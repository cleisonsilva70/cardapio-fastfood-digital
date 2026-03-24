export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatOrderNumber(orderNumber: number) {
  return String(orderNumber).padStart(3, "0");
}

export function formatPhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function formatTimeLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
