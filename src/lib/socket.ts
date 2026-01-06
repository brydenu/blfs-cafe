import { io } from "socket.io-client";

// This connects your Next.js backend to your local Socket server
// Since they are on the same EC2, localhost works perfectly.
export const socket = io("http://localhost:3001", {
  autoConnect: false,
});

export const triggerSocketEvent = (event: string, data: any) => {
  if (!socket.connected) socket.connect();
  socket.emit(event, data);
};