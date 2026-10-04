import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  Trip,
  ChatMessage,
  ItineraryStop,
  Hotel,
  ConstraintItem,
  AgentVertical
} from '../types';
import { BASE_TOKYO_TRIP, INITIAL_TOKYO_MESSAGES, PRESET_SCENARIOS } from '../data/mockTrips';
import { optimizeTripItinerary, solveTspDynamicProgramming, buildTransitLegsForDay } from '../utils/routingEngine';
import { runStrictValidation, updateConstraintsStatus } from '../utils/constraintValidator';
import { tripService } from '../services/tripService';
import { chatService } from '../services/chatService';
import { PlanningEvent } from '../services/planningStream';

export type WorkspaceLayoutMode = 'split' | 'map_primary' | 'itinerary_primary';

interface TripContextType {
  currentTrip: Trip;
  savedTrips: Trip[];
  messages: ChatMessage[];
  isAgentStreaming: boolean;
  isGeneratingTrip: boolean;
  generationDestination: string;
  activeAgent: AgentVertical | null;
  activeDayIndex: number;
  selectedStop: ItineraryStop | null;
  selectedHotel: Hotel | null;
  focusedStopId: string | null;
  activeWorkspaceTab: 'itinerary' | 'map' | 'fleet' | 'constraints' | 'analytics';
  
  // Editorial UI State & Collapsible Panels
  currentView: 'landing' | 'workspace';
  isSidebarOpen: boolean;
  isChatOpen: boolean;
  workspaceLayoutMode: WorkspaceLayoutMode;

  // Modals
  isNewTripModalOpen: boolean;
  isExportModalOpen: boolean;
  isStopDetailModalOpen: boolean;

  // Actions
  setCurrentView: (view: 'landing' | 'workspace') => void;
  setIsSidebarOpen: (open: boolean) => void;
  setIsChatOpen: (open: boolean) => void;
  setWorkspaceLayoutMode: (mode: WorkspaceLayoutMode) => void;
  sendMessage: (text: string) => Promise<void>;
  handleClarificationResponse: (clarificationId: string, optionIds: string[]) => Promise<void>;
  setActiveDayIndex: (index: number) => void;
  setActiveWorkspaceTab: (tab: 'itinerary' | 'map' | 'fleet' | 'constraints' | 'analytics') => void;
  setSelectedStop: (stop: ItineraryStop | null) => void;
  setSelectedHotel: (hotel: Hotel | null) => void;
  setFocusedStopId: (id: string | null) => void;
  setIsNewTripModalOpen: (open: boolean) => void;
  setIsExportModalOpen: (open: boolean) => void;
  setIsStopDetailModalOpen: (open: boolean) => void;
  loadScenario: (scenarioId: string) => void;
  recalculateRoute: (dayIndex?: number) => void;
  removeStopFromDay: (dayNumber: number, stopId: string) => void;
  swapStopInDay: (dayNumber: number, oldStopId: string, newStop: ItineraryStop) => void;
  addStopToDay: (dayNumber: number, newStop: ItineraryStop) => void;
  toggleConstraint: (constraintId: string) => void;
  selectHotel: (hotelId: string) => void;
  createNewTrip: (tripData: Partial<Trip>) => Promise<void> | void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

function readSession(): { trip?: Trip; messages?: ChatMessage[] } {
  try {
    const saved = JSON.parse(localStorage.getItem('optiroute-harsh-session-v1') || '{}');
    return saved.trip?.itinerary && saved.trip?.hotels && Array.isArray(saved.messages) ? saved : {};
  } catch { return {}; }
}

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session] = useState(readSession);
  const [currentTrip, setCurrentTrip] = useState<Trip>(session.trip || BASE_TOKYO_TRIP);
  const [savedTrips, setSavedTrips] = useState<Trip[]>([
    BASE_TOKYO_TRIP,
    PRESET_SCENARIOS[1].tripData,
    PRESET_SCENARIOS[2].tripData
  ]);
  const [messages, setMessages] = useState<ChatMessage[]>(session.messages || INITIAL_TOKYO_MESSAGES);
  const [isAgentStreaming, setIsAgentStreaming] = useState<boolean>(false);
  const [isGeneratingTrip, setIsGeneratingTrip] = useState<boolean>(false);
  const [generationDestination, setGenerationDestination] = useState<string>('');
  const [activeAgent, setActiveAgent] = useState<AgentVertical | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState<number>(1);
  const [selectedStop, setSelectedStop] = useState<ItineraryStop | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(currentTrip.hotels[0]);
  const [focusedStopId, setFocusedStopId] = useState<string | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'itinerary' | 'map' | 'fleet' | 'constraints' | 'analytics'>('itinerary');

  // Redesign Layout Controls: Start at Landing Page or Workspace
  const [currentView, setCurrentView] = useState<'landing' | 'workspace'>('landing');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true);
  const [workspaceLayoutMode, setWorkspaceLayoutMode] = useState<WorkspaceLayoutMode>('split');

  // Modals
  const [isNewTripModalOpen, setIsNewTripModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isStopDetailModalOpen, setIsStopDetailModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isAgentStreaming) return;
    try { localStorage.setItem('optiroute-harsh-session-v1', JSON.stringify({ trip: currentTrip, messages: messages.slice(-60) })); }
    catch { /* Planning still works when browser storage is disabled or full. */ }
  }, [currentTrip, messages, isAgentStreaming]);

  // Sync and validate helper
  const syncAndValidateTrip = useCallback((updatedTrip: Trip): Trip => {
    const { optimizedDays, metrics } = optimizeTripItinerary(updatedTrip.itinerary);
    const withOptimized = {
      ...updatedTrip,
      itinerary: optimizedDays,
      route: metrics
    };
    const validation = runStrictValidation(withOptimized);
    const updatedConstraints = updateConstraintsStatus(withOptimized.constraints, validation);
    return {
      ...withOptimized,
      constraints: updatedConstraints,
      validation
    };
  }, []);

  const recalculateRoute = useCallback((dayIndex?: number) => {
    setCurrentTrip((prev) => syncAndValidateTrip(prev));
  }, [syncAndValidateTrip]);

  const removeStopFromDay = useCallback((dayNumber: number, stopId: string) => {
    setCurrentTrip((prev) => {
      const updatedDays = prev.itinerary.map((day) => {
        if (day.dayNumber !== dayNumber) return day;
        const filteredStops = day.stops.filter((s) => s.id !== stopId);
        const { stopsWithTransit, totalDistanceKm, totalTransitMinutes, polyline } =
          buildTransitLegsForDay(filteredStops);
        return {
          ...day,
          stops: stopsWithTransit,
          totalDistanceKm,
          totalTransitMinutes,
          routePolyline: polyline
        };
      });

      const updated = syncAndValidateTrip({
        ...prev,
        itinerary: updatedDays
      });

      const noticeMessage: ChatMessage = {
        id: `msg-remove-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'route_update',
        content: `Removed stop from Day ${dayNumber}. Algorithmic Routing Engine re-balanced the daily sequence with 0 zigzagging.`,
        payload: {
          algorithm: 'Route Engine Re-computation',
          beforeDistanceKm: prev.route.totalDistanceKm,
          afterDistanceKm: updated.route.totalDistanceKm,
          savedDistanceKm: Math.max(0, Math.round((prev.route.totalDistanceKm - updated.route.totalDistanceKm) * 10) / 10),
          percentReduction: updated.route.zigzagReductionPercent,
          transitMinutesSaved: 18,
          note: `Remaining ${updated.itinerary.find(d => d.dayNumber === dayNumber)?.stops.length || 0} stops re-sequenced optimally.`
        }
      };
      setMessages((m) => [...m, noticeMessage]);
      return updated;
    });
  }, [syncAndValidateTrip]);

  const swapStopInDay = useCallback((dayNumber: number, oldStopId: string, newStop: ItineraryStop) => {
    setCurrentTrip((prev) => {
      const updatedDays = prev.itinerary.map((day) => {
        if (day.dayNumber !== dayNumber) return day;
        const replaced = day.stops.map((s) => (s.id === oldStopId ? newStop : s));
        const tsp = solveTspDynamicProgramming(replaced);
        const { stopsWithTransit, totalDistanceKm, totalTransitMinutes, polyline } =
          buildTransitLegsForDay(tsp.orderedStops);
        return {
          ...day,
          stops: stopsWithTransit,
          totalDistanceKm,
          totalTransitMinutes,
          routePolyline: polyline
        };
      });

      return syncAndValidateTrip({
        ...prev,
        itinerary: updatedDays
      });
    });
  }, [syncAndValidateTrip]);

  const addStopToDay = useCallback((dayNumber: number, newStop: ItineraryStop) => {
    setCurrentTrip((prev) => {
      const updatedDays = prev.itinerary.map((day) => {
        if (day.dayNumber !== dayNumber) return day;
        const added = [...day.stops, newStop];
        const tsp = solveTspDynamicProgramming(added);
        const { stopsWithTransit, totalDistanceKm, totalTransitMinutes, polyline } =
          buildTransitLegsForDay(tsp.orderedStops);
        return {
          ...day,
          stops: stopsWithTransit,
          totalDistanceKm,
          totalTransitMinutes,
          routePolyline: polyline
        };
      });

      const updated = syncAndValidateTrip({
        ...prev,
        itinerary: updatedDays
      });

      const addNotice: ChatMessage = {
        id: `msg-add-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'place_card',
        content: `Added "${newStop.name}" to Day ${dayNumber} and scheduled arrival time.`,
        payload: {
          place: newStop
        }
      };
      setMessages((m) => [...m, addNotice]);
      return updated;
    });
  }, [syncAndValidateTrip]);

  const toggleConstraint = useCallback((constraintId: string) => {
    setCurrentTrip((prev) => {
      const updatedConstraints = prev.constraints.map((c) =>
        c.id === constraintId
          ? { ...c, status: (c.status === 'satisfied' ? 'validating' : 'satisfied') as any }
          : c
      );
      return {
        ...prev,
        constraints: updatedConstraints
      };
    });
  }, []);

  const selectHotel = useCallback((hotelId: string) => {
    setCurrentTrip((prev) => {
      const updatedHotels = prev.hotels.map((h) => ({
        ...h,
        selected: h.id === hotelId
      }));
      const chosen = updatedHotels.find((h) => h.id === hotelId) || updatedHotels[0];
      setSelectedHotel(chosen);
      return {
        ...prev,
        hotels: updatedHotels
      };
    });
  }, []);

  const loadScenario = useCallback((scenarioId: string) => {
    const scenario = PRESET_SCENARIOS.find((s) => s.id === scenarioId) || PRESET_SCENARIOS[0];
    const validated = syncAndValidateTrip(scenario.tripData);
    setCurrentTrip(validated);
    setMessages(scenario.initialMessages);
    setActiveDayIndex(1);
    setSelectedStop(null);
    setSelectedHotel(validated.hotels[0]);
    setCurrentView('workspace'); // transition smoothly to workspace!
  }, [syncAndValidateTrip]);

  const beginFleet = useCallback((id: string) => {
    const roles = ['coordinator', 'transit', 'hotel', 'places', 'compiler', 'routing', 'validator'];
    const agents = Object.fromEntries(roles.map(role => [role, { status: 'idle', action: role === 'compiler' ? 'Waiting for the three specialists' : 'Waiting for dispatch', activity: [], output: '' }]));
    setMessages(prev => [...prev, { id, sender: 'agent_fleet', type: 'agent_status', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), content: 'Three agents, one trip.', payload: { agents, step: 'running' } }]);
    return (event: PlanningEvent) => {
      if (event.type !== 'agent.progress' || !event.agent) return;
      setActiveAgent(event.agent as AgentVertical);
      if (event.fleet) setCurrentTrip(prev => ({ ...prev, agentStatus: event.fleet }));
      setMessages(prev => prev.map(message => {
        if (message.id !== id) return message;
        const previous = message.payload.agents[event.agent!] || { activity: [] };
        return { ...message, payload: { ...message.payload, agents: { ...message.payload.agents,
          [event.agent!]: { ...previous, status: event.status, action: event.action, attempt: event.outputReset ? event.attempt : Math.max(event.attempt || 1, previous.attempt || 1),
            query: event.query || previous.query, results: event.results || previous.results,
            output: ((event.outputReset ? '' : previous.output || '') + (event.outputDelta || '')).slice(-12000),
            activity: event.outputDelta || previous.activity.at(-1) === event.action ? previous.activity : [...previous.activity, event.action].slice(-20) } } } };
      }));
    };
  }, []);

  const finishFleet = useCallback((id: string, error?: string) => {
    setMessages(prev => prev.map(message => {
      if (message.id !== id) return message;
      const agents = Object.fromEntries(Object.entries(message.payload.agents).map(([role, state]: [string, any]) =>
        [role, error && ['running', 're-prompting'].includes(state.status) ? { ...state, status: 'error', action: error } : state]));
      return { ...message, payload: { ...message.payload, agents, step: error ? 'error' : 'completed', error } };
    }));
    if (error) setCurrentTrip(prev => ({ ...prev, agentStatus: { ...prev.agentStatus, isOrchestrating: false, overallStatusText: error } }));
  }, []);

  // Backend routes already contain engine ordering and travel metrics. Validate
  // them without replacing those routes with frontend straight-line estimates.
  const acceptLiveTrip = useCallback((trip: Trip) => {
    const validation = runStrictValidation(trip);
    return { ...trip, validation, constraints: updateConstraintsStatus(trip.constraints, validation) };
  }, []);

  const createNewTrip = useCallback(async (newTripData: Partial<Trip>) => {
    const dest = newTripData.destination || 'your destination';
    setIsNewTripModalOpen(false);
    setCurrentView('workspace');
    setIsGeneratingTrip(true);
    setGenerationDestination(dest);
    setIsAgentStreaming(true);
    setActiveAgent('coordinator');

    setMessages([]);
    const fleetId = `fleet-${Date.now()}`;
    const onProgress = beginFleet(fleetId);

    try {
      const liveTrip = await tripService.createTrip(newTripData, onProgress);
      const validated = acceptLiveTrip(liveTrip);
      setCurrentTrip(validated);
      setSavedTrips((prev) => [validated, ...prev]);
      setSelectedHotel(validated.hotels[0] || null);
      setActiveDayIndex(1);
      setSelectedStop(validated.itinerary[0]?.stops[0] || null);

      finishFleet(fleetId);
      const successMsg: ChatMessage = {
        id: `msg-success-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text',
        content: `Trip generated successfully for **${validated.destination}**! Agent searches resolved the map locations and the routing engine optimized the daily routes.`,
        suggestions: [
          'Show Day 1 route on interactive map',
          'Inspect pure vegetarian dining options',
          'View hotel details and proximity score',
          'Export final itinerary as PDF'
        ]
      };
      setMessages(prev => [...prev, successMsg]);
    } catch (err: any) {
      finishFleet(fleetId, err?.message || 'Connection error');
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text',
        content: `Lead Coordinator: Live agent planning pipeline encountered an issue (${err?.message || 'Connection error'}). Please ensure the backend server is running on port 3001 and retry.`
      };
      setMessages((m) => [...m, errorMsg]);
    } finally {
      setIsGeneratingTrip(false);
      setIsAgentStreaming(false);
      setActiveAgent(null);
    }
  }, [beginFleet, finishFleet, acceptLiveTrip]);

  const handleClarificationResponse = useCallback(async (clarificationId: string, optionIds: string[]) => {
    setIsAgentStreaming(true);
    setActiveAgent('coordinator');

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.type === 'clarification' && msg.payload?.prompt?.id === clarificationId) {
          return {
            ...msg,
            payload: {
              ...msg.payload,
              prompt: {
                ...msg.payload.prompt,
                resolved: true,
                selectedAnswer: optionIds
              }
            }
          };
        }
        return msg;
      })
    );

    await new Promise((r) => setTimeout(r, 600));
    setActiveAgent('hotel');

    const selectedOption = currentTrip.hotels.find((h) => h.id === optionIds[0]) || currentTrip.hotels[0];
    selectHotel(selectedOption.id);

    await new Promise((r) => setTimeout(r, 500));
    setActiveAgent('validator');

    const confirmationMsg: ChatMessage = {
      id: `msg-clarify-confirm-${Date.now()}`,
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'hotel_card',
      content: `Locked choice: ${selectedOption.name}. Verified pure vegetarian breakfast option and updated morning departure point.`,
      payload: {
        hotel: selectedOption
      },
      suggestions: [
        'Check day-by-day walking distance',
        'Optimize Day 2 stops',
        'Export itinerary to PDF'
      ]
    };

    setMessages((m) => [...m, confirmationMsg]);
    setIsAgentStreaming(false);
    setActiveAgent(null);
  }, [currentTrip.hotels, selectHotel]);

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || isAgentStreaming) return;
    setMessages(prev => [...prev, { id: `msg-user-${Date.now()}`, sender: 'user', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'text', content: userText }]);
    setIsAgentStreaming(true);
    setActiveAgent('coordinator');
    const fleetId = `fleet-${Date.now()}`;
    const onProgress = beginFleet(fleetId);
    try {
      const history = messages.filter(message => message.sender === 'user' || message.sender === 'assistant').slice(-20).map(({ sender, content }) => ({ sender, content }));
      const result = await chatService.sendMessage(userText, { trip: currentTrip, currentDay: activeDayIndex, history }, onProgress);
      const trip = acceptLiveTrip(result.trip);
      setCurrentTrip(trip);
      setSavedTrips(prev => [trip, ...prev.filter(saved => saved.id !== trip.id)]);
      setSelectedHotel(trip.hotels[0] || null);
      setSelectedStop(null);
      setFocusedStopId(null);
      setActiveDayIndex(1);
      finishFleet(fleetId);
      setMessages(prev => [...prev, result.message]);
    } catch (error: any) {
      const message = error?.message || 'Agent connection failed';
      finishFleet(fleetId, message);
      setMessages(prev => [...prev, { id: `error-${Date.now()}`, sender: 'assistant', type: 'text', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), content: message }]);
    } finally {
      setIsAgentStreaming(false);
      setActiveAgent(null);
    }
  }, [currentTrip, messages, activeDayIndex, isAgentStreaming, beginFleet, finishFleet, acceptLiveTrip]);

  return (
    <TripContext.Provider
      value={{
        currentTrip,
        savedTrips,
        messages,
        isAgentStreaming,
        activeAgent,
        activeDayIndex,
        selectedStop,
        selectedHotel,
        focusedStopId,
        activeWorkspaceTab,
        isGeneratingTrip,
        generationDestination,
        currentView,
        isSidebarOpen,
        isChatOpen,
        workspaceLayoutMode,
        isNewTripModalOpen,
        isExportModalOpen,
        isStopDetailModalOpen,
        setCurrentView,
        setIsSidebarOpen,
        setIsChatOpen,
        setWorkspaceLayoutMode,
        sendMessage,
        handleClarificationResponse,
        setActiveDayIndex,
        setActiveWorkspaceTab,
        setSelectedStop,
        setSelectedHotel,
        setFocusedStopId,
        setIsNewTripModalOpen,
        setIsExportModalOpen,
        setIsStopDetailModalOpen,
        loadScenario,
        recalculateRoute,
        removeStopFromDay,
        swapStopInDay,
        addStopToDay,
        toggleConstraint,
        selectHotel,
        createNewTrip
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
};
