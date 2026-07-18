"use client";

import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  children?: ReactNode;
}

export default function EmptyState({ icon, title, description, action, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center" role="status">
      {icon && (
        <span aria-hidden="true" className="text-5xl mb-4 opacity-40">{icon}</span>
      )}
      <h3 className="text-lg font-semibold text-slate-200 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-400 max-w-md mb-6">{description}</p>
      )}
      {children}
      {action && action.href && (
        <a
          href={action.href}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#c5a35e] to-[#a8851f] text-[#0a0e1a] font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          {action.label}
        </a>
      )}
      {action && action.onClick && !action.href && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#c5a35e] to-[#a8851f] text-[#0a0e1a] font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
