"use client";

import { useState } from "react";
import DomeGallery from "./DomeGallery";
import { refreshGallery } from "../actions";

export default function ClientHome({ initialImages = [] }) {
  const [isExplored, setIsExplored] = useState(false);
  const [isGalleryLoaded, setIsGalleryLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-black">
      {/* Gallery Layer */}
      <div
        className={`absolute inset-0 transition-all duration-[2000ms] ease-in-out ${isExplored ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <DomeGallery
          maxVerticalRotationDeg={8}
          segments={28}
          grayscale={false}
          interactive={isExplored}
          images={initialImages}
          onLoad={() => setIsGalleryLoaded(true)}
        />
      </div>

      {/* Content Layer (Title & Button) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
        <div
          className={`transition-all duration-[1500ms] ease-in-out flex flex-col items-center ${isExplored ? "-translate-y-[150vh] opacity-0" : "translate-y-0 opacity-100"}`}
        >
          <div className="flex flex-col items-center mb-12 pointer-events-auto">
            <h1 className="text-8xl md:text-[8rem] text-white font-tangerine font-bold text-center leading-none drop-shadow-2xl z-20">
              Richie's
            </h1>
            <h2 className="text-sm md:text-md text-white font-spartan font-bold text-center tracking-[0.2em] uppercase mt-[-0.5rem] md:mt-[-1.5rem] drop-shadow-xl z-10">
              Memoria Dome
            </h2>
          </div>

          <blockquote className="max-w-xs md:max-w-sm text-center text-white/50 text-xs md:text-sm italic leading-relaxed mt-2 px-4">
            "As long as there is love and memory, there is no true loss."
            <span className="block not-italic text-white/30 text-[10px] md:text-xs mt-1">
              — Cassandra Clare
            </span>
          </blockquote>
        </div>

        <div
          className={`absolute bottom-32 transition-all duration-[1500ms] ease-in-out delay-100 ${isExplored ? "translate-y-[150vh] opacity-0" : "translate-y-0 opacity-100"}`}
        >
          <button
            onClick={() => setIsExplored(true)}
            disabled={!isGalleryLoaded}
            className={`pointer-events-auto cursor-pointer px-8 py-3 bg-white/0 hover:bg-white/20 text-white rounded-full border border-white/30 backdrop-blur-md transition-all active:scale-95 text-lg tracking-widest uppercase font-light ${
              !isGalleryLoaded ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isGalleryLoaded ? "Explore" : "Loading..."}
          </button>
        </div>
      </div>

      {/* Top "Stop Exploring" Button */}
      <div
        className={`absolute top-[calc(1.5rem+env(safe-area-inset-top))] left-0 w-full text-center z-20 pointer-events-none transition-opacity duration-1000 ${isExplored ? "opacity-100" : "opacity-0"}`}
      >
        <button
          onClick={() => setIsExplored(false)}
          className={`text-white/40 hover:text-white/80 transition-colors text-xs md:text-sm font-medium font-spartan tracking-widest uppercase cursor-pointer ${isExplored ? "pointer-events-auto" : "pointer-events-none"}`}
        >
          stop exploring
        </button>
      </div>

      {/* Refresh Button */}
      <div
        className={`absolute top-[calc(1.5rem+env(safe-area-inset-top))] right-4 md:right-8 z-30 pointer-events-none transition-opacity duration-1000 ${isExplored ? "opacity-100" : "opacity-0"}`}
      >
        <button
          onClick={async () => {
            if (isRefreshing) return;
            setIsRefreshing(true);
            await refreshGallery();
            setTimeout(() => setIsRefreshing(false), 2000);
          }}
          className={`text-white/40 hover:text-white/80 transition-colors p-2 cursor-pointer ${isExplored ? "pointer-events-auto" : "pointer-events-none"}`}
          title="Refresh Gallery"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`${isRefreshing ? "animate-spin animate-pulse opacity-100" : ""}`}
          >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </button>
      </div>

      {/* Footer Layer */}
      <div className="absolute bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-0 w-full text-center z-20 pointer-events-none">
        <p
          suppressHydrationWarning
          className="text-white/40 text-xs md:text-sm font-medium font-spartan tracking-widest"
        >
          © {new Date().getFullYear()} Richie Lagito.
        </p>
      </div>
    </div>
  );
}
