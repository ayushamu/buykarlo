"use client";

import Script from "next/script";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

declare global {
  interface Window {
    OneSignalDeferred?: any[];
  }
}

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
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
    });

    // Supabase auth link to OneSignal External ID
    const supabase = createClient();
    
    // Check current active session
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(function (OneSignal: any) {
          OneSignal.login(user.id);
        });
      }
    });

    // Subscribe to auth state transitions
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

  return (
    <>
      <Script
        src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
        strategy="afterInteractive"
      />
      {children}
    </>
  );
}
