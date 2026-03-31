export default function Select({ className, children, ...props }) {
  return (
    <select
      className={[
        "w-full rounded-xl bg-ink-900/90 border border-white/10 px-4 py-3 text-sm text-white",
        "focus:outline-none focus:ring-2 focus:ring-aqua-500/40",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </select>
  );
}

