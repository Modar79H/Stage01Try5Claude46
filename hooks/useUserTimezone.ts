// hooks/useUserTimezone.ts
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getUserTimezone } from "@/lib/utils";

export function useUserTimezone() {
  const { data: session } = useSession();
  const [timezone, setTimezone] = useState<string>("UTC");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initializeTimezone() {
      if (!session?.user) {
        // Not logged in, use browser timezone
        const browserTimezone = getUserTimezone();
        setTimezone(browserTimezone);
        setIsLoading(false);
        return;
      }

      try {
        // Get user's stored timezone from database
        const response = await fetch("/api/user/timezone");

        if (response.ok) {
          const data = await response.json();
          setTimezone(data.timezone || "UTC");
        } else {
          // Fallback to browser timezone if API call fails
          const browserTimezone = getUserTimezone();
          setTimezone(browserTimezone);

          // Try to update user's timezone in background
          updateUserTimezone(browserTimezone);
        }
      } catch (error) {
        console.error("Error fetching user timezone:", error);
        // Fallback to browser timezone
        const browserTimezone = getUserTimezone();
        setTimezone(browserTimezone);
      } finally {
        setIsLoading(false);
      }
    }

    initializeTimezone();
  }, [session]);

  const updateUserTimezone = async (newTimezone: string) => {
    if (!session?.user) return false;

    try {
      const response = await fetch("/api/user/timezone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ timezone: newTimezone }),
      });

      if (response.ok) {
        setTimezone(newTimezone);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating user timezone:", error);
      return false;
    }
  };

  return {
    timezone,
    isLoading,
    updateTimezone: updateUserTimezone,
  };
}
