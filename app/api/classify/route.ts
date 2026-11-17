import { NextResponse } from "next/server";
import { getModel, getModelInfo } from "@/lib/model";

export const dynamic = "force-dynamic";

const MAX_LENGTH = 5000;

// API pública e sem estado (sem cookies nem credenciais): CORS aberto para a demo poder ser chamada de qualquer origem.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: CORS });

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/** GET: métricas do modelo (acurácia no conjunto de teste, validação cruzada, matriz de confusão, palavras-chave). */
export async function GET() {
  return json(getModelInfo());
}

/** POST: classifica uma mensagem em spam ou ham e explica a decisão token a token. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Corpo da requisição inválido (JSON esperado)." }, 400);
  }

  const text = typeof body === "object" && body !== null ? (body as { text?: unknown }).text : undefined;
  if (typeof text !== "string" || text.trim().length === 0) {
    return json({ error: "Envie um campo 'text' com a mensagem." }, 400);
  }
  if (text.length > MAX_LENGTH) {
    return json({ error: `Mensagem muito longa (máximo ${MAX_LENGTH} caracteres).` }, 413);
  }

  const model = getModel();
  const result = model.classify(text);
  return json({
    label: result.label,
    pSpam: result.pSpam,
    pHam: result.pHam,
    contributions: result.contributions.slice(0, 12),
    unknownTokens: result.unknownTokens.slice(0, 12),
    tokenCount: result.tokens.length,
    segments: model.highlight(text),
  });
}
