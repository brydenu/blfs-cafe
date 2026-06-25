"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  computeUserDashboardStatistics,
  type UserStatsTimeframe,
} from "@/lib/user-statistics";

export async function getMyStats(timeframe: UserStatsTimeframe) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, message: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    const stats = await computeUserDashboardStatistics(user.id, timeframe);

    return {
      success: true,
      data: stats,
      timeframe,
    };
  } catch (error) {
    console.error("Failed to get user statistics:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Database error",
    };
  }
}
