export default function Spinner({ className }) {
  return (
    <div
      className={[
        "h-10 w-10 rounded-full border-2 border-aqua-500/30 border-t-aqua-400 animate-spin",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

