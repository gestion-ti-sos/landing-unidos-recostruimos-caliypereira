import type { Field, FormValues } from '../data/types';

export function isFieldVisible(field: Field, values: FormValues): boolean {
  return field.visibleIf ? field.visibleIf(values) : true;
}

export function isFieldRequired(field: Field, values: FormValues): boolean {
  if (field.requiredIf) return field.requiredIf(values);
  return Boolean(field.required);
}

/** Devuelve un mensaje de error o null si el campo es válido. */
export function validateField(field: Field, values: FormValues): string | null {
  if (!isFieldVisible(field, values)) return null;

  const value = values[field.id];
  const required = isFieldRequired(field, values);

  const isEmpty =
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0) ||
    (field.type === 'consent' && value !== true);

  if (field.type === 'consent') {
    if (required && value !== true) return 'Necesitamos que marques esta casilla para continuar.';
    return null;
  }

  if (required && isEmpty) {
    return 'Este campo es obligatorio.';
  }

  if (isEmpty) return null; // opcional y vacío: nada más que validar

  switch (field.type) {
    case 'tel': {
      const digits = String(value).replace(/\D/g, '');
      if (field.exactDigits && digits.length !== field.exactDigits) {
        return `Debe tener exactamente ${field.exactDigits} dígitos.`;
      }
      return null;
    }
    case 'email': {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
      return ok ? null : 'Ingresa un correo válido.';
    }
    case 'url': {
      try {
        new URL(String(value));
        return null;
      } catch {
        return 'Ingresa un enlace válido (debe empezar con https://).';
      }
    }
    case 'checkbox-group': {
      const arr = value as string[];
      if (field.minSelected && arr.length < field.minSelected) {
        return `Selecciona al menos ${field.minSelected} opción(es).`;
      }
      if (field.maxSelected && arr.length > field.maxSelected) {
        return `Selecciona como máximo ${field.maxSelected} opción(es).`;
      }
      return null;
    }
    case 'number': {
      const n = Number(value);
      if (Number.isNaN(n)) return 'Ingresa un número válido.';
      if (field.min !== undefined && n < field.min) return `El mínimo es ${field.min}.`;
      if (field.max !== undefined && n > field.max) return `El máximo es ${field.max}.`;
      return null;
    }
    case 'file': {
      const files = value as File[];
      if (!Array.isArray(files)) return null;
      if (field.maxFiles && files.length > field.maxFiles) {
        return `Puedes adjuntar como máximo ${field.maxFiles} archivo(s).`;
      }
      if (field.maxSizeMB) {
        const tooBig = files.find((f) => f.size > field.maxSizeMB! * 1024 * 1024);
        if (tooBig) return `"${tooBig.name}" supera el máximo de ${field.maxSizeMB} MB.`;
      }
      return null;
    }
    default:
      return null;
  }
}

/** Valida todos los campos visibles de una sección. Devuelve un mapa id -> error. */
export function validateSection(fields: Field[], values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const err = validateField(field, values);
    if (err) errors[field.id] = err;
  }
  return errors;
}
