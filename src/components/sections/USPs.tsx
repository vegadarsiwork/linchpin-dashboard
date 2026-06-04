"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

gsap.registerPlugin(ScrollTrigger);

const USPS = [
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <path d="M13 3v4M13 19v4M3 13h4M19 13h4M5.93 5.93l2.83 2.83M17.24 17.24l2.83 2.83M5.93 20.07l2.83-2.83M17.24 8.76l2.83-2.83" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    title: "48-Hour Delivery",
    desc: "We ship fast without cutting corners. Most projects are delivered in 48 hours — guaranteed.",
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <circle cx="13" cy="13" r="10" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M13 8v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    title: "Unlimited Revisions",
    desc: "We don't stop until you love it. Revisions are included — no extra charges, no arguments.",
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <rect x="4" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M10 10l4 3-4 3V10z" fill="currentColor"/>
      </svg>
    ),
    title: "Studio-Grade Quality",
    desc: "Professional colour grading, sound design, and motion graphics on every single video we produce.",
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <path d="M5 13h16M13 5l8 8-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Multi-Platform Ready",
    desc: "Reels, Shorts, TikToks, LinkedIn, YouTube — every video is optimised for each platform's algorithm.",
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <path d="M13 3L4 8v5c0 5.25 3.84 10.15 9 11.33C18.16 23.15 22 18.25 22 13V8L13 3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M9 13l2.5 2.5L17 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Data-Driven Creative",
    desc: "We research what performs in your niche and reverse-engineer winning hooks, formats, and CTAs.",
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="10" cy="11" r="4" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M17 7.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    title: "Dedicated Team",
    desc: "You get your own editor, strategist, and account manager — not a random freelancer each time.",
  },
];

export default function USPs() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".usps-header", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: ".usps-header", start: "top 85%" },
      });
      gsap.from(".usp-card", {
        y: 50,
        opacity: 0,
        duration: 0.65,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: ".usps-grid", start: "top 80%" },
      });
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} id="usps" className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="usps-header text-center mb-14">
          <span className="section-label">Why Linchpin</span>
          <h2 className="font-display text-4xl md:text-5xl font-black mb-4 leading-tight">
            Built different,{" "}
            <span className="gradient-text">for a reason</span>
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto">
            We&apos;ve worked with enough brands to know exactly what separates
            content that converts from content that gets ignored.
          </p>
        </div>

        <div className="usps-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {USPS.map((u) => (
            <div
              key={u.title}
              className="usp-card group p-6 rounded-2xl border border-[#404e7c]/35 bg-[#251f47]/50 transition-all duration-300 cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-[#7c3cff]/12 border border-[#7c3cff]/25 flex items-center justify-center text-[#c084fc] mb-4 group-hover:bg-[#7c3cff]/22 transition-colors duration-300">
                {u.icon}
              </div>
              <h3 className="text-base font-bold text-white mb-2">{u.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{u.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
