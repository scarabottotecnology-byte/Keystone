import type { ReactNode } from "react";
import { HONEYPOT_FIELD } from "@/lib/lead-schema";
import { HUBSPOT_FIELD } from "@/lib/hubspot-fields";
import { useLeadSubmission, type LeadFieldConfig } from "@/hooks/useLeadSubmission";
import type { LeadTrack } from "@/lib/leads";

export function LeadForm({
  fields,
  origem,
  track,
  submitLabel,
  loadingLabel = "Enviando...",
  successTitle = "Mensagem enviada",
  successDescription,
  idleHeader,
  footer,
  bare = false,
  className = "",
}: {
  fields: LeadFieldConfig[];
  origem: string;
  track?: LeadTrack;
  submitLabel: string;
  loadingLabel?: string;
  successTitle?: string;
  successDescription: string;
  /** Conteúdo mostrado acima dos campos, só enquanto o formulário não foi enviado. */
  idleHeader?: ReactNode;
  /** Mostrado abaixo do conteúdo, tanto no formulário quanto na tela de sucesso. */
  footer?: ReactNode;
  /** true quando o card (borda/fundo) já é fornecido pela página — renderiza só o conteúdo. */
  bare?: boolean;
  className?: string;
}) {
  const { values, setField, status, formError, handleSubmit } = useLeadSubmission(fields, {
    origem,
    track,
  });

  if (status === "done") {
    return (
      <div
        className={`text-center ${bare ? "" : "border border-gold/30 bg-navy-card p-10"} ${className}`}
      >
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 text-2xl text-gold">
          ✓
        </div>
        <p className="font-display text-2xl text-cream">{successTitle}</p>
        <p className="mt-3 text-sm text-cream-dim">{successDescription}</p>
        {footer}
      </div>
    );
  }

  return (
    <div className={bare ? "" : "border border-border-sub bg-navy-card p-8 md:p-10"}>
      {idleHeader}
      <form onSubmit={handleSubmit} className={`space-y-5 ${bare ? "mt-8" : ""} ${className}`}>
        {/* Campo-armadilha: invisível para humanos, bots preenchem sem saber. */}
        <input
          type="text"
          name={HONEYPOT_FIELD}
          value={values[HONEYPOT_FIELD]}
          onChange={(e) => setField(HONEYPOT_FIELD, e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
        />

        {fields.map(({ name, label, type, required, placeholder }) => (
          <label key={name} className="block">
            <span className="text-[11px] uppercase tracking-[0.2em] text-cream-dim">
              {label}
              {required && " *"}
            </span>
            {name === "mensagem" ? (
              <textarea
                name={HUBSPOT_FIELD.mensagem}
                rows={4}
                required={required}
                value={values.mensagem}
                placeholder={placeholder}
                onChange={(e) => setField("mensagem", e.target.value)}
                className="mt-2 w-full resize-none border border-border-sub bg-navy px-4 py-3 text-cream outline-none transition-colors focus:border-gold placeholder:text-cream-mute/40"
              />
            ) : (
              <input
                name={HUBSPOT_FIELD[name]}
                type={type}
                required={required}
                value={values[name]}
                placeholder={placeholder}
                onChange={(e) => setField(name, e.target.value)}
                className="mt-2 w-full border border-border-sub bg-navy px-4 py-3 text-cream outline-none transition-colors focus:border-gold placeholder:text-cream-mute/40"
              />
            )}
          </label>
        ))}

        {formError && (
          <p role="alert" aria-live="assertive" className="text-xs text-red-400">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-gold w-full justify-center disabled:opacity-60"
        >
          {status === "loading" ? loadingLabel : submitLabel}
        </button>

        {footer}
      </form>
    </div>
  );
}
