import type { FormValues } from '../data/types';
import { allFields } from '../data/schema';
import { isFieldVisible } from './validation';
import { compressImages } from './media';

export interface SubmitResult {
  ok: boolean;
  error?: string;
}

const ENDPOINT = "/api/send-form";

export async function buildFormData(values: FormValues): Promise<FormData> {
  const formData = new FormData();

  for (const field of allFields) {
    if (!isFieldVisible(field, values)) continue;
    const value = values[field.id];
    if (value === undefined || value === '') continue;

    if (field.type === 'file') {
      const files = (Array.isArray(value) ? value : []) as File[];
      if (files.length === 0) continue;
      const toSend = field.compressImages ? await compressImages(files) : files;
      for (const file of toSend) formData.append(field.id, file, file.name);
      continue;
    }

    if (Array.isArray(value)) {
      for (const v of value) formData.append(`${field.id}[]`, String(v));
      continue;
    }

    formData.append(field.id, String(value));
  }

  formData.append('submitted_at', new Date().toISOString());
  return formData;
}

export async function submitForm(values: FormValues): Promise<SubmitResult> {
  if (!ENDPOINT) {
    return {
      ok: false,
      error:
        'No hay un endpoint configurado (PUBLIC_FORM_ENDPOINT). Define la variable de entorno con la URL de tu backend.',
    };
  }

  try {
    const formData = await buildFormData(values);
    const res = await fetch(ENDPOINT, { method: 'POST', body: formData });
    if (!res.ok) {
      return { ok: false, error: `El servidor respondió con un error (${res.status}). Intenta de nuevo.` };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: 'No se pudo enviar. Revisa tu conexión — tus respuestas siguen guardadas en este dispositivo.',
    };
  }
}
