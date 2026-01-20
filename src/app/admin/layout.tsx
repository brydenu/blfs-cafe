import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminLayoutWrapper from "./AdminLayoutWrapper";

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

  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}