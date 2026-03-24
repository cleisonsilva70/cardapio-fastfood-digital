import { z } from "zod";

const phoneDigitsSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .pipe(z.string().min(10, "Informe um telefone valido.").max(11, "Telefone invalido."));

export const checkoutSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, "Informe o nome do cliente."),
  phone: phoneDigitsSchema,
  address: z
    .string()
    .trim()
    .min(5, "Informe o endereco."),
  houseNumber: z
    .string()
    .trim()
    .min(1, "Informe o numero da casa."),
  deliveryArea: z.string().trim().optional(),
  reference: z.string().trim().optional(),
  paymentMethod: z.enum([
    "PIX",
    "DINHEIRO",
    "CARTAO_CREDITO",
    "CARTAO_DEBITO",
  ]),
});

export const cartItemSchema = z.object({
  id: z.string(),
  quantity: z.number().int().positive(),
});

export const createOrderSchema = z.object({
  checkout: checkoutSchema,
  items: z.array(cartItemSchema).min(1, "Adicione pelo menos um item."),
});

export const updateStatusSchema = z.object({
  status: z.enum(["NOVO", "EM_PREPARO", "PRONTO", "ENTREGUE"]),
});

export const confirmPaymentSchema = z.object({
  paymentCode: z.string().min(6, "Codigo de pagamento invalido."),
});

export const adminProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Informe o nome do produto."),
  description: z.string().min(5, "Informe uma descricao curta."),
  price: z.coerce.number().positive("Informe um preco valido."),
  imageUrl: z.string().url("Informe uma URL valida para a imagem."),
  category: z.enum(["BURGERS", "COMBOS", "BEBIDAS", "ADICIONAIS"]),
  featured: z.coerce.boolean().default(false),
  active: z.coerce.boolean().default(true),
});

export const adminStoreSettingsSchema = z
  .object({
    name: z.string().min(2, "Informe o nome da hamburgueria."),
    shortName: z.string().min(2, "Informe o nome curto."),
    logoText: z.string().min(1, "Informe as iniciais da marca.").max(4, "Use ate 4 caracteres."),
    logoPath: z.string().optional().default(""),
    phoneDisplay: z.string().min(8, "Informe o telefone exibido."),
    whatsappNumber: z.string().min(10, "Informe o WhatsApp no formato numerico."),
    address: z.string().min(5, "Informe o endereco."),
    openingHours: z.string().min(3, "Informe o horario."),
    deliveryFee: z.coerce.number().min(0, "Informe uma taxa de entrega valida."),
    estimatedDeliveryMin: z.coerce
      .number()
      .int("Use minutos inteiros.")
      .min(0, "Informe o tempo minimo."),
    estimatedDeliveryMax: z.coerce
      .number()
      .int("Use minutos inteiros.")
      .min(0, "Informe o tempo maximo."),
    deliveryAreasText: z.string().default(""),
    heroTitle: z.string().min(5, "Informe o titulo principal."),
    heroDescription: z.string().min(10, "Informe a descricao principal."),
    eyebrow: z.string().min(3, "Informe o texto de apoio."),
    tagline: z.string().min(5, "Informe a tagline."),
    primaryColor: z.string().regex(/^#([0-9a-fA-F]{6})$/, "Cor principal invalida."),
    secondaryColor: z.string().regex(/^#([0-9a-fA-F]{6})$/, "Cor secundaria invalida."),
    accentColor: z.string().regex(/^#([0-9a-fA-F]{6})$/, "Cor de destaque invalida."),
    surfaceColor: z.string().regex(/^#([0-9a-fA-F]{6})$/, "Cor de superficie invalida."),
  })
  .refine(
    (data) => data.estimatedDeliveryMax >= data.estimatedDeliveryMin,
    {
      message: "O tempo maximo nao pode ser menor que o minimo.",
      path: ["estimatedDeliveryMax"],
    },
  );

export const adminBannerSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2, "Informe o titulo do banner."),
  description: z.string().min(5, "Informe a descricao do banner."),
  imageUrl: z.string().url("Informe uma URL valida para a imagem do banner."),
  ctaLabel: z.string().min(2, "Informe o texto do botao."),
  active: z.coerce.boolean().default(true),
});
