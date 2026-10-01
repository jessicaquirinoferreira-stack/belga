import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface CinematicIntroProps {
  onComplete: () => void;
  logoUrl: string;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({
  onComplete,
  logoUrl,
}) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'opening' | 'radiance' | 'slogan' | 'exit'>('opening');

  useEffect(() => {
    const startTime = Date.now();
    const duration = 6000; // 6 seconds duration

    // Timeline phases
    const t1 = setTimeout(() => setPhase('radiance'), 700);
    const t2 = setTimeout(() => setPhase('slogan'), 2200);
    const t3 = setTimeout(() => setPhase('exit'), 5300);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(interval);
        onComplete();
      }
    }, 20);

    return () => {
      clearInterval(interval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070b14] text-white overflow-hidden transition-opacity duration-700 select-none ${
        phase === 'exit' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Dynamic Cosmic & Volumetric Lighting Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Deep ambient golden-orange radial glow behind the logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[950px] h-[700px] sm:h-[950px] rounded-full bg-gradient-to-tr from-amber-500/25 via-orange-600/30 to-blue-600/20 blur-[120px] animate-pulse [animation-duration:3s]" />
        
        {/* Core focal light beam */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] rounded-full bg-amber-400/25 blur-[70px]" />

        {/* Anamorphic horizontal optical flare streak */}
        <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-amber-300 to-transparent -translate-y-1/2 shadow-[0_0_25px_rgba(251,191,36,0.9)] animate-optical-pulse" />

        {/* Rotating subtle ray fan */}
        <div className="absolute top-1/2 left-1/2 w-[1100px] h-[1100px] opacity-20 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(245,158,11,0.6)_0deg,transparent_45deg,rgba(59,130,246,0.6)_90deg,transparent_135deg,rgba(245,158,11,0.6)_180deg,transparent_225deg,rgba(59,130,246,0.6)_270deg,transparent_315deg)] animate-ray-rotate" />

        {/* Micro-particle dust background */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff20_1px,transparent_1px)] [background-size:28px_28px] opacity-50" />
      </div>

      {/* Skip Button */}
      <button
        onClick={onComplete}
        className="absolute top-6 right-6 z-30 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center gap-2 border border-white/15 shadow-xl cursor-pointer"
        aria-label="Pular Introdução"
      >
        <span>Pular Intro</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      {/* Main Cinematic Visual Center */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center max-w-2xl mx-auto">
        
        {/* FREE, BIG, UNCONSTRAINED LOGO */}
        <div className="relative flex items-center justify-center mb-6">
          {/* Energy halo */}
          <div
            className={`absolute inset-0 rounded-full bg-amber-500/35 blur-[60px] transition-all duration-700 ${
              phase === 'opening' ? 'scale-75 opacity-60' : 'scale-125 opacity-90'
            }`}
          />

          {/* FREE LOGO: Rapid entrance, big scale, floating effect */}
          <div className="relative animate-logo-float">
            <img
              src={logoUrl}
              alt="Belga Móveis"
              loading="eager"
              className={`w-72 h-72 sm:w-88 sm:h-88 md:w-[420px] md:h-[420px] object-contain transition-all duration-700 ease-out ${
                phase === 'opening'
                  ? 'scale-90 opacity-90 brightness-125'
                  : 'scale-100 opacity-100 brightness-110'
              }`}
              style={{
                filter: 'drop-shadow(0 0 35px rgba(245, 158, 11, 0.65)) drop-shadow(0 15px 30px rgba(0,0,0,0.8))',
              }}
            />

            {/* Shimmer light sweep sheen traveling across the logo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none mix-blend-overlay">
              <div className="w-[180%] h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer-sweep" />
            </div>
          </div>
        </div>

        {/* Cinematic Title & Slogan Section */}
        <div className="space-y-3">
          {/* Brand Name Typography */}
          <div
            className={`transition-all duration-700 transform ${
              phase === 'opening'
                ? 'opacity-0 translate-y-4 scale-95'
                : 'opacity-100 translate-y-0 scale-100'
            }`}
          >
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white font-sans flex items-center justify-center gap-3">
              <span className="text-white drop-shadow-[0_2px_16px_rgba(255,255,255,0.4)]">
                BELGA
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-blue-500 drop-shadow-[0_2px_20px_rgba(56,189,248,0.5)]">
                MÓVEIS
              </span>
            </h1>
          </div>

          {/* Slogan Reveal */}
          <div
            className={`transition-all duration-700 delay-150 transform ${
              phase === 'slogan' || phase === 'exit'
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-4 scale-95'
            }`}
          >
            <p className="text-base sm:text-lg md:text-xl font-black uppercase tracking-[0.28em] text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200 drop-shadow-[0_2px_12px_rgba(245,158,11,0.5)]">
              "Seu lar mais completo!"
            </p>
            
            <div className="flex items-center justify-center gap-2.5 mt-3 text-xs sm:text-sm text-slate-300 font-semibold">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin [animation-duration:6s]" />
              <span>Colchões Queen • Crediário Digital • Móveis</span>
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin [animation-duration:6s]" />
            </div>
          </div>
        </div>
      </div>

      {/* 6-Second Cinematic Progress Bar */}
      <div className="absolute bottom-0 inset-x-0 h-1.5 bg-slate-900/90">
        <div
          className="h-full bg-gradient-to-r from-orange-600 via-amber-400 to-blue-500 shadow-[0_0_12px_rgba(245,158,11,0.8)] transition-all ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Micro indicator */}
      <div className="absolute bottom-4 left-6 text-[11px] text-slate-400 font-mono tracking-widest flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <span>ENTRANDO • {Math.min(6, Math.max(1, Math.ceil((progress / 100) * 6)))}s / 6s</span>
      </div>
    </div>
  );
};
