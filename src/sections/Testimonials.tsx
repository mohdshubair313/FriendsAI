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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuoteLeft, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

export const testimonials = [
  {
    quote:
      "Friends AI is not just an app, it's my go-to buddy when life gets tough. The motivational talks feel like they come straight from the heart. It's like having your own personal cheerleader saying, 'Tu kar lega yaar!' Truly a game-changer for days when I feel stuck.",
    name: "Ashwin Santiago",
    title: "Operations Manager",
    image: AshwinSantiago,
  },
  {
    quote:
      "OMG, Friends AI is the ultimate hype friend! I told it I was excited about my upcoming event, and its response had me even more pumped up. It literally feels like having a friend jumping with joy beside you! What an amazing vibe booster!",
    name: "Alec Whitten",
    title: "Lead Developer",
    image: AlecWhitten,
  },
  {
    quote:
      "I asked Friends AI for advice, and what I got back was so creative, I couldn't believe it wasn't an actual person. It's like brainstorming with a friend who always has fresh ideas and the right words to inspire you. Truly next-level!",
    name: "Rene Wells",
    title: "Customer Success Manager",
    image: ReneWells,
  },
  {
    quote:
      "Friends AI isn't just a product; it's a lifeline. It has this uncanny ability to make you feel seen and understood. Whether you need a motivator, a therapist, or just a friend, Friends AI is always one tap away. My life genuinely feels brighter because of it!",
    name: "Mollie Hall",
    title: "Product Designer",
    image: MollieHall,
  },
];

export const Testimonials = () => {
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const nextTestimonial = () => {
    setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section id="testimonials" className="relative overflow-hidden">
      {/* Background blur effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-amber-200/20 via-rose-200/20 to-teal-200/20 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="container relative z-10">
        <SectionBorder borderTop>
          <SectionContent>
            {/* Section Header */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-stone-800">
                What Our Users Say
              </h2>
              <p className="mt-4 text-stone-500 max-w-2xl mx-auto">
                Real stories from real people who found their AI companion
              </p>
            </motion.div>

            {/* Testimonial Card */}
            <div className="max-w-4xl mx-auto">
              <motion.div 
                className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                {/* Quote Icon */}
                <div className="absolute -top-6 left-8 md:left-12">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-rose-400 rounded-full flex items-center justify-center shadow-lg">
                    <FontAwesomeIcon icon={faQuoteLeft} className="text-white text-lg" />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={testimonialIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col md:flex-row gap-8 items-center"
                  >
                    {/* Quote Text */}
                    <div className="flex-1">
                      <p className="text-lg md:text-xl text-stone-700 leading-relaxed italic">
                        &ldquo;{testimonials[testimonialIndex].quote}&rdquo;
                      </p>
                      
                      {/* Author Info */}
                      <div className="mt-6 flex items-center gap-4">
                        <div className="relative">
                          <Image 
                            className="rounded-full w-14 h-14 object-cover ring-4 ring-white shadow-lg" 
                            src={testimonials[testimonialIndex].image} 
                            alt={testimonials[testimonialIndex].name} 
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-stone-800">
                            {testimonials[testimonialIndex].name}
                          </div>
                          <div className="text-sm text-stone-500">
                            {testimonials[testimonialIndex].title}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-stone-100">
                  {/* Dots */}
                  <div className="flex gap-2">
                    {testimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setTestimonialIndex(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                          testimonialIndex === index 
                            ? "bg-gradient-to-r from-amber-400 to-rose-400 w-8" 
                            : "bg-stone-200 hover:bg-stone-300"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Arrows */}
                  <div className="flex gap-2">
                    <button
                      onClick={prevTestimonial}
                      className="w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
                    >
                      <FontAwesomeIcon icon={faChevronLeft} className="text-stone-600" />
                    </button>
                    <button
                      onClick={nextTestimonial}
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500 flex items-center justify-center transition-all shadow-lg"
                    >
                      <FontAwesomeIcon icon={faChevronRight} className="text-white" />
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
