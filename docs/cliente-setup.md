# Setup de Novo Cliente

## Objetivo

Esta base foi preparada em modelo white-label. Para entregar um novo cardápio digital para outra hamburgueria, troque apenas os arquivos de configuração e os assets.

## Arquivos que voce altera

- `data/store.json`
- `data/branding.json`
- `data/banners.json`
- `data/products.json`
- `public/branding/*`

## O que mudar em cada arquivo

### `data/store.json`

- nome da hamburgueria
- nome curto
- slug do projeto
- iniciais da marca
- caminho da logo
- numero do WhatsApp
- telefone exibido
- endereco
- horario de funcionamento
- taxa de entrega

### `data/branding.json`

- cores principais
- titulo da home
- descricao principal
- tagline

### `data/banners.json`

- banners promocionais
- campanhas
- combos em destaque

### `public/branding`

- logo do cliente
- favicon
- imagens institucionais

Se quiser usar uma logo real no topo, coloque o arquivo em `public/branding/` e ajuste `logoPath` em `data/store.json`.

### `data/products.json`

- produtos
- descricoes
- precos
- categorias
- imagens

## Fluxo rapido para vender a proxima copia

1. Duplicar esta base
2. Atualizar `data/*.json`
3. Trocar senha da cozinha em `.env.local`
4. Se usar banco, ajustar `DATABASE_URL`
5. Rodar:

```powershell
npm install
npm run prisma:generate
npm run prisma:seed
npm run build
```

6. Publicar

## Beneficio

Voce nao precisa reescrever a logica do sistema. Troca apenas os dados do cliente e entrega uma nova hamburgueria com a mesma base.

## Edicao rapida via painel

Com a senha da cozinha, voce tambem pode acessar:

- `/painel`

Essa area permite:

- criar produto
- editar produto
- ativar ou desativar item
- ajustar preco, descricao e imagem
- enviar imagens de produto, banner e logo da loja

Hoje o painel cobre catalogo, dados da loja, branding e banners. Os arquivos em `data/*.json` seguem como base inicial para acelerar a entrega de novos clientes.
