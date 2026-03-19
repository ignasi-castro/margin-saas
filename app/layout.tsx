import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MixPower — Optimiza el mix. Recupera el margen.",
  description: "Software comercial para fabricantes de materiales de construcción. Analiza el mix de producto de tu cartera y recupera el margen perdido.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:ital,wght@0,300;0,400;0,500;1,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
