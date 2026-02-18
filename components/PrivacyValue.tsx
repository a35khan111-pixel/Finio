"use client";

import { useBudgetStore } from "@/store/useBudgetStore";

interface PrivacyValueProps {
  children: React.ReactNode;
  className?: string;
  /** If true, shows a fixed-width blur placeholder instead of the actual children */
  as?: "span" | "p" | "div";
}

/**
 * Wraps a sensitive value. When privacy mode is on, blurs the content
 * with a smooth CSS transition so the layout never shifts.
 */
export function PrivacyValue({
  children,
  className = "",
  as: Tag = "span",
}: PrivacyValueProps) {
  const privacyMode = useBudgetStore((s) => s.privacyMode);

  return (
    <Tag
      className={`transition-all duration-300 ease-out inline-block ${
        privacyMode
          ? "blur-md select-none pointer-events-none"
          : "blur-0"
      } ${className}`}
      aria-hidden={privacyMode}
    >
      {children}
    </Tag>
  );
}
