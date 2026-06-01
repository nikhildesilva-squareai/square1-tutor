"use client";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
}

export function Logo({ className, size = "md", variant = "dark" }: LogoProps) {
  const sizes = { sm: "h-7", md: "h-9", lg: "h-12" };
  const textColor = variant === "light" ? "#FFFFFF" : "#0F172A";
  const accentColor = "#0056CE";
  return (
    <div className={cn("flex items-center gap-2", sizes[size], className)}>
      {/* Square icon with S1 */}
      <svg viewBox="0 0 36 36" fill="none" className="h-full w-auto" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="8" fill={accentColor}/>
        <text x="18" y="25" textAnchor="middle" fill="white" fontSize="16" fontWeight="700" fontFamily="system-ui, sans-serif">S1</text>
      </svg>
      <span style={{ color: textColor }} className="font-bold text-lg tracking-tight">
        Square 1 <span style={{ color: accentColor }}>AI</span>
      </span>
    </div>
  );
}
