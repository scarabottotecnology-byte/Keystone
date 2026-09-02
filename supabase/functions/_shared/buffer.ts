/**
 * Cliente da API do Buffer.
 *
 * ## Por que o Buffer entrou
 *
 * A FASE 6 publica direto na API do LinkedIn, e isso exige a aprovação do
 * Community Management API — um processo de análise que pode levar semanas e
 * que ninguém controla. Enquanto ela não vem, nenhuma publicação sai.
 *
 * O Buffer já está conectado e resolve os dois lados: ele carrega a
 * autorização com as plataformas, e cobre LinkedIn e Instagram pelo mesmo
 * contrato. O que era uma dependência de aprovação externa virou uma chave
 * de API que o usuário gera sozinho.
 *
 * ## O contrato (consultado em agosto de 2026)
 *
 *   - Endpoint único: `POST https://api.buffer.com` (GraphQL)
 *   - `Authorization: Bearer <chave>` e `Content-Type: application/json`
 *   - Chave pessoal gerada em `https://publish.buffer.com/settings/api`
 *   - `429` quando estoura a janela de limite (15 min, 24 h ou 30 dias)
 *
 * ## O que este módulo NÃO faz
 *
 * Não agenda no Buffer. O calendário e a fila do Keystone continuam sendo a
 * fonte da verdade: quando o worker decide que é hora, publica com
 * `shareNow`. Empurrar para a fila do Buffer criaria dois agendadores
 * discordando sobre o que já saiu — e o plano gratuito do Buffer limita
 * posts agendados, um teto que não existe no `shareNow`.
 */
import { AppError } from "./errors.ts";

const BUFFER_API_URL = "https://api.buffer.com";

/**
 * Marcador em `social_accounts.token_ref` para conta que usa o Buffer.
 *
 * A credencial em si não mora na linha da conta: é uma chave só, da
 * organização, resolvida por `secrets.ts` (ambiente ou Vault).
 */
export const BUFFER_TOKEN_REF = "env:BUFFER_ACCESS_TOKEN";

interface GraphQLError {
  message?: string;
  extensions?: Record<string, unknown>;
}

/**
 * Executa uma operação GraphQL.
 *
 * GraphQL responde `200` mesmo quando a operação falha — o erro vem no corpo,
 * em `errors`. Tratar só o status HTTP deixaria passar falha como sucesso,
 * que aqui significaria marcar como publicado algo que não foi.
 */
async function graphql<T>(
  input: {
    accessToken: string;
    query: string;
    variables?: Record<string, unknown>;
    timeoutMs?: number;
    /** Descrição da operação, para a mensagem de erro fazer sentido. */
    label: string;
  },
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    input.timeoutMs ?? 20_000,
  );

  let response: Response;
  try {
    response = await fetch(BUFFER_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: input.query,
        variables: input.variables ?? {},
      }),
    });
  } catch (thrown) {
    if (thrown instanceof DOMException && thrown.name === "AbortError") {
      // `timeout`, não `upstream_error`: quem trata precisa saber que a
      // publicação PODE ter acontecido. Ver a invariante I-4.
      throw new AppError(
        "timeout",
        `Buffer não respondeu a tempo (${input.label}) — a publicação pode ter acontecido`,
      );
    }
    throw new AppError(
      "upstream_error",
      `Falha de rede no Buffer (${input.label})`,
      {
        cause: thrown,
      },
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new AppError(
      response.status === 429
        ? "rate_limited"
        : response.status === 401 || response.status === 403
        ? "unauthorized"
        : response.status >= 500
        ? "upstream_error"
        : "bad_request",
      `Buffer recusou a requisição (${input.label}, HTTP ${response.status})`,
      { detail: { status: response.status, body: text.slice(0, 500) } },
    );
  }

  const json = await response.json() as {
    data?: T;
    errors?: GraphQLError[];
  };

  if (json.errors && json.errors.length > 0) {
    const messages = json.errors
      .map((e) => e.message ?? "erro sem mensagem")
      .join("; ");
    throw new AppError(
      "upstream_error",
      `Buffer devolveu erro (${input.label}): ${messages}`,
      { detail: { errors: json.errors.slice(0, 3) } },
    );
  }

  if (json.data === undefined || json.data === null) {
    throw new AppError(
      "upstream_error",
      `Buffer respondeu sem dados (${input.label})`,
    );
  }

  return json.data;
}

export interface BufferChannel {
  id: string;
  name: string;
  displayName: string | null;
  /** `linkedin`, `instagram`, `facebook`… */
  service: string;
  /** `profile`, `page`, `business`… */
  type: string | null;
  isDisconnected: boolean;
  isLocked: boolean;
}

export interface BufferAccount {
  id: string;
  email: string | null;
  timezone: string | null;
  organizations: { id: string; name: string }[];
}

export async function getBufferAccount(
  accessToken: string,
): Promise<BufferAccount> {
  const data = await graphql<{ account: BufferAccount }>({
    accessToken,
    label: "conta",
    query: `query {
      account {
        id
        email
        timezone
        organizations { id name }
      }
    }`,
  });
  return data.account;
}

/**
 * Descobre a organização do Buffer a ser usada.
 *
 * `configured` tem prioridade, para quem tem mais de uma organização. Sem
 * ele, resolve pela conta — **exigindo que haja exatamente uma**. Com duas,
 * lança em vez de escolher a primeira: publicar na organização errada é o
 * tipo de engano que só se descobre depois de sair no feed.
 */
export async function resolveBufferOrganizationId(
  accessToken: string,
  configured?: string | null,
): Promise<string> {
  if (configured) return configured;

  const account = await getBufferAccount(accessToken);
  const orgs = account.organizations ?? [];

  if (orgs.length === 1) return orgs[0].id;

  throw new AppError(
    "misconfigured",
    orgs.length === 0
      ? "A chave do Buffer não dá acesso a nenhuma organização"
      : `A conta do Buffer tem ${orgs.length} organizações — defina ` +
        "BUFFER_ORGANIZATION_ID para dizer qual usar",
    { detail: { organizations: orgs.map((o) => o.name) } },
  );
}

export async function listBufferChannels(
  accessToken: string,
  organizationId: string,
): Promise<BufferChannel[]> {
  const data = await graphql<{ channels: BufferChannel[] }>({
    accessToken,
    label: "canais",
    variables: { input: { organizationId } },
    query: `query Channels($input: ChannelsInput!) {
      channels(input: $input) {
        id
        name
        displayName
        service
        type
        isDisconnected
        isLocked
      }
    }`,
  });
  return data.channels ?? [];
}

export interface BufferPost {
  id: string;
  status: string;
  text: string;
  /** URL do post na plataforma. Nulo enquanto o Buffer ainda não publicou. */
  externalLink: string | null;
  sentAt: string | null;
  error: { message: string } | null;
}

export interface BufferPublishResult {
  externalPostId: string;
  /**
   * Nulo quando o Buffer ainda não devolveu a URL.
   *
   * `shareNow` responde assim que aceita o post, e a plataforma ainda pode
   * estar publicando — nesse instante `externalLink` costuma vir nulo. Nulo
   * aqui significa "ainda não sei", e é gravado como nulo. Montar uma URL
   * plausível seria inventar dado.
   */
  permalink: string | null;
  status: string;
}

const POST_FIELDS = `
  id
  status
  text
  externalLink
  sentAt
  error { message }
`;

/**
 * Publica agora, no canal indicado.
 *
 * `needsApproval: false` e `schedulingType: automatic` porque a aprovação já
 * aconteceu antes, no Keystone: só peça com status `approved` chega até aqui.
 * Pedir aprovação de novo dentro do Buffer criaria uma segunda fila humana
 * que ninguém combinou de olhar.
 */
/**
 * `createPost` devolve `PostActionPayload`, uma union — `PostActionSuccess`
 * (com o post dentro) ou um dos tipos de erro, todos implementando
 * `MutationError { message }`. Selecionar campo direto na union (como
 * `id`/`status`) é erro de validação do GraphQL, não erro de execução: o
 * Buffer nem chega a tentar publicar, só recusa a query. Só apareceu porque
 * o contrato foi montado por inspeção, sem confirmar contra o schema real —
 * `introspect_schema` do MCP do Buffer teria pego isto antes do deploy.
 */
interface CreatePostResponse {
  __typename: string;
  message?: string;
  post?: BufferPost;
}

export async function publishViaBuffer(input: {
  accessToken: string;
  channelId: string;
  text: string;
  timeoutMs?: number;
}): Promise<BufferPublishResult> {
  const data = await graphql<{ createPost: CreatePostResponse }>({
    accessToken: input.accessToken,
    label: "publicação",
    timeoutMs: input.timeoutMs,
    variables: {
      input: {
        channelId: input.channelId,
        text: input.text,
        assets: [],
        mode: "shareNow",
        schedulingType: "automatic",
        needsApproval: false,
        source: "keystone-growth-os",
      },
    },
    query: `mutation CreatePost($input: CreatePostInput!) {
      createPost(input: $input) {
        __typename
        ... on PostActionSuccess { post { ${POST_FIELDS} } }
        ... on MutationError { message }
      }
    }`,
  });

  const result = data.createPost;
  if (result.__typename !== "PostActionSuccess" || !result.post) {
    throw new AppError(
      "upstream_error",
      `A plataforma recusou a publicação: ${
        result.message ?? `erro ${result.__typename} sem mensagem`
      }`,
      { detail: { typename: result.__typename } },
    );
  }

  const post = result.post;
  if (!post.id) {
    throw new AppError(
      "upstream_error",
      "Buffer aceitou a publicação mas não devolveu o identificador do post",
    );
  }

  // O Buffer aceita e publica de forma assíncrona: `error` preenchido aqui
  // significa que a plataforma recusou, e isso é falha, não sucesso.
  if (post.error?.message) {
    throw new AppError(
      "upstream_error",
      `A plataforma recusou a publicação: ${post.error.message}`,
      { detail: { bufferPostId: post.id, status: post.status } },
    );
  }

  return {
    externalPostId: post.id,
    permalink: post.externalLink ?? null,
    status: post.status,
  };
}

/**
 * Procura, entre os posts recentes do canal, um com exatamente este texto.
 *
 * É o caminho de verificação após timeout: `null` significa "verifiquei e não
 * publicou" (pode republicar), enquanto lançar significa "não consegui nem
 * verificar" (não pode republicar às cegas). São situações diferentes e o
 * chamador decide diferente em cada uma.
 */
export async function findRecentBufferPostByText(input: {
  accessToken: string;
  organizationId: string;
  channelId: string;
  text: string;
}): Promise<BufferPublishResult | null> {
  const data = await graphql<{ posts: { edges?: { node: BufferPost }[] } }>({
    accessToken: input.accessToken,
    label: "verificação de publicação recente",
    variables: {
      first: 20,
      input: {
        organizationId: input.organizationId,
        filter: { channelIds: [input.channelId] },
        sort: [{ field: "createdAt", direction: "desc" }],
      },
    },
    query: `query Posts($input: PostsInput!, $first: Int) {
      posts(input: $input, first: $first) {
        edges { node { ${POST_FIELDS} } }
      }
    }`,
  });

  const needle = input.text.trim();
  const found = (data.posts?.edges ?? [])
    .map((edge) => edge.node)
    .find((node) =>
      typeof node?.text === "string" && node.text.trim() === needle
    );

  if (!found) return null;
  return {
    externalPostId: found.id,
    permalink: found.externalLink ?? null,
    status: found.status,
  };
}
