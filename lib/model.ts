import { NaiveBayes, crossValidate } from "./naive-bayes";
import { ALL_SAMPLES, TEST_SET, TRAIN_SET } from "./dataset";

/**
 * O modelo é treinado uma vez por instância da função serverless (escopo de módulo).
 * O corpus é pequeno, então o treino leva poucos milissegundos.
 */
const model = new NaiveBayes(1);
model.train(TRAIN_SET);

const evaluation = model.evaluate(TEST_SET);
const crossValidation = crossValidate(ALL_SAMPLES, 5);

export function getModel(): NaiveBayes {
  return model;
}

export function getModelInfo() {
  return {
    algorithm: "Naive Bayes multinomial (suavização de Laplace, α = 1)",
    vocabularySize: model.vocabularySize,
    trainDocuments: model.documentCount,
    testDocuments: TEST_SET.length,
    evaluation,
    crossValidation,
    topSpamWords: model.topWords("spam", 8),
    topHamWords: model.topWords("ham", 8),
  };
}
