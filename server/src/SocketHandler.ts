class SocketHandler {
  private static instance: SocketHandler;
  private sockets = new Map<string, WebSocket>();

  // Private constructor to prevent direct instantiation
  private constructor() {}

  // Static method to get the singleton instance
  public static getInstance(): SocketHandler {
    if (!SocketHandler.instance) {
      SocketHandler.instance = new SocketHandler();
    }
    return SocketHandler.instance;
  }

  addSocket(userId: string, socket: WebSocket) {
    this.sockets.set(userId, socket);
    socket.onclose = () => {
      this.sockets.delete(userId);
    };
    this.sendMessage(userId, "connected");
  }

  getSocket(userId: string) {
    return this.sockets.get(userId);
  }

  sendMessage(userId: string, message: string) {
    const socket = this.sockets.get(userId);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  }
}

// Export the singleton getInstance method
export const socketHandler = SocketHandler.getInstance();

