import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { pageTitle } from "@/lib/metadata";
import type { UserStatsTimeframe } from "@/lib/user-statistics";
import { getMyStats } from "./actions";
import UserStatisticsView from "./UserStatisticsView";

export const metadata = pageTitle("My Statistics");
export const dynamic = "force-dynamic";

interface StatisticsPageProps {
  searchParams: Promise<{ timeframe?: string }>;
}

function isValidTimeframe(value: string | undefined): value is UserStatsTimeframe {
  return value === "today" || value === "week" || value === "month" || value === "all";
}

export default async function StatisticsPage({ searchParams }: StatisticsPageProps) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { firstName: true },
  });

  if (!user) {
    redirect("/");
  }

  const resolvedSearchParams = await searchParams;
  const timeframe: UserStatsTimeframe = isValidTimeframe(resolvedSearchParams.timeframe)
    ? resolvedSearchParams.timeframe
    : "all";

  const result = await getMyStats(timeframe);
  const stats = result.success && result.data ? result.data : null;

  if (!stats) {
    redirect("/dashboard");
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#004876] flex items-center justify-center">
          <p className="text-white font-bold animate-pulse">Loading statistics...</p>
        </div>
      }
    >
      <UserStatisticsView
        stats={stats}
        currentTimeframe={timeframe}
        firstName={user.firstName}
      />
    </Suspense>
  );
}
