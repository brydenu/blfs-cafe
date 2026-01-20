'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) return { success: false, message: "Unauthorized" };

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const phone = formData.get("phone") as string;

  if (!firstName || !lastName) {
    return { success: false, message: "First and Last Name are required." };
  }

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { firstName, lastName, phone },
    });
    
    // Refresh data on the page
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard"); 

    return { success: true, message: "Profile updated successfully." };
  } catch (error) {
    console.error("Profile Update Error:", error);
    return { success: false, message: "Failed to update profile." };
  }
}

export async function updatePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) return { success: false, message: "Unauthorized" };

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, message: "All fields are required." };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, message: "New passwords do not match." };
  }

  if (newPassword.length < 6) {
    return { success: false, message: "New password must be at least 6 characters." };
  }

  // 1. Get current user password hash
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) return { success: false, message: "User not found." };

  // 2. Verify Current Password
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return { success: false, message: "Current password is incorrect." };
  }

  // 3. Hash New Password & Update
  const newHash = await bcrypt.hash(newPassword, 10);
  
  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { passwordHash: newHash },
    });

    return { success: true, message: "Password changed successfully." };
  } catch (error) {
    console.error("Password Update Error:", error);
    return { success: false, message: "Failed to update password." };
  }
}

export async function updateNotificationPreferences(data: {
  notificationsEnabled: boolean;
  notificationDefaultType: string;
  notificationMethods: { email: boolean };
}) {
  const session = await auth();
  if (!session?.user?.email) return { success: false, message: "Unauthorized" };

  if (!['per-drink', 'order-complete'].includes(data.notificationDefaultType)) {
    return { success: false, message: "Invalid notification type." };
  }

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        notificationsEnabled: data.notificationsEnabled,
        notificationDefaultType: data.notificationDefaultType,
        notificationMethods: data.notificationMethods,
      },
    });
    
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");

    return { success: true, message: "Notification preferences updated successfully." };
  } catch (error) {
    console.error("Notification Preferences Update Error:", error);
    return { success: false, message: "Failed to update notification preferences." };
  }
}