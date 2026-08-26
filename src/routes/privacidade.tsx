import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Keystone" },
      {
        name: "description",
        content:
          "Política de privacidade e uso de cookies da Keystone, em conformidade com a Lei Geral de Proteção de Dados (LGPD).",
      },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/privacidade" }],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-navy text-cream">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden px-8 pb-16 pt-36 lg:pt-44">
          <div
            aria-hidden
            className="grid-texture pointer-events-none absolute inset-0 opacity-50"
          />
          <div className="relative z-10 mx-auto max-w-3xl">
            <span className="eyebrow">Privacidade</span>
            <h1 className="section-title mt-7">
              Política de <em>Privacidade</em> e Cookies
            </h1>
            <p className="mt-6 text-[13px] uppercase tracking-[0.15em] text-cream-mute">
              Última atualização: agosto de 2026
            </p>
          </div>
        </section>

        <section className="border-t border-border-sub py-16">
          <div className="mx-auto max-w-3xl space-y-10 px-8 text-[14.5px] leading-relaxed text-cream-dim">
            <div>
              <h2 className="font-display text-xl font-medium text-cream">1. Introdução</h2>
              <p className="mt-3">
                A Keystone valoriza a privacidade e a proteção de dados pessoais de seus
                visitantes e clientes. Esta política explica, de forma simples, quais dados
                coletamos neste site, como usamos cookies e outras tecnologias de navegação, e
                quais são os seus direitos, em conformidade com a Lei Geral de Proteção de Dados
                (Lei nº 13.709/2018 — LGPD).
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-medium text-cream">2. Quais dados coletamos</h2>
              <p className="mt-3">
                Podemos coletar dados fornecidos voluntariamente por você em formulários de
                contato e diagnóstico (como nome, e-mail, telefone e informações sobre sua
                empresa), além de dados de navegação coletados automaticamente por meio de
                cookies e tecnologias semelhantes, como endereço IP, tipo de dispositivo,
                navegador e páginas visitadas.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-medium text-cream">3. Uso de cookies</h2>
              <p className="mt-3">
                Cookies são pequenos arquivos armazenados no seu navegador que nos ajudam a
                entender como o site é utilizado, lembrar suas preferências e melhorar sua
                experiência de navegação. Utilizamos cookies essenciais ao funcionamento do site
                e, quando aplicável, cookies analíticos para medir audiência e desempenho das
                páginas. Você pode gerenciar ou desativar cookies diretamente nas configurações
                do seu navegador, ciente de que isso pode afetar algumas funcionalidades do site.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-medium text-cream">4. Finalidade do tratamento</h2>
              <p className="mt-3">
                Os dados coletados são utilizados para responder a solicitações de contato e
                diagnóstico, aprimorar o conteúdo e a experiência do site, cumprir obrigações
                legais e regulatórias, e, quando autorizado, enviar comunicações sobre os
                serviços da Keystone.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-medium text-cream">5. Compartilhamento de dados</h2>
              <p className="mt-3">
                Não vendemos seus dados pessoais. Eventuais compartilhamentos ocorrem apenas com
                prestadores de serviço que apoiam a operação do site (como provedores de
                hospedagem e ferramentas de análise), sempre sob obrigações de confidencialidade
                e segurança, ou quando exigido por lei.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-medium text-cream">6. Seus direitos</h2>
              <p className="mt-3">
                Nos termos da LGPD, você tem direito a confirmar a existência de tratamento,
                acessar, corrigir ou solicitar a exclusão dos seus dados pessoais, revogar
                consentimentos e obter informações sobre com quem compartilhamos suas
                informações. Para exercer esses direitos, entre em contato conosco pelos canais
                disponíveis na página de{" "}
                <a href="/contato" className="text-gold hover:underline">
                  Contato
                </a>
                .
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-medium text-cream">7. Segurança</h2>
              <p className="mt-3">
                Adotamos medidas técnicas e organizacionais razoáveis para proteger os dados
                pessoais coletados contra acesso não autorizado, perda, alteração ou divulgação
                indevida.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-medium text-cream">8. Alterações desta política</h2>
              <p className="mt-3">
                Esta política pode ser atualizada periodicamente para refletir melhorias no site
                ou mudanças na legislação aplicável. Recomendamos revisar esta página
                ocasionalmente.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-medium text-cream">9. Contato</h2>
              <p className="mt-3">
                Em caso de dúvidas sobre esta política ou sobre o tratamento de seus dados
                pessoais, entre em contato pela nossa página de{" "}
                <a href="/contato" className="text-gold hover:underline">
                  Contato
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
