import test from "node:test";
import assert from "node:assert/strict";
import { NaiveBayes, crossValidate, tokenize } from "../lib/naive-bayes.ts";
import { ALL_SAMPLES, TRAIN_SET } from "../lib/dataset.ts";

const model = new NaiveBayes(1);
model.train(TRAIN_SET);

test("tokenize: 'usd' só vale como dinheiro quando é palavra inteira", () => {
  assert.ok(tokenize("invoice USD 120").includes("__dinheiro__"));
  assert.ok(!tokenize("Husdon river report").includes("__dinheiro__"));
});

test("tokenize: encurtador de link sem http vira __link__", () => {
  assert.ok(tokenize("veja bit.ly/abc agora").includes("__link__"));
});

test("classify: spam óbvio e ham óbvio", () => {
  assert.equal(model.classify("PARABÉNS!!! Ganhe R$ 10.000 clicando no link http://premio.xyz").label, "spam");
  assert.equal(model.classify("Pessoal, a reunião da sprint foi movida para as 14h").label, "ham");
});

test("highlight: preserva o texto original e pesa palavras conhecidas", () => {
  const text = "Retire seu prêmio agora, Maria!";
  const segments = model.highlight(text);
  assert.equal(segments.map((s) => s.text).join(""), text);
  const premio = segments.find((s) => s.text === "prêmio");
  assert.ok(premio && premio.weight !== undefined && premio.weight > 0);
  assert.equal(segments.find((s) => s.text === "Maria")?.weight, undefined);
});

test("crossValidate: cada amostra é testada exatamente uma vez", () => {
  const cv = crossValidate(ALL_SAMPLES, 5);
  assert.equal(cv.total, ALL_SAMPLES.length);
  assert.ok(cv.accuracy > 0.7, `acurácia CV baixa: ${cv.accuracy}`);
});
