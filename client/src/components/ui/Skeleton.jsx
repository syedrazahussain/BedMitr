export function SkeletonLine({ className }) {
  return (
    <div
      className={[
        "h-3 rounded-full bg-white/10 animate-pulse",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

export function SkeletonBlock({ className }) {
  return (
    <div
      className={[
        "rounded-2xl bg-white/10 animate-pulse",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

