# Seeds – Dados iniciais

Os JSON em `data/` são carregados pelo script `npm run seed` na ordem das FKs.

## Testar o worker de auto-aplicação

Após rodar o seed:

1. **Vagas elegíveis:** O cron enfileira vagas com `status: "open"` e `acceptAutoApply: true`. No seed, por exemplo:
   - `e0000001` – Estagiário(a) em Desenvolvimento Web (já tem 2 candidaturas manuais)
   - `e0000003` – Estagiário(a) QA (nenhuma candidatura)
   - `e0000004` – Estagiário(a) Desenvolvimento (nenhuma candidatura)

2. **Estudantes elegíveis:** Qualquer estudante com `isAutoApplyEnabled: true` que ainda não se candidatou à vaga. Vários em `students.json` têm essa flag (Maria, Ana, Pedro, Lucas, Fernanda, etc.).

3. **Como testar:**
   - Subir Redis: `docker compose up -d redis` (ou `docker compose up -d`).
   - Rodar a API: `npm run dev`.
   - O cron (padrão a cada 15 min) enfileira as vagas; o worker processa e cria até **15 candidaturas automáticas por vaga**, com `isAutoApply: true`.
   - Para testar mais rápido: em `.env-development` use `AUTO_APPLY_CRON=*/1 * * * *` (a cada 1 minuto).

4. **Candidaturas do seed:** As 3 candidaturas em `job_applications.json` são manuais (`isAutoApply: false`). O limite é de 15 **candidaturas automáticas** por vaga; como nenhuma é auto no seed, cada vaga elegível pode receber até 15 novas candidaturas criadas pelo worker.
