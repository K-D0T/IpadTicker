'use client';

import { useRef, useEffect, useState } from 'react';

interface PixelLogoProps {
  src: string;
  size: number;
  pixelResolution?: number;
  glow?: boolean;
  className?: string;
}

export default function PixelLogo({
  src,
  size,
  pixelResolution = 24,
  glow = false,
  className = '',
}: PixelLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!src) return;
    setLoaded(false);
    setErrored(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const pad = Math.max(2, Math.floor(size / 22));
      const innerSize = size - pad * 2;

      canvas.width = innerSize;
      canvas.height = innerSize;

      const offscreen = document.createElement('canvas');
      offscreen.width = pixelResolution;
      offscreen.height = pixelResolution;
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;

      offCtx.imageSmoothingEnabled = true;
      offCtx.drawImage(img, 0, 0, pixelResolution, pixelResolution);

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(offscreen, 0, 0, pixelResolution, pixelResolution, 0, 0, innerSize, innerSize);

      setLoaded(true);
    };

    img.onerror = () => setErrored(true);
    img.src = src;
  }, [src, size, pixelResolution]);

  const wrapperClass = `rounded-lg logo-icon-bg border border-white/20 shadow-inner flex items-center justify-center shrink-0 ${className}`;

  if (errored || !src) {
    return (
      <div className={wrapperClass} style={{ width: size, height: size }}>
        <span className="text-gray-600 text-xs font-bold">?</span>
      </div>
    );
  }

  const pad = Math.max(2, Math.floor(size / 22));
  const innerSize = size - pad * 2;
  return (
    <div className={wrapperClass} style={{ width: size, height: size, padding: pad }}>
      <canvas
        ref={canvasRef}
        width={innerSize}
        height={innerSize}
        className="rounded-[inherit] block"
        style={{
          width: innerSize,
          height: innerSize,
          imageRendering: 'pixelated',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s ease',
          boxShadow: glow
            ? '0 0 12px rgba(0,200,255,0.3), 0 0 24px rgba(0,200,255,0.1)'
            : undefined,
        }}
      />
    </div>
  );
}
