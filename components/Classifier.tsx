"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { EXAMPLES } from "@/lib/examples";
import { pct, prettyToken } from "@/lib/format";

interface Segment {
  text: string;
  weight?: number;
}

interface Contribution {
  token: string;
  count: number;
  weight: number;
}

interface ClassifyResult {
  label: "spam" | "ham";
  pSpam: number;
  pHam: number;
  contributions: Contribution[];
  unknownTokens: string[];
  tokenCount: number;
  segments: Segment[];
}

export default function Classifier() {
  const [text, setText] = useState(EXAMPLES[0].text);
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0); // descarta respostas atrasadas quando o usuário dispara várias seguidas

  async function classify(value: string) {
    if (!value.trim()) return;
    const id = ++latest.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao classificar.");
      if (id === latest.current) setResult(data);
    } catch (err) {
      if (id === latest.current) {
        setResult(null);
        setError(err instanceof Error ? err.message : "Erro inesperado.");
      }
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }

  // mostra um resultado já na primeira visita
  useEffect(() => {
    void classify(EXAMPLES[0].text);
  }, []);

  const maxWeight = result ? Math.max(1, ...result.contributions.map((c) => Math.abs(c.weight))) : 1;
  const maxSegment = result ? Math.max(1, ...result.segments.map((s) => Math.abs(s.weight ?? 0))) : 1;

  return (
    <>
      <section className="card">
        <label className="label" htmlFor="msg">
          Mensagem
        </label>
        <textarea
          id="msg"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") void classify(text);
          }}
          placeholder="Digite ou cole o texto de um e-mail ou SMS…"
          maxLength={5000}
        />
        <div className="examples" aria-label="Exemplos prontos">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.title}
              className="chip-btn"
              type="button"
              onClick={() => {
                setText(ex.text);
                void classify(ex.text);
              }}
            >
              {ex.title}
            </button>
          ))}
        </div>
        <div className="actions">
          <button className="primary" type="button" onClick={() => void classify(text)} disabled={loading || !text.trim()}>
            {loading ? "Classificando…" : "Classificar mensagem"}
          </button>
          <span className="hint">
            {text.length} / 5000 caracteres · Ctrl + Enter classifica
          </span>
        </div>
        {error && <p className="error">{error}</p>}
      </section>

      {result && (
        <section className="card" aria-live="polite">
          <h2>Resultado</h2>
          <div className="verdict">
            <span className={`badge ${result.label}`}>{result.label === "spam" ? "SPAM" : "HAM (legítima)"}</span>
            <span className="verdict-text">
              P(spam) = <b>{pct(result.pSpam)}</b> · P(ham) = <b>{pct(result.pHam)}</b> · {result.tokenCount} tokens
            </span>
          </div>
          <div className="meter" role="img" aria-label={`Probabilidade de spam: ${pct(result.pSpam)}`}>
            <div className="meter-fill" style={{ width: `${result.pSpam * 100}%` }} />
          </div>
          <div className="meter-scale">
            <span>0% (ham)</span>
            <span>100% (spam)</span>
          </div>

          <div className="sub-label" style={{ marginTop: "1.2rem" }}>
            Palavras que pesaram na decisão (vermelho puxa para spam, verde para ham; passe o mouse para ver o peso)
          </div>
          <p className="highlighted">
            {result.segments.map((s, i) =>
              s.weight === undefined ? (
                <span key={i}>{s.text}</span>
              ) : (
                <mark
                  key={i}
                  className={`hl ${s.weight >= 0 ? "spam" : "ham"}`}
                  style={{ "--a": Math.min(1, Math.abs(s.weight) / maxSegment) } as CSSProperties}
                  title={`peso ${s.weight > 0 ? "+" : ""}${s.weight.toFixed(2)}`}
                >
                  {s.text}
                </mark>
              ),
            )}
          </p>

          <div className="sub-label">
            Por que o modelo decidiu assim? Peso de cada token = log P(token|spam) − log P(token|ham)
          </div>
          {result.contributions.length === 0 ? (
            <p className="hint">Nenhum token conhecido pelo modelo nesta mensagem; vale só a probabilidade a priori.</p>
          ) : (
            <>
              <div className="contrib">
                {result.contributions.map((c) => (
                  <div className="contrib-row" key={c.token}>
                    <span className="contrib-token" title={c.token}>
                      {prettyToken(c.token)}
                      {c.count > 1 ? ` ×${c.count}` : ""}
                    </span>
                    <div className="bar-track">
                      <div
                        className={`bar ${c.weight >= 0 ? "spam" : "ham"}`}
                        style={{ width: `${Math.min(50, (Math.abs(c.weight) / maxWeight) * 50)}%` }}
                      />
                    </div>
                    <span className="weight">
                      {c.weight > 0 ? "+" : ""}
                      {c.weight.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="legend">
                <span>← puxa para ham</span>
                <span>puxa para spam →</span>
              </p>
            </>
          )}
          {result.unknownTokens.length > 0 && (
            <>
              <div className="sub-label">Palavras que o modelo nunca viu (ignoradas):</div>
              <div className="pills">
                {result.unknownTokens.map((t) => (
                  <span className="pill neutral" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </>
  );
}
