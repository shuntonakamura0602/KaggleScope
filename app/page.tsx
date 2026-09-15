export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="flex items-center gap-3" aria-label="KaggleScope">
        <span
          aria-hidden="true"
          className="grid size-10 place-items-center rounded-xl border border-primary/30 bg-primary/10 font-mono text-lg font-bold text-primary"
        >
          KS
        </span>
        <span className="text-xl font-semibold tracking-tight">
          KaggleScope
        </span>
      </div>
    </main>
  );
}
