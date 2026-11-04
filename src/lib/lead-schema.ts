import { z } from "zod";

/**
 * Nome do campo-armadilha. Fica escondido do olho humano (fora da tela, sem
 * tab, sem leitor de tela) mas visível para scripts que preenchem todo
 * campo do formulário sem olhar — se vier preenchido, é bot.
 */
export const HONEYPOT_FIELD = "website_url";

export const leadFormSchema = z.object({
  nome: z.string().trim().min(1, "Informe seu nome."),
  email: z.string().trim().min(1, "Informe seu e-mail.").email("Informe um e-mail válido."),
  empresa: z.string().trim().optional(),
  telefone: z.string().trim().optional(),
  mensagem: z.string().trim().optional(),
  [HONEYPOT_FIELD]: z.string().max(0).optional(),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;
