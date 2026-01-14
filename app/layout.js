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
    title: "Richie Gallery Dome",
    description: "A 3D Gallery Experience",
};

export const viewport = {
    viewportFit: "cover",
    themeColor: "#000000",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} ${tangerine.variable} ${leagueSpartan.variable} antialiased`}>{children}</body>
        </html>
    );
}
