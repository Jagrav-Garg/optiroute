import { useTrip } from '../context/TripContext';

export function useChat() {
  const {
    messages,
    sendMessage,
    isAgentStreaming,
    handleClarificationResponse,
    isChatOpen,
    setIsChatOpen
  } = useTrip();

  return {
    messages,
    sendMessage,
    isStreaming: isAgentStreaming,
    handleClarification: handleClarificationResponse,
    isOpen: isChatOpen,
    setIsOpen: setIsChatOpen
  };
}
