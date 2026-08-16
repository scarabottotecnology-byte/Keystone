import { createServerFn } from "@tanstack/react-start";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/hubspot";

export type HubspotContact = {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    company?: string;
    lifecyclestage?: string;
    createdate?: string;
  };
};

export const listHubspotContacts = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    contacts: HubspotContact[];
    error: string | null;
  }> => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;

    if (!LOVABLE_API_KEY || !HUBSPOT_API_KEY) {
      return { contacts: [], error: "Conector HubSpot não configurado." };
    }

    const properties = [
      "firstname",
      "lastname",
      "email",
      "phone",
      "company",
      "lifecyclestage",
      "createdate",
    ].join(",");

    try {
      const res = await fetch(
        `${GATEWAY_URL}/crm/v3/objects/contacts?limit=25&properties=${encodeURIComponent(properties)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": HUBSPOT_API_KEY,
          },
        },
      );

      if (res.status === 204) return { contacts: [], error: null };

      const data = await res.json();
      if (!res.ok) {
        console.error("HubSpot gateway error", res.status, data);
        return {
          contacts: [],
          error: `Erro HubSpot [${res.status}]: ${data?.message ?? "falha na requisição"}`,
        };
      }

      return { contacts: (data.results ?? []) as HubspotContact[], error: null };
    } catch (err) {
      console.error(err);
      return { contacts: [], error: "Falha ao conectar no HubSpot." };
    }
  },
);

export const createHubspotLead = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      firstname: string;
      lastname?: string;
      email: string;
      company: string;
      phone: string;
      origem: string;
      mensagem?: string;
    }) => data,
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error: string | null }> => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;
    if (!LOVABLE_API_KEY || !HUBSPOT_API_KEY)
      return { ok: false, error: "Conector não configurado." };
    try {
      const res = await fetch(`${GATEWAY_URL}/crm/v3/objects/contacts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": HUBSPOT_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            firstname: data.firstname,
            lastname: data.lastname,
            email: data.email,
            company: data.company,
            phone: data.phone,
            hs_lead_status: "NEW",
            lifecyclestage: "lead",
            message: data.mensagem ? `${data.origem} — ${data.mensagem}` : data.origem,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("HubSpot create contact error", res.status, err);
        return { ok: false, error: err?.message ?? "Erro ao salvar contato." };
      }
      return { ok: true, error: null };
    } catch (e) {
      console.error(e);
      return { ok: false, error: "Falha de conexão." };
    }
  });
