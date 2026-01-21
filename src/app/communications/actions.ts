'use server';

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getActiveCommunications(location: 'landing' | 'dashboard' | 'menu') {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;

    const now = new Date();

    // Fetch all active communications for this location
    // Note: Prisma JSON filtering for arrays requires a different approach
    const allCommunications = await prisma.communication.findMany({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter by location manually (since Prisma JSON array contains is complex)
    const communications = allCommunications.filter((comm) => {
      let locations = comm.visibilityLocations;
      
      // Handle JSON string if it's stored as a string
      if (typeof locations === 'string') {
        try {
          locations = JSON.parse(locations);
        } catch (e) {
          return false;
        }
      }
      
      if (!Array.isArray(locations)) {
        return false;
      }
      
      // Check if location matches
      return locations.some((loc: string) => loc === location);
    });

    // For each communication, check if it's been dismissed
    const communicationsWithDismissal = await Promise.all(
      communications.map(async (comm) => {
        let isDismissed = false;

        if (userId) {
          // Check if logged-in user has dismissed it
          const dismissal = await prisma.communicationDismissal.findUnique({
            where: {
              userId_communicationId: {
                userId,
                communicationId: comm.id,
              },
            },
          });
          isDismissed = !!dismissal;
        }

        return {
          ...comm,
          isDismissed,
        };
      })
    );

    // Filter out dismissed communications for logged-in users
    const activeCommunications = userId
      ? communicationsWithDismissal.filter((comm) => !comm.isDismissed)
      : communicationsWithDismissal;

    return {
      success: true,
      data: activeCommunications.map(({ isDismissed, ...comm }) => comm),
    };
  } catch (error) {
    console.error("[getActiveCommunications] Error:", error);
    return { success: false, message: "Database error", data: [] };
  }
}

export async function dismissCommunication(communicationId: number, sessionId?: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;

    if (!userId && !sessionId) {
      return { success: false, message: "User ID or session ID required" };
    }

    // Check if already dismissed
    if (userId) {
      const existing = await prisma.communicationDismissal.findUnique({
        where: {
          userId_communicationId: {
            userId,
            communicationId,
          },
        },
      });

      if (existing) {
        return { success: true };
      }

      await prisma.communicationDismissal.create({
        data: {
          userId,
          communicationId,
        },
      });
    } else if (sessionId) {
      const existing = await prisma.communicationDismissal.findUnique({
        where: {
          sessionId_communicationId: {
            sessionId,
            communicationId,
          },
        },
      });

      if (existing) {
        return { success: true };
      }

      await prisma.communicationDismissal.create({
        data: {
          sessionId,
          communicationId,
        },
      });
    }

    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/menu');
    return { success: true };
  } catch (error) {
    console.error("Failed to dismiss communication:", error);
    return { success: false, message: "Database error" };
  }
}
