'use client';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-white/10 ${className}`}
    />
  );
}

export function GameCardSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-36" />
    </div>
  );
}

export function ScoreRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-2">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-5 w-20" />
    </div>
  );
}
