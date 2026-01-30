'use server';

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { sendNotification } from "@/lib/notifications";

// Define the expected shape of the data
interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export async function registerUser(data: RegisterInput) {
  // Destructure the plain object instead of using formData.get()
  const { email, password, firstName, lastName, phone } = data;

  // 1. Basic Validation
  if (!email || !password || !firstName || !lastName) {
    return { success: false, message: "Missing required fields" };
  }

  // 2. Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { success: false, message: "User already exists" };
  }

  // 3. Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 4. Create the user
  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        phone,
        role: "customer",
      },
    });

    // --- TRIGGER WELCOME EMAIL ---
    if (user.email) {
      sendNotification('WELCOME', user.email, {
        name: user.firstName
      }).catch(err => console.error("Failed to send welcome email:", err));
    }
    // -----------------------------

    return { success: true };

  } catch (error) {
    console.error("Registration Error:", error);
    return { success: false, message: "Database error. Please try again." };
  }
}