import Link from "next/link";

export function Brand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 rounded-lg focus-visible:outline-offset-4"
      aria-label="KaggleScope home"
    >
      <span className="grid size-9 place-items-center rounded-[0.65rem] border border-primary/30 bg-primary/10 font-mono text-sm font-bold text-primary shadow-[inset_0_0_20px_rgb(45_212_191/8%)]">
        KS
      </span>
      <span className="text-[1.05rem] font-semibold tracking-[-0.025em]">
        KaggleScope
      </span>
    </Link>
  );
}
