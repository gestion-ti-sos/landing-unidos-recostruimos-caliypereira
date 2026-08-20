import { useEffect, useRef, useState } from 'preact/hooks';
import type { FormValues } from '../../data/types';
import { saveDraft, loadDraft, clearDraft } from '../../lib/storage';

const STARTED_AT_STORAGE_KEY = 'sos_todos_unidos_form_started_at';

function readStartedAt(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STARTED_AT_STORAGE_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

function writeStartedAt(value: number | null) {
  if (typeof window === 'undefined') return;
  try {
    if (value === null) {
      window.localStorage.removeItem(STARTED_AT_STORAGE_KEY);
    } else {
      window.localStorage.setItem(STARTED_AT_STORAGE_KEY, String(value));
    }
  } catch {
    // localStorage puede fallar (modo privado, cuota, etc.) — no es crítico.
  }
}

export function useFormDraft() {
  const [values, setValues] = useState<FormValues>({});
  const [savedLabel, setSavedLabel] = useState<string | null>(null);
  const [resumeAvailable, setResumeAvailable] = useState(false);
  const initialStep = useRef(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const labelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoaded = useRef(false);
  const startedAtRef = useRef<number>(0);

  // Cargar borrador una sola vez, al montar.
  useEffect(() => {
    const draft = loadDraft();
    if (draft && Object.keys(draft.values).length > 0) {
      setValues(draft.values);
      initialStep.current = draft.meta.currentStep ?? 0;
      setResumeAvailable(true);
    }

    // El "inicio" se persiste aparte del borrador: si la persona cierra y
    // vuelve a abrir mientras llena el formulario, el tiempo real que
    // mandamos al backend sigue midiendo desde el primer momento en que
    // abrió el formulario (no se reinicia por refrescar la página).
    const existingStartedAt = readStartedAt();
    if (existingStartedAt) {
      startedAtRef.current = existingStartedAt;
    } else {
      const now = Date.now();
      startedAtRef.current = now;
      writeStartedAt(now);
    }

    hasLoaded.current = true;
  }, []);

  function scheduleSave(nextValues: FormValues, currentStep: number) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveDraft(nextValues, currentStep);
      setSavedLabel('Guardado en este dispositivo');
      if (labelTimer.current) clearTimeout(labelTimer.current);
      labelTimer.current = setTimeout(() => setSavedLabel(null), 2500);
    }, 500);
  }

  function updateValue(id: string, value: FormValues[string], currentStep: number) {
    setValues((prev) => {
      const next = { ...prev, [id]: value };
      scheduleSave(next, currentStep);
      return next;
    });
  }

  function updateManyValues(patch: FormValues, currentStep: number) {
    setValues((prev) => {
      const next = { ...prev, ...patch };
      scheduleSave(next, currentStep);
      return next;
    });
  }

  function discardDraft() {
    clearDraft();
    setValues({});
    setResumeAvailable(false);
    const now = Date.now();
    startedAtRef.current = now;
    writeStartedAt(now);
  }

  /** Segundos transcurridos desde que la persona abrió el formulario por
   * primera vez. Ojo: mide tiempo real de reloj, no tiempo "activo" — si
   * cierra la pestaña y vuelve dos días después, cuenta esos dos días. */
  function getElapsedSeconds() {
    const start = startedAtRef.current || Date.now();
    return Math.max(0, Math.round((Date.now() - start) / 1000));
  }

  return {
    values,
    updateValue,
    updateManyValues,
    savedLabel,
    resumeAvailable,
    dismissResumeBanner: () => setResumeAvailable(false),
    initialStep: initialStep.current,
    discardDraft,
    getElapsedSeconds,
  };
}