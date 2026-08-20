import type { FormValues } from '../data/types';
import { allFields } from '../data/schema';
import { isFieldVisible } from './validation';
import { compressImages } from './media';
import { fieldRequiresOtherDetail, getOtherDetailFieldId } from './other-detail';

export interface SubmitResult {
  ok: boolean;
  error?: string;
}

export interface SubmitMeta {
  /** Tiempo real (en segundos) que tardó la persona en llenar el formulario. */
  durationSeconds?: number;
}

const ENDPOINT = "/api/send-form";

export async function buildFormData(values: FormValues, meta?: SubmitMeta): Promise<FormData> {
  const formData = new FormData();

  for (const field of allFields) {
    if (!isFieldVisible(field, values)) continue;
    const value = values[field.id];

    if (value !== undefined && value !== '') {
      if (field.type === 'file') {
        const files = (Array.isArray(value) ? value : []) as File[];
        if (files.length > 0) {
          const toSend = field.compressImages ? await compressImages(files) : files;
          for (const file of toSend) formData.append(field.id, file, file.name);
        }
      } else if (Array.isArray(value)) {
        for (const v of value) formData.append(`${field.id}[]`, String(v));
      } else {
        formData.append(field.id, String(value));
      }
    }

    // Detalle libre de "Otro" (ver lib/otherDetail.ts) — viaja como un
    // campo aparte, ej. `document_type__otro_detalle`.
    if (fieldRequiresOtherDetail(field, values)) {
      const detailId = getOtherDetailFieldId(field);
      const detailValue = values[detailId];
      if (typeof detailValue === 'string' && detailValue.trim() !== '') {
        formData.append(detailId, detailValue.trim());
      }
    }
  }

  formData.append('submitted_at', new Date().toISOString());
  if (meta?.durationSeconds !== undefined) {
    formData.append('form_duration_seconds', String(meta.durationSeconds));
  }
  return formData;
}

export async function submitForm(values: FormValues, meta?: SubmitMeta): Promise<SubmitResult> {
  if (!ENDPOINT) {
    return {
      ok: false,
      error:
        'No hay un endpoint configurado (PUBLIC_FORM_ENDPOINT). Define la variable de entorno con la URL de tu backend.',
    };
  }

  try {
    const formData = await buildFormData(values, meta);
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