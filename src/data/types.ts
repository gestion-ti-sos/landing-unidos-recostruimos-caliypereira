/**
 * Tipos base del formulario.
 *
 * Todo el formulario (60 preguntas / 9 secciones) se describe como DATOS
 * (ver `schema.ts`), no como componentes escritos a mano uno por uno.
 * Esto es a propósito: agregar, quitar o reordenar una pregunta es editar
 * un objeto en `schema.ts`, no tocar JSX ni lógica de render.
 *
 * `visibleIf` y `requiredIf` son funciones sobre `FormValues`, así que
 * TypeScript te avisa en compilación si referenciás un `FieldId` que no
 * existe o si comparás contra un tipo de valor incorrecto (ver los helpers
 * `eq`, `oneOf`, `truthy` en `conditions.ts`).
 */

export type FieldId = string;

/** Valor que puede tomar un campo. Los archivos NO se persisten en
 * localStorage (no son serializables de forma barata) — ver storage.ts. */
export type FieldValue = string | string[] | boolean | FileList | File[] | undefined;

export type FormValues = Record<FieldId, FieldValue>;

export interface Option {
  value: string;
  label: string;
  /** Marca la opción como "fuera de alcance" (se registra pero no bloquea
   * necesariamente el envío) — usado en la sección 2. */
  outOfScope?: boolean;
  requiresDetail?: boolean;
}

interface BaseField {
  id: FieldId;
  /** Número de sección (1-9), solo para trazabilidad/orden. */
  section: number;
  label: string;
  helpText?: string;
  /** Requerido siempre. Si el campo es condicional, combinar con `visibleIf`. */
  required?: boolean;
  /** El campo solo se vuelve requerido bajo cierta condición (ej. "si
   * respondiste que eres arrendatario, decinos si el propietario está de
   * acuerdo"). Si no se define, se usa `required`. */
  requiredIf?: (values: FormValues) => boolean;
  /** Si retorna false, el campo no se renderiza y su valor se ignora al
   * validar/enviar. */
  visibleIf?: (values: FormValues) => boolean;
  /** Toca datos sensibles (salud, discapacidad, etc.) — se muestra con
   * aclaración explícita de que es opcional y por qué se pregunta. */
  sensitive?: boolean;
  /** Nota corta bajo el campo (ej. "Esto no afecta tu postulación"). */
  note?: string;
  /** Placeholder de ejemplo (inputs de texto/select) y autocompletado del
   * navegador (inputs de texto). Se ignoran en tipos donde no aplican. */
  placeholder?: string;
  autoComplete?: string;
}

export type Field =
  | (BaseField & { type: 'text'; maxLength?: number })
  | (BaseField & { type: 'textarea'; maxLength?: number; rows?: number })
  | (BaseField & { type: 'tel'; exactDigits?: number })
  | (BaseField & { type: 'email' })
  | (BaseField & { type: 'date' })
  | (BaseField & { type: 'number'; min?: number; max?: number })
  | (BaseField & { type: 'select'; options: Option[] })
  | (BaseField & { type: 'radio'; options: Option[] })
  | (BaseField & { type: 'checkbox-group'; options: Option[]; minSelected?: number; maxSelected?: number })
  | (BaseField & { type: 'consent'; consentText: string })
  | (BaseField & { type: 'url' })
  | (BaseField & {
      type: 'file';
      accept: string;
      multiple?: boolean;
      maxFiles?: number;
      maxSizeMB?: number;
      /** Si true, las imágenes se comprimen en el navegador antes de
       * guardarlas en memoria/enviarlas (ver lib/media.ts). */
      compressImages?: boolean;
    });

export interface Section {
  id: string;
  order: number;
  eyebrow: string;
  title: string;
  description?: string;
  fields: Field[];
}

/** Resultado de evaluar la sección 2 (requisitos de la campaña). */
export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}
