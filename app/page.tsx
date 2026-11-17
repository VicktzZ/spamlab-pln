"use client";

import { useEffect, useState } from "react";
import { EXAMPLES } from "@/lib/examples";

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
}

interface ModelInfo {
  algorithm: string;
  vocabularySize: number;
  trainDocuments: { spam: number; ham: number };
  testDocuments: number;
  evaluation: {
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    confusion: { tp: number; fp: number; tn: number; fn: number };
    total: number;
  };
  topSpamWords: { token: string; weight: number }[];
  topHamWords: { token: string; weight: number }[];
}

const pct = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`;

const FEATURE_NAMES: Record<string, string> = {
  __link__: "contém link",
  __dinheiro__: "menciona dinheiro",
  __caixa_alta__: "CAIXA ALTA",
  __exclamacoes__: "muitas exclamações",
  __numero_longo__: "número longo",
};

const prettyToken = (token: string) => FEATURE_NAMES[token] ?? token;

export default function Home() {
  const [text, setText] = useState(EXAMPLES[0].text);
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/classify")
      .then((res) => res.json())
      .then(setInfo)
      .catch(() => setInfo(null));
  }, []);

  async function classify() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao classificar.");
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  const maxWeight = result
    ? Math.max(1, ...result.contributions.map((c) => Math.abs(c.weight)))
    : 1;

  return (
    <>
      <header className="hero">
        <div className="wrap">
          <p className="kicker">Processamento de Linguagem Natural · FATEC Cotia</p>
          <h1>SpamLab — filtro de e-mail com PLN</h1>
          <p className="sub">
            Cole uma mensagem e veja um classificador Naive Bayes decidir entre <b>spam</b> e{" "}
            <b>ham</b> (mensagem legítima), mostrando quais palavras pesaram na decisão.
          </p>
        </div>
      </header>

      <main className="wrap">
        <section className="card">
          <label className="label" htmlFor="msg">
            Mensagem
          </label>
          <textarea
            id="msg"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite ou cole o texto de um e-mail ou SMS…"
            maxLength={5000}
          />
          <div className="examples" aria-label="Exemplos prontos">
            {EXAMPLES.map((ex) => (
              <button key={ex.title} className="chip-btn" type="button" onClick={() => setText(ex.text)}>
                {ex.title}
              </button>
            ))}
          </div>
          <div className="actions">
            <button className="primary" type="button" onClick={classify} disabled={loading || !text.trim()}>
              {loading ? "Classificando…" : "Classificar mensagem"}
            </button>
            <span className="hint">{text.length} / 5000 caracteres</span>
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
                      <span className="weight">{c.weight > 0 ? "+" : ""}{c.weight.toFixed(2)}</span>
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

        <section className="card">
          <h2>Como o filtro funciona</h2>
          <div className="pipeline">
            <div className="step">
              <b>Tokenização</b>
              Minúsculas, remoção de acentos e de stopwords.
            </div>
            <div className="step">
              <b>Features de forma</b>
              Detecta link, dinheiro, CAIXA ALTA e excesso de “!”.
            </div>
            <div className="step">
              <b>Verossimilhança</b>
              P(palavra|spam) e P(palavra|ham) aprendidas do corpus.
            </div>
            <div className="step">
              <b>Teorema de Bayes</b>
              Soma de log-probabilidades + prior de cada classe.
            </div>
            <div className="step">
              <b>Decisão</b>
              Spam se P(spam) ≥ 50%. Explicação token a token.
            </div>
          </div>
        </section>

        {info && (
          <section className="card">
            <h2>Desempenho do modelo</h2>
            <p className="hint" style={{ marginTop: 0 }}>
              {info.algorithm}. Treinado com {info.trainDocuments.spam + info.trainDocuments.ham} mensagens e
              avaliado em {info.testDocuments} mensagens separadas (teste). Vocabulário: {info.vocabularySize} tokens.
            </p>
            <div className="stats">
              <div className="stat">
                <b>{pct(info.evaluation.accuracy)}</b>
                <span>Acurácia</span>
              </div>
              <div className="stat">
                <b>{pct(info.evaluation.precision)}</b>
                <span>Precisão (spam)</span>
              </div>
              <div className="stat">
                <b>{pct(info.evaluation.recall)}</b>
                <span>Recall (spam)</span>
              </div>
              <div className="stat">
                <b>{pct(info.evaluation.f1)}</b>
                <span>F1-score</span>
              </div>
            </div>

            <div className="two-col">
              <div>
                <div className="sub-label" style={{ marginTop: 0 }}>
                  Matriz de confusão (conjunto de teste)
                </div>
                <div className="matrix">
                  <div />
                  <div className="h">previsto: spam</div>
                  <div className="h">previsto: ham</div>
                  <div className="h">real: spam</div>
                  <div className="cell good">
                    {info.evaluation.confusion.tp}
                    <small>verdadeiro positivo</small>
                  </div>
                  <div className="cell bad">
                    {info.evaluation.confusion.fn}
                    <small>falso negativo</small>
                  </div>
                  <div className="h">real: ham</div>
                  <div className="cell bad">
                    {info.evaluation.confusion.fp}
                    <small>falso positivo</small>
                  </div>
                  <div className="cell good">
                    {info.evaluation.confusion.tn}
                    <small>verdadeiro negativo</small>
                  </div>
                </div>
              </div>
              <div>
                <div className="sub-label" style={{ marginTop: 0 }}>
                  Tokens mais associados a spam
                </div>
                <div className="pills">
                  {info.topSpamWords.map((w) => (
                    <span className="pill spam" key={w.token}>
                      {prettyToken(w.token)}
                    </span>
                  ))}
                </div>
                <div className="sub-label">Tokens mais associados a ham</div>
                <div className="pills">
                  {info.topHamWords.map((w) => (
                    <span className="pill ham" key={w.token}>
                      {prettyToken(w.token)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="card">
          <h2>Use como API</h2>
          <p className="hint" style={{ marginTop: 0 }}>
            O mesmo classificador responde em <code>POST /api/classify</code> com <code>{`{ "text": "..." }`}</code>.
          </p>
        </section>
      </main>

      <footer>
        Demonstração didática — corpus pequeno, não substitui um filtro de produção. · Vitor Hugo Rodrigues dos
        Santos · Ciência de Dados · FATEC Cotia
      </footer>
    </>
  );
}
