"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { socket } from "@/lib/socket";
import { formatAdminTabTitle } from "@/lib/admin-tab-title";
import {
  getLastKnownQueueCount,
  setLastKnownQueueCount,
} from "@/lib/queue-count-client";

interface RefreshQueuePayload {
  drinkCount?: number;
}

interface AdminQueueCountContextValue {
  drinkCount: number;
}

const AdminQueueCountContext = createContext<AdminQueueCountContextValue>({
  drinkCount: 0,
});

export function useAdminQueueCount() {
  return useContext(AdminQueueCountContext);
}

interface AdminQueueCountProviderProps {
  initialCount: number;
  children: React.ReactNode;
}

export function AdminQueueCountProvider({
  initialCount,
  children,
}: AdminQueueCountProviderProps) {
  const pathname = usePathname();
  const [drinkCount, setDrinkCount] = useState(
    () => getLastKnownQueueCount() ?? initialCount
  );
  const drinkCountRef = useRef(drinkCount);
  const pathnameRef = useRef(pathname);

  drinkCountRef.current = drinkCount;
  pathnameRef.current = pathname;

  useEffect(() => {
    const knownCount = getLastKnownQueueCount();
    if (knownCount !== null) {
      setDrinkCount(knownCount);
      return;
    }

    setLastKnownQueueCount(initialCount);
    setDrinkCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    const onRefresh = (data: RefreshQueuePayload) => {
      if (typeof data?.drinkCount === "number") {
        setLastKnownQueueCount(data.drinkCount);
        setDrinkCount(data.drinkCount);
      }
    };

    if (!socket.connected) {
      socket.connect();
    }

    socket.on("refresh-queue", onRefresh);

    return () => {
      socket.off("refresh-queue", onRefresh);
    };
  }, []);

  useLayoutEffect(() => {
    const applyTitle = () => {
      const knownCount = getLastKnownQueueCount();
      const countForTitle = knownCount ?? drinkCountRef.current;

      const nextTitle = formatAdminTabTitle(pathnameRef.current, countForTitle);
      if (document.title !== nextTitle) {
        document.title = nextTitle;
      }
    };

    const onVisible = () => {
      const knownCount = getLastKnownQueueCount();
      if (document.visibilityState === "visible" && knownCount !== null) {
        setDrinkCount(knownCount);
        drinkCountRef.current = knownCount;
      }
      applyTitle();
    };

    applyTitle();

    // Next.js metadata can REPLACE the <title> element (not just mutate its
    // text) during router.refresh(). Observing document.head with subtree
    // ensures we re-apply the count whether the title is mutated or swapped.
    const observer = new MutationObserver(applyTitle);
    observer.observe(document.head, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      observer.disconnect();
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useLayoutEffect(() => {
    const knownCount = getLastKnownQueueCount();
    const countForTitle = knownCount ?? drinkCount;
    const nextTitle = formatAdminTabTitle(pathname, countForTitle);
    if (document.title !== nextTitle) {
      document.title = nextTitle;
    }
  }, [pathname, drinkCount]);

  const value = useMemo(() => ({ drinkCount }), [drinkCount]);

  return (
    <AdminQueueCountContext.Provider value={value}>
      {children}
    </AdminQueueCountContext.Provider>
  );
}
