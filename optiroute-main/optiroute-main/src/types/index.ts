// OptiRoute Core Domain & State Models

export type DietConstraint = 'pure_veg_jain' | 'pure_veg' | 'vegan' | 'halal' | 'kosher' | 'none';
export type PacePreference = 'relaxed' | 'moderate' | 'intensive';
export type TransitPreference = 'walking_friendly' | 'metro_subway' | 'taxi_private' | 'public_transit';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface TransitSegment {
  id: string;
  fromStopId: string;
  toStopId: string;
  fromName: string;
  toName: string;
  mode: 'walk' | 'subway' | 'bus' | 'taxi' | 'bullet_train' | 'flight';
  durationMinutes: number;
  distanceKm: number;
  cost: number;
  instructions: string;
  isOptimizedShortestPath: boolean;
}

export interface ItineraryStop {
  id: string;
  name: string;
  category: 'attraction' | 'meal' | 'hotel' | 'transit_hub' | 'activity';
  timeSlot: 'morning' | 'afternoon' | 'evening';
  scheduledTime: string; // e.g. "09:30 AM - 11:30 AM"
  durationMinutes: number;
  cost: number;
  rating: number;
  reviewsCount: number;
  address: string;
  coordinates: LatLng;
  imageUrl: string;
  images?: string[];
  description: string;
  tags: string[];
  dietCompliance?: {
    isPureVeg: boolean;
    isJainFriendly: boolean;
    verifiedByAgent: boolean;
  };
  openingHours: {
    open: string;
    close: string;
    verifiedConflictFree: boolean;
  };
  bookingStatus?: 'confirmed' | 'recommended' | 'optional';
  ticketUrl?: string;
  transitToNext?: TransitSegment;
  isHotelOrigin?: boolean;
  isHotelDestination?: boolean;
}

export interface DayItinerary {
  dayNumber: number;
  date: string;
  title: string;
  theme: string;
  totalDistanceKm: number;
  totalTransitMinutes: number;
  estimatedCost: number;
  stops: ItineraryStop[];
  routePolyline?: LatLng[];
  efficiencyScore: number; // e.g. 98%
}

export interface Hotel {
  id: string;
  name: string;
  rating: number;
  stars: number;
  pricePerNight: number;
  totalPrice: number;
  address: string;
  coordinates: LatLng;
  imageUrl: string;
  images?: string[];
  amenities: string[];
  pureVegBreakfast: boolean;
  transitProximityScore: number; // 0-100
  selected: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  rating: number;
  coordinates: LatLng;
  imageUrl: string;
  images?: string[];
  isPureVeg: boolean;
  isJainFriendly: boolean;
  dietCertification: string;
  distanceFromHotelKm: number;
}

export interface Attraction {
  id: string;
  name: string;
  category: string;
  rating: number;
  coordinates: LatLng;
  imageUrl: string;
  images?: string[];
  estimatedVisitMinutes: number;
  ticketPrice: number;
  tags: string[];
}

export interface ConstraintItem {
  id: string;
  type: 'diet' | 'budget' | 'pace' | 'timebox' | 'transit' | 'hotel_amenity' | 'custom';
  title: string;
  description: string;
  isHardConstraint: boolean; // cannot be violated
  status: 'satisfied' | 'validating' | 'conflict_detected' | 'auto_repaired';
  repairedNote?: string;
  confidence: number; // 0 - 100%
  extractedFromText?: string;
}

export interface RouteMetrics {
  totalDistanceKm: number;
  totalTransitHours: number;
  zigzagReductionPercent: number;
  stopsCount: number;
  engineName?: string;
  dynamicProgrammingSteps?: number;
  algorithm?: string;
  tspExecutionTimeMs?: number;
  executionTimeMs?: number;
}
export interface RouteEngineRequest {
  locations: ItineraryStop[];
  constraints?: Record<string, any>;
  startLocation?: LatLng | ItineraryStop;
  endLocation?: LatLng | ItineraryStop;
  date?: string;
}

export interface RouteEngineResponse {
  orderedStops: ItineraryStop[];
  segments: TransitSegment[];
  totalDistance: number;
  totalDuration: number;
  efficiency: number;
  constraintStatus: {
    satisfiedCount: number;
    totalCount: number;
    conflicts: string[];
    isFeasible: boolean;
  };
  metrics?: RouteMetrics;
}


export interface ValidationViolation {
  id: string;
  rule: string;
  severity: 'critical' | 'warning';
  dayNumber?: number;
  description: string;
  repairActionTaken: string;
  resolved: boolean;
}

export interface ValidationReport {
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  autoRepairsApplied: number;
  violations: ValidationViolation[];
  lastValidatedTimestamp: string;
}

export type AgentVertical = 
  | 'coordinator' 
  | 'transit' 
  | 'hotel' 
  | 'places' 
  | 'compiler' 
  | 'routing' 
  | 'validator';

export interface AgentTaskState {
  agent: AgentVertical;
  displayName: string;
  packageName: '@cline/core' | '@cline/agents' | '@cline/routing' | '@cline/validator';
  status: 'idle' | 'running' | 'completed' | 're-prompting' | 'error';
  currentAction: string;
  progressPercent: number;
  tokensUsed: number;
  latencyMs: number;
  lastUpdated: string;
}

export interface AgentFleetState {
  isOrchestrating: boolean;
  overallStatusText: string;
  coordinator: AgentTaskState;
  transit: AgentTaskState;
  hotel: AgentTaskState;
  places: AgentTaskState;
  compiler: AgentTaskState;
  routing: AgentTaskState;
  validator: AgentTaskState;
}

export interface ClarificationOption {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  badge?: string;
}

export interface ClarificationPrompt {
  id: string;
  question: string;
  category: 'diet' | 'budget' | 'pace' | 'hotel' | 'transit' | 'schedule';
  options: ClarificationOption[];
  allowMultiple?: boolean;
  defaultSelected?: string[];
  resolved?: boolean;
  selectedAnswer?: string[];
}

export type MessageType =
  | 'text'
  | 'clarification'
  | 'constraint_update'
  | 'agent_status'
  | 'place_card'
  | 'hotel_card'
  | 'itinerary_preview'
  | 'route_update'
  | 'validation_error'
  | 'final_itinerary';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'agent_fleet' | 'system';
  timestamp: string;
  type: MessageType;
  content: string;
  payload?: any;
  suggestions?: string[];
  isStreaming?: boolean;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  country: string;
  cityCenter: LatLng;
  dates: {
    startDate: string;
    endDate: string;
    totalDays: number;
  };
  travelers: {
    adults: number;
    children: number;
    type: 'solo' | 'couple' | 'family' | 'business' | 'backpackers';
  };
  budget: {
    currency: string;
    totalCap: number;
    spentTotal: number;
    breakdown: {
      flights: number;
      hotels: number;
      food: number;
      activities: number;
      buffer: number;
    };
    status: 'under' | 'near_cap' | 'exceeded';
  };
  constraints: ConstraintItem[];
  preferences: {
    pace: PacePreference;
    diet: DietConstraint;
    mobility: TransitPreference;
    interests: string[];
  };
  itinerary: DayItinerary[];
  hotels: Hotel[];
  restaurants: Restaurant[];
  attractions: Attraction[];
  transportation: TransitSegment[];
  route: RouteMetrics;
  validation: ValidationReport;
  agentStatus: AgentFleetState;
}

export interface TripScenario {
  id: string;
  title: string;
  destination: string;
  description: string;
  days: number;
  highlightConstraint: string;
  tripData: Trip;
  initialMessages: ChatMessage[];
}
