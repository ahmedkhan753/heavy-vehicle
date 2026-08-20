"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SWIPE_THRESHOLD_PX = 50;
const SETTLE_MS = 280;
const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Drag-following swipe for a 3-slide track (prev/current/next), the same
 * mechanic PakWheels and most native apps use: the image moves 1:1 with
 * your finger while dragging, then either finishes the swipe or springs
 * back — never an abrupt cut with no motion in between, which is what the
 * old touchstart/touchend-only handling did (nothing moved until you lifted
 * your finger, then it hard-jumped).
 *
 * React attaches touchmove as a passive listener by default, which silently
 * blocks preventDefault() — needed here to stop the page from scrolling
 * once a horizontal drag is recognized. Attaching the listener manually via
 * addEventListener(..., { passive: false }) is the reliable way around that.
 *
 * The listener-attaching effect deliberately avoids depending on `phase` or
 * the onSwipeLeft/onSwipeRight callbacks — those change on every render (the
 * callbacks are inline arrow functions at the call site, and `phase` changes
 * on every touchmove), which would tear down and rebuild the listeners
 * mid-gesture. Reading the latest phase/callbacks from refs instead keeps
 * the listeners mounted for as long as the container node is stable, while
 * still always seeing current values.
 *
 * `enabled` should be false when there's only one image — no swipe target,
 * nothing to drag.
 */
export default function useSwipeTrack({ enabled, onSwipeLeft, onSwipeRight }) {
  // A plain useRef doesn't work for the lightbox's track: that container
  // only exists in the DOM once the lightbox opens, which happens well
  // after this hook's mount-time effect has already run (and bailed out
  // on a null ref, never to re-run since nothing else in its dependency
  // array changes later). A callback ref triggers a state update exactly
  // when the node actually mounts, so the listener effect can depend on
  // it and attach once the element genuinely exists.
  const [containerNode, setContainerNode] = useState(null);
  const containerRef = useCallback((node) => setContainerNode(node), []);
  const [dragPx, setDragPx] = useState(0);
  const [phase, setPhase] = useState("idle"); // idle | dragging | settling
  const [settleTo, setSettleTo] = useState(0); // -100/3, 0, or -200/3 (%)

  const phaseRef = useRef("idle");
  const callbacksRef = useRef({ onSwipeLeft, onSwipeRight });
  callbacksRef.current = { onSwipeLeft, onSwipeRight };

  const gesture = useRef({ startX: 0, startY: 0, lastX: 0, locked: null }); // locked: 'x' | 'y' | null

  const setPhaseBoth = useCallback((next) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const settle = useCallback((targetPercent, fire) => {
    setPhaseBoth("settling");
    setSettleTo(targetPercent);
    window.setTimeout(() => {
      fire?.();
      setPhaseBoth("idle");
      setDragPx(0);
      setSettleTo(0);
    }, SETTLE_MS);
  }, [setPhaseBoth]);

  useEffect(() => {
    const el = containerNode;
    if (!el || !enabled) return undefined;

    function onTouchStart(e) {
      if (phaseRef.current === "settling") return;
      const t = e.touches[0];
      gesture.current = { startX: t.clientX, startY: t.clientY, lastX: t.clientX, locked: null };
    }

    function onTouchMove(e) {
      const t = e.touches[0];
      const dx = t.clientX - gesture.current.startX;
      const dy = t.clientY - gesture.current.startY;
      gesture.current.lastX = t.clientX;

      if (gesture.current.locked === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        gesture.current.locked = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        if (gesture.current.locked === "x") setPhaseBoth("dragging");
      }
      if (gesture.current.locked === "x") {
        e.preventDefault(); // only once we're sure this is a horizontal swipe, not a page scroll
        setDragPx(dx);
      }
    }

    function onTouchEnd() {
      if (gesture.current.locked !== "x") {
        gesture.current.locked = null;
        return;
      }
      const dx = gesture.current.lastX - gesture.current.startX;
      gesture.current.locked = null;

      if (dx <= -SWIPE_THRESHOLD_PX) {
        settle(-200 / 3, callbacksRef.current.onSwipeLeft); // finish sliding to "next"
      } else if (dx >= SWIPE_THRESHOLD_PX) {
        settle(0, callbacksRef.current.onSwipeRight); // finish sliding to "prev"
      } else {
        settle(-100 / 3, null); // spring back, no index change
      }
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [containerNode, enabled, settle, setPhaseBoth]);

  const trackStyle = phase === "dragging"
    ? { transform: `translateX(calc(-100%/3 + ${dragPx}px))`, transition: "none" }
    : phase === "settling"
      ? { transform: `translateX(${settleTo}%)`, transition: `transform ${SETTLE_MS}ms ${EASING}` }
      : { transform: "translateX(calc(-100%/3))", transition: "none" };

  return { containerRef, trackStyle, isDragging: phase !== "idle" };
}
