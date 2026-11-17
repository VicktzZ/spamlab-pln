export const pct = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`;

const FEATURE_NAMES: Record<string, string> = {
  __link__: "contém link",
  __dinheiro__: "menciona dinheiro",
  __caixa_alta__: "CAIXA ALTA",
  __exclamacoes__: "muitas exclamações",
  __numero_longo__: "número longo",
};

export const prettyToken = (token: string) => FEATURE_NAMES[token] ?? token;
