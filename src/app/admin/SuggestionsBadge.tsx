'use client';

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getUnreadSuggestionsCount } from "./suggestions/actions";

export default function SuggestionsBadge() {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const result = await getUnreadSuggestionsCount();
        if (result.success) {
          setCount(result.count);
        }
      } catch (error) {
        console.error("Failed to fetch unread suggestions count:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();
    // Refresh count every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    
    return () => clearInterval(interval);
  }, [pathname]); // Refresh when pathname changes (e.g., after marking as read)

  if (isLoading || count === 0) {
    return null;
  }

  return (
    <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full ml-2">
      {count}
    </span>
  );
}
