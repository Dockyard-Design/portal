import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";

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
      <html lang="en" className="dark">
        <body className="min-h-screen bg-background text-foreground font-sans antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
