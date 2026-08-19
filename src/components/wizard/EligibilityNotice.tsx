interface Props {
  reasons: string[];
  onContinueAnyway: () => void;
  onGoBack: () => void;
}

export default function EligibilityNotice({ reasons, onContinueAnyway, onGoBack }: Props) {
  return (
    <div class="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
      <div class="rounded-xl border border-(--color-amber) bg-[#fbf3e4] p-4">
        <h3 class="font-display text-lg text-(--color-ink)">Tu caso podría estar fuera del alcance de esta campaña</h3>
        <ul class="mt-2 list-disc pl-5 text-[15px] text-(--color-ink)">
          {reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p class="mt-3 text-sm text-(--color-slate)">
          Esto no significa que tu situación no importe — esta campaña puntual tiene un alcance definido. Si crees
          que hay un error, o quieres que tu caso quede registrado igual, puedes continuar.
        </p>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onContinueAnyway}
          class="min-h-11 flex-1 rounded-lg border border-(--color-line) bg-(--color-paper-raised) px-4 text-[15px] font-medium text-(--color-ink)"
        >
          Continuar de todos modos
        </button>
        <button
          type="button"
          onClick={onGoBack}
          class="min-h-11 flex-1 rounded-lg bg-(--color-forest) px-4 text-[15px] font-medium text-white"
        >
          Revisar mis respuestas
        </button>
      </div>
    </div>
  );
}
