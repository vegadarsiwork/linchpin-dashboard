"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

gsap.registerPlugin(ScrollTrigger);

const BRANDS = [
  "Zomato", "Swiggy", "Meesho", "CRED", "Razorpay", "Nykaa",
  "PhonePe", "Zepto", "Blinkit", "boAt", "Mamaearth", "Sugar",
  "Wow Skin", "Lenskart", "Cars24", "Urban Company",
];

function BrandLogo({ name }: { name: string }) {
  return (
    <div className="flex-shrink-0 flex items-center justify-center px-8 py-4 mx-4 rounded-xl border border-[#404e7c]/40 bg-[#251f47]/50 h-[52px] min-w-[140px]">
      <span className="text-white/35 font-semibold text-sm tracking-wide whitespace-nowrap">{name}</span>
    </div>
  );
}

export default function Clients() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".clients-header", {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: ".clients-header", start: "top 88%" },
      });
      gsap.from(".marquee-wrap", {
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: ".marquee-wrap", start: "top 88%" },
      });
    },
    { scope: containerRef }
  );

  const doubled = [...BRANDS, ...BRANDS];

  return (
    <section ref={containerRef} className="py-20 border-y border-[#404e7c]/30 bg-[#251f47]/40 overflow-hidden">
      <div className="clients-header text-center mb-10 px-6">
        <p className="text-white/25 text-xs font-bold tracking-widest uppercase">
          Brands we have worked with
        </p>
      </div>
      <div className="marquee-wrap overflow-hidden">
        <div className="marquee-track">
          {doubled.map((name, i) => (
            <BrandLogo key={`${name}-${i}`} name={name} />
          ))}
        </div>
      </div>
    </section>
  );
}
