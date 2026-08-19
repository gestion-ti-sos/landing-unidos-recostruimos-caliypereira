import type { ComponentChildren } from 'preact';
import type { Field, FieldValue, FormValues } from '../../data/types';
import { formatBytes } from '../../lib/media';

interface Props {
  field: Field;
  values: FormValues;
  error?: string;
  required: boolean;
  onChange: (id: string, value: FieldValue) => void;
}

const inputClass =
  'w-full min-h-11 rounded-lg border border-(--color-line) bg-(--color-paper-raised) px-3.5 py-2.5 text-base text-(--color-ink) placeholder:text-(--color-slate-light) transition-colors focus:border-(--color-brick)';

const errorInputClass = 'border-(--color-brick) bg-[#fbf1ea]';

function FieldShell({ field, error, required, children }: { field: Field; error?: string; required: boolean; children: ComponentChildren }) {
  return (
    <div class="flex flex-col gap-1.5">
      {field.type !== 'consent' && (
        <label for={field.id} class="text-[15px] font-medium leading-snug text-(--color-ink)">
          {field.label}
          {required && <span class="ml-1 text-(--color-brick)" aria-hidden="true">*</span>}
        </label>
      )}
      {field.helpText && (
        <p id={`${field.id}-help`} class="text-sm text-(--color-slate) -mt-0.5">
          {field.helpText}
        </p>
      )}
      {children}
      {field.note && <p class="text-sm text-(--color-slate) italic">{field.note}</p>}
      {field.sensitive && !field.note && (
        <p class="text-sm text-(--color-slate) italic">Esta pregunta es opcional.</p>
      )}
      {error && (
        <p id={`${field.id}-error`} class="text-sm font-medium text-(--color-brick-dark)" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function FieldRenderer({ field, values, error, required, onChange }: Props) {
  const value = values[field.id];
  const describedBy = [field.helpText ? `${field.id}-help` : null, error ? `${field.id}-error` : null]
    .filter(Boolean)
    .join(' ') || undefined;
  const cls = `${inputClass} ${error ? errorInputClass : ''}`;

  switch (field.type) {
    case 'text':
    case 'email':
    case 'url':
      return (
        <FieldShell field={field} error={error} required={required}>
          <input
            id={field.id}
            name={field.id}
            type={field.type}
            class={cls}
            value={(value as string) ?? ''}
            placeholder={field.placeholder}
            maxLength={'maxLength' in field ? field.maxLength : undefined}
            autoComplete={field.autoComplete}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
            onInput={(e) => onChange(field.id, (e.target as HTMLInputElement).value)}
          />
        </FieldShell>
      );

    case 'tel':
      return (
        <FieldShell field={field} error={error} required={required}>
          <input
            id={field.id}
            name={field.id}
            type="tel"
            inputMode="numeric"
            class={cls}
            value={(value as string) ?? ''}
            placeholder="3001234567"
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
            onInput={(e) => onChange(field.id, (e.target as HTMLInputElement).value.replace(/[^\d]/g, ''))}
          />
        </FieldShell>
      );

    case 'date':
      return (
        <FieldShell field={field} error={error} required={required}>
          <input
            id={field.id}
            name={field.id}
            type="date"
            class={cls}
            value={(value as string) ?? ''}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
            onInput={(e) => onChange(field.id, (e.target as HTMLInputElement).value)}
          />
        </FieldShell>
      );

    case 'number':
      return (
        <FieldShell field={field} error={error} required={required}>
          <input
            id={field.id}
            name={field.id}
            type="number"
            inputMode="numeric"
            min={field.min}
            max={field.max}
            class={cls}
            value={(value as string) ?? ''}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
            onInput={(e) => onChange(field.id, (e.target as HTMLInputElement).value)}
          />
        </FieldShell>
      );

    case 'textarea':
      return (
        <FieldShell field={field} error={error} required={required}>
          <textarea
            id={field.id}
            name={field.id}
            class={cls}
            rows={field.rows ?? 3}
            maxLength={field.maxLength}
            placeholder={field.placeholder}
            value={(value as string) ?? ''}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
            onInput={(e) => onChange(field.id, (e.target as HTMLTextAreaElement).value)}
          />
        </FieldShell>
      );

    case 'select':
      return (
        <FieldShell field={field} error={error} required={required}>
          <select
            id={field.id}
            name={field.id}
            class={cls}
            value={(value as string) ?? ''}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
            onChange={(e) => onChange(field.id, (e.target as HTMLSelectElement).value)}
          >
            <option value="" disabled>
              {field.placeholder ?? 'Selecciona una opción'}
            </option>
            {field.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FieldShell>
      );

    case 'radio':
      return (
        <FieldShell field={field} error={error} required={required}>
          <div role="radiogroup" aria-describedby={describedBy} class="flex flex-col gap-2">
            {field.options.map((opt) => {
              const checked = value === opt.value;
              return (
                <label
                  key={opt.value}
                  class={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 min-h-11 cursor-pointer transition-colors ${
                    checked ? 'border-(--color-brick) bg-[#fbf1ea]' : 'border-(--color-line) bg-(--color-paper-raised)'
                  } ${opt.outOfScope ? 'opacity-90' : ''}`}
                >
                  <input
                    type="radio"
                    name={field.id}
                    value={opt.value}
                    checked={checked}
                    class="h-4 w-4 accent-(--color-brick)"
                    onChange={() => onChange(field.id, opt.value)}
                  />
                  <span class="text-[15px] text-(--color-ink)">{opt.label}</span>
                </label>
              );
            })}
          </div>
        </FieldShell>
      );

    case 'checkbox-group': {
      const selected = (value as string[]) ?? [];
      return (
        <FieldShell field={field} error={error} required={required}>
          <div aria-describedby={describedBy} class="flex flex-col gap-2">
            {field.options.map((opt) => {
              const checked = selected.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  class={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 min-h-11 cursor-pointer transition-colors ${
                    checked ? 'border-(--color-brick) bg-[#fbf1ea]' : 'border-(--color-line) bg-(--color-paper-raised)'
                  }`}
                >
                  <input
                    type="checkbox"
                    name={`${field.id}[]`}
                    value={opt.value}
                    checked={checked}
                    class="h-4 w-4 accent-(--color-brick)"
                    onChange={() => {
                      const next = checked ? selected.filter((v) => v !== opt.value) : [...selected, opt.value];
                      onChange(field.id, next);
                    }}
                  />
                  <span class="text-[15px] text-(--color-ink)">{opt.label}</span>
                </label>
              );
            })}
          </div>
        </FieldShell>
      );
    }

    case 'consent': {
      const checked = value === true;
      return (
        <div class="flex flex-col gap-1">
          <label
            class={`flex items-start gap-3 rounded-lg border px-3.5 py-3 cursor-pointer transition-colors ${
              checked ? 'border-(--color-forest) bg-[#eef3f0]' : 'border-(--color-line) bg-(--color-paper-raised)'
            } ${error ? 'border-(--color-brick)' : ''}`}
          >
            <input
              id={field.id}
              type="checkbox"
              checked={checked}
              class="mt-0.5 h-5 w-5 accent-(--color-forest)"
              aria-describedby={error ? `${field.id}-error` : undefined}
              aria-invalid={Boolean(error)}
              onChange={(e) => onChange(field.id, (e.target as HTMLInputElement).checked)}
            />
            <span class="text-[15px] leading-snug text-(--color-ink)">{field.consentText}</span>
          </label>
          {error && (
            <p id={`${field.id}-error`} class="text-sm font-medium text-(--color-brick-dark)" role="alert">
              {error}
            </p>
          )}
        </div>
      );
    }

    case 'file': {
      const files = ((value as File[]) ?? []).filter(Boolean);
      return (
        <FieldShell field={field} error={error} required={required}>
          <div class="flex flex-col gap-2">
            <label
              for={field.id}
              class="flex min-h-11 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-(--color-line) bg-(--color-paper-raised) px-4 py-4 text-center text-[15px] font-medium text-(--color-forest)"
            >
              {field.multiple ? 'Elegir archivos' : 'Elegir archivo'}
              <input
                id={field.id}
                type="file"
                class="sr-only"
                accept={field.accept}
                multiple={field.multiple}
                aria-describedby={describedBy}
                aria-invalid={Boolean(error)}
                onChange={(e) => {
                  const list = Array.from((e.target as HTMLInputElement).files ?? []);
                  onChange(field.id, field.multiple ? list.slice(0, field.maxFiles) : list.slice(0, 1));
                }}
              />
            </label>
            {files.length > 0 && (
              <ul class="flex flex-col gap-1">
                {files.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    class="flex items-center justify-between gap-2 rounded-md bg-(--color-paper) px-3 py-2 text-sm text-(--color-ink)"
                  >
                    <span class="truncate">{f.name}</span>
                    <span class="shrink-0 text-(--color-slate)">{formatBytes(f.size)}</span>
                    <button
                      type="button"
                      class="shrink-0 text-(--color-brick-dark) underline"
                      onClick={() => onChange(field.id, files.filter((_, idx) => idx !== i))}
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </FieldShell>
      );
    }

    default:
      return null;
  }
}
