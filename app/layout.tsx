import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpamLab · Filtro de e-mail com PLN",
  description:
    "Demonstração de classificação de spam com Naive Bayes — Processamento de Linguagem Natural, FATEC Cotia.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
