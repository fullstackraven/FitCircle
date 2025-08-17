/**
 * Reusable back button component
 * Provides consistent navigation UI across pages
 */

import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface BackButtonProps {
  to?: string;
  title?: string;
  label?: string;
  className?: string;
}

export function BackButton({ 
  to = "/calendar", 
  title = "Back to Calendar",
  label = "Back",
  className = "text-slate-500 hover:text-white transition-colors flex items-center space-x-1"
}: BackButtonProps) {
  const [, navigate] = useLocation();

  return (
    <button
      onClick={() => navigate(to)}
      className={className}
      title={title}
      aria-label={title}
    >
      <ArrowLeft className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}