import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soy Agaci",
  description: "SOY AGACI UYGULAMASINA HOSGELDINIZ
    HUN XER HATIN"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
