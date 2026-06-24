import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminLayoutWrapper from "./AdminLayoutWrapper";
import { ADMIN_APP_NAME } from "@/lib/metadata";
import { getActiveQueueDrinkCount } from "@/lib/queue-count";
import { AdminQueueCountProvider } from "@/providers/AdminQueueCountProvider";

export const metadata: Metadata = {
  title: {
    template: `%s - ${ADMIN_APP_NAME}`,
    default: ADMIN_APP_NAME,
  },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // 1. Security Check
  if (!session || session.user.role !== "admin") {
    redirect("/"); // Kick them out to home
  }

  const initialQueueCount = await getActiveQueueDrinkCount();

  return (
    <AdminQueueCountProvider initialCount={initialQueueCount}>
      <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
    </AdminQueueCountProvider>
  );
}