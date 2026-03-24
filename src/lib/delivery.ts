import type { DeliveryAreaRule } from "./types";

function toRuleId(name: string, index: number) {
  return `${name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `area-${index + 1}`}`;
}

function normalizeRule(
  rule: Partial<DeliveryAreaRule>,
  index: number,
): DeliveryAreaRule | null {
  const name = String(rule.name ?? "").trim();

  if (!name) {
    return null;
  }

  const fee = Number(rule.fee ?? 0);
  const estimatedDeliveryMin = Number(rule.estimatedDeliveryMin ?? 0);
  const estimatedDeliveryMax = Number(rule.estimatedDeliveryMax ?? estimatedDeliveryMin);

  if (
    Number.isNaN(fee) ||
    Number.isNaN(estimatedDeliveryMin) ||
    Number.isNaN(estimatedDeliveryMax)
  ) {
    return null;
  }

  return {
    id: rule.id?.trim() || toRuleId(name, index),
    name,
    fee,
    estimatedDeliveryMin,
    estimatedDeliveryMax,
    active: rule.active ?? true,
  };
}

export function normalizeDeliveryAreas(raw: unknown): DeliveryAreaRule[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((rule, index) => normalizeRule(rule as Partial<DeliveryAreaRule>, index))
    .filter((rule): rule is DeliveryAreaRule => Boolean(rule));
}

export function parseDeliveryAreasJson(raw: string | null | undefined) {
  if (!raw) {
    return [];
  }

  try {
    return normalizeDeliveryAreas(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function formatDeliveryAreasText(areas: DeliveryAreaRule[]) {
  return areas
    .map(
      (area) =>
        `${area.name}|${area.fee.toFixed(2)}|${area.estimatedDeliveryMin}|${area.estimatedDeliveryMax}`,
    )
    .join("\n");
}

export function parseDeliveryAreasText(raw: string) {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => {
    const [name, feeText, minText, maxText] = line.split("|").map((part) => part.trim());

    if (!name || !feeText || !minText || !maxText) {
      throw new Error(
        `Linha ${index + 1}: use o formato Bairro|Taxa|TempoMin|TempoMax.`,
      );
    }

    const fee = Number(feeText.replace(",", "."));
    const estimatedDeliveryMin = Number(minText);
    const estimatedDeliveryMax = Number(maxText);

    if (
      Number.isNaN(fee) ||
      Number.isNaN(estimatedDeliveryMin) ||
      Number.isNaN(estimatedDeliveryMax)
    ) {
      throw new Error(
        `Linha ${index + 1}: informe taxa e tempos usando apenas numeros validos.`,
      );
    }

    if (estimatedDeliveryMax < estimatedDeliveryMin) {
      throw new Error(
        `Linha ${index + 1}: o tempo maximo nao pode ser menor que o minimo.`,
      );
    }

    return {
      id: toRuleId(name, index),
      name,
      fee,
      estimatedDeliveryMin,
      estimatedDeliveryMax,
      active: true,
    } satisfies DeliveryAreaRule;
  });
}

export function formatDeliveryEstimate(min: number, max: number) {
  if (min <= 0 && max <= 0) {
    return "Retirada imediata";
  }

  if (min === max) {
    return `${min} min`;
  }

  return `${min}-${max} min`;
}
