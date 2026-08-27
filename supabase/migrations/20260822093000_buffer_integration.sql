-- Buffer como via de publicação.
--
-- ## Por que
--
-- A FASE 6 publica direto na API do LinkedIn e depende da aprovação do
-- Community Management API — um processo externo, sem prazo e fora do
-- controle de quem constrói. Enquanto não sai, nada é publicado.
--
-- O Buffer já está conectado e carrega a autorização com as plataformas.
-- Troca uma dependência de aprovação por uma chave de API que o próprio
-- usuário gera. E cobre LinkedIn e Instagram pelo mesmo contrato, o que
-- antecipa parte da FASE 7 sem escrever um segundo cliente.
--
-- ## O caminho direto não foi removido
--
-- `integration = 'direct'` continua sendo o caminho de `oauth-start` /
-- `oauth-callback`, com o token em `private.oauth_tokens`. Quando a
-- aprovação do LinkedIn chegar, é só conectar a página e a conta nasce
-- `direct` — sem desfazer nada. As duas vias convivem, e cada linha diz
-- qual usa.

alter table social_accounts
  add column if not exists integration text not null default 'direct';

do $mig$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.social_accounts'::regclass
       and conname = 'social_accounts_integration_check'
  ) then
    alter table social_accounts
      add constraint social_accounts_integration_check
      check (integration in ('direct', 'buffer'));
  end if;
end;
$mig$;

comment on column social_accounts.integration is
  'Como esta conta publica: `direct` usa o token em private.oauth_tokens; `buffer` usa a chave de API do Buffer, guardada como segredo de ambiente, e external_account_id é o channelId do Buffer.';

-- ---------------------------------------------------------------------------
-- Os dois canais já conectados no Buffer
-- ---------------------------------------------------------------------------
--
-- ⚠️ O canal de LinkedIn é um **perfil pessoal** (Jefferson Scarabotto), não
-- a página da empresa. A FASE 6 foi desenhada para `urn:li:organization:` —
-- publicar aqui sai no perfil de uma pessoa, com o alcance e o tom que isso
-- implica. Está registrado como está para não haver dúvida depois: se a
-- intenção for publicar na página da Keystone, é preciso conectar a página
-- no Buffer e cadastrar o canal correspondente.
--
-- `token_ref` recebe um marcador em vez de apontar para private.oauth_tokens:
-- no Buffer a credencial é uma chave só, de ambiente, não um token por conta.
-- A coluna é NOT NULL e mentir nela (apontando para uma linha inexistente)
-- seria pior que dizer explicitamente onde a credencial mora.
insert into social_accounts (
  organization_id, provider, external_account_id, display_name,
  scopes, status, token_ref, integration
)
select
  o.id, v.provider::social_channel, v.channel_id, v.display_name,
  array[]::text[], 'connected'::account_status, 'env:BUFFER_ACCESS_TOKEN',
  'buffer'
from organizations o
cross join (values
  ('linkedin',  '6a8a094cccaf649a67f8d8f6', 'Jefferson Scarabotto (perfil)'),
  ('instagram', '6a8e1950ccaf649a671822de', 'keystone_consultoria')
) as v(provider, channel_id, display_name)
where o.slug = 'keystone'
on conflict (organization_id, provider, external_account_id) do nothing;
