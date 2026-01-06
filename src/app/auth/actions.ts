'use server';

import { prisma } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";
import { randomBytes } from "crypto";

export async function requestPasswordReset(email: string) {
  // 1. Check if user exists
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // SECURITY: Return true anyway so hackers can't fish for emails
    return { success: true, message: "If that email exists, we sent a link." };
  }

  // 2. Generate Token
  const token = randomBytes(32).toString("hex");
  const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 Hour

  // 3. Save to DB
  await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expires
    }
  });

  // 4. Send Email
  const resetLink = `${process.env.NEXT_PUBLIC_URL}/reset-password?token=${token}`;
  
  await sendNotification('PASSWORD_RESET', email, {
    resetLink
  });

  return { success: true, message: "Check your email." };
}