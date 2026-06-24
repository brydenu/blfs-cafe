export function getClientSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = process.env.NEXT_PUBLIC_SOCKET_PORT || "3001";
    return `${protocol}//${hostname}:${port}`;
  }

  return process.env.SOCKET_SERVER_URL || "http://localhost:3001";
}
