"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

gsap.registerPlugin(ScrollTrigger);

const SERVICES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="3" y="5" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 23h10M14 21v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 10l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Web Engineering",
    desc: "Full-stack applications built on Next.js, React, and modern backend stacks. Performance-first, SEO-optimized, and built to scale.",
    tags: ["Next.js", "TypeScript", "Node.js", "PostgreSQL"],
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="9" y="2" width="10" height="24" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="14" cy="22" r="1" fill="currentColor" />
        <path d="M11 5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Mobile Development",
    desc: "Cross-platform mobile apps with React Native that feel native on both iOS and Android. Smooth, fast, and polished.",
    tags: ["React Native", "Expo", "iOS", "Android"],
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 4v3M14 21v3M4 14h3M21 14h3M6.93 6.93l2.12 2.12M18.95 18.95l2.12 2.12M6.93 21.07l2.12-2.12M18.95 9.05l2.12-2.12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "AI & LLM Integration",
    desc: "Ship AI-powered features fast — RAG pipelines, LLM-backed UIs, agentic workflows, and intelligent automations.",
    tags: ["OpenAI", "Claude", "LangChain", "Vector DBs"],
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 4L4 9l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M4 14l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 19l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Product Design",
    desc: "Design systems, UI/UX, and brand identity that converts. We bridge the gap between beautiful and functional.",
    tags: ["Figma", "Design Systems", "UX Research", "Prototyping"],
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M5 9h18M5 14h10M5 19h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="21" cy="17" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M19 17l1.5 1.5L23 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Quality Engineering",
    desc: "End-to-end testing, CI/CD pipelines, and code reviews. Ship with confidence — every release, every time.",
    tags: ["Jest", "Playwright", "GitHub Actions", "Docker"],
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 4C8.48 4 4 8.48 4 14s4.48 10 10 10 10-4.48 10-10S19.52 4 14 4z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 14h20M14 4c-2.67 3.33-4 6.67-4 10s1.33 6.67 4 10M14 4c2.67 3.33 4 6.67 4 10s-1.33 6.67-4 10" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    title: "Cloud & DevOps",
    desc: "Infrastructure as code, serverless deployments, and scalable architecture on AWS, Vercel, and GCP.",
    tags: ["AWS", "Vercel", "Terraform", "Kubernetes"],
  },
];

export default function Services() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".service-header", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".service-header",
          start: "top 85%",
        },
      });

      gsap.from(".service-card", {
        y: 60,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: ".services-grid",
          start: "top 80%",
        },
      });
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} id="services" className="py-32 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <div className="service-header text-center mb-16">
          <p className="text-brand-400 text-sm font-semibold tracking-widest uppercase mb-4">
            What we do
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-5">
            Everything you need to{" "}
            <span className="gradient-text">ship great software</span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            From idea to production, we handle the full lifecycle with a senior
            team that cares about quality.
          </p>
        </div>

        <div className="services-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="service-card group p-6 rounded-2xl border border-white/8 bg-white/3 card-glow cursor-default"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-600/20 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-5 group-hover:bg-brand-600/30 group-hover:border-brand-500/40 transition-colors duration-300">
                {s.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-5">{s.desc}</p>
              <div className="flex flex-wrap gap-2">
                {s.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-md bg-brand-950/50 border border-brand-800/40 text-brand-300 text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
