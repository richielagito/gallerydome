import { Geist, Geist_Mono, Tangerine, League_Spartan } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const tangerine = Tangerine({
  weight: ["400", "700"],
  variable: "--font-tangerine",
  subsets: ["latin"],
});

const leagueSpartan = League_Spartan({
  variable: "--font-league-spartan",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://www.richielagito.com"),
  title: {
    default: "Richie Memoria Dome",
    template: "%s | Richie Memoria Dome",
  },
  description:
    "A 3D Interactive Memoria Experience. Explore memories, photos, and videos in a unique 3D dome environment.",
  openGraph: {
    title: "Richie Memoria Dome",
    description:
      "A 3D Interactive Memoria Experience. Explore memories, photos, and videos in a unique 3D dome environment.",
    url: "/",
    siteName: "Richie Memoria Dome",
    images: [
      {
        url: "/og-image.jpg", // Ideally this should exist in public/, but Next.js won't crash if missing immediately.
        width: 1200,
        height: 630,
        alt: "Richie Memoria Dome Preview",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Richie Memoria Dome",
    description: "A 3D Interactive Memoria Experience",
    images: ["/og-image.jpg"],
  },
};

export const viewport = {
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${tangerine.variable} ${leagueSpartan.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
