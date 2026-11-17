import type { Sample } from "./naive-bayes";

/**
 * Corpus didático (escrito para este trabalho) com mensagens em português do Brasil
 * e algumas em inglês. É pequeno de propósito: serve para demonstrar o pipeline de PLN,
 * não para uso em produção.
 */
const SPAM: string[] = [
  "PARABÉNS!!! Você ganhou um iPhone 15. Clique aqui para resgatar seu prêmio agora: http://premio-gratis.xyz",
  "Seu CPF foi bloqueado. Regularize agora pelo link www.regulariza-cpf.top e evite multa",
  "Empréstimo aprovado sem consulta ao SPC e Serasa! Dinheiro na conta em 10 minutos. Responda SIM",
  "PROMOÇÃO IMPERDÍVEL!!! Todos os produtos com 90% de desconto só hoje. Compre já",
  "Sua conta bancária será suspensa em 24 horas. Atualize seus dados de acesso neste link",
  "Ganhe R$ 5.000 por mês trabalhando em casa, sem experiência. Cadastre-se grátis agora",
  "Aumente seus seguidores no Instagram: 10 mil seguidores por apenas R$ 29,90. Clique e garanta",
  "Cartão de crédito pré-aprovado com limite de R$ 20.000. Solicite agora sem burocracia",
  "Pix recebido não identificado no valor de R$ 1.850,00. Confirme seus dados para liberar o valor",
  "Seu pacote está retido na alfândega. Pague a taxa de R$ 14,90 pelo link para liberar a entrega",
  "URGENTE: sua assinatura expirou. Renove agora e ganhe 70% OFF. Oferta válida por poucas horas!!",
  "Você foi selecionado para receber um vale-compras de R$ 500. Responda esta mensagem e participe",
  "Emagreça 15 quilos em 30 dias com este chá milagroso. Compre 2 e leve 3. Frete grátis!!!",
  "Investimento garantido: dobre seu dinheiro em 7 dias com criptomoedas. Vagas limitadas, entre agora",
  "Limpe seu nome hoje! Negocie suas dívidas com até 95% de desconto. Acesse www.limpa-nome.click",
  "ÚLTIMA CHANCE!!! Ganhe um cruzeiro de luxo. Preencha o cadastro e concorra, é grátis",
  "Atenção: detectamos acesso suspeito na sua conta. Clique no link para confirmar sua senha imediatamente",
  "Viagra e remédios sem receita com preço baixo. Entrega discreta em todo o Brasil. Compre online",
  "Você ganhou um cupom de R$ 100 em compras. Resgate agora antes que expire: bit.ly/cupom-vip",
  "Trabalhe pelo celular e receba por dia. Ganhos de até R$ 800 diários. Entre no grupo VIP grátis",
  "Parabéns, seu número foi sorteado! Retire seu prêmio de R$ 10.000 pagando apenas a taxa de liberação",
  "Compre seguidores, curtidas e visualizações baratas. Resultados garantidos em 24 horas!!!",
  "Seu cartão foi bloqueado por segurança. Ligue agora ou clique para desbloquear e evitar cancelamento",
  "Ganhe dinheiro fácil apostando! Bônus de R$ 200 no primeiro depósito. Cadastre-se e jogue agora",
  "Renda extra imediata: indique amigos e ganhe comissões altas. Sem investimento inicial, entre agora",
  "OFERTA EXCLUSIVA para você: relógio de marca por R$ 49,90. Estoque acabando, compre hoje!",
  "Receita Federal: restituição liberada de R$ 2.340,00. Confirme seu CPF no link para receber",
  "Aumente seu desempenho com pílulas naturais. Satisfação garantida ou seu dinheiro de volta. Compre já",
  "Você tem uma herança de milhões esperando. Envie seus dados bancários para receber a transferência",
  "Clique aqui para baixar o app e ganhe R$ 50 de bônus grátis. Oferta por tempo limitado!!",
  "Congratulations! You have won a free cruise. Click here to claim your prize now!!!",
  "Win cash now! Limited time offer, send your bank details to receive $5000 instantly",
  "URGENT: your account has been suspended. Verify your password at http://secure-login.xyz today",
  "Buy cheap meds online, no prescription needed. Free shipping and huge discounts, order now",
  "Make money fast from home! Guaranteed income, no experience needed. Sign up free today!!!",
  "You have been selected for a free gift card of $500. Reply YES to claim your reward",
  "Lowest prices on watches and bags, 90% off today only. Click the link and save big!!",
  "Final notice: pay the customs fee now to release your package. Click the link below",
  "Desbloqueie seu limite do cartão agora, aprovação imediata e sem consulta. Chame no WhatsApp",
  "Ganhe 3 meses de streaming grátis. Cadastre seu cartão e aproveite essa promoção imperdível!!!",
];

const HAM: string[] = [
  "Oi, tudo bem? Podemos remarcar nossa reunião para quinta-feira à tarde?",
  "Segue em anexo a ata da reunião de ontem. Qualquer dúvida é só me avisar",
  "A aula de Processamento de Linguagem Natural será presencial na segunda-feira, às 19h20",
  "Lembrete: a entrega do trabalho no Teams é amanhã até as 17h. Não esqueçam do slide de referências",
  "Valeu pela ajuda ontem com o código, consegui resolver o erro na API",
  "Bom dia! Você consegue revisar o pull request que abri hoje de manhã?",
  "Vou chegar um pouco atrasado na faculdade, o ônibus está parado no trânsito",
  "Pode me mandar o link do repositório do projeto? Preciso clonar na minha máquina",
  "A reunião de planejamento da sprint foi movida para as 14h. A sala continua a mesma",
  "Obrigado pelo feedback no relatório. Já ajustei as seções e atualizei o documento",
  "Mãe, cheguei bem em casa. Mais tarde te ligo para conversar sobre o final de semana",
  "Estou enviando o documento revisado com as correções que combinamos na reunião",
  "O professor liberou as notas da primeira unidade no portal. Dá uma olhada quando puder",
  "Vamos almoçar juntos amanhã? Tem um restaurante novo perto do escritório",
  "Preciso da sua opinião sobre o layout da página inicial. Mandei o protótipo no Figma",
  "A pipeline falhou no teste de integração. Vou investigar o log e te aviso o que encontrei",
  "Segue o cronograma atualizado do projeto com as entregas de cada semana até o fim do semestre",
  "Pessoal, a apresentação do trabalho em grupo será na próxima segunda. Combinem a ordem das falas",
  "Fechei o ajuste no banco de dados. Pode testar novamente a consulta de relatórios",
  "Oi professor, posso entregar o exercício até sexta? Tive um problema com a internet em casa",
  "Parabéns pelo aniversário! Desejo muita saúde e felicidades. Vamos comemorar no sábado",
  "Subi a nova versão no ambiente de homologação. Quando puder, valida o fluxo de cadastro",
  "Obrigado por participar da entrevista. Retornamos com o resultado do processo seletivo na próxima semana",
  "Anexei os slides da apresentação. Revisei a ortografia e padronizei as fontes",
  "Você viu o commit que o Pedro fez? Acho que quebrou o build da branch principal",
  "Vou estudar para a prova de estatística hoje à noite. Quer revisar junto comigo por chamada de vídeo?",
  "Combinado então: nos encontramos na biblioteca às 10h para finalizar o trabalho",
  "O relatório mensal está pronto. Coloquei os gráficos no documento compartilhado do drive",
  "Tudo certo com a sua inscrição no evento. O credenciamento começa às 8h no auditório principal",
  "Podemos conversar rapidamente sobre o escopo da tarefa? Fiquei com uma dúvida sobre os requisitos",
  "Hi team, the meeting notes are attached. Please review and let me know if I missed anything",
  "Thanks for the update. I will look at the pull request this afternoon and leave my comments",
  "Can we move our call to Thursday at 3pm? I have a conflict with another meeting",
  "Reminder: the project report is due on Friday. Please upload your section to the shared folder",
  "Great job on the presentation yesterday. The feedback from the professor was very positive",
  "Attached is the latest version of the schedule. Let me know if the dates work for everyone",
  "I deployed the fix to the staging environment. Could you test the login flow when you have time?",
  "Lunch tomorrow? There is a new place near the office that I would like to try",
  "Olá, sua consulta está confirmada para quarta-feira às 15h. Em caso de imprevisto, avise com antecedência",
  "Obrigada pela explicação na aula de hoje. Ficou muito mais claro como funciona a classificação de texto",
  "Estou passando para avisar que a reunião de alinhamento do time terminou. Mando o resumo por e-mail",
];

function toSamples(texts: string[], label: Sample["label"]): Sample[] {
  return texts.map((text) => ({ text, label }));
}

const ALL_SPAM = toSamples(SPAM, "spam");
const ALL_HAM = toSamples(HAM, "ham");

/** Divisão determinística 75/25: toda 4ª mensagem de cada classe vai para o teste. */
function split(samples: Sample[]): { train: Sample[]; test: Sample[] } {
  const train: Sample[] = [];
  const test: Sample[] = [];
  samples.forEach((s, i) => (i % 4 === 3 ? test : train).push(s));
  return { train, test };
}

const spamSplit = split(ALL_SPAM);
const hamSplit = split(ALL_HAM);

export const TRAIN_SET: Sample[] = [...spamSplit.train, ...hamSplit.train];
export const TEST_SET: Sample[] = [...spamSplit.test, ...hamSplit.test];

export const ALL_SAMPLES: Sample[] = [...ALL_SPAM, ...ALL_HAM];
