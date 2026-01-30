'use server';

import { prisma } from '@/lib/db';

/**
 * Generates a date-based order ID in the format: YYMMDD###
 * Example: 250123001 = January 23, 2025, order #1
 * 
 * Handles race conditions by retrying with incremented sequence if unique constraint violation occurs.
 */
export async function generateOrderId(): Promise<string> {
  const maxRetries = 3;
  let attempt = 0;

  // Get current date in YYMMDD format
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month (01-12)
  const day = now.getDate().toString().padStart(2, '0'); // Day (01-31)
  const datePrefix = `${year}${month}${day}`; // e.g., "250123"

  while (attempt < maxRetries) {
    try {
      // Count existing orders with publicId starting with today's date prefix
      const existingOrders = await prisma.order.count({
        where: {
          publicId: {
            startsWith: datePrefix,
          },
        },
      });

      // Calculate next sequence number
      // Add attempt number to handle race conditions where multiple orders are created simultaneously
      const sequence = existingOrders + 1 + attempt;
      
      // Pad sequence to 3 digits with leading zeros
      const sequenceStr = sequence.toString().padStart(3, '0');
      
      // Combine date prefix and sequence
      const orderId = `${datePrefix}${sequenceStr}`;

      // Verify uniqueness by checking if this ID exists
      const exists = await prisma.order.findUnique({
        where: { publicId: orderId },
      });

      if (!exists) {
        // ID is unique, return it
        return orderId;
      }

      // ID exists, try next sequence number
      attempt++;
    } catch (error) {
      // If we get an error, retry with incremented sequence
      attempt++;
      if (attempt >= maxRetries) {
        throw new Error(`Failed to generate unique order ID after ${maxRetries} attempts: ${error}`);
      }
    }
  }

  // Fallback (shouldn't reach here, but TypeScript requires it)
  throw new Error(`Failed to generate unique order ID after ${maxRetries} attempts`);
}
