import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getCurrentUser, publicUser } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata: Metadata = {
  title: "MYSPOT — Park nearby. Park securely. Park smart.",
  description:
    "MYSPOT is a peer-to-peer smart parking marketplace. Find trusted parking near your destination — or turn your unused parking space into extra income.",
  keywords: ["parking", "smart parking", "MYSPOT", "book parking", "residential parking"],
  openGraph: {
    title: "MYSPOT — Park nearby. Park securely. Park smart.",
    description: "Find trusted parking near your destination, or turn unused space into income.",
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={`${inter.variable} ${space.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <Navbar user={user ? publicUser(user) : null} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
