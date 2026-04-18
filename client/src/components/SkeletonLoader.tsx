interface Props {
  rows?: number;
  className?: string;
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-xl h-24 ${className}`} />;
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 rounded w-3/4" />
        <div className="skeleton h-3 rounded w-1/2" />
      </div>
      <div className="skeleton h-4 w-16 rounded" />
    </div>
  );
}

export function SkeletonLoader({ rows = 5 }: Props) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  );
}
