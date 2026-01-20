import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const session = await auth();
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  // Fetch fresh user data from DB
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      notificationsEnabled: true,
      notificationDefaultType: true,
      notificationMethods: true,
    }
  });

  if (!user) return <div>User not found</div>;

  return <SettingsForm user={user} />;
}