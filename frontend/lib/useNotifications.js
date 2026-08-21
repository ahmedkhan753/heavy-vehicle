"use client";

import { useCallback, useEffect, useState } from "react";
import { notificationApi } from "@/lib/api";

// Long enough that an idle dashboard isn't hammering the API, short enough
// that a badge doesn't feel stale after acting on the thing it points at.
const POLL_MS = 60000;

/**
 * Badge/alert data for the nav components.
 *
 * scope "admin" → per-tab counts of items awaiting an admin decision.
 * scope "me"    → the signed-in user's unread messages + dated alerts.
 *
 * Failures are swallowed on purpose: a badge is decoration on top of
 * navigation that has to keep working regardless, so a flaky poll should
 * never surface an error state or block the menu from rendering.
 *
 * `refresh` is returned so a page that just cleared something (read a
 * thread, approved a dealer) can update the badge without waiting out the
 * poll interval.
 */
export default function useNotifications(scope, enabled = true) {
  const [data, setData] = useState({ counts: {}, alerts: [], total: 0 });

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = scope === "admin" ? await notificationApi.adminCounts() : await notificationApi.mine();
      setData({
        counts: res?.data?.counts || {},
        alerts: res?.data?.alerts || [],
        total: res?.data?.total || 0,
        pendingListings: res?.data?.pendingListings || 0,
      });
    } catch {
      // Keep whatever we last had rather than blanking the badges.
    }
  }, [scope, enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    refresh();
    const id = window.setInterval(refresh, POLL_MS);
    // A dashboard left open in a background tab shouldn't keep polling, but
    // it should be current the moment it's looked at again.
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh, enabled]);

  return { ...data, refresh };
}
