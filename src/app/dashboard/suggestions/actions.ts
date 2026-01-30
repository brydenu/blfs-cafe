'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function submitSuggestion(content: string) {
  // Validate content
  if (!content || content.trim().length === 0) {
    return { success: false, message: "Suggestion content cannot be empty." };
  }

  if (content.trim().length > 5000) {
    return { success: false, message: "Suggestion is too long. Please keep it under 5000 characters." };
  }

  try {
    const session = await auth();
    const userEmail = session?.user?.email;
    
    // Resolve User - follow same pattern as cart actions
    let userId: string | null = null;
    if (userEmail) {
      const user = await prisma.user.findUnique({ 
        where: { email: userEmail },
        select: { id: true }
      });
      if (user) {
        userId = user.id;
      }
    }

    await prisma.suggestion.create({
      data: {
        userId,
        content: content.trim(),
      },
    });

    revalidatePath("/dashboard/suggestions");
    return { success: true, message: "Thank you for your suggestion!" };
  } catch (error: any) {
    console.error("Suggestion submission error:", error);
    // Log more details for debugging
    if (error?.code) {
      console.error("Prisma error code:", error.code);
    }
    if (error?.message) {
      console.error("Error message:", error.message);
    }
    return { 
      success: false, 
      message: error?.message?.includes("Suggestion") 
        ? error.message 
        : "Failed to submit suggestion. Please try again." 
    };
  }
}

export async function getUserSuggestions() {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return { success: false, data: [], message: "Not authenticated" };
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    if (!user) {
      return { success: false, data: [], message: "User not found" };
    }

    const suggestions = await prisma.suggestion.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: suggestions,
    };
  } catch (error) {
    console.error("Error fetching user suggestions:", error);
    return { success: false, data: [], message: "Failed to fetch suggestions." };
  }
}

export async function deleteUserSuggestion(suggestionId: number) {
  try {
    const session = await auth();
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return { success: false, message: "Not authenticated" };
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Verify the suggestion belongs to the user
    const suggestion = await prisma.suggestion.findUnique({
      where: { id: suggestionId },
      select: { userId: true },
    });

    if (!suggestion) {
      return { success: false, message: "Suggestion not found" };
    }

    if (suggestion.userId !== user.id) {
      return { success: false, message: "Unauthorized" };
    }

    await prisma.suggestion.delete({
      where: { id: suggestionId },
    });

    revalidatePath("/dashboard/suggestions");
    revalidatePath("/dashboard/suggestions/history");
    return { success: true, message: "Suggestion deleted." };
  } catch (error) {
    console.error("Error deleting suggestion:", error);
    return { success: false, message: "Failed to delete suggestion." };
  }
}
