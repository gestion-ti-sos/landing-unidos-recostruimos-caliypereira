import type { FormValues, FieldId } from './types';

/** values[id] === value (para radios/selects de valor único). */
export const eq = (id: FieldId, value: string) => (values: FormValues) => values[id] === value;

/** values[id] es alguno de estos valores. */
export const oneOf = (id: FieldId, list: string[]) => (values: FormValues) => {
  const v = values[id];
  return typeof v === 'string' && list.includes(v);
};

/** El campo (checkbox-group) incluye este valor entre los seleccionados. */
export const includes = (id: FieldId, value: string) => (values: FormValues) => {
  const v = values[id];
  return Array.isArray(v) && (v as string[]).includes(value);
};

/** El campo tiene algún valor "verdadero" (radio sí/no === 'si', checkbox true, etc.) */
export const truthy = (id: FieldId) => (values: FormValues) => {
  const v = values[id];
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v === 'si' || v === 'sí';
  if (Array.isArray(v)) return v.length > 0;
  return false;
};

/** Combinar condiciones con AND. */
export const and = (...fns: Array<(v: FormValues) => boolean>) => (values: FormValues) =>
  fns.every((fn) => fn(values));

/** Combinar condiciones con OR. */
export const or = (...fns: Array<(v: FormValues) => boolean>) => (values: FormValues) =>
  fns.some((fn) => fn(values));

/** Negar una condición. */
export const not = (fn: (v: FormValues) => boolean) => (values: FormValues) => !fn(values);
