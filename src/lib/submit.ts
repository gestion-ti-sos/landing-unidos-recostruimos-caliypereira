import type { FormValues } from '../data/types';
import { allFields } from '../data/schema';
import { isFieldVisible } from './validation';
import { compressImages } from './media';

export interface SubmitResult {
  ok: boolean;
  error?: string;
}

/**
 * ⚠️ AJUSTAR A TU BACKEND
 *
 * Como ya tienes un backend que recibe el formulario, esta función construye
 * un `FormData` con una convención razonable por defecto:
 *   - Cada pregunta va como una entrada con su `id` como nombre de campo
 *     (ver los ids en schema.ts, ej. "full_name", "housing_location"...).
 *   - Los checkbox-group (selección múltiple) van como `${id}[]`, una
 *     entrada por valor seleccionado.
 *   - Los archivos van con el id del campo como nombre, una entrada por
 *     archivo (ej. 3 fotos = 3 entradas "photos").
 *   - Se agrega "submitted_at" con la fecha/hora ISO del envío.
 *
 * Si tu backend espera otros nombres de campo o un JSON en vez de
 * multipart/form-data, este es el único archivo que necesitas tocar.
 */
const ENDPOINT = import.meta.env.PUBLIC_FORM_ENDPOINT as string | undefined;

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
