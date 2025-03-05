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
    console.log("Socket opened for user:", userId);
    
    const existingSocket = this.sockets.get(userId);
    if(existingSocket) {
      existingSocket.onclose = null;
      existingSocket.close();
    }
    
    this.sockets.set(userId, socket);
    
    socket.onclose = (event: CloseEvent) => {
      console.log("Socket closed for user:", userId);
      if(this.sockets.get(userId) === socket) {
        this.sockets.delete(userId);
      }
    };
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

