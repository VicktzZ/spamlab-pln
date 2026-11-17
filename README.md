# SpamLab — filtro de e-mail com PLN

Demo para a disciplina de Processamento de Linguagem Natural (FATEC Cotia).
Classificador **Naive Bayes** escrito do zero em TypeScript, exposto por uma API
(`/api/classify`) e uma interface web em Next.js.

## Rodar localmente

```bash
npm install
npm run dev        # http://localhost:3000
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
- `app/page.tsx` — interface
