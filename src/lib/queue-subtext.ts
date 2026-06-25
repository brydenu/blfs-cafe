export function formatQueueSubtext(count: number): string {
  if (count === 0) return "Queue is empty!";
  if (count === 1) return "1 drink in queue";
  return `${count} drinks in queue`;
}

export function formatQueueIndicatorLabel(count: number): string {
  if (count === 0) return "Queue empty";
  if (count === 1) return "1 drink in queue";
  return `${count} drinks in queue`;
}
