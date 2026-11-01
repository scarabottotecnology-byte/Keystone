const items = [
  { title: "Contador responsável de verdade", desc: "Um profissional com registro no CRC acompanha a sua empresa e responde pelas demonstrações." },
  { title: "Atendimento digital, resposta em 1 dia útil", desc: "Documentos, dúvidas e relatórios em um só canal, sem precisar ir ao escritório." },
  { title: "Contabilidade que explica", desc: "Todo mês você recebe os números e uma conversa sobre o que eles significam para o seu caixa." },
  { title: "Sigilo e LGPD", desc: "NDA se você quiser, acesso restrito e armazenamento seguro das informações da empresa e dos sócios." },
];

export function Diferenciais() {
  return (
    <section className="border-t border-border-sub bg-navy-mid py-28">
      <div className="mx-auto max-w-[1400px] px-8">
        <h2 className="section-title max-w-2xl">Por que escolher a Keystone</h2>

        <div className="mt-14 grid gap-px bg-border-sub md:grid-cols-2">
          {items.map(({ title, desc }) => (
            <div key={title} className="bg-navy-mid p-12 transition-colors hover:bg-navy-light">
              <h3 className="font-display text-[22px] font-medium text-cream">{title}</h3>
              <p className="mt-2.5 text-[13px] font-light leading-relaxed text-cream-dim">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
