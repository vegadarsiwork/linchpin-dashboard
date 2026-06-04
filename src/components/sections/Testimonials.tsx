"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

gsap.registerPlugin(ScrollTrigger);

const TESTIMONIALS = [
  {
    quote: "Our reels went from 2K to 400K views in three months. The team at Linchpin understood our brand voice from day one — rare to find that.",
    name: "Rohan Malhotra",
    role: "Founder, UrbanFit",
    initials: "RM",
    rating: 5,
  },
  {
    quote: "48-hour delivery isn't just a promise — they've never missed it. The quality per rupee is unbeatable. We've worked with 4 other agencies before.",
    name: "Sneha Kapoor",
    role: "Head of Marketing, Glow Republic",
    initials: "SK",
    rating: 5,
  },
  {
    quote: "They turned a simple product brief into a 2-minute brand film that our entire team is proud of. Genuinely cinematic quality at a startup price.",
    name: "Aditya Nair",
    role: "CMO, PureNest",
    initials: "AN",
    rating: 5,
  },
  {
    quote: "Content strategy + production in one team is a game changer. We stopped second-guessing what to post — Linchpin just handles it.",
    name: "Meera Joshi",
    role: "Brand Manager, Saffron Bites",
    initials: "MJ",
    rating: 5,
  },
  {
    quote: "Our conversion rate on ad creatives jumped 38% in the first month. I didn't expect ROI this quickly. Genuinely surprised.",
    name: "Arjun Singh",
    role: "Performance Lead, TechZap",
    initials: "AS",
    rating: 5,
  },
  {
    quote: "The unlimited revisions policy made us sceptical — but they genuinely stuck to it. Two tiny tweaks and it was perfect. No friction at all.",
    name: "Priya Mehta",
    role: "Founder, Velvet & Co",
    initials: "PM",
    rating: 5,
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 13 13" fill="#c084fc">
          <path d="M6.5 1l1.4 3.7H12l-3.3 2.4 1.2 3.7L6.5 8.5 3.1 10.8l1.2-3.7L1 4.7h4.1L6.5 1z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".testimonials-header", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: ".testimonials-header", start: "top 85%" },
      });
      gsap.from(".t-card", {
        y: 50,
        opacity: 0,
        duration: 0.65,
        ease: "power3.out",
        stagger: 0.09,
        scrollTrigger: { trigger: ".t-grid", start: "top 80%" },
      });
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} id="testimonials" className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="testimonials-header text-center mb-14">
          <span className="section-label">Testimonials</span>
          <h2 className="font-display text-4xl md:text-5xl font-black mb-4">
            Brands love us.{" "}
            <span className="gradient-text">Here&apos;s why.</span>
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto">
            Don&apos;t take our word for it — take theirs.
          </p>
        </div>

        <div className="t-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="t-card p-6 rounded-2xl border border-[#404e7c]/40 bg-[#251f47]/60 flex flex-col gap-4 hover:border-[#7c3cff]/30 transition-colors duration-300"
            >
              <Stars count={t.rating} />
              <p className="text-white/65 text-sm leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-3 border-t border-[#404e7c]/30">
                <div className="w-9 h-9 rounded-full bg-[#7c3cff]/20 border border-[#7c3cff]/30 flex items-center justify-center text-[#c084fc] text-xs font-black">
                  {t.initials}
                </div>
                <div>
                  <p className="text-white text-sm font-bold">{t.name}</p>
                  <p className="text-white/30 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
