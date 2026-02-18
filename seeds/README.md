# Seeds

Dados iniciais para popular o banco de dados em desenvolvimento.

## Estrutura

- **`data/`** – Um arquivo JSON por tabela, com array de objetos no formato dos models (camelCase).
- **`../scripts/seed.js`** – Script que lê esses JSON e insere os registros no banco via Sequelize.

## Ordem de inserção

A ordem respeita as chaves estrangeiras:

1. `users` → `skills` → `companies` → `students`
2. `student_education`, `student_experience`, `student_skills`, `student_certifications`, `student_languages`
3. `job_openings` → `job_applications` → `job_application_feedbacks` → `student_views`

## Como rodar

1. Configure o banco (variáveis de ambiente em `.env-development`: `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`).
2. Na raiz do projeto:

```bash
npm run seed
```

Ou diretamente:

```bash
node scripts/seed.js
```

## Observações

- As senhas nos JSON são em texto plano (ex.: `senha123`); o script faz o hash com bcrypt antes de inserir.
- Os IDs nos JSON são fixos (UUIDs) para que as referências entre tabelas funcionem. Se rodar o seed mais de uma vez no mesmo banco, haverá erro de constraint (registros já existem). Use em banco vazio ou limpe as tabelas antes.
