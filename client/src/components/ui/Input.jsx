export default function Input({
  className,
  type = "text",
  ...props
}) {
  return (
    <input
      type={type}
      className={[
        "w-full rounded-xl bg-ink-900/90 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-600",
        "focus:outline-none focus:ring-2 focus:ring-aqua-500/40",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

