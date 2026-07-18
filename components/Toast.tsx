"use client";

import { useState, useCallback, useEffect, createContext, useContext, type ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

const ToastContext = createContext<(message: string, type?: ToastType) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2" aria-live="polite" role="status">
        {toasts.map((toast) => {
          const colors: Record<ToastType, string> = {
            success: "border-[#c5a35e]/40 bg-[#c5a35e]/10 text-[#e0c887]",
            error: "border-red-500/40 bg-red-500/10 text-red-400",
            info: "border-blue-500/40 bg-blue-500/10 text-blue-300",
          };
          const icons: Record<ToastType, string> = {
            success: "✅",
            error: "⚠️",
            info: "ℹ️",
          };
          return (
            <div
              key={toast.id}
              className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur-sm animate-slide-up ${colors[toast.type]}`}
              role="alert"
            >
              <span aria-hidden="true">{icons[toast.type]}</span>
              <span>{toast.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
