'use client';

import { useState, useEffect } from 'react';
import { getActiveCommunications, dismissCommunication } from '@/app/communications/actions';

interface Communication {
  id: number;
  title: string;
  content: string;
  startDate: Date;
  endDate: Date;
}

interface CommunicationBannerProps {
  location: 'landing' | 'dashboard' | 'menu';
}

// Generate or get session ID for guests
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  const key = 'communication_session_id';
  let sessionId = localStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, sessionId);
  }
  
  return sessionId;
}

export default function CommunicationBanner({ location }: CommunicationBannerProps) {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [minimized, setMinimized] = useState<Record<number, boolean>>({});
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sessionId] = useState(() => getOrCreateSessionId());

  useEffect(() => {
    async function fetchCommunications() {
      try {
        const result = await getActiveCommunications(location);
        if (result.success) {
          setCommunications(result.data as Communication[]);
        }
      } catch (error) {
        console.error('Failed to fetch communications:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCommunications();
  }, [location]);

  const handleMinimize = (id: number) => {
    setMinimized((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDismiss = async (id: number) => {
    try {
      const result = await dismissCommunication(id, sessionId);
      if (result.success) {
        setDismissed((prev) => new Set([...prev, id]));
      }
    } catch (error) {
      console.error('Failed to dismiss communication:', error);
    }
  };

  if (loading) {
    return null;
  }

  const visibleCommunications = communications.filter(
    (comm) => !dismissed.has(comm.id)
  );

  if (visibleCommunications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {visibleCommunications.map((comm) => {
        const isMinimized = minimized[comm.id];

        return (
          <div
            key={comm.id}
            className="bg-white rounded-3xl shadow-xl border border-white/10 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-[#004876]">{comm.title}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleMinimize(comm.id)}
                  className="text-gray-400 hover:text-[#32A5DC] transition-colors p-1"
                  aria-label={isMinimized ? 'Expand' : 'Minimize'}
                >
                  {isMinimized ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 15.75l7.5-7.5 7.5 7.5"
                      />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => handleDismiss(comm.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  aria-label="Dismiss"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            {!isMinimized && (
              <div
                className="p-4 prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: comm.content }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
