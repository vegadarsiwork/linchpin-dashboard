"use client";

import { useRef, useState, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

const NAV_LINKS = [
  { label: "Work", href: "#work" },
  { label: "Packages", href: "#pricing" },
  { label: "Why Us", href: "#usps" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQs", href: "#faqs" },
];

export default function Navbar() {
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useGSAP(
    () => {
      gsap.from(".nav-item", {
        y: -16,
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.06,
        delay: 0.3,
      });
    },
    { scope: navRef }
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      ref={navRef}
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl rounded-2xl border transition-all duration-300 ${
        scrolled
          ? "bg-[#1a0a2e]/80 border-[#7c3cff]/20 shadow-2xl shadow-black/40 backdrop-blur-2xl"
          : "bg-[#260f26]/50 border-white/[0.07] shadow-xl shadow-black/20 backdrop-blur-xl"
      }`}
    >
      <div className="px-5 h-[60px] flex items-center justify-between">
        <a href="#" className="nav-item flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#7c3cff] flex items-center justify-center text-white font-black text-sm">
            L
          </div>
          <span className="font-bold text-white tracking-tight">Linchpin Studio</span>
        </a>

        <div className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="nav-item text-sm text-white/45 hover:text-white transition-colors duration-200 font-medium"
            >
              {l.label}
            </a>
          ))}
        </div>

        <a
          href="#contact"
          className="nav-item hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#7c3cff] hover:bg-[#9d6fff] text-white text-sm font-bold transition-colors duration-200 btn-glow"
        >
          Get a Quote
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>

        <button
          className="md:hidden text-white/60 hover:text-white transition-colors"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            {open ? (
              <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            ) : (
              <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/[0.06] px-5 py-5 flex flex-col gap-4">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-white/60 hover:text-white text-base transition-colors font-medium"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#contact"
            className="mt-2 px-5 py-3 rounded-lg bg-[#7c3cff] text-white text-sm font-bold text-center"
            onClick={() => setOpen(false)}
          >
            Get a Quote
          </a>
        </div>
      )}
    </nav>
  );
}
