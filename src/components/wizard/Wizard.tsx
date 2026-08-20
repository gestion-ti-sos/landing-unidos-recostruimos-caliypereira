import { useMemo, useRef, useState } from 'preact/hooks';
import { sections } from '../../data/schema';
import type { FieldValue } from '../../data/types';
import { isFieldVisible, isFieldRequired, validateSection } from '../../lib/validation';
import { evaluateEligibility } from '../../lib/eligibility';
import { submitForm } from '../../lib/submit';
import { useFormDraft } from './useFormDraft';
import FieldRenderer from './FieldRenderer';
import ProgressBar from './ProgressBar';
import EligibilityNotice from './EligibilityNotice';

const REQUISITOS_INDEX = sections.findIndex((s) => s.id === 'requisitos');

type Phase = 'form' | 'eligibility-notice' | 'submitting' | 'success' | 'error';

export default function Wizard() {
  const {
    values,
    updateValue,
    savedLabel,
    resumeAvailable,
    dismissResumeBanner,
    initialStep,
    discardDraft,
    getElapsedSeconds,
  } = useFormDraft();

  const [step, setStep] = useState(initialStep);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>('form');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const section = sections[step];
  const visibleFields = useMemo(() => section.fields.filter((f) => isFieldVisible(f, values)), [section, values]);

  function scrollTop() {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleBack() {
    if (step === 0) return;
    setErrors({});
    setStep((s) => s - 1);
    scrollTop();
  }

  function goToStep(index: number) {
    setErrors({});
    setStep(index);
    scrollTop();
  }

  async function handleContinue() {
    const stepErrors = validateSection(visibleFields, values);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      scrollTop();
      return;
    }
    setErrors({});

    if (step === REQUISITOS_INDEX) {
      const { eligible } = evaluateEligibility(values);
      if (!eligible) {
        setPhase('eligibility-notice');
        scrollTop();
        return;
      }
    }

    if (step === sections.length - 1) {
      await handleSubmit();
      return;
    }

    setStep((s) => s + 1);
    scrollTop();
  }

  async function handleSubmit() {
    setPhase('submitting');
    const result = await submitForm(values, { durationSeconds: getElapsedSeconds() });
    if (result.ok) {
      discardDraft();
      setPhase('success');
    } else {
      setSubmitError(result.error ?? 'Algo salió mal.');
      setPhase('error');
    }
    scrollTop();
  }

  if (phase === 'success') {
    return (
      <div ref={topRef} class="mx-auto flex max-w-lg flex-col items-center gap-3 px-4 py-16 text-center">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-(--color-forest) text-2xl text-white">
          ✓
        </div>
        <h2 class="font-display text-2xl text-(--color-ink)">Recibimos tu postulación</h2>
        <p class="text-[15px] text-(--color-slate)">
          Gracias por contarnos tu caso. Nuestro equipo va a revisar la información y se pondrá en contacto contigo
          para coordinar la visita técnica.
        </p>
      </div>
    );
  }

  if (phase === 'submitting') {
    return (
      <div ref={topRef} class="mx-auto flex max-w-lg flex-col items-center gap-3 px-4 py-16 text-center">
        <div class="h-8 w-8 animate-spin rounded-full border-3 border-(--color-line) border-t-(--color-brick)" />
        <p class="text-[15px] text-(--color-slate)">Enviando tu información…</p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div ref={topRef} class="mx-auto flex max-w-lg flex-col gap-4 px-4 py-16 text-center">
        <h2 class="font-display text-xl text-(--color-ink)">No pudimos enviar tu formulario</h2>
        <p class="text-[15px] text-(--color-slate)">{submitError}</p>
        <button
          type="button"
          onClick={() => setPhase('form')}
          class="mx-auto min-h-11 rounded-lg bg-(--color-forest) px-6 text-[15px] font-medium text-white"
        >
          Volver e intentar de nuevo
        </button>
      </div>
    );
  }

  if (phase === 'eligibility-notice') {
    return (
      <div ref={topRef}>
        <EligibilityNotice
          reasons={evaluateEligibility(values).reasons}
          onGoBack={() => {
            setPhase('form');
            goToStep(REQUISITOS_INDEX);
          }}
          onContinueAnyway={() => {
            setPhase('form');
            setStep((s) => Math.min(s + 1, sections.length - 1));
            scrollTop();
          }}
        />
      </div>
    );
  }

  return (
    <div ref={topRef}>
      <ProgressBar
        current={step}
        total={sections.length}
        title={section.title}
        eyebrow={section.eyebrow}
        savedLabel={savedLabel}
      />

      <div class="mx-auto max-w-lg px-4 py-5">
        {resumeAvailable && (
          <div class="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-(--color-forest-light) bg-[#eef3f0] px-3.5 py-3 text-sm text-(--color-ink)">
            <span>Encontramos respuestas guardadas de una vez anterior. Seguimos donde quedaste.</span>
            <div class="flex gap-3">
              <button type="button" onClick={dismissResumeBanner} class="shrink-0 whitespace-nowrap font-medium underline">
                Seguir aquí
              </button>
              <button
                type="button"
                onClick={() => {
                  discardDraft();
                  setStep(0);
                }}
                class="shrink-0 whitespace-nowrap underline"
              >
                Empezar de nuevo
              </button>
            </div>
          </div>
        )}

        {step === 0 && !resumeAvailable && (
          <div class="mb-5 flex flex-col gap-2">
            <span class="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#eef3f0] px-3 py-1 text-xs font-medium text-(--color-forest)">
              ⏱ Tiempo estimado: 5 minutos
            </span>
            <p class="text-[15px] text-(--color-slate)">
              Son unas 60 preguntas, pero la mayoría son cortas y varias no te van a aplicar. Una familia toma en
              promedio entre 35 y 40 respuestas. Puedes cerrar esta página en cualquier momento — tus respuestas se
              guardan solas en este dispositivo.
            </p>
          </div>
        )}

        {section.description && <p class="mb-5 text-[15px] text-(--color-slate)">{section.description}</p>}

        <form
          class="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleContinue();
          }}
        >
          {visibleFields.map((field) => (
            <FieldRenderer
              key={field.id}
              field={field}
              values={values}
              errors={errors}
              required={isFieldRequired(field, values)}
              onChange={(id, val: FieldValue) => {
                updateValue(id, val, step);
                if (errors[id]) setErrors((prev) => ({ ...prev, [id]: '' }));
              }}
            />
          ))}
        </form>
      </div>

      <div class="sticky bottom-0 border-t border-(--color-line) bg-(--color-paper)/95 px-4 py-3 backdrop-blur-sm">
        <div class="mx-auto flex max-w-lg gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 0}
            class="min-h-12 rounded-lg border border-(--color-line) bg-(--color-paper-raised) px-5 text-[15px] font-medium text-(--color-ink) disabled:opacity-40"
          >
            Atrás
          </button>
          <button type="button" onClick={handleContinue} class="min-h-12 flex-1 rounded-lg bg-(--color-brick) px-5 text-[15px] font-semibold text-white">
            {step === sections.length - 1 ? 'Enviar postulación' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}