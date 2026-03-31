const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua-500/50 disabled:opacity-60 disabled:cursor-not-allowed";

const variants = {
  primary:
    "bg-gradient-to-r from-aqua-500 to-teal-600 text-ink-950 shadow-glow hover:opacity-95",
  secondary:
    "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
  outline: "border border-white/15 bg-transparent text-white hover:bg-white/5",
  ghost: "bg-transparent text-slate-300 hover:bg-white/5 border border-transparent hover:border-white/10",
  danger: "border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15",
  link: "bg-transparent text-aqua-300 hover:text-white px-0 py-0 rounded-none border border-transparent hover:border-transparent",
};

const sizes = {
  sm: "px-4 py-2 text-xs font-semibold",
  md: "px-5 py-2.5 text-sm font-semibold",
  lg: "px-7 py-3.5 text-sm font-bold",
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={[base, variants[variant], sizes[size], className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}

