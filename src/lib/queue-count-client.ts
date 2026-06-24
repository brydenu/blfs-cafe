let lastKnownQueueCount: number | null = null;

export function getLastKnownQueueCount(): number | null {
  return lastKnownQueueCount;
}

export function setLastKnownQueueCount(count: number): void {
  lastKnownQueueCount = count;
}
