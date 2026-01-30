'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getSuggestions(archived: boolean = false) {
  try {
    const suggestions = await prisma.suggestion.findMany({
      where: {
        isArchived: archived,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' }, // Pinned first
        { createdAt: 'desc' }, // Then by date
      ],
    });

    return {
      success: true,
      data: suggestions.map((s) => ({
        ...s,
        user: s.user ? {
          id: s.user.id,
          firstName: s.user.firstName,
          lastName: s.user.lastName,
          email: s.user.email,
        } : null,
      })),
    };
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return { success: false, data: [], message: "Failed to fetch suggestions." };
  }
}

export async function markSuggestionAsRead(suggestionId: number) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    await prisma.suggestion.update({
      where: { id: suggestionId },
      data: {
        isRead: true,
        readAt: new Date(),
        readBy: session.user.id,
      },
    });

    revalidatePath("/admin/suggestions");
    return { success: true, message: "Suggestion marked as read." };
  } catch (error) {
    console.error("Error marking suggestion as read:", error);
    return { success: false, message: "Failed to mark suggestion as read." };
  }
}

export async function markSuggestionAsUnread(suggestionId: number) {
  try {
    await prisma.suggestion.update({
      where: { id: suggestionId },
      data: {
        isRead: false,
        readAt: null,
        readBy: null,
      },
    });

    revalidatePath("/admin/suggestions");
    return { success: true, message: "Suggestion marked as unread." };
  } catch (error) {
    console.error("Error marking suggestion as unread:", error);
    return { success: false, message: "Failed to mark suggestion as unread." };
  }
}

export async function getUnreadSuggestionsCount() {
  try {
    const count = await prisma.suggestion.count({
      where: {
        isRead: false,
        isArchived: false, // Don't count archived suggestions
      },
    });

    return { success: true, count };
  } catch (error) {
    console.error("Error fetching unread suggestions count:", error);
    return { success: false, count: 0 };
  }
}

export async function archiveSuggestion(suggestionId: number) {
  try {
    await prisma.suggestion.update({
      where: { id: suggestionId },
      data: {
        isArchived: true,
      },
    });

    revalidatePath("/admin/suggestions");
    return { success: true, message: "Suggestion archived." };
  } catch (error) {
    console.error("Error archiving suggestion:", error);
    return { success: false, message: "Failed to archive suggestion." };
  }
}

export async function unarchiveSuggestion(suggestionId: number) {
  try {
    await prisma.suggestion.update({
      where: { id: suggestionId },
      data: {
        isArchived: false,
      },
    });

    revalidatePath("/admin/suggestions");
    return { success: true, message: "Suggestion unarchived." };
  } catch (error) {
    console.error("Error unarchiving suggestion:", error);
    return { success: false, message: "Failed to unarchive suggestion." };
  }
}

export async function pinSuggestion(suggestionId: number) {
  try {
    await prisma.suggestion.update({
      where: { id: suggestionId },
      data: {
        isPinned: true,
      },
    });

    revalidatePath("/admin/suggestions");
    return { success: true, message: "Suggestion pinned." };
  } catch (error) {
    console.error("Error pinning suggestion:", error);
    return { success: false, message: "Failed to pin suggestion." };
  }
}

export async function unpinSuggestion(suggestionId: number) {
  try {
    await prisma.suggestion.update({
      where: { id: suggestionId },
      data: {
        isPinned: false,
      },
    });

    revalidatePath("/admin/suggestions");
    return { success: true, message: "Suggestion unpinned." };
  } catch (error) {
    console.error("Error unpinning suggestion:", error);
    return { success: false, message: "Failed to unpin suggestion." };
  }
}

export async function deleteSuggestion(suggestionId: number) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" };
  }

  // Validate suggestionId
  if (!suggestionId || typeof suggestionId !== 'number' || isNaN(suggestionId)) {
    console.error("Invalid suggestionId:", suggestionId);
    return { success: false, message: "Invalid suggestion ID." };
  }

  try {
    await prisma.suggestion.delete({
      where: { id: suggestionId },
    });

    revalidatePath("/admin/suggestions");
    return { success: true, message: "Suggestion deleted." };
  } catch (error: any) {
    console.error("Error deleting suggestion:", error);
    // Provide more specific error messages
    if (error?.code === 'P2025') {
      return { success: false, message: "Suggestion not found. It may have already been deleted." };
    }
    return { success: false, message: error?.message || "Failed to delete suggestion." };
  }
}
