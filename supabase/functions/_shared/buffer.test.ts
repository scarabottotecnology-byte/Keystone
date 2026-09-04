import { afterEach, describe, expect, it, vi } from "vitest";
import {
  findRecentBufferPostByText,
  listBufferChannels,
  publishViaBuffer,
} from "./buffer.ts";

const TOKEN = "chave-de-teste";
const CHANNEL = "6a8a094cccaf649a67f8d8f6";
const ORG = "6a8a08f11cc81b93d11894bc";

/** Responde como a API do Buffer: sempre JSON, status controlado pelo teste. */
function stubFetch(
  handler: (
    body: { query: string; variables: Record<string, unknown> },
  ) => { status?: number; json?: unknown; text?: string } | Promise<never>,
) {
  const spy = vi.fn(async (_url: unknown, init?: { body?: string }) => {
    const parsed = JSON.parse(init?.body ?? "{}");
    const result = await handler(parsed);
    const status = result.status ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => result.json,
      text: async () => result.text ?? "",
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", spy);
  return spy;
}

function postNode(overrides: Record<string, unknown> = {}) {
  return {
    id: "post-1",
    status: "sending",
    text: "texto publicado",
    externalLink: null,
    sentAt: null,
    error: null,
    ...overrides,
  };
}

/**
 * `createPost` devolve a union `PostActionPayload`, nunca o post direto —
 * é exatamente o formato que o schema real do Buffer exige (confirmado via
 * `introspect_schema`) e que a versão anterior deste cliente não respeitava.
 */
function postActionSuccess(overrides: Record<string, unknown> = {}) {
  return { __typename: "PostActionSuccess", post: postNode(overrides) };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cliente do Buffer", () => {
  it("manda a chave como Bearer e fala GraphQL por POST", async () => {
    const spy = stubFetch(() => ({
      json: { data: { createPost: postActionSuccess() } },
    }));

    await publishViaBuffer({
      accessToken: TOKEN,
      channelId: CHANNEL,
      text: "texto publicado",
    });

    const [url, init] = spy.mock.calls[0] as [
      string,
      { method: string; headers: Record<string, string> },
    ];
    expect(url).toBe("https://api.buffer.com");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  it("trata erro de GraphQL vindo com HTTP 200", async () => {
    // A armadilha do GraphQL: a resposta é 200 e mesmo assim a operação
    // falhou. Olhar só o status marcaria como publicado algo que não saiu.
    stubFetch(() => ({
      status: 200,
      json: { errors: [{ message: "channelId inválido" }] },
    }));

    await expect(
      publishViaBuffer({ accessToken: TOKEN, channelId: CHANNEL, text: "x" }),
    ).rejects.toMatchObject({
      code: "upstream_error",
      message: expect.stringContaining("channelId inválido"),
    });
  });

  it("classifica 429 como rate_limited e 401 como unauthorized", async () => {
    stubFetch(() => ({ status: 429, text: "too many requests" }));
    await expect(
      publishViaBuffer({ accessToken: TOKEN, channelId: CHANNEL, text: "x" }),
    ).rejects.toMatchObject({ code: "rate_limited", retryable: true });

    stubFetch(() => ({ status: 401, text: "unauthorized" }));
    await expect(
      publishViaBuffer({ accessToken: TOKEN, channelId: CHANNEL, text: "x" }),
    ).rejects.toMatchObject({ code: "unauthorized", retryable: false });
  });

  it("aborto vira timeout, não upstream_error", async () => {
    // A distinção existe porque só `timeout` obriga a verificar na
    // plataforma antes de republicar — `upstream_error` significa que não
    // publicou.
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        throw new DOMException("aborted", "AbortError");
      }),
    );

    await expect(
      publishViaBuffer({ accessToken: TOKEN, channelId: CHANNEL, text: "x" }),
    ).rejects.toMatchObject({ code: "timeout" });
  });

  it("post aceito mas recusado pela plataforma é falha, não sucesso", async () => {
    stubFetch(() => ({
      json: {
        data: {
          createPost: postActionSuccess({
            status: "error",
            error: { message: "LinkedIn recusou: texto muito longo" },
          }),
        },
      },
    }));

    await expect(
      publishViaBuffer({ accessToken: TOKEN, channelId: CHANNEL, text: "x" }),
    ).rejects.toMatchObject({
      code: "upstream_error",
      message: expect.stringContaining("texto muito longo"),
    });
  });

  it("createPost devolvendo variante de erro da union (não __typename PostActionSuccess) é falha", async () => {
    // Este é o caso que quebrou em produção: a query em si era inválida
    // contra o schema (campo direto na union), o que o Buffer rejeita como
    // erro de validação (`json.errors`, já coberto acima). Este teste cobre
    // o outro caminho, que a query correta precisa saber tratar: a query é
    // válida, mas o Buffer recusa a operação e devolve um membro de erro da
    // union em vez de `PostActionSuccess`.
    stubFetch(() => ({
      json: {
        data: {
          createPost: {
            __typename: "InvalidInputError",
            message: "channelId não pertence à organização",
          },
        },
      },
    }));

    await expect(
      publishViaBuffer({ accessToken: TOKEN, channelId: CHANNEL, text: "x" }),
    ).rejects.toMatchObject({
      code: "upstream_error",
      message: expect.stringContaining("channelId não pertence à organização"),
    });
  });

  it("permalink ausente é nulo, nunca uma URL inventada", async () => {
    stubFetch(() => ({
      json: { data: { createPost: postActionSuccess({ externalLink: null }) } },
    }));

    const result = await publishViaBuffer({
      accessToken: TOKEN,
      channelId: CHANNEL,
      text: "x",
    });

    expect(result.externalPostId).toBe("post-1");
    expect(result.permalink).toBeNull();
  });

  it("publica com shareNow e sem pedir aprovação de novo", async () => {
    // A aprovação humana já aconteceu no Keystone: só peça `approved`
    // chega aqui. Uma segunda fila de aprovação dentro do Buffer seria uma
    // fila que ninguém combinou de olhar.
    const spy = stubFetch(() => ({
      json: { data: { createPost: postActionSuccess() } },
    }));

    await publishViaBuffer({
      accessToken: TOKEN,
      channelId: CHANNEL,
      text: "x",
    });

    const body = JSON.parse(
      (spy.mock.calls[0][1] as { body: string }).body,
    );
    expect(body.variables.input).toMatchObject({
      channelId: CHANNEL,
      mode: "shareNow",
      schedulingType: "automatic",
      needsApproval: false,
      assets: [],
    });
  });

  it("anexa a imagem quando a peça tem uma — o bug que saiu sem imagem era assets:[] fixo", async () => {
    const spy = stubFetch(() => ({
      json: { data: { createPost: postActionSuccess() } },
    }));

    await publishViaBuffer({
      accessToken: TOKEN,
      channelId: CHANNEL,
      text: "x",
      assets: [{
        url: "https://exemplo.supabase.co/storage/v1/object/public/linkedin-artes/post-42.png",
        altText: "Gráfico de margem de contribuição",
      }],
    });

    const body = JSON.parse(
      (spy.mock.calls[0][1] as { body: string }).body,
    );
    expect(body.variables.input.assets).toEqual([{
      image: {
        url:
          "https://exemplo.supabase.co/storage/v1/object/public/linkedin-artes/post-42.png",
        metadata: { altText: "Gráfico de margem de contribuição" },
      },
    }]);
  });

  it("imagem sem alt text não manda metadata — o schema não exige e não há o que inventar", async () => {
    const spy = stubFetch(() => ({
      json: { data: { createPost: postActionSuccess() } },
    }));

    await publishViaBuffer({
      accessToken: TOKEN,
      channelId: CHANNEL,
      text: "x",
      assets: [{ url: "https://exemplo.supabase.co/post-42.png" }],
    });

    const body = JSON.parse(
      (spy.mock.calls[0][1] as { body: string }).body,
    );
    expect(body.variables.input.assets).toEqual([{
      image: { url: "https://exemplo.supabase.co/post-42.png" },
    }]);
  });

  it("verificação após timeout casa pelo texto exato", async () => {
    stubFetch(() => ({
      json: {
        data: {
          posts: {
            edges: [
              { node: postNode({ id: "outro", text: "texto diferente" }) },
              {
                node: postNode({
                  id: "achado",
                  text: "  o texto procurado  ",
                  externalLink:
                    "https://www.linkedin.com/feed/update/urn:li:share:1",
                  status: "sent",
                }),
              },
            ],
          },
        },
      },
    }));

    const found = await findRecentBufferPostByText({
      accessToken: TOKEN,
      organizationId: ORG,
      channelId: CHANNEL,
      text: "o texto procurado",
    });

    expect(found?.externalPostId).toBe("achado");
    expect(found?.permalink).toContain("linkedin.com");
  });

  it("verificação devolve null quando o post não está lá", async () => {
    // `null` e exceção são coisas diferentes: null libera a retentativa,
    // exceção manda o job para revisão humana.
    stubFetch(() => ({
      json: { data: { posts: { edges: [{ node: postNode() }] } } },
    }));

    const found = await findRecentBufferPostByText({
      accessToken: TOKEN,
      organizationId: ORG,
      channelId: CHANNEL,
      text: "texto que não existe lá",
    });

    expect(found).toBeNull();
  });

  it("lista canais conectados", async () => {
    stubFetch(() => ({
      json: {
        data: {
          channels: [
            {
              id: CHANNEL,
              name: "jefferson-scarabotto",
              displayName: "Jefferson Scarabotto",
              service: "linkedin",
              type: "profile",
              isDisconnected: false,
              isLocked: false,
            },
          ],
        },
      },
    }));

    const channels = await listBufferChannels(TOKEN, ORG);
    expect(channels).toHaveLength(1);
    expect(channels[0].service).toBe("linkedin");
  });
});
