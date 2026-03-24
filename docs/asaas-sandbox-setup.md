# Asaas Sandbox

Use este passo a passo para ativar pagamento real em modo de testes.

## 1. Criar a conta Sandbox

1. Acesse [https://sandbox.asaas.com/](https://sandbox.asaas.com/)
2. Crie a conta normalmente
3. Finalize o fluxo de aprovacao
4. No painel web do Asaas, abra `Integracoes`
5. Gere uma nova `API Key`

Observacao:
- a chave de Sandbox e diferente da chave de producao
- o Asaas exibe a chave completa apenas no momento da criacao

## 2. Configurar as variaveis do projeto

No arquivo `.env.local`, preencha:

```env
APP_BASE_URL="https://seu-endereco-publico"
ASAAS_API_KEY="sua-chave-do-sandbox"
ASAAS_ENVIRONMENT="sandbox"
ASAAS_WEBHOOK_TOKEN="um-token-forte"
```

Exemplo com URL publica:

```env
APP_BASE_URL="https://cardapio-teste.seudominio.com"
ASAAS_API_KEY="..."
ASAAS_ENVIRONMENT="sandbox"
ASAAS_WEBHOOK_TOKEN="token-cardapio-fastfood"
```

## 3. URL publica obrigatoria

Para testar o fluxo completo com retorno automatico e webhook, o projeto precisa estar acessivel por uma URL publica.

Opcoes praticas:
- publicar temporariamente na Vercel
- usar um tunel como Cloudflare Tunnel ou ngrok

Importante:
- `localhost` nao serve para o webhook do Asaas
- para redirecionamento automatico, a URL precisa ser compativel com o dominio configurado no Asaas

## 4. Configurar o webhook no Asaas

Cadastre o webhook apontando para:

```text
https://seu-endereco-publico/api/webhooks/asaas?token=SEU_TOKEN
```

Eventos recomendados:
- `CHECKOUT_PAID`

Eventos adicionais aceitos pelo projeto:
- `PAYMENT_RECEIVED`
- `PAYMENT_CONFIRMED`

## 5. Subir o projeto

No terminal:

```powershell
npm run dev
```

ou, para testar mais proximo da producao:

```powershell
npm run build
npm run start
```

## 6. Fluxo de teste

1. Abrir o cardapio
2. Montar o pedido
3. Ir para checkout
4. Confirmar o pedido
5. O sistema deve abrir o checkout do Asaas
6. Finalizar o pagamento no ambiente Sandbox
7. O Asaas chama o webhook
8. O pedido passa para `PAGO`
9. O WhatsApp e liberado
10. O pedido aparece na cozinha

## 7. Como saber se esta funcionando

Sinais corretos:
- o pedido nasce como `PENDENTE`
- depois do pagamento, muda para `PAGO`
- o WhatsApp so abre apos confirmacao
- a cozinha mostra apenas pedidos pagos

## 8. Referencias oficiais

- Sandbox: [https://docs.asaas.com/docs/sandbox](https://docs.asaas.com/docs/sandbox)
- Chaves de API: [https://docs.asaas.com/docs/chaves-de-api](https://docs.asaas.com/docs/chaves-de-api)
- Checkout link e redirecionamento: [https://docs.asaas.com/docs/checkout-link-and-customer-redirection](https://docs.asaas.com/docs/checkout-link-and-customer-redirection)
- Redirection after payment: [https://docs.asaas.com/docs/redirection-after-payment](https://docs.asaas.com/docs/redirection-after-payment)
- Checkout events: [https://docs.asaas.com/docs/checkout-events](https://docs.asaas.com/docs/checkout-events)
