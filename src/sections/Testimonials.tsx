"use client"

import React, { useState } from "react";
import AshwinSantiago from "@/assets/images/ashwin-santiago.jpg";
import AlecWhitten from "@/assets/images/alec-whitten.jpg";
import ReneWells from "@/assets/images/rene-wells.jpg";
import MollieHall from "@/assets/images/mollie-hall.jpg";
import SectionBorder from "@/components/SectionBorder";
import SectionContent from "@/components/SectionContent";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

export const testimonials = [
  {
    quote:
      "Friends AI isn't just an app — it's my go-to when life gets tough. The conversations feel like they come straight from the heart. It's like having your own personal cheerleader saying, 'Tu kar lega yaar!' A genuine game-changer.",
    name: "Ashwin Santiago",
    title: "Operations Manager",
    image: AshwinSantiago,
  },
  {
    quote:
      "Friends AI is the ultimate hype friend. I told it I was excited about my upcoming project, and its response had me even more pumped up. It literally feels like having a friend jumping with joy beside you. What a vibe booster.",
    name: "Alec Whitten",
    title: "Lead Developer",
    image: AlecWhitten,
  },
  {
    quote:
      "I asked Friends AI for advice, and what I got back was so thoughtful I couldn't believe it wasn't a real person. It's like brainstorming with a friend who always has fresh ideas and the right words to inspire you.",
    name: "Rene Wells",
    title: "Customer Success Manager",
    image: ReneWells,
  },
  {
    quote:
      "Friends AI isn't just a product — it's a lifeline. It has this ability to make you feel seen and understood. Whether you need a motivator, a listener, or just a friend, it's always one tap away.",
    name: "Mollie Hall",
    title: "Product Designer",
    image: MollieHall,
  },
];

export const Testimonials = () => {
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const next = () => setTestimonialIndex((p) => (p + 1) % testimonials.length);
  const prev = () => setTestimonialIndex((p) => (p - 1 + testimonials.length) % testimonials.length);

  return (
    <section id="testimonials" className="relative overflow-hidden">
      <div className="container relative z-10">
        <SectionBorder borderTop>
          <SectionContent>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-5"
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400/90 text-xs font-medium tracking-widest uppercase">
                Testimonials
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="text-3xl md:text-4xl lg:text-5xl font-semibold text-center text-stone-100 tracking-tight"
            >
              What our users say
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="mt-4 text-stone-500 text-sm text-center max-w-md mx-auto"
            >
              Real stories from real people who found their AI companion
            </motion.p>

            <div className="max-w-3xl mx-auto mt-14">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="relative bg-stone-900/60 backdrop-blur-xl border border-stone-800/60 rounded-2xl p-8 md:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.3)]"
              >
                {/* Quote icon */}
                <div className="absolute -top-4 left-8">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-[0_4px_16px_rgba(245,158,11,0.3)]">
                    <Quote className="w-4 h-4 text-stone-950" fill="currentColor" />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={testimonialIndex}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.28 }}
                  >
                    <p className="text-base md:text-lg text-stone-300 leading-relaxed italic pt-2">
                      &ldquo;{testimonials[testimonialIndex].quote}&rdquo;
                    </p>

                    <div className="mt-7 flex items-center gap-4">
                      <Image
                        className="rounded-full w-11 h-11 object-cover ring-2 ring-stone-700"
                        src={testimonials[testimonialIndex].image}
                        alt={testimonials[testimonialIndex].name}
                      />
                      <div>
                        <div className="font-semibold text-stone-200 text-sm">
                          {testimonials[testimonialIndex].name}
                        </div>
                        <div className="text-xs text-stone-500 mt-0.5">
                          {testimonials[testimonialIndex].title}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-stone-800/60">
                  <div className="flex gap-1.5">
                    {testimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setTestimonialIndex(index)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          testimonialIndex === index
                            ? "bg-amber-500 w-6"
                            : "bg-stone-700 hover:bg-stone-600 w-1.5"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={prev}
                      className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700/50 flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-stone-400" />
                    </button>
                    <button
                      onClick={next}
                      className="w-9 h-9 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-amber-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </SectionContent>
        </SectionBorder>
      </div>
    </section>
  );
};

export default Testimonials;
