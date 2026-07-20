import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const raleway = Raleway({ variable: "--font-raleway", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Systemregistret",
  description: "Sundsvalls kommuns systemregister",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv" className={raleway.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
