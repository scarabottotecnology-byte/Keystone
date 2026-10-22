-- Cancela a fila antiga do LinkedIn: cartões quadrados (1080×1080) só com
-- frase, sem foto. Rendem menos que post com imagem e saem cortados na grade do
-- Instagram, que mostra cada post em 3:4. Os temas continuam em content_assets
-- e podem voltar como carrossel no modelo do render-post (1080×1350, com foto).
-- Para desfazer: status = 'scheduled' nas linhas marcadas abaixo.
update public.content_calendar
set status = 'cancelled',
    notes = concat_ws(' | ', notes, 'cancelado em 22/10/2026: cartão só com frase, refazer como carrossel com foto'),
    updated_at = now()
where status = 'scheduled'
  and enqueued_at is null
  and scheduled_for > now();
