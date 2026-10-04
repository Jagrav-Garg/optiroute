import { useTrip } from '../context/TripContext';

export function useAgentStatus() {
  const { currentTrip, isAgentStreaming, activeAgent } = useTrip();
  const fleet = currentTrip.agentStatus;

  return {
    fleet,
    isOrchestrating: isAgentStreaming || fleet.isOrchestrating,
    activeAgent,
    overallStatus: fleet.overallStatusText
  };
}
