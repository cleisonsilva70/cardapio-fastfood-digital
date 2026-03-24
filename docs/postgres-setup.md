# PostgreSQL Setup

## O que ja esta pronto

- Schema Prisma em `prisma/schema.prisma`
- Migracao inicial em `prisma/migrations/20260323_init/migration.sql`
- Seed do catalogo inicial em `prisma/seed.ts`

## Variaveis necessarias

Edite `D:\Users\Cleison\Documents\CARDAPIO FASTFOOD DIGITAL\.env.local` e adicione:

```env
DATABASE_URL="postgresql://USUARIO:SENHA@HOST:5432/NOME_DO_BANCO?schema=public"
ALLOW_DEMO_MODE="false"
OWNER_ACCESS_PASSWORD="troque-esta-senha"
OWNER_SESSION_SECRET="troque-este-segredo"
```

## Comandos

Gerar client:

```powershell
npm run prisma:generate
```

Aplicar migracoes:

```powershell
npm run prisma:deploy
```

Popular produtos iniciais:

```powershell
npm run prisma:seed
```

## Fluxo recomendado

1. Configurar `DATABASE_URL`
2. Colocar `ALLOW_DEMO_MODE="false"`
3. Rodar `npm run prisma:generate`
4. Rodar `npm run prisma:deploy`
5. Rodar `npm run prisma:seed`
6. Subir a aplicacao com `npm run dev` ou `npm run start`

## Observacao

Se houver um servidor Node/Next rodando e o Prisma acusar erro de arquivo bloqueado no Windows, pare os servidores antes de rodar `npm run prisma:generate`.
