export type Label = "spam" | "ham";

export interface Sample {
  text: string;
  label: Label;
}

export interface TokenContribution {
  token: string;
  count: number;
  /** log(P(token|spam) / P(token|ham)) somado pelas ocorrências. >0 empurra para spam, <0 para ham. */
  weight: number;
}

export interface Classification {
  label: Label;
  pSpam: number;
  pHam: number;
  contributions: TokenContribution[];
  unknownTokens: string[];
  tokens: string[];
}

export interface Evaluation {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  confusion: { tp: number; fp: number; tn: number; fn: number };
  total: number;
}

const STOPWORDS = new Set(
  (
    "a o as os um uma uns umas de do da dos das em no na nos nas por para com sem sob sobre " +
    "e ou mas que se ao aos ja eu tu ele ela nos eles elas me te lhe meu minha seu sua " +
    "isso isto esse essa este esta ser foi sao era tem ter the and to of in is it you your"
  ).split(" "),
);

/**
 * Tokenização em duas camadas:
 * 1) features "de forma" (link, dinheiro, CAIXA ALTA, excesso de "!") que sinalizam spam
 *    mesmo quando as palavras são novas;
 * 2) palavras normalizadas (minúsculas, sem acento, sem stopwords).
 */
export function tokenize(text: string): string[] {
  const tokens: string[] = [];

  if (/https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|biz|xyz|top|link|click|info)\b/i.test(text)) {
    tokens.push("__link__");
  }
  if (/r\$|\$|usd|€|\breais\b/i.test(text)) tokens.push("__dinheiro__");

  const letters = text.replace(/[^A-Za-zÀ-ÿ]/g, "");
  const upper = letters.replace(/[^A-ZÀ-Ý]/g, "");
  if (letters.length > 8 && upper.length / letters.length > 0.5) tokens.push("__caixa_alta__");

  if ((text.match(/!/g) ?? []).length >= 2) tokens.push("__exclamacoes__");
  if (/\d{5,}/.test(text)) tokens.push("__numero_longo__");

  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  const words = normalized.match(/[a-z]{2,}/g) ?? [];
  for (const word of words) {
    if (!STOPWORDS.has(word)) tokens.push(word);
  }
  return tokens;
}

interface WordStats {
  spam: number;
  ham: number;
}

/** Naive Bayes multinomial com suavização de Laplace, implementado do zero. */
export class NaiveBayes {
  private vocab = new Map<string, WordStats>();
  private docs: Record<Label, number> = { spam: 0, ham: 0 };
  private totalTokens: Record<Label, number> = { spam: 0, ham: 0 };

  constructor(private alpha = 1) {}

  get vocabularySize(): number {
    return this.vocab.size;
  }

  get documentCount(): Record<Label, number> {
    return { ...this.docs };
  }

  train(samples: Sample[]): void {
    for (const { text, label } of samples) {
      this.docs[label] += 1;
      for (const token of tokenize(text)) {
        const entry = this.vocab.get(token) ?? { spam: 0, ham: 0 };
        entry[label] += 1;
        this.totalTokens[label] += 1;
        this.vocab.set(token, entry);
      }
    }
  }

  private wordProb(token: string, label: Label): number {
    const entry = this.vocab.get(token)!;
    return (entry[label] + this.alpha) / (this.totalTokens[label] + this.alpha * this.vocab.size);
  }

  classify(text: string): Classification {
    const tokens = tokenize(text);
    const totalDocs = this.docs.spam + this.docs.ham;

    let logSpam = Math.log(this.docs.spam / totalDocs);
    let logHam = Math.log(this.docs.ham / totalDocs);

    const merged = new Map<string, TokenContribution>();
    const unknown: string[] = [];

    for (const token of tokens) {
      if (!this.vocab.has(token)) {
        if (!unknown.includes(token)) unknown.push(token);
        continue;
      }
      const ps = this.wordProb(token, "spam");
      const ph = this.wordProb(token, "ham");
      logSpam += Math.log(ps);
      logHam += Math.log(ph);

      const weight = Math.log(ps / ph);
      const current = merged.get(token);
      if (current) {
        current.count += 1;
        current.weight += weight;
      } else {
        merged.set(token, { token, count: 1, weight });
      }
    }

    // log-sum-exp para evitar underflow
    const max = Math.max(logSpam, logHam);
    const es = Math.exp(logSpam - max);
    const eh = Math.exp(logHam - max);
    const pSpam = es / (es + eh);

    const contributions = [...merged.values()].sort(
      (a, b) => Math.abs(b.weight) - Math.abs(a.weight),
    );

    return {
      label: pSpam >= 0.5 ? "spam" : "ham",
      pSpam,
      pHam: 1 - pSpam,
      contributions,
      unknownTokens: unknown,
      tokens,
    };
  }

  /** Palavras mais associadas a cada classe (razão de verossimilhança, com frequência mínima). */
  topWords(label: Label, n = 10, minCount = 3): { token: string; weight: number }[] {
    const rows: { token: string; weight: number }[] = [];
    for (const [token, stats] of this.vocab) {
      if (stats.spam + stats.ham < minCount) continue;
      const weight = Math.log(this.wordProb(token, "spam") / this.wordProb(token, "ham"));
      rows.push({ token, weight });
    }
    rows.sort((a, b) => (label === "spam" ? b.weight - a.weight : a.weight - b.weight));
    return rows.slice(0, n);
  }

  evaluate(samples: Sample[]): Evaluation {
    let tp = 0;
    let fp = 0;
    let tn = 0;
    let fn = 0;
    for (const { text, label } of samples) {
      const predicted = this.classify(text).label;
      if (label === "spam" && predicted === "spam") tp++;
      else if (label === "ham" && predicted === "spam") fp++;
      else if (label === "ham" && predicted === "ham") tn++;
      else fn++;
    }
    const total = tp + fp + tn + fn;
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    return {
      accuracy: total === 0 ? 0 : (tp + tn) / total,
      precision,
      recall,
      f1,
      confusion: { tp, fp, tn, fn },
      total,
    };
  }
}
