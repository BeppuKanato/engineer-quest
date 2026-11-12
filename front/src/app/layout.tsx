import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SoundProvider } from "@/lib/audio/soundFeedback";
import { HexadRouteGuard } from "./component/hexadRouteGuard";
import { UserSessionProvider } from "@/lib/session/userSession";
import { AnswerFeedbackProvider } from "@/features/learning/assessment/AnswerFeedback";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Engineer Quest",
    template: "%s | Engineer Quest",
  },
  description: "ゲーム感覚でプログラミングとアルゴリズムを学べる学習アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="jp">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-200`}
      >
        <UserSessionProvider>
          <SoundProvider>
            <AnswerFeedbackProvider>
              <HexadRouteGuard />
              {children}
            </AnswerFeedbackProvider>
          </SoundProvider>
        </UserSessionProvider>
      </body>
    </html>
  );
}
