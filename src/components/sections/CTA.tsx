"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import MagneticButton from "@/components/ui/MagneticButton";

gsap.registerPlugin(ScrollTrigger);

export default function CTA() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".cta-inner > *", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: ".cta-inner", start: "top 80%" },
      });
      gsap.to(".cta-blob", {
        scale: 1.2,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} id="contact" className="py-32 px-6 relative overflow-hidden">
      <div
        className="cta-blob absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-[0.1] pointer-events-none"
        style={{ background: "radial-gradient(circle, #7c3cff 0%, transparent 60%)" }}
      />

      <div className="cta-inner relative z-10 max-w-3xl mx-auto text-center">
        <span className="section-label justify-center">Let&apos;s Work Together</span>
        <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-black leading-[1.02] mb-6 tracking-tight">
          Ready to make{" "}
          <br />
          <span className="gradient-text">content that hits?</span>
        </h2>
        <p className="text-white/45 text-lg mb-10 max-w-lg mx-auto">
          Book a free 20-minute strategy call. We&apos;ll audit your current
          content, understand your goals, and tell you exactly how we can help.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <MagneticButton
            href="mailto:info@linchpinsoftsolution.com"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-[#7c3cff] hover:bg-[#9d6fff] text-white font-bold text-base transition-all duration-200 btn-glow cursor-pointer"
          >
            Book a Free Call
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </MagneticButton>
          <a
            href="mailto:info@linchpinsoftsolution.com"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl border border-[#404e7c]/50 hover:border-[#7c3cff]/40 text-white/60 hover:text-white font-semibold text-base transition-all duration-200"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 5l6 4 6-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            info@linchpinsoftsolution.com
          </a>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-white/20 text-xs font-medium">
          {["No commitment required", "Response within 2 hours", "Free content audit included"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="#c084fc">
                <path d="M6 1L7.3 4.3H11L8.2 6.3l1 3.3L6 7.6 2.8 9.6l1-3.3L1 4.3h3.7L6 1z" />
              </svg>
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
