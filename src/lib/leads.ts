import { supabase } from "@/integrations/supabase/client";
import { trackMetaLead } from "@/lib/meta-pixel";
import { trackGa4Lead } from "@/lib/ga4";

/**
 * Ponto único de captura de lead do site — grava no Supabase, que é a fonte
 * de verdade lida pelo gerenciador de leads do Growth OS.
 *
 * O HubSpot não precisa de código de integração aqui: o script de tracking
 * (ver hubspot-tracking.tsx, carregado globalmente) usa o recurso nativo de
 * "formulários coletados" do HubSpot — ele reconhece qualquer <form> da
 * página pelos atributos `name` dos campos (ver hubspot-fields.ts) e cria o
 * contato sozinho, sem chave de API. Por isso não existe mais uma chamada de
 * API para o HubSpot aqui: ela dependia do gateway proprietário da Lovable
 * (connector-gateway.lovable.dev), que não existe mais desde que o projeto
 * saiu de lá — e era redundante com o que o script já faz.
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

export async function saveLead(input: LeadInput): Promise<{ ok: boolean; error: string | null }> {
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

  trackMetaLead(input.origem);
  trackGa4Lead(input.origem);

  return { ok: true, error: null };
}
