'use server';

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function resetPassword(token: string, formData: FormData) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // 1. Basic Validation
  if (!password || !confirmPassword) {
    return { success: false, message: "Please fill in all fields." };
  }

  if (password !== confirmPassword) {
    return { success: false, message: "Passwords do not match." };
  }

  if (password.length < 6) {
    return { success: false, message: "Password must be at least 6 characters." };
  }

  // 2. Verify Token
  const storedToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!storedToken) {
    return { success: false, message: "Invalid or expired token." };
  }

  // 3. Check Expiry
  if (new Date() > storedToken.expires) {
    // Optional: Delete expired token to clean up
    await prisma.passwordResetToken.delete({ where: { token } });
    return { success: false, message: "Token has expired. Please request a new one." };
  }

  // 4. Update User Password
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Update password
    await prisma.user.update({
      where: { email: storedToken.email },
      data: { passwordHash: hashedPassword },
    });

    // 5. Delete Used Token
    await prisma.passwordResetToken.delete({
      where: { token },
    });

    return { success: true, message: "Password reset successfully!" };

  } catch (error) {
    console.error("Reset Password Error:", error);
    return { success: false, message: "Database error. Please try again." };
  }
}