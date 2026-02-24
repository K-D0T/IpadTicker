'use client';

import { ReactNode } from 'react';

interface LedOverlayProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
}

export default function LedOverlay({
  children,
  className = '',
  intensity = 0.18,
}: LedOverlayProps) {
  return (
    <div className={`relative ${className}`}>
      {children}
      <div
        className="led-dots pointer-events-none absolute inset-0 rounded-[inherit] z-10"
        style={{ opacity: intensity }}
      />
    </div>
  );
}
