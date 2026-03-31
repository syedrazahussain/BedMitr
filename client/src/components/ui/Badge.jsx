export default function Badge({
  className,
  children,
  tone = "aqua",
}) {
  const tones = {
    aqua: "bg-aqua-500/15 text-aqua-200 border-aqua-500/20",
    emerald: "bg-emerald-500/15 text-emerald-200 border-emerald-500/20",
    violet: "bg-violet-500/15 text-violet-200 border-violet-500/20",
    rose: "bg-rose-500/15 text-rose-200 border-rose-500/20",
    neutral: "bg-white/5 text-slate-200 border-white/10",
  };

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-widest",
        tones[tone] || tones.neutral,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}

