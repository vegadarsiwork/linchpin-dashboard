"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

gsap.registerPlugin(ScrollTrigger);

const FAQS = [
  {
    q: "How fast do you deliver videos?",
    a: "Our standard turnaround is 48 hours for short-form videos (under 60 seconds). Brand films and longer formats take 5–7 business days. Growth and Premium clients get priority queuing.",
  },
  {
    q: "Do you handle scripting and ideation too?",
    a: "Yes — entirely. You can share a brief, a raw idea, or just a product link. We handle research, scripting, storyboarding, production, and editing. You just review and approve.",
  },
  {
    q: "What platforms do you optimise for?",
    a: "Instagram Reels, YouTube Shorts, TikTok, LinkedIn, and Facebook. Each video is exported in the right aspect ratio, caption style, and hook format for the platform's algorithm.",
  },
  {
    q: "Do I need to provide raw footage?",
    a: "Not necessarily. We work both ways — if you have footage, we can edit it. If you don't, we can source stock footage, create motion graphics, or arrange a shoot depending on your plan.",
  },
  {
    q: "What does 'unlimited revisions' actually mean?",
    a: "It means exactly that. We iterate until you're happy — no cap on revision rounds, no extra charge. In practice, most clients are satisfied within 2–3 rounds.",
  },
  {
    q: "Can I pause or cancel my subscription?",
    a: "Yes. Monthly plans can be cancelled anytime before the next billing cycle. Quarterly plans can be paused once per quarter. No questions, no penalties.",
  },
  {
    q: "Is there a minimum commitment?",
    a: "Monthly plans have no commitment — pay month to month. Quarterly plans lock in for 3 months but save you 15% on the total.",
  },
  {
    q: "How do I share feedback and track progress?",
    a: "We use Frame.io for all video reviews — you can timestamp comments directly on the video. You'll also get a dedicated Slack/WhatsApp channel with your account manager.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#404e7c]/30">
      <button
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={`font-semibold text-sm md:text-base transition-colors duration-200 ${open ? "text-[#c084fc]" : "text-white/75 group-hover:text-white"}`}>
          {q}
        </span>
        <span className={`flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-300 ${open ? "bg-[#7c3cff] border-[#7c3cff] rotate-45" : "border-[#404e7c]/60 text-white/35"}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      <div className={`faq-answer ${open ? "open" : ""}`}>
        <p className="text-white/45 text-sm leading-relaxed pb-5">{a}</p>
      </div>
    </div>
  );
}

export default function FAQs() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".faqs-header", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: ".faqs-header", start: "top 85%" },
      });
      gsap.from(".faq-list", {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: ".faq-list", start: "top 82%" },
      });
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} id="faqs" className="py-32 px-6 bg-[#251f47]/30">
      <div className="max-w-3xl mx-auto">
        <div className="faqs-header text-center mb-14">
          <span className="section-label">FAQs</span>
          <h2 className="font-display text-4xl md:text-5xl font-black mb-4">
            Questions?{" "}
            <span className="gradient-text">We got you.</span>
          </h2>
          <p className="text-white/45 text-lg">
            Everything you need to know before working with us.
          </p>
        </div>

        <div className="faq-list">
          {FAQS.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>

        <p className="text-center text-white/25 text-sm mt-10">
          Still have questions?{" "}
          <a href="mailto:info@linchpinsoftsolution.com" className="text-[#c084fc] hover:underline">
            Drop us a message
          </a>
        </p>
      </div>
    </section>
  );
}
