export interface ChatMessage {
  sender: string;
  channel: 'global' | string; // 'global' or agent ID for private messages
  content: string;
  timestamp: number;
}

export class CommunicationService {
  private messageHistory: ChatMessage[] = [];
  private subscribers: Map<string, (message: ChatMessage) => void> = new Map();

  // Subscribe an agent to receive messages
  subscribe(agentId: string, callback: (message: ChatMessage) => void) {
    this.subscribers.set(agentId, callback);
  }

  // Send a message to a channel
  sendMessage(sender: string, channel: 'global' | string, content: string) {
    const message: ChatMessage = {
      sender,
      channel,
      content,
      timestamp: Date.now()
    };

    this.messageHistory.push(message);

    // Broadcast to relevant subscribers
    if (channel === 'global') {
      // Send to all subscribers
      this.subscribers.forEach((callback, agentId) => {
        if (agentId !== sender) { // Don't send to sender
          callback(message);
        }
      });
    } else {
      // Private message - send only to target
      const targetCallback = this.subscribers.get(channel);
      if (targetCallback) {
        targetCallback(message);
      }
    }
  }

  // Get recent messages for an agent
  getRecentMessages(agentId: string, limit: number = 10): ChatMessage[] {
    return this.messageHistory
      .filter(msg => msg.channel === 'global' || msg.channel === agentId || msg.sender === agentId)
      .slice(-limit);
  }

  // Get all messages (for debugging/logging)
  getAllMessages(): ChatMessage[] {
    return [...this.messageHistory];
  }
}