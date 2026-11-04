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

export function useLeadSubmission(
  fields: LeadFieldConfig[],
  options: { origem: string; track?: LeadTrack },
) {
  const [values, setValues] = useState<Values>(EMPTY_VALUES);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [formError, setFormError] = useState<string | null>(null);
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
      setFormError("Revise os dados e envie novamente.");
      return;
    }

    for (const field of fields) {
      if (field.required && !values[field.name].trim()) {
        setFormError(`Preencha o campo "${field.label}".`);
        return;
      }
    }

    const parsed = leadFormSchema.safeParse(values);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Verifique os dados informados.");
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
      setFormError(result.error);
    }
  }

  return { values, setField, status, formError, handleSubmit };
}
