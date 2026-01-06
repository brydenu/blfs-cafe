'use server';

import { requestPasswordReset } from "@/app/auth/actions"; // Assuming this is where we put the helper in Step 5

export async function handleForgotPassword(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return { success: false, message: "Please enter your email address." };
  }

  // Call the core logic
  try {
    const result = await requestPasswordReset(email);
    return result; // Returns { success: true, message: "..." }
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}