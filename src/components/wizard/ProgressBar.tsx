interface Props {
  current: number; // 0-indexed
  total: number;
  title: string;
  eyebrow: string;
  savedLabel: string | null;
}

export default function ProgressBar({ current, total, title, eyebrow, savedLabel }: Props) {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div class="sticky top-0 z-10 border-b border-(--color-line) bg-(--color-paper)/95 backdrop-blur-sm px-4 pt-3 pb-2.5">
      <div class="mx-auto flex max-w-lg items-center justify-between gap-2 text-xs text-(--color-slate)">
        <span>
          Paso {current + 1} de {total}
        </span>
        <span aria-live="polite" class="min-h-[1em] text-(--color-forest)">
          {savedLabel ?? ''}
        </span>
      </div>
      <div class="mx-auto mt-1.5 max-w-lg">
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-(--color-line)">
          <div
            class="h-full rounded-full bg-(--color-brick) transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div class="mx-auto mt-2 max-w-lg">
        <p class="text-[13px] font-medium uppercase tracking-wide text-(--color-brick-dark)">{eyebrow}</p>
        <h2 class="font-display text-xl text-(--color-ink)">{title}</h2>
      </div>
    </div>
  );
}
