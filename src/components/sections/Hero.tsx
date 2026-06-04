"use client";

import { useRef, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";
import MagneticButton from "@/components/ui/MagneticButton";

gsap.registerPlugin(ScrollTrigger, SplitText);

const STATS = [
  { value: 500,  suffix: "+",  label: "Videos delivered"  },
  { value: 80,   suffix: "+",  label: "Brands served"      },
  { value: 3.2,  suffix: "M+", label: "Views generated", decimal: true },
  { value: 48,   suffix: "hr", label: "Avg turnaround"    },
];

export default function Hero() {
  const containerRef  = useRef<HTMLDivElement>(null);
  const line1Ref      = useRef<HTMLSpanElement>(null);  // "We Make Your Brand"
  const line2Ref      = useRef<HTMLSpanElement>(null);  // "to Ignore."
  const blob1Ref      = useRef<HTMLDivElement>(null);
  const blob2Ref      = useRef<HTMLDivElement>(null);

  /* ── Mouse parallax ── */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const xPct = (e.clientX / window.innerWidth  - 0.5) * 30;
      const yPct = (e.clientY / window.innerHeight - 0.5) * 30;
      gsap.to(blob1Ref.current, { x:  xPct, y:  yPct, duration: 2,   ease: "power2.out" });
      gsap.to(blob2Ref.current, { x: -xPct, y: -yPct, duration: 2.5, ease: "power2.out" });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useGSAP(
    () => {
      /* ── SplitText on non-gradient lines only ── */
      const split1 = new SplitText(line1Ref.current, { type: "chars" });
      const split2 = new SplitText(line2Ref.current, { type: "chars" });

      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      // 1. Eyebrow
      tl.from(".hero-eyebrow", { y: 20, opacity: 0, duration: 0.5 })

      // 2. Line 1 chars stagger in
        .from(
          split1.chars,
          {
            y: 70,
            opacity: 0,
            rotationX: -80,
            stagger: 0.016,
            duration: 0.65,
            ease: "back.out(1.3)",
            transformOrigin: "0% 50% -40",
          },
          "-=0.15"
        )

      // 3. "Impossible" — gradient word, clip-path wipe from left
        .fromTo(
          ".hero-impossible",
          { clipPath: "inset(0 100% 0 0)", opacity: 1 },
          { clipPath: "inset(0 0% 0 0)",   duration: 0.75, ease: "power3.inOut" },
          "-=0.1"
        )

      // 4. Line 2 chars stagger in
        .from(
          split2.chars,
          {
            y: 70,
            opacity: 0,
            rotationX: -80,
            stagger: 0.016,
            duration: 0.65,
            ease: "back.out(1.3)",
            transformOrigin: "0% 50% -40",
          },
          "-=0.35"
        )

      // 5. Sub + CTAs + stats
        .from(".hero-sub",  { y: 20, opacity: 0, duration: 0.6 }, "-=0.3")
        .from(".hero-ctas", { y: 20, opacity: 0, duration: 0.5 }, "-=0.35")
        .from(".stat-item", { y: 15, opacity: 0, duration: 0.45, stagger: 0.09 }, "-=0.3");

      /* ── Counter animation ── */
      STATS.forEach((stat, i) => {
        const numEl = document.querySelector<HTMLElement>(`.stat-num-${i}`);
        if (!numEl) return;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: stat.value,
          duration: 2,
          ease: "power2.out",
          delay: 1.5 + i * 0.12,
          onUpdate() {
            numEl.textContent =
              (stat.decimal ? obj.val.toFixed(1) : Math.round(obj.val)) + stat.suffix;
          },
        });
      });

      /* ── Idle blob float ── */
      gsap.to(blob1Ref.current, {
        y: -25, x: 15, duration: 7, repeat: -1, yoyo: true, ease: "sine.inOut",
      });
      gsap.to(blob2Ref.current, {
        y: 20, x: -20, duration: 9, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 2,
      });

      return () => {
        split1.revert();
        split2.revert();
      };
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col justify-center pt-28 pb-20 px-6 overflow-hidden grid-bg"
    >
      {/* Blobs */}
      <div
        ref={blob1Ref}
        className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, #7c3cff 0%, transparent 65%)", opacity: 0.13 }}
      />
      <div
        ref={blob2Ref}
        className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, #c084fc 0%, transparent 65%)", opacity: 0.09 }}
      />

      {/* Floating accent dots */}
      <div className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full bg-[#7c3cff] opacity-40 animate-pulse" />
      <div className="absolute bottom-1/3 left-1/4 w-1.5 h-1.5 rounded-full bg-[#c084fc] opacity-30 animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-2/3 right-1/3 w-1 h-1 rounded-full bg-[#7c3cff] opacity-25 animate-pulse" style={{ animationDelay: "2s" }} />

      <div className="relative z-10 max-w-5xl mx-auto w-full">

        {/* Eyebrow */}
        <div className="hero-eyebrow inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#7c3cff]/40 bg-[#7c3cff]/10 text-[#c084fc] text-xs font-bold tracking-widest uppercase mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7c3cff] animate-pulse" />
          Digital Marketing · Video Production · Content Strategy
        </div>

        {/* Headline — split into 3 parts so gradient word is isolated */}
        <h1
          className="font-display text-[clamp(42px,7vw,88px)] font-black leading-[1.0] tracking-tight mb-7"
          style={{ perspective: "600px" }}
        >
          {/* Line 1 — SplitText chars */}
          <span ref={line1Ref} className="block">
            We Make Your Brand
          </span>

          {/* Gradient word — animated separately with clip-path, NOT touched by SplitText */}
          <span
            className="hero-impossible gradient-text italic block"
            style={{ clipPath: "inset(0 100% 0 0)" }}
          >
            Impossible
          </span>

          {/* Line 2 — SplitText chars */}
          <span ref={line2Ref} className="block">
            to Ignore.
          </span>
        </h1>

        {/* Sub */}
        <p className="hero-sub font-body text-lg md:text-xl text-white/45 max-w-2xl mb-10 leading-relaxed">
          Short-form videos, brand reels, social ads, and content strategy — crafted
          to stop the scroll and drive real results. For brands who mean business.
        </p>

        {/* CTAs */}
        <div className="hero-ctas flex flex-col sm:flex-row gap-4 mb-20">
          <MagneticButton
            href="#work"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-[#7c3cff] hover:bg-[#9d6fff] text-white font-bold text-base transition-colors duration-200 btn-glow cursor-pointer"
          >
            See Our Work
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </MagneticButton>

          <MagneticButton
            href="#pricing"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl border border-white/12 hover:border-[#7c3cff]/50 bg-white/4 hover:bg-[#7c3cff]/10 text-white/75 hover:text-white font-semibold text-base transition-all duration-200 cursor-pointer"
          >
            View Packages
          </MagneticButton>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-10">
          {STATS.map((s, i) => (
            <div key={s.label} className="stat-item">
              <p className={`stat-num-${i} text-3xl md:text-4xl font-black font-display gradient-text`}>
                0{s.suffix}
              </p>
              <p className="text-white/30 text-xs mt-0.5 font-medium tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-25">
        <span className="text-[10px] tracking-widest uppercase text-white/50">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-[#7c3cff] to-transparent" />
      </div>
    </section>
  );
}
