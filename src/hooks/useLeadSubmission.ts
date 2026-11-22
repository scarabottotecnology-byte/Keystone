import { useRef, useState, type FormEvent } from "react";
import { saveLead, type LeadTrack } from "@/lib/leads";
import { HONEYPOT_FIELD, leadFormSchema } from "@/lib/lead-schema";

export type LeadFieldName = "nome" | "email" | "empresa" | "telefone" | "mensagem";

export type LeadFieldConfig = {
  name: LeadFieldName;
  label: string;
  type: "text" | "email" | "tel";
  required?: boolean;
  placeholder?: string;
};

type Values = Record<LeadFieldName, string> & { [HONEYPOT_FIELD]: string };

const EMPTY_VALUES: Values = {
  nome: "",
  email: "",
  empresa: "",
  telefone: "",
  mensagem: "",
  [HONEYPOT_FIELD]: "",
};

const MIN_FILL_TIME_MS = 1200;

const MESSAGES = {
  pt: {
    review: "Revise os dados e envie novamente.",
    required: (label: string) => `Preencha o campo "${label}".`,
    invalid: "Verifique os dados informados.",
    invalidEmail: null as string | null,
    failed: null as string | null,
  },
  en: {
    review: "Please review your details and submit again.",
    required: (label: string) => `Please fill in "${label}".`,
    invalid: "Please check the information you entered.",
    // O schema e o saveLead respondem em português; no site em inglês, trocamos.
    invalidEmail: "Please enter a valid email address.",
    failed: "We couldn't submit your message. Please try again.",
  },
};

export function useLeadSubmission(
  fields: LeadFieldConfig[],
  options: { origem: string; track?: LeadTrack; locale?: "pt" | "en" },
) {
  const [values, setValues] = useState<Values>(EMPTY_VALUES);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const msg = MESSAGES[options.locale ?? "pt"];
  const mountedAt = useRef(Date.now());

  function setField(name: keyof Values, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    // Campo-armadilha preenchido = bot. Finge sucesso para não ensinar o
    // script a se adaptar, e não grava nada.
    if (values[HONEYPOT_FIELD]) {
      setStatus("done");
      return;
    }

    // Preenchimento mais rápido que isso é típico de script, não de pessoa.
    if (Date.now() - mountedAt.current < MIN_FILL_TIME_MS) {
      setFormError(msg.review);
      return;
    }

    for (const field of fields) {
      if (field.required && !values[field.name].trim()) {
        setFormError(msg.required(field.label));
        return;
      }
    }

    const parsed = leadFormSchema.safeParse(values);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      if (msg.invalidEmail && issue?.path[0] === "email") setFormError(msg.invalidEmail);
      else if (options.locale === "en") setFormError(msg.invalid);
      else setFormError(issue?.message ?? msg.invalid);
      return;
    }

    setStatus("loading");
    const result = await saveLead({
      nome: parsed.data.nome,
      email: parsed.data.email,
      empresa: parsed.data.empresa || undefined,
      telefone: parsed.data.telefone || undefined,
      mensagem: parsed.data.mensagem || undefined,
      origem: options.origem,
      track: options.track ?? "geral",
    });

    if (result.ok) {
      setStatus("done");
    } else {
      setStatus("error");
      setFormError(msg.failed ?? result.error);
    }
  }

  return { values, setField, status, formError, handleSubmit };
}
