import type { PostMeta } from "../posts";

export const meta: PostMeta = {
  slug: "precificacao-e-margem-de-contribuicao",
  title: "Você sabe qual produto dá lucro? A maioria das PMEs não sabe.",
  description:
    "Como margem de contribuição por SKU pode revelar que metade do seu mix de produtos está sustentando a outra metade — que dá prejuízo.",
  date: "2026-04-15",
  readingTime: "4 min de leitura",
  category: "Custos",
  author: "Equipe Keystone",
};

export default function Post() {
  return (
    <>
      <p>
        Quando perguntamos "qual é o produto mais lucrativo da empresa?", a resposta
        costuma vir rápida — e quase sempre errada. É o mais vendido, ou o de maior
        preço, ou o de maior margem bruta. Raramente é o de maior margem de contribuição
        depois de rateados os custos variáveis reais.
      </p>

      <h2>Por que isso importa</h2>
      <p>
        Sem essa visão, decisões de mix, desconto e portfólio são tomadas no escuro.
        Vendas comemora volume; financeiro estranha o resultado; ninguém entende por quê.
      </p>

      <h2>O que um diagnóstico de custos entrega</h2>
      <ul>
        <li>Margem de contribuição por SKU, cliente e canal.</li>
        <li>Ponto de equilíbrio operacional e financeiro.</li>
        <li>Política de preço com piso técnico, não emocional.</li>
      </ul>

      <p>
        Em quase todo projeto, o diagnóstico revela que 20% do mix sustenta 80% do
        resultado — e que parte significativa do portfólio queima caixa silenciosamente.
      </p>
    </>
  );
}
