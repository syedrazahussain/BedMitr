export default function Card({
  className,
  variant = "glass",
  children,
}) {
  const variants = {
    glass: "glass border border-white/[0.08] bg-white/[0.02]",
    glassStrong: "glass-strong border border-white/[0.12] bg-white/[0.02]",
    lift: "rounded-3xl border border-white/[0.08] bg-ink-900/40 shadow-card",
  };

  return <div className={[variants[variant] || variants.glass, className].filter(Boolean).join(" ")}>{children}</div>;
}

