import { prisma } from "@/lib/db";

// Match the queue page: incomplete items in active or cancelled orders.
export async function getActiveQueueDrinkCount(): Promise<number> {
  return prisma.orderItem.count({
    where: {
      completed_at: null,
      order: {
        status: { in: ["queued", "preparing", "cancelled"] },
      },
    },
  });
}
