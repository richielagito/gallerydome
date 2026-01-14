"use client";

import { useState } from "react";
import DomeGallery from "./DomeGallery";

export default function ClientHome({ initialImages = [] }) {
    const [isExplored, setIsExplored] = useState(false);

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-black">
            {/* Gallery Layer */}
            <div className={`absolute inset-0 transition-all duration-[2000ms] ease-in-out ${isExplored ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"}`}>
                <DomeGallery maxVerticalRotationDeg={8} segments={28} grayscale={false} interactive={isExplored} images={initialImages} />
            </div>

            {/* Content Layer (Title & Button) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                <div className={`transition-all duration-[1500ms] ease-in-out flex flex-col items-center ${isExplored ? "-translate-y-[150vh] opacity-0" : "translate-y-0 opacity-100"}`}>
                    <div className="flex flex-col items-center mb-12 pointer-events-auto">
                        <h1 className="text-8xl md:text-[8rem] text-white font-tangerine font-bold text-center leading-none drop-shadow-2xl z-20">Richie's</h1>
                        <h2 className="text-sm md:text-md text-white font-spartan font-bold text-center tracking-[0.2em] uppercase mt-[-0.5rem] md:mt-[-1.5rem] drop-shadow-xl z-10">Gallery Dome</h2>
                    </div>
                </div>

                <div className={`absolute bottom-32 transition-all duration-[1500ms] ease-in-out delay-100 ${isExplored ? "translate-y-[150vh] opacity-0" : "translate-y-0 opacity-100"}`}>
                    <button
                        onClick={() => setIsExplored(true)}
                        className="pointer-events-auto cursor-pointer px-8 py-3 bg-white/0 hover:bg-white/20 text-white rounded-full border border-white/30 backdrop-blur-md transition-all active:scale-95 text-lg tracking-widest uppercase font-light"
                    >
                        Explore
                    </button>
                </div>
            </div>

            {/* Top "Stop Exploring" Button */}
            <div className={`absolute top-6 left-0 w-full text-center z-20 pointer-events-none transition-opacity duration-1000 ${isExplored ? "opacity-100" : "opacity-0"}`}>
                <button
                    onClick={() => setIsExplored(false)}
                    className={`text-white/40 hover:text-white/80 transition-colors text-xs md:text-sm font-light font-spartan tracking-widest uppercase cursor-pointer ${isExplored ? "pointer-events-auto" : "pointer-events-none"}`}
                >
                    stop exploring
                </button>
            </div>

            {/* Footer Layer */}
            <div className="absolute bottom-6 left-0 w-full text-center z-20 pointer-events-none">
                <p suppressHydrationWarning className="text-white/40 text-xs md:text-sm font-light font-spartan tracking-widest">
                    © {new Date().getFullYear()} Richie Lagito.
                </p>
            </div>
        </div>
    );
}
