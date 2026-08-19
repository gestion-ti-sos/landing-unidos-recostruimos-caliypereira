import type { FormValues, EligibilityResult } from '../data/types';
import { sections } from '../data/schema';

const requisitosSection = sections.find((s) => s.id === 'requisitos')!;

/**
 * Evalúa las 3 preguntas de "Requisitos de la campaña" y decide si el caso
 * parece estar dentro de alcance.
 *
 * Importante: esto es un filtro SUAVE. No bloqueamos el envío — mostramos
 * un aviso claro y dejamos que la persona decida si quiere continuar de
 * todos modos (por ejemplo, si cree que hay un error, o quiere que su caso
 * quede registrado para otra ayuda). El resumen del formulario no
 * especifica los criterios exactos de "el informe" para daños — ajustá
 * `damage_types` en schema.ts y esta función cuando tengas ese texto.
 */
export function evaluateEligibility(values: FormValues): EligibilityResult {
  const reasons: string[] = [];

  if (values.housing_location && values.housing_location !== 'cali' && values.housing_location !== 'pereira') {
    reasons.push('Esta campaña solo cubre viviendas en Cali o Pereira.');
  }

  const damageTypes = values.damage_types;
  const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((item) => typeof item === 'string');

  if (isStringArray(damageTypes) && damageTypes.length > 0) {
    const damageField = requisitosSection.fields.find((f) => f.id === 'damage_types');
    const outOfScopeValues = new Set(
      damageField && damageField.type === 'checkbox-group'
        ? damageField.options.filter((o) => o.outOfScope).map((o) => o.value)
        : [],
    );
    const onlyOutOfScope = damageTypes.every((v) => outOfScopeValues.has(v));
    if (onlyOutOfScope) {
      reasons.push(
        'Las afectaciones que describes (solo estéticas, o daño estructural severo) están fuera del alcance específico de esta campaña.',
      );
    }
  }

  if (values.insurance_status === 'tengo_cubriendo') {
    reasons.push('Indicaste que tu seguro ya está cubriendo el daño, así que priorizamos casos sin esa cobertura.');
  }

  return { eligible: reasons.length === 0, reasons };
}
