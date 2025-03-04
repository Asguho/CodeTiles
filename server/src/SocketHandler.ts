export class SocketHandler {
  sockets = new Map<string, WebSocket>();
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
