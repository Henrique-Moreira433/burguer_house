import "./globals.css";

export const metadata = {
  title: "Burguer House",
  description: "O melhor hambúrguer da região",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body>{children}</body>
    </html>
  );
}