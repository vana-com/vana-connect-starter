import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vana Connect — Next.js Starter",
  description: "Example app for the Vana Connect SDK",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          margin: 0,
          fontFamily: '"DM Sans", sans-serif',
          background: "#09090b",
          color: "#e4e4e7",
          minHeight: "100vh",
        }}
      >
        {children}
      </body>
    </html>
  );
}
