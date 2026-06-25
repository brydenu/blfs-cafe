import { getActiveQueueDrinkCount } from "@/lib/queue-count";
import QueueStatusIndicator from "@/components/QueueStatusIndicator";

export default async function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialQueueCount = await getActiveQueueDrinkCount();

  return (
    <>
      {children}
      <QueueStatusIndicator initialQueueCount={initialQueueCount} />
    </>
  );
}
