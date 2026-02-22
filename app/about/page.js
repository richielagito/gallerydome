"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AboutPage() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="relative w-full min-h-[100dvh] bg-black overflow-y-auto overflow-x-hidden">
            {/* Subtle ambient gradient */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-white/[0.015] rounded-full blur-[100px]" />
            </div>

            {/* Back button */}
            <div className={`fixed top-[calc(1.5rem+env(safe-area-inset-top))] left-4 md:left-8 z-50 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
                <Link href="/" className="text-white/40 hover:text-white/80 transition-colors text-xs md:text-sm font-spartan tracking-widest uppercase inline-flex items-center gap-2 group">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-transform group-hover:-translate-x-1 shrink-0"
                    >
                        <path d="M19 12H5" />
                        <path d="m12 19-7-7 7-7" />
                    </svg>
                    <span className="translate-y-0.5">Back</span>
                </Link>
            </div>

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center justify-center px-6 md:px-8 py-24 md:py-32">
                {/* Title */}
                <div className={`transition-all duration-[1500ms] ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                    <h1 className="text-6xl md:text-8xl text-white font-tangerine font-bold text-center leading-none drop-shadow-2xl">About</h1>
                    <div className="w-16 h-[1px] bg-white/20 mx-auto mt-4 mb-12" />
                </div>

                {/* Poetic narrative content */}
                <div className={`max-w-lg md:max-w-xl text-center space-y-8 transition-all duration-[2000ms] ease-out delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
                    <p className="text-white/60 text-sm md:text-base font-spartan leading-relaxed tracking-wide">
                        Pernah ga sih kalian bertanya — apa yang membuat seseorang menjadi <em className="text-white/80 not-italic font-medium">dirinya sendiri?</em>
                    </p>

                    <p className="text-white/50 text-sm md:text-base font-spartan leading-relaxed tracking-wide">
                        Bukan nama. Bukan wajah. Bukan tempat tinggal atau pekerjaan. Melainkan serpihan-serpihan kecil yang tersimpan di sudut-sudut ingatan — momen-momen yang pernah membuat kalian tertawa, menangis, terjatuh, lalu bangkit
                        lagi.
                    </p>

                    <p className="text-white/50 text-sm md:text-base font-spartan leading-relaxed tracking-wide">
                        Setiap foto di sini adalah sebuah cerita. Setiap kenangan adalah sebuah jejak. Dan setiap jejak itu, entah baik ataupun buruk, membentuk gw menjadi Richie yang kalian kenal hari ini.
                    </p>

                    <div className="w-8 h-[1px] bg-white/10 mx-auto my-4" />

                    <p className="text-white/50 text-sm md:text-base font-spartan leading-relaxed tracking-wide">
                        Tanpa kenangan itu, gw bukanlah <em className="text-white/70 not-italic">gw.</em>
                    </p>

                    <p className="text-white/50 text-sm md:text-base font-spartan leading-relaxed tracking-wide">
                        Karena kita tidak hanya hidup di masa kini — kita adalah kumpulan dari semua yang pernah kita rasakan, semua yang pernah kita cintai, dan semua yang pernah mengubah kita. Memori itu bukan sekadar masa lalu. Memori
                        itu adalah bagian dari siapa kita.
                    </p>

                    <p className="text-white/60 text-sm md:text-base font-spartan leading-relaxed tracking-wide">
                        Website ini ada agar kalian bisa melihat dunia dari mata gw — melihat memori-memori yang pernah membentuk diri gw. Sebuah dome kecil tempat gw menyimpan hal-hal yang tak ingin gw lupakan.
                    </p>
                </div>

                {/* Divider */}
                <div className={`my-16 transition-all duration-[2000ms] ease-out delay-700 ${isVisible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 md:w-24 h-[1px] bg-white/10" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        <div className="w-12 md:w-24 h-[1px] bg-white/10" />
                    </div>
                </div>

                {/* Cassandra Clare quote */}
                <blockquote className={`max-w-md md:max-w-lg text-center transition-all duration-[2500ms] ease-out delay-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                    <p className="text-white/40 text-sm md:text-base italic leading-loose font-spartan tracking-wide">
                        &ldquo;We are all the pieces of what we remember. We hold in ourselves the hopes and fears of those who love us. As long as there is love and memory, there is no true loss.&rdquo;
                    </p>
                    <footer className="mt-4 text-white/25 text-xs md:text-sm font-spartan tracking-[0.15em]">
                        — Cassandra Clare, <span className="italic">City of Heavenly Fire</span>
                    </footer>
                </blockquote>
            </div>

            {/* Footer */}
            <div className="relative z-10 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center">
                <p suppressHydrationWarning className="text-white/40 text-xs md:text-sm font-medium font-spartan tracking-widest">
                    © {new Date().getFullYear()} Richie Lagito.
                </p>
            </div>
        </div>
    );
}
