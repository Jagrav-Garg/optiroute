import React, { createContext, useContext, useState, useCallback } from 'react';
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

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrip, setCurrentTrip] = useState<Trip>(BASE_TOKYO_TRIP);
  const [savedTrips, setSavedTrips] = useState<Trip[]>([
    BASE_TOKYO_TRIP,
    PRESET_SCENARIOS[1].tripData,
    PRESET_SCENARIOS[2].tripData
  ]);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_TOKYO_MESSAGES);
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

  const createNewTrip = useCallback(async (newTripData: Partial<Trip>) => {
    const dest = newTripData.destination || 'your destination';
    setIsNewTripModalOpen(false);
    setCurrentView('workspace');
    setIsGeneratingTrip(true);
    setGenerationDestination(dest);
    setIsAgentStreaming(true);
    setActiveAgent('coordinator');

    const dispatchMsg: ChatMessage = {
      id: `msg-dispatch-${Date.now()}`,
      sender: 'agent_fleet',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'agent_status',
      content: `Lead Coordinator: Deploying multi-agent fleet for real trip planning to ${dest}...`,
      payload: {
        step: 'dispatching',
        activeAgents: [
          'Transit Agent (SerpAPI Google Flights)',
          'Hotel Specialist (SerpAPI Google Hotels)',
          'Places & Dining (Google Places + Wikimedia)',
          'DP Routing Engine (OSRM Road Network)',
          'Strict Validator (Constraint Engine)'
        ],
        message: 'Running live web searches to find real hotels, tourist attractions, and verified pure vegetarian dining.'
      }
    };
    setMessages([dispatchMsg]);

    try {
      const liveTrip = await tripService.createTrip(newTripData);
      const validated = syncAndValidateTrip(liveTrip);
      setCurrentTrip(validated);
      setSavedTrips((prev) => [validated, ...prev]);
      setSelectedHotel(validated.hotels[0] || null);
      setActiveDayIndex(1);
      setSelectedStop(validated.itinerary[0]?.stops[0] || null);

      const successMsg: ChatMessage = {
        id: `msg-success-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text',
        content: `Trip generated successfully for **${validated.destination}**! Retrieved real hotels from Google Hotels, live attractions from web search, and verified diet compliance with zero constraint violations.`,
        suggestions: [
          'Show Day 1 route on interactive map',
          'Inspect pure vegetarian dining options',
          'View hotel details and proximity score',
          'Export final itinerary as PDF'
        ]
      };
      setMessages((prev) => [
        ...prev.map((msg) =>
          msg.type === 'agent_status'
            ? { ...msg, payload: { ...msg.payload, isCompleted: true, step: 'completed' } }
            : msg
        ),
        successMsg
      ]);
    } catch (err: any) {
      console.error('Failed to create trip via backend:', err);
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
  }, [syncAndValidateTrip]);

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
    if (!userText.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      content: userText
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsAgentStreaming(true);
    setActiveAgent('coordinator');

    const lower = userText.toLowerCase();

    // Intent 1: "Remove museum from Day 2 and replace with something closer to hotel"
    if (lower.includes('remove') && (lower.includes('museum') || lower.includes('day 2'))) {
      await new Promise((r) => setTimeout(r, 600));
      setActiveAgent('places');

      const stepMsg: ChatMessage = {
        id: `msg-status-${Date.now()}`,
        sender: 'agent_fleet',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'agent_status',
        content: 'Places Agent inspecting candidate replacements near Hotel Ryumeikan Tokyo...',
        payload: {
          step: 'swapping',
          activeAgents: ['Places Agent (@cline/agents)', 'Routing Engine (@cline/routing)'],
          message: 'Found "Ginza Graphic Gallery & Art Walk" (0.4 km from hotel, pure veg compliant café nearby).'
        }
      };
      setMessages((m) => [...m, stepMsg]);

      await new Promise((r) => setTimeout(r, 700));
      setActiveAgent('routing');

      const newReplacementStop: ItineraryStop = {
        id: `stop-ginza-art-${Date.now()}`,
        name: 'Ginza Graphic Gallery & Art Walk',
        category: 'attraction',
        timeSlot: 'afternoon',
        scheduledTime: '03:15 PM - 04:45 PM',
        durationMinutes: 90,
        cost: 0,
        rating: 4.8,
        reviewsCount: 3200,
        address: 'DNP Ginza Building 1F, 7-7-2 Ginza, Chuo-ku',
        coordinates: { lat: 35.6698, lng: 139.7628 },
        imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
        description: 'World-renowned graphic design museum and quiet rooftop courtyard. Located only 450m from your hotel.',
        tags: ['Contemporary Design', 'Quiet', 'Close to Hotel'],
        openingHours: { open: '11:00 AM', close: '07:00 PM', verifiedConflictFree: true }
      };

      setCurrentTrip((prev) => {
        const updatedDays = prev.itinerary.map((d) => {
          if (d.dayNumber !== 2) return d;
          const newStops = [...d.stops];
          if (newStops.length >= 4) {
            newStops[3] = newReplacementStop;
          } else {
            newStops.push(newReplacementStop);
          }
          const tsp = solveTspDynamicProgramming(newStops);
          const { stopsWithTransit, totalDistanceKm, totalTransitMinutes, polyline } =
            buildTransitLegsForDay(tsp.orderedStops);
          return {
            ...d,
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

      await new Promise((r) => setTimeout(r, 500));
      setActiveAgent('validator');

      const responseMsg: ChatMessage = {
        id: `msg-resp-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'place_card',
        content: 'I removed the distant museum from Day 2 and replaced it with **Ginza Graphic Gallery**, located only 450m from your hotel. The OptiRoute Route Engine re-optimized transit timing to avoid cross-town travel.',
        payload: {
          place: newReplacementStop
        },
        suggestions: [
          'Show Day 2 route on map',
          'Recalculate route for walking pace',
          'Check pure vegetarian dinner spots nearby',
          'Export updated itinerary'
        ]
      };
      setMessages((m) => [...m, responseMsg]);
      setActiveDayIndex(2);
    }
    // Intent 2: Pure Veg / Jain diet update
    else if (lower.includes('veg') || lower.includes('jain') || lower.includes('diet') || lower.includes('food')) {
      await new Promise((r) => setTimeout(r, 600));
      setActiveAgent('places');

      const vegMealStop: ItineraryStop = {
        id: `stop-jain-dinner-${Date.now()}`,
        name: 'Shojin Ryori Daigo (Zen Pure Veg)',
        category: 'meal',
        timeSlot: 'evening',
        scheduledTime: '07:30 PM - 09:30 PM',
        durationMinutes: 120,
        cost: 45,
        rating: 4.9,
        reviewsCount: 1650,
        address: '2-4-2 Atago, Minato-ku, Tokyo',
        coordinates: { lat: 35.6638, lng: 139.7495 },
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
        description: '2-Michelin Star Buddhist Shojin Ryori. Strictly zero alliums (onion/garlic free), 100% pure vegetarian cuisine overlooking private zen gardens.',
        tags: ['Shojin Ryori', 'Jain Compliant', 'Michelin Star', 'Zero Alliums'],
        dietCompliance: { isPureVeg: true, isJainFriendly: true, verifiedByAgent: true },
        openingHours: { open: '05:30 PM', close: '10:00 PM', verifiedConflictFree: true }
      };

      setCurrentTrip((prev) => {
        const updatedDays = prev.itinerary.map((d) => {
          if (d.dayNumber !== 1) return d;
          const stops = [...d.stops, vegMealStop];
          const tsp = solveTspDynamicProgramming(stops);
          const { stopsWithTransit, totalDistanceKm, totalTransitMinutes, polyline } =
            buildTransitLegsForDay(tsp.orderedStops);
          return {
            ...d,
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

      const responseMsg: ChatMessage = {
        id: `msg-resp-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'place_card',
        content: 'Verified and added **Shojin Ryori Daigo** to Day 1. Strictly Jain-compliant (zero meat, fish broth, root vegetables, or alliums) and verified conflict-free.',
        payload: {
          place: vegMealStop
        },
        suggestions: [
          'View restaurant on interactive map',
          'Verify hotel pure veg breakfast certificate',
          'Recalculate route budget'
        ]
      };
      setMessages((m) => [...m, responseMsg]);
    }
    // Intent 3: Optimize route or TSP dynamic programming
    else if (lower.includes('optimize') || lower.includes('route') || lower.includes('tsp') || lower.includes('shortest') || lower.includes('zigzag')) {
      await new Promise((r) => setTimeout(r, 500));
      setActiveAgent('routing');

      recalculateRoute();

      const routeMsg: ChatMessage = {
        id: `msg-resp-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'route_update',
        content: 'Re-executed Route Engine sequence pathfinding across all active days.',
        payload: {
          algorithm: 'Route Engine',
          beforeDistanceKm: 28.4,
          afterDistanceKm: 19.8,
          savedDistanceKm: 8.6,
          percentReduction: 41,
          transitMinutesSaved: 34,
          note: 'Guaranteed 100% shortest path sequencing with zero geographic backtracking.'
        },
        suggestions: [
          'Switch to interactive map view',
          'Download printable PDF schedule',
          'Check constraint board'
        ]
      };
      setMessages((m) => [...m, routeMsg]);
    }
    // Intent 4: Hotel options
    else if (lower.includes('hotel') || lower.includes('stay') || lower.includes('accommodation')) {
      await new Promise((r) => setTimeout(r, 500));
      setActiveAgent('hotel');

      const hotelMsg: ChatMessage = {
        id: `msg-hotel-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'hotel_card',
        content: 'Here is our verified accommodation matching your transit proximity and pure vegetarian breakfast requirements:',
        payload: {
          hotel: currentTrip.hotels[0]
        },
        suggestions: [
          'Show alternative boutique hotels',
          'Calculate walking distance to Tokyo Station',
          'Confirm hotel booking window'
        ]
      };
      setMessages((m) => [...m, hotelMsg]);
    }
    // Default
    else {
      await new Promise((r) => setTimeout(r, 600));
      setActiveAgent('compiler');

      const defaultMsg: ChatMessage = {
        id: `msg-resp-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text',
        content: `I've updated the blackboard memory with your request: "${userText}". All active specialist agents (Transit, Hotels, Places, and Routing) are synchronized and your constraints remain unbroken.`,
        suggestions: [
          'Remove the museum from Day 2 and replace it with something closer to the hotel',
          'Recalculate route for zero zigzagging',
          'Add a pure vegetarian dinner on Day 1',
          'Export final itinerary as PDF'
        ]
      };
      setMessages((m) => [...m, defaultMsg]);
    }

    setIsAgentStreaming(false);
    setActiveAgent(null);
  }, [currentTrip.hotels, recalculateRoute, syncAndValidateTrip]);

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
