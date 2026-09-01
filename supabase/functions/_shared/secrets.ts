/**
 * Credenciais: ambiente primeiro, Vault depois.
 *
 * ## Por que o Vault entrou
 *
 * Cadastrar secret de Edge Function exige o painel do Supabase numa tela que
 * não coopera no celular, ou o CLI. O Vault é uma tabela: preenche pelo SQL
 * editor do navegador, de qualquer aparelho. Isso tirou a última barreira
 * entre "construído" e "rodando".
 *
 * ## Por que o ambiente continua tendo prioridade
 *
 * Variável de ambiente é uma barreira a mais que o Vault: um segredo no
 * Vault é legível por quem tem a `service_role`. Como a `service_role` já dá
 * acesso total ao banco, isso não é uma brecha nova — mas também não é
 * equivalente, e quem puder usar o ambiente deve continuar usando. Por isso
 * a ordem é ambiente → Vault, e não o contrário.
 *
 * O segredo de automação não passa por aqui: ele nunca sai do banco. A
 * comparação acontece lá dentro, em `verify_automation_secret`, e o que
 * volta é só um booleano.
 */
import { AppError } from "./errors.ts";

/** Nome no Vault → variável de ambiente equivalente. */
export type SecretName =
  | "buffer_access_token"
  | "buffer_organization_id"
  | "anthropic_api_key"
  | "openai_api_key";

const ENV_NAME: Record<SecretName, string> = {
  buffer_access_token: "BUFFER_ACCESS_TOKEN",
  buffer_organization_id: "BUFFER_ORGANIZATION_ID",
  anthropic_api_key: "ANTHROPIC_API_KEY",
  openai_api_key: "OPENAI_API_KEY",
};

/** Onde cada credencial é gerada. Entra na mensagem de erro. */
const WHERE_TO_GET: Record<SecretName, string> = {
  buffer_access_token: "https://publish.buffer.com/settings/api",
  buffer_organization_id:
    "a conta do Buffer (só se houver mais de uma organização)",
  anthropic_api_key: "https://console.anthropic.com",
  openai_api_key: "https://platform.openai.com/api-keys",
};

/** O mínimo do cliente Supabase que este módulo usa. */
interface RpcCapable {
  rpc(
    fn: string,
    args: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: unknown }>;
}

/**
 * Busca uma credencial. Devolve `null` quando ela não existe em lugar nenhum.
 *
 * Devolver `null` em vez de lançar é deliberado: quem chama decide se a
 * ausência é fatal (publicar sem chave do Buffer) ou apenas limitante
 * (organização do Buffer, que é descoberta sozinha quando há só uma).
 */
export async function findSecret(
  db: RpcCapable,
  name: SecretName,
): Promise<string | null> {
  const fromEnv = Deno.env.get(ENV_NAME[name]);
  if (fromEnv) return fromEnv;

  const { data, error } = await db.rpc("integration_secret", { p_name: name });
  if (error) {
    throw new AppError(
      "internal",
      `Falha ao ler a credencial '${name}' do Vault`,
      { cause: error },
    );
  }

  const value = typeof data === "string" ? data.trim() : "";
  return value.length > 0 ? value : null;
}

/** Igual a `findSecret`, mas a ausência é erro — com onde conseguir a chave. */
export async function requireSecret(
  db: RpcCapable,
  name: SecretName,
): Promise<string> {
  const value = await findSecret(db, name);
  if (value) return value;

  throw new AppError(
    "misconfigured",
    `Credencial '${name}' não configurada. Gere em ${WHERE_TO_GET[name]} e ` +
      `cadastre com: select vault.create_secret('<valor>', '${name}'); ` +
      `— ou defina ${ENV_NAME[name]} como secret da Edge Function.`,
  );
}

/**
 * Confere o segredo de automação.
 *
 * A comparação roda dentro do banco de propósito: o valor esperado nunca
 * trafega até a função, então nem um log acidental do lado de cá poderia
 * vazá-lo.
 */
export async function isAutomationSecretValid(
  db: RpcCapable,
  provided: string | null,
): Promise<boolean> {
  if (!provided) return false;

  // O ambiente ainda tem prioridade, para quem já configurou assim.
  const fromEnv = Deno.env.get("AUTOMATION_WEBHOOK_SECRET");
  if (fromEnv) return fromEnv === provided;

  const { data, error } = await db.rpc("verify_automation_secret", {
    p_secret: provided,
  });
  if (error) {
    throw new AppError("internal", "Falha ao conferir o segredo de automação", {
      cause: error,
    });
  }
  return data === true;
}
