import Classifier from "@/components/Classifier";
import { pct, prettyToken } from "@/lib/format";
import { getModelInfo } from "@/lib/model";

const REPO_URL = "https://github.com/VicktzZ/spamlab-pln";

function GithubIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export default function Home() {
  // Servidor: o modelo é treinado no import, então as métricas já chegam prontas no HTML (sem fetch no cliente).
  const info = getModelInfo();
  const { evaluation, crossValidation } = info;

  return (
    <>
      <header className="hero">
        <div className="wrap">
          <div className="hero-top">
            <p className="kicker">Processamento de Linguagem Natural · FATEC Cotia</p>
            <a className="gh-link" href={REPO_URL} target="_blank" rel="noopener noreferrer" aria-label="Código-fonte no GitHub">
              <GithubIcon />
              GitHub
            </a>
          </div>
          <h1>SpamLab — filtro de e-mail com PLN</h1>
          <p className="sub">
            Cole uma mensagem e veja um classificador Naive Bayes decidir entre <b>spam</b> e <b>ham</b> (mensagem
            legítima), mostrando quais palavras pesaram na decisão.
          </p>
        </div>
      </header>

      <main className="wrap">
        <Classifier />

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

        <section className="card">
          <h2>Desempenho do modelo</h2>
          <p className="hint" style={{ marginTop: 0 }}>
            {info.algorithm}. Treinado com {info.trainDocuments.spam + info.trainDocuments.ham} mensagens e avaliado em{" "}
            {info.testDocuments} mensagens separadas (teste). Vocabulário: {info.vocabularySize} tokens.
          </p>
          <div className="stats">
            <div className="stat">
              <b>{pct(evaluation.accuracy)}</b>
              <span>Acurácia</span>
            </div>
            <div className="stat">
              <b>{pct(evaluation.precision)}</b>
              <span>Precisão (spam)</span>
            </div>
            <div className="stat">
              <b>{pct(evaluation.recall)}</b>
              <span>Recall (spam)</span>
            </div>
            <div className="stat">
              <b>{pct(evaluation.f1)}</b>
              <span>F1-score</span>
            </div>
          </div>

          <div className="sub-label">
            Validação cruzada (5-fold, {crossValidation.total} mensagens): com só {info.testDocuments} mensagens de
            teste, um split único engana; aqui cada mensagem é testada uma vez por um modelo que não a viu.
          </div>
          <div className="stats">
            <div className="stat">
              <b>{pct(crossValidation.accuracy)}</b>
              <span>Acurácia (CV)</span>
            </div>
            <div className="stat">
              <b>{pct(crossValidation.precision)}</b>
              <span>Precisão (CV)</span>
            </div>
            <div className="stat">
              <b>{pct(crossValidation.recall)}</b>
              <span>Recall (CV)</span>
            </div>
            <div className="stat">
              <b>{pct(crossValidation.f1)}</b>
              <span>F1-score (CV)</span>
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
                  {evaluation.confusion.tp}
                  <small>verdadeiro positivo</small>
                </div>
                <div className="cell bad">
                  {evaluation.confusion.fn}
                  <small>falso negativo</small>
                </div>
                <div className="h">real: ham</div>
                <div className="cell bad">
                  {evaluation.confusion.fp}
                  <small>falso positivo</small>
                </div>
                <div className="cell good">
                  {evaluation.confusion.tn}
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

        <section className="card">
          <h2>Use como API</h2>
          <p className="hint" style={{ marginTop: 0 }}>
            O mesmo classificador responde em <code>POST /api/classify</code> com <code>{`{ "text": "..." }`}</code>{" "}
            (CORS aberto). <code>GET /api/classify</code> devolve as métricas do modelo.
          </p>
        </section>
      </main>

      <footer>
        Demonstração didática — corpus pequeno, não substitui um filtro de produção. · Vitor Hugo Rodrigues dos Santos
        · Ciência de Dados · FATEC Cotia ·{" "}
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
          código no GitHub
        </a>
      </footer>
    </>
  );
}
