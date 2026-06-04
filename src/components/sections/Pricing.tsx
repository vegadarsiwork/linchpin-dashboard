"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

gsap.registerPlugin(ScrollTrigger);

const PLANS = [
  {
    name: "Starter",
    tagline: "For growing brands",
    monthly: 29999,
    quarterly: 24999,
    features: [
      "4 short-form videos / month",
      "Up to 60-sec reels",
      "Basic motion graphics",
      "2 revision rounds",
      "7-day delivery",
      "1 platform format",
    ],
    cta: "Get Started",
    featured: false,
  },
  {
    name: "Growth",
    tagline: "Most popular",
    monthly: 59999,
    quarterly: 49999,
    features: [
      "10 short-form videos / month",
      "Up to 3-min brand films",
      "Advanced motion & colour grade",
      "Unlimited revisions",
      "48-hr priority delivery",
      "3 platform formats",
      "Monthly content strategy call",
      "Dedicated editor",
    ],
    cta: "Start Growing",
    featured: true,
  },
  {
    name: "Premium",
    tagline: "Full-service studio",
    monthly: 99999,
    quarterly: 84999,
    features: [
      "20+ videos / month",
      "Full-length brand films",
      "Custom animated intros/outros",
      "Unlimited revisions",
      "24-hr turnaround",
      "All platform formats",
      "Weekly strategy sessions",
      "Dedicated account manager",
      "Monthly analytics report",
    ],
    cta: "Go Premium",
    featured: false,
  },
];

function formatPrice(n: number) {
  return `₹${(n / 1000).toFixed(0)}K`;
}

export default function Pricing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [billing, setBilling] = useState<"monthly" | "quarterly">("monthly");

  useGSAP(
    () => {
      gsap.from(".pricing-header", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: ".pricing-header", start: "top 85%" },
      });
      gsap.from(".plan-card", {
        y: 60,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: { trigger: ".plans-grid", start: "top 80%" },
      });
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} id="pricing" className="py-32 px-6 bg-[#251f47]/30">
      <div className="max-w-6xl mx-auto">
        <div className="pricing-header text-center mb-14">
          <span className="section-label">Packages</span>
          <h2 className="font-display text-4xl md:text-5xl font-black mb-4 leading-tight">
            Simple, transparent{" "}
            <span className="gradient-text">pricing</span>
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto mb-8">
            No hidden costs. No long contracts. Cancel anytime.
          </p>

          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#251f47] border border-[#404e7c]/40">
            {(["monthly", "quarterly"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 capitalize ${
                  billing === b
                    ? "bg-[#7c3cff] text-white"
                    : "text-white/40 hover:text-white"
                }`}
              >
                {b}
                {b === "quarterly" && (
                  <span className="ml-1.5 text-[10px] bg-[#c084fc]/20 text-[#c084fc] px-1.5 py-0.5 rounded font-bold">
                    Save 15%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="plans-grid grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`plan-card relative p-7 rounded-2xl border bg-[#251f47] ${
                plan.featured
                  ? "featured border-[#7c3cff]/60 md:-mt-4"
                  : "border-[#404e7c]/40"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#7c3cff] text-white text-xs font-bold tracking-wide">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <p className="text-white/35 text-xs font-bold uppercase tracking-widest mb-1">
                  {plan.tagline}
                </p>
                <h3 className="text-2xl font-black text-white mb-4">{plan.name}</h3>
                <div className="flex items-end gap-1.5">
                  <span className="text-4xl font-black text-white">
                    {formatPrice(billing === "monthly" ? plan.monthly : plan.quarterly)}
                  </span>
                  <span className="text-white/30 text-sm mb-1.5">/mo</span>
                </div>
                {billing === "quarterly" && (
                  <p className="text-white/25 text-xs mt-1">
                    Billed quarterly · Save{" "}
                    <span className="text-[#c084fc] font-semibold">
                      {formatPrice(plan.monthly - plan.quarterly)}/mo
                    </span>
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white/60">
                    <svg className="flex-shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <circle cx="7.5" cy="7.5" r="7" fill="#7c3cff" fillOpacity="0.18" />
                      <path d="M4.5 7.5l2 2 4-4" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                className={`block w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                  plan.featured
                    ? "bg-[#7c3cff] hover:bg-[#9d6fff] text-white btn-glow"
                    : "border border-[#404e7c]/60 hover:border-[#7c3cff]/50 text-white/60 hover:text-white hover:bg-[#7c3cff]/10"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-white/20 text-sm mt-10">
          Need something custom?{" "}
          <a href="#contact" className="text-[#c084fc] hover:underline">
            Let&apos;s talk
          </a>
        </p>
      </div>
    </section>
  );
}
