import type { FormValues } from '../data/types';

const STORAGE_KEY = 'coral-terremoto-form:draft:v1';
const STORAGE_META_KEY = 'coral-terremoto-form:draft-meta:v1';

interface DraftMeta {
  updatedAt: string;
  currentStep: number;
}

/** Los archivos (File/FileList) no se guardan: no sirven de mucho en
 * localStorage (límite ~5MB, y de todas formas no sobreviven bien
 * serializados) y preferimos avisar explícitamente que hay que volver a
 * adjuntarlos, a fingir que se guardaron. */
function stripFiles(values: FormValues): FormValues {
  const clean: FormValues = {};
  for (const [key, val] of Object.entries(values)) {
    const isFileLike = val instanceof File || (Array.isArray(val) && val[0] instanceof File) || val instanceof FileList;
    if (!isFileLike) clean[key] = val;
  }
  return clean;
}

export function saveDraft(values: FormValues, currentStep: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stripFiles(values)));
    const meta: DraftMeta = { updatedAt: new Date().toISOString(), currentStep };
    window.localStorage.setItem(STORAGE_META_KEY, JSON.stringify(meta));
  } catch {
    // localStorage lleno o deshabilitado (modo incógnito estricto, etc.)
    // No es crítico: seguimos funcionando sin autosave.
  }
}

export function loadDraft(): { values: FormValues; meta: DraftMeta } | null {
  if (typeof window === 'undefined') return null;
  try {
    const rawValues = window.localStorage.getItem(STORAGE_KEY);
    const rawMeta = window.localStorage.getItem(STORAGE_META_KEY);
    if (!rawValues || !rawMeta) return null;
    return { values: JSON.parse(rawValues), meta: JSON.parse(rawMeta) };
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(STORAGE_META_KEY);
}

export function hasFileFields(values: FormValues): boolean {
  return Object.values(values).some(
    (val) => val instanceof File || (Array.isArray(val) && val[0] instanceof File) || val instanceof FileList,
  );
}
