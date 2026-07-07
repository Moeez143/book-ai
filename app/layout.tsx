import {ClerkProvider} from "@clerk/nextjs";
import type { Metadata } from "next";
import { IBM_Plex_Serif, Mona_Sans } from "next/font/google";

import "./globals.css";
import Navbar from "@/components/Navbar";

const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  variable: "--font-ibm-plex-serif",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const monaSans = Mona_Sans({
  subsets: ["latin"],
  variable: "--font-mona-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Book AI",
  description:
    "Transform your reading experience with Book AI: Summarize, analyze, and explore your books like never before. Uploads PDFs and chats with your books to unlock insights and enhance your understanding.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`min-h-full flex flex-col ${ibmPlexSerif.variable} ${monaSans.variable} h-full antialiased`}
        cz-shortcut-listen="true"
      >
        <ClerkProvider dynamic>
          <Navbar />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
