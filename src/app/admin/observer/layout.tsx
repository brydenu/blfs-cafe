import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/metadata";

export const metadata = pageTitle("Observer");

export default async function ObserverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Security Check - Still require admin authentication
  if (!session || session.user.role !== "admin") {
    redirect("/"); // Kick them out to home
  }

  // Return children without admin layout wrapper
  // The page itself will handle the user UI styling
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {children}
    </div>
  );
}