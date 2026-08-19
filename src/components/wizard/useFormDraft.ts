import { useEffect, useRef, useState } from 'preact/hooks';
import type { FormValues } from '../../data/types';
import { saveDraft, loadDraft, clearDraft } from '../../lib/storage';

export function useFormDraft() {
  const [values, setValues] = useState<FormValues>({});
  const [savedLabel, setSavedLabel] = useState<string | null>(null);
  const [resumeAvailable, setResumeAvailable] = useState(false);
  const initialStep = useRef(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const labelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoaded = useRef(false);

  // Cargar borrador una sola vez, al montar.
  useEffect(() => {
    const draft = loadDraft();
    if (draft && Object.keys(draft.values).length > 0) {
      setValues(draft.values);
      initialStep.current = draft.meta.currentStep ?? 0;
      setResumeAvailable(true);
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
  };
}
