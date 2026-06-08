"use client";

import { createContext, useContext, useState } from "react";

const ToastContext = createContext({
  success: () => {},
  error: () => {},
  info: () => {},
});

export const useToast = () => useContext(ToastContext);

let nextId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (type, message) => {
    const toast = { id: nextId++, type, message };
    setToasts((current) => [...current, toast]);
    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toast.id));
    }, 3000);
  };

  const value = {
    success: (message) => addToast("success", message),
    error: (message) => addToast("error", message),
    info: (message) => addToast("info", message),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-20 right-5 z-[80] grid gap-2 md:bottom-5">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`min-w-64 rounded-lg px-4 py-3 text-sm font-semibold shadow-2xl ${
              toast.type === "success"
                ? "bg-[var(--hw-green)] text-[var(--hw-text-inverse)]"
                : toast.type === "error"
                  ? "bg-[var(--hw-red)] text-white"
                  : "bg-[var(--hw-bg-elevated)] text-[var(--hw-text-primary)]"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
