const APP_TIME_ZONE = "America/Sao_Paulo";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function parseCurrencyInput(value?: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value
    .trim()
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatCashChangeFor(value?: string | null) {
  if (!value) {
    return undefined;
  }

  const parsed = parseCurrencyInput(value);

  if (parsed === null) {
    return value.trim() || undefined;
  }

  return formatCurrency(parsed);
}

export function formatOrderNumber(orderNumber: number) {
  return String(orderNumber).padStart(3, "0");
}

export function formatPhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function getDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  return {
    year: parts.find((part) => part.type === "year")?.value ?? "",
    month: parts.find((part) => part.type === "month")?.value ?? "",
    day: parts.find((part) => part.type === "day")?.value ?? "",
  };
}

export function formatTimeLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDateTimeLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDateInputValue(date: Date) {
  const { year, month, day } = getDateParts(date);
  return `${year}-${month}-${day}`;
}

export function formatMonthInputValue(date: Date) {
  const { year, month } = getDateParts(date);
  return `${year}-${month}`;
}

export function formatYearValue(date: Date) {
  return getDateParts(date).year;
}

export function parseDateInputValue(value: string) {
  if (!value) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const [, yearText, monthText, dayText] = match;
  return new Date(
    Number(yearText),
    Number(monthText) - 1,
    Number(dayText),
    0,
    0,
    0,
    0,
  );
}
