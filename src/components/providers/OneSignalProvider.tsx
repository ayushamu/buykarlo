"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, X } from "lucide-react";

declare global {
  interface Window {
    OneSignalDeferred?: any[];
  }
}

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    
    if (!appId) {
      console.warn("OneSignal Warning: NEXT_PUBLIC_ONESIGNAL_APP_ID is not configured in environment variables.");
      return;
    }

    // Initialize OneSignal
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      await OneSignal.init({
        appId: appId,
        allowLocalhostAsSecureOrigin: true, // Allows testing push locally
      });

      // Show banner if notification permission is not granted yet
      if (!OneSignal.Notifications.permission) {
        setShowBanner(true);
      }

      // Hide banner if user allows notification in-session
      OneSignal.Notifications.addEventListener("permissionChange", (permissionChange: boolean) => {
        if (OneSignal.Notifications.permission) {
          setShowBanner(false);
        }
      });
    });

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(function (OneSignal: any) {
          OneSignal.login(user.id);
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(function (OneSignal: any) {
        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
          OneSignal.login(session.user.id);
        } else if (event === "SIGNED_OUT") {
          OneSignal.logout();
        }
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleRequestPermission = () => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      try {
        await OneSignal.Notifications.requestPermission();
        // Hide the banner if granted
        if (OneSignal.Notifications.permission) {
          setShowBanner(false);
        }
      } catch (err) {
        console.error("Error requesting notification permission:", err);
      }
    });
  };

  return (
    <>
      <Script
        src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
        strategy="afterInteractive"
      />
      {children}

      {/* Glassmorphic Notification Prompt Banner */}
      {showBanner && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-[calc(100vw-3rem)] bg-surface/90 backdrop-blur-md border border-outline-variant/30 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex gap-4 items-start">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-violet-500/10 text-primary border border-primary/20 shrink-0">
              <Bell className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-on-surface leading-tight">
                Stay Notified ⚡️
              </h4>
              <p className="text-sm font-semibold text-on-surface-variant/90 mt-1 leading-snug">
                Never miss an offer on your listings or new chat messages from buyers and sellers.
              </p>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="text-on-surface-variant/60 hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-high transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center justify-end gap-3 mt-1">
            <button
              onClick={() => setShowBanner(false)}
              className="text-sm font-bold text-on-surface-variant/80 hover:text-on-surface px-3 py-2 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={handleRequestPermission}
              className="bg-primary text-white text-sm font-bold px-4 py-2 rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all"
            >
              Enable Now
            </button>
          </div>
        </div>
      )}
    </>
  );
}
