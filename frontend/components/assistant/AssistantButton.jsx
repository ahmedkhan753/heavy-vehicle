"use client";

import { useState, useRef, useEffect } from "react";
import BrandLogo from "@/components/layout/BrandLogo";

export default function AssistantButton({ open, onClick, label }) {
  const buttonRef = useRef(null);
  const [position, setPosition] = useState(null); // { x: number, y: number }
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const initialOffset = useRef({ x: 0, y: 0 });

  // Cleanup window listeners on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const onDragStart = (clientX, clientY) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    initialOffset.current = { x: rect.left, y: rect.top };
    startPos.current = { x: clientX, y: clientY };
    isDragging.current = false;

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
  };

  const onDragMove = (clientX, clientY) => {
    const dx = clientX - startPos.current.x;
    const dy = clientY - startPos.current.y;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      isDragging.current = true;
    }

    if (isDragging.current && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      let newX = initialOffset.current.x + dx;
      let newY = initialOffset.current.y + dy;

      // Constrain within viewport boundaries with 10px padding
      const padding = 10;
      newX = Math.max(padding, Math.min(newX, window.innerWidth - rect.width - padding));
      newY = Math.max(padding, Math.min(newY, window.innerHeight - rect.height - padding));

      setPosition({ x: newX, y: newY });
    }
  };

  const onDragEnd = () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);

    if (!isDragging.current) {
      onClick();
    }
  };

  const onMouseDown = (e) => {
    if (e.button !== 0) return; // Left click only
    onDragStart(e.clientX, e.clientY);
  };

  const onMouseMove = (e) => {
    onDragMove(e.clientX, e.clientY);
  };

  const onMouseUp = () => {
    onDragEnd();
  };

  const onTouchStart = (e) => {
    const touch = e.touches[0];
    onDragStart(touch.clientX, touch.clientY);
  };

  const onTouchMove = (e) => {
    if (isDragging.current) {
      e.preventDefault(); // Prevent screen scroll during drag
    }
    const touch = e.touches[0];
    onDragMove(touch.clientX, touch.clientY);
  };

  const onTouchEnd = () => {
    onDragEnd();
  };

  // Apply inline styles once the button starts being dragged
  const dragStyle = position
    ? {
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        bottom: "auto",
        right: "auto",
        cursor: "grab",
        touchAction: "none",
      }
    : {
        cursor: "grab",
        touchAction: "none",
      };

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={label}
      aria-expanded={open}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      style={dragStyle}
      className="fixed bottom-20 right-4 z-50 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--hw-orange)] bg-[var(--hw-bg-card)] shadow-lg shadow-black/20 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[var(--hw-orange)] focus:ring-offset-2 focus:ring-offset-[var(--hw-bg-base)] lg:bottom-6"
    >
      <BrandLogo className="h-9 w-auto select-none pointer-events-none" />
    </button>
  );
}
