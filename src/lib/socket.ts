import { io, Socket } from "socket.io-client";
import { getClientSocketUrl } from "./socket-client";

const socketUrl = getClientSocketUrl();

export const socket: Socket = io(socketUrl, {
  autoConnect: false,
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Ensure socket connects on first use
let connectionPromise: Promise<void> | null = null;

function ensureConnected(): Promise<void> {
  if (socket.connected) {
    return Promise.resolve();
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = new Promise((resolve, reject) => {
    if (socket.connected) {
      connectionPromise = null;
      return resolve();
    }

    socket.connect();

    const timeout = setTimeout(() => {
      connectionPromise = null;
      reject(new Error("Socket connection timeout"));
    }, 5000);

    socket.once("connect", () => {
      clearTimeout(timeout);
      connectionPromise = null;
      resolve();
    });

    socket.once("connect_error", (err) => {
      clearTimeout(timeout);
      connectionPromise = null;
      reject(err);
    });
  });

  return connectionPromise;
}

export const triggerSocketEvent = async (event: string, data: any) => {
  try {
    await ensureConnected();
    socket.emit(event, data);
    console.log(`📤 Emitted socket event: ${event}`, data);
  } catch (error) {
    console.error(`❌ Failed to emit socket event ${event}:`, error);
    // Still try to emit - Socket.IO will buffer if not connected
    socket.emit(event, data);
  }
};

export async function emitRefreshQueue(data: Record<string, unknown> = {}) {
  let drinkCount: number | undefined;

  try {
    const { getActiveQueueDrinkCount } = await import("@/lib/queue-count");
    drinkCount = await getActiveQueueDrinkCount();
  } catch (error) {
    console.error("Failed to get queue count for socket emit:", error);
  }

  await triggerSocketEvent("refresh-queue", { ...data, drinkCount });
}