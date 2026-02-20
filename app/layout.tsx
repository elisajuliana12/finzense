import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer"; // Import Footer baru kamu

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finzense - Personal Finance Manager",
  description: "Kelola keuanganmu dengan lebih cerdas dan transparan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        {/* Main content akan mengambil space yang tersedia */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Footer akan selalu berada di bawah */}
        <Footer />
      </body>
    </html>
  );
}