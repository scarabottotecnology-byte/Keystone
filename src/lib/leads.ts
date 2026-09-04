import { supabase } from "@/integrations/supabase/client";

/**
 * Ponto único de captura de lead do site.
 *
 * Antes cada formulário fazia a sua coisa: /contato gravava no Supabase, o
 * diagnóstico e as ferramentas mandavam pro HubSpot através do gateway da
 * Lovable. Resultado: os leads ficavam espalhados em dois sistemas, e os que
 * dependiam do gateway sumiam quando ele não estava configurado.
 *
 * Agora o Supabase é a fonte de verdade — é dele que o gerenciador de leads do
 * Growth OS lê. O HubSpot continua sendo alimentado quando estiver configurado,
 * mas como efeito colateral: se falhar, o lead já está salvo.
 */

export type LeadInput = {
  nome: string;
  email: string;
  empresa?: string;
  telefone?: string;
  mensagem?: string;
  /** De onde veio, em texto legível. Ex.: "Diagnóstico — Score 62 (Intermediário)". */
  origem: string;
  /**
   * Trilha de serviço (ÓRBITA, MFI, Custos, PRISMA), não etapa de funil —
   * a etapa de onde o lead veio fica em `origem`. Enquanto o formulário não
   * pergunta a trilha, fica "geral".
   */
  track?: LeadTrack;
};

export type LeadTrack = "orbita" | "mfi" | "custos" | "prisma" | "geral";

type Utm = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
};

const UTM_STORAGE_KEY = "keystone.utm.v1";
const UTM_FIELDS = ["utm_source", "utm_medium", "utm_campaign"] as const;

/**
 * Guarda a origem da visita assim que a pessoa chega. Quase ninguém converte na
 * primeira tela — ela cai pelo link do post, navega, e só depois preenche. Sem
 * guardar, a atribuição se perde no meio do caminho.
 */
export function captureUtm(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const found: Record<string, string> = {};
    for (const field of UTM_FIELDS) {
      const value = params.get(field);
      if (value) found[field] = value;
    }
    if (Object.keys(found).length > 0) {
      window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(found));
    }
  } catch {
    /* navegador sem sessionStorage (aba anônima restrita) — segue sem atribuição */
  }
}

function storedUtm(): Utm {
  const empty: Utm = { utm_source: null, utm_medium: null, utm_campaign: null };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<Record<string, string>>;
    return {
      utm_source: parsed["utm_source"] ?? null,
      utm_medium: parsed["utm_medium"] ?? null,
      utm_campaign: parsed["utm_campaign"] ?? null,
    };
  } catch {
    return empty;
  }
}

export async function saveLead(
  input: LeadInput,
): Promise<{ ok: boolean; error: string | null }> {
  const utm = storedUtm();

  try {
    const { error } = await supabase.from("leads").insert({
      nome: input.nome,
      email: input.email,
      empresa: input.empresa || null,
      telefone: input.telefone || null,
      mensagem: input.mensagem || null,
      origem: input.origem,
      track: input.track ?? "geral",
      ...utm,
    });
    if (error) throw error;
  } catch (err) {
    console.error("Falha ao gravar lead no Supabase:", err);
    return { ok: false, error: "Não foi possível registrar seu contato. Tente novamente." };
  }

  // A partir daqui o lead já está salvo. O HubSpot é espelho, não gargalo.
  void mirrorToHubspot(input);

  return { ok: true, error: null };
}

async function mirrorToHubspot(input: LeadInput): Promise<void> {
  try {
    const [firstname, ...rest] = input.nome.trim().split(" ");
    const { createHubspotLead } = await import("@/lib/hubspot.functions");
    const result = await createHubspotLead({
      data: {
        firstname: firstname || input.nome,
        lastname: rest.join(" "),
        email: input.email,
        company: input.empresa ?? "",
        phone: input.telefone ?? "",
        origem: input.origem,
        ...(input.mensagem ? { mensagem: input.mensagem } : {}),
      },
    });
    if (!result.ok) {
      console.warn("HubSpot não recebeu o lead (o registro no Supabase está feito):", result.error);
    }
  } catch (err) {
    console.warn("HubSpot indisponível (o registro no Supabase está feito):", err);
  }
}
