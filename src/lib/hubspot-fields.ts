// Nome dos campos como o HubSpot os reconhece nos "formulários coletados":
// com o atributo name certo, cada resposta cai na propriedade certa do contato.
export const HUBSPOT_FIELD = {
  nome: "firstname",
  email: "email",
  empresa: "company",
  telefone: "phone",
  mensagem: "message",
} as const;
