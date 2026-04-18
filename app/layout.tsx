import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Inter } from "next/font/google";
import "./globals.css";
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Dockyard Portal",
  description: "Dockyard Design - Dockyard Portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        ...dark,
      }}
    >
      <html lang="en" className={`dark ${inter.variable}`}>
        <body className={`min-h-screen bg-background text-foreground font-sans antialiased ${inter.className}`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
