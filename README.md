# SpamLab — filtro de e-mail com PLN

Demo para a disciplina de Processamento de Linguagem Natural (FATEC Cotia).
Classificador **Naive Bayes** escrito do zero em TypeScript, exposto por uma API
(`/api/classify`) e uma interface web em Next.js.

**Demo:** https://spamlab-pln.vercel.app · **Código:** https://github.com/VicktzZ/spamlab-pln

## Rodar localmente

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # testes unitários (node --test, sem dependências extras)
```

## Publicar na Vercel

Opção 1 — CLI:

```bash
npx vercel login
npx vercel --prod
```

Opção 2 — GitHub: suba esta pasta para um repositório e use "Add New → Project"
em vercel.com/new. O framework (Next.js) é detectado automaticamente.

## API

```bash
curl -X POST https://SEU-PROJETO.vercel.app/api/classify \
  -H "Content-Type: application/json" \
  -d '{"text":"PARABÉNS!!! Clique no link e ganhe R$ 10.000"}'
```

`GET /api/classify` devolve as métricas do modelo (acurácia, matriz de confusão).

## Estrutura

- `lib/naive-bayes.ts` — tokenização, treino, classificação e avaliação
- `lib/dataset.ts` — corpus didático (spam/ham, português e inglês) e divisão treino/teste
- `lib/model.ts` — treina o modelo uma vez por instância serverless
- `app/api/classify/route.ts` — endpoint
- `app/page.tsx` — página (Server Component: métricas já vêm no HTML)
- `components/Classifier.tsx` — formulário, resultado e destaque das palavras (client)
- `lib/format.ts` — formatação compartilhada (porcentagem, nomes das features)
- `tests/` — testes do tokenizador, classificador, destaque e validação cruzada

## Roadmap

Já feito: destaque das palavras na própria mensagem, validação cruzada 5-fold, métricas renderizadas no servidor,
classificação automática ao escolher exemplo (Ctrl+Enter no texto), correção do falso positivo `usd` em palavras como
"Husdon", detecção de encurtadores de link (`bit.ly`), CORS na API, favicon e metadados, testes unitários.

Backlog mapeado:

- Corpus maior e real (SMS Spam Collection, datasets PT-BR) com split estratificado
- Bigramas/TF-IDF e stemming para português (RSLP)
- Slider de limiar de decisão, mostrando o trade-off falso positivo × falso negativo
- Modo escuro (as cores já são variáveis CSS)
- Rate limit na API (Vercel Firewall)
- CI no GitHub Actions (testes + build)
- Classificação em lote (`POST` com lista de textos)
- Comparar com outro algoritmo (regressão logística) na mesma tela