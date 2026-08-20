import type { Field, FormValues, FieldId } from "../data/types";

const OTHER_DETAIL_SUFFIX = "__otro_detalle";

export function getOtherDetailFieldId(field: Field): FieldId {
  return `${field.id}${OTHER_DETAIL_SUFFIX}`;
}

function isOptionSelected(
  field: Field,
  values: FormValues,
  optionValue: string,
): boolean {
  const value = values[field.id];
  if (Array.isArray(value)) return (value as string[]).includes(optionValue);
  return value === optionValue;
}

export function fieldRequiresOtherDetail(
  field: Field,
  values: FormValues,
): boolean {
  if (!("options" in field) || !field.options) return false;
  return field.options.some(
    (opt) => opt.requiresDetail && isOptionSelected(field, values, opt.value),
  );
}
