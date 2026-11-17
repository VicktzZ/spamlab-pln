import { NextResponse } from "next/server";
import { getModel, getModelInfo } from "@/lib/model";

export const dynamic = "force-dynamic";

const MAX_LENGTH = 5000;

/** GET: métricas do modelo (acurácia no conjunto de teste, matriz de confusão, palavras-chave). */
export async function GET() {
  return NextResponse.json(getModelInfo());
}

/** POST: classifica uma mensagem em spam ou ham e explica a decisão token a token. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido (JSON esperado)." }, { status: 400 });
  }

  const text = typeof body === "object" && body !== null ? (body as { text?: unknown }).text : undefined;
  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "Envie um campo 'text' com a mensagem." }, { status: 400 });
  }
  if (text.length > MAX_LENGTH) {
    return NextResponse.json({ error: `Mensagem muito longa (máximo ${MAX_LENGTH} caracteres).` }, { status: 413 });
  }

  const result = getModel().classify(text);
  return NextResponse.json({
    label: result.label,
    pSpam: result.pSpam,
    pHam: result.pHam,
    contributions: result.contributions.slice(0, 12),
    unknownTokens: result.unknownTokens.slice(0, 12),
    tokenCount: result.tokens.length,
  });
}
