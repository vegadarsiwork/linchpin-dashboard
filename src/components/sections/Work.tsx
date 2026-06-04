"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

gsap.registerPlugin(ScrollTrigger);

const REELS = [
  {
    id: "1",
    title: "boAt — Diwali Campaign",
    category: "Brand Reel",
    views: "1.2M views",
    duration: "0:45",
    accent: "#7c3cff",
    bg: "linear-gradient(135deg, #1a0a2e 0%, #260f26 100%)",
  },
  {
    id: "2",
    title: "Nykaa — Skincare Launch",
    category: "Product Showcase",
    views: "890K views",
    duration: "0:30",
    accent: "#ec4899",
    bg: "linear-gradient(135deg, #1a0a18 0%, #260f26 100%)",
  },
  {
    id: "3",
    title: "Zepto — App Promo",
    category: "Social Ad",
    views: "2.1M views",
    duration: "0:15",
    accent: "#22c55e",
    bg: "linear-gradient(135deg, #0a1a0e 0%, #260f26 100%)",
  },
  {
    id: "4",
    title: "CRED — Referral Campaign",
    category: "Performance Ad",
    views: "750K views",
    duration: "1:00",
    accent: "#c084fc",
    bg: "linear-gradient(135deg, #1a0a2e 0%, #251f47 100%)",
  },
  {
    id: "5",
    title: "Mamaearth — Founder Story",
    category: "Brand Film",
    views: "480K views",
    duration: "2:30",
    accent: "#f59e0b",
    bg: "linear-gradient(135deg, #1a1200 0%, #260f26 100%)",
  },
  {
    id: "6",
    title: "Urban Company — Testimonials",
    category: "Social Proof",
    views: "320K views",
    duration: "1:00",
    accent: "#06b6d4",
    bg: "linear-gradient(135deg, #001a1a 0%, #260f26 100%)",
  },
];

export default function Work() {
  const sectionRef  = useRef<HTMLDivElement>(null);
  const trackRef    = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const track   = trackRef.current;
      const section = sectionRef.current;
      if (!track || !section) return;

      const totalScroll = track.scrollWidth - window.innerWidth;

      /* Store the tween so we can kill(true) on cleanup.
         kill(true) removes the pin spacer that ScrollTrigger inserts into the
         real DOM — without this React's reconciler throws removeChild errors. */
      const hTween = gsap.to(track, {
        x: -totalScroll,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${totalScroll}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      gsap.from(".work-heading", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: section, start: "top 80%" },
      });

      gsap.utils.toArray<HTMLElement>(".reel-card").forEach((card, i) => {
        gsap.from(card, {
          opacity: 0,
          scale: 0.92,
          y: 30,
          duration: 0.7,
          ease: "power3.out",
          delay: i * 0.06,
          scrollTrigger: {
            trigger: section,
            start: "top 60%",
            toggleActions: "play none none none",
          },
        });
      });

      return () => {
        hTween.scrollTrigger?.kill(true);
      };
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef}>
      {/*
        sectionRef is the ScrollTrigger pin target.
        flex-col: header at top, cards fill remaining height.
        overflow-hidden clips the horizontal track overhang.
      */}
      <div
        ref={sectionRef}
        id="work"
        className="bg-[#251f47]/20"
        style={{
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header — visible at the top of the pinned viewport */}
        <div className="work-heading flex-shrink-0 px-6 pt-16 pb-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="section-label">Our Work</span>
              <h2 className="font-display text-4xl md:text-5xl font-black leading-tight">
                Content that{" "}
                <span className="gradient-text">actually performs</span>
              </h2>
            </div>
            <a
              href="#contact"
              className="flex-shrink-0 inline-flex items-center gap-2 text-sm text-white/40 hover:text-[#c084fc] transition-colors duration-200 font-semibold"
            >
              Want results like these?
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>

        {/* Cards area — flex:1 fills remaining height, centres the track vertically */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", alignItems: "center" }}>
          <div
            ref={trackRef}
            className="flex gap-5 items-center pl-6 pr-20 w-max"
          >
            {REELS.map((reel) => (
              <div
                key={reel.id}
                className="reel-card group relative flex-shrink-0 w-[340px] md:w-[380px] rounded-2xl overflow-hidden cursor-pointer"
                style={{ background: reel.bg }}
              >
                {/* Thumbnail */}
                <div className="relative w-full aspect-[9/14] flex items-center justify-center overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at center, ${reel.accent} 0%, transparent 70%)` }}
                  />
                  <div className="absolute inset-0 grid-bg opacity-20" />
                  <div
                    className="relative z-10 w-16 h-16 rounded-full border-2 bg-black/30 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ borderColor: `${reel.accent}60` }}
                  >
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="white" style={{ marginLeft: 3 }}>
                      <path d="M5 3l15 8-15 8V3z" />
                    </svg>
                  </div>
                  <div className="absolute top-4 right-4 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white/60 text-xs font-mono font-semibold">
                    {reel.duration}
                  </div>
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[3px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
                    style={{ background: reel.accent }}
                  />
                </div>

                {/* Info */}
                <div className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: reel.accent }}>
                    {reel.category}
                  </p>
                  <p className="text-white font-semibold text-base leading-snug mb-2">{reel.title}</p>
                  <p className="text-white/35 text-xs font-medium">{reel.views}</p>
                </div>
              </div>
            ))}

            {/* End CTA */}
            <div className="flex-shrink-0 w-[240px] flex flex-col items-center justify-center gap-4 px-8 text-center">
              <div className="w-14 h-14 rounded-full border border-[#7c3cff]/40 bg-[#7c3cff]/10 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M11 4v14M4 11h14" stroke="#c084fc" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">Want to see your brand here?</p>
              <a
                href="#contact"
                className="px-5 py-2.5 rounded-xl bg-[#7c3cff] hover:bg-[#9d6fff] text-white text-sm font-bold transition-colors duration-200 btn-glow"
              >
                Let&apos;s Talk
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
