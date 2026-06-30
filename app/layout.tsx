import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soy Agaci",
  description: "Supabase destekli aile soy agaci uygulamasi"
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
