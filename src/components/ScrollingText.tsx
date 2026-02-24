'use client';

import { useRef, useState, useEffect } from 'react';

interface ScrollingTextProps {
  children: string;
  className?: string;
  /** If true, always scroll (marquee). If false, only scroll when content overflows. */
  forceScroll?: boolean;
}

export default function ScrollingText({ children, className = '', forceScroll = false }: ScrollingTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const checkOverflow = () => {
      setShouldScroll(forceScroll || content.scrollWidth > container.clientWidth);
    };

    checkOverflow();
    const ro = new ResizeObserver(checkOverflow);
    ro.observe(container);

    return () => ro.disconnect();
  }, [children, forceScroll]);

  return (
    <div ref={containerRef} className={`overflow-hidden ${className}`}>
      <span
        ref={contentRef}
        className={`inline-block whitespace-nowrap ${shouldScroll ? 'animate-marquee' : ''}`}
      >
        {children}
        {shouldScroll && (
          <>
            <span className="inline-block w-12 shrink-0" aria-hidden />
            {children}
          </>
        )}
      </span>
    </div>
  );
}
