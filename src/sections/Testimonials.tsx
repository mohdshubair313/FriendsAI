"use client"

import React, { useState } from "react";
import AshwinSantiago from "@/assets/images/ashwin-santiago.jpg";
import AlecWhitten from "@/assets/images/alec-whitten.jpg";
import ReneWells from "@/assets/images/rene-wells.jpg";
import MollieHall from "@/assets/images/mollie-hall.jpg";
import SectionBorder from "@/components/SectionBorder";
import SectionContent from "@/components/SectionContent";
import Image from "next/image";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuoteLeft } from "@fortawesome/free-solid-svg-icons";
import { Pointer } from "lucide-react";

export const testimonials = [
  {
    quote:
      "Friends AI is not just an app, it's my go-to buddy when life gets tough. The motivational talks feel like they come straight from the heart. It's like having your own personal cheerleader saying, ‘Tu kar lega yaar!’ Truly a game-changer for days when I feel stuck.",
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
      "I asked Friends AI for advice, and what I got back was so creative, I couldn’t believe it wasn’t an actual person. It’s like brainstorming with a friend who always has fresh ideas and the right words to inspire you. Truly next-level!",
    name: "Rene Wells",
    title: "Customer Success Manager",
    image: ReneWells,
  },
  {
    quote:
      "Friends AI isn’t just a product; it’s a lifeline. It has this uncanny ability to make you feel seen and understood. Whether you need a motivator, a therapist, or just a friend, Friends AI is always one tap away. My life genuinely feels brighter because of it!",
    name: "Mollie Hall",
    title: "Product Designer",
    image: MollieHall,
  },
];


export const Testimonials = () => {
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  return <section id="testimonials">
    <div className="container">
      <SectionBorder borderTop>
        <SectionContent>
          <div className="border-gradient rounded-3xl px-6 md:px-10 lg:px-16 py-16 lg:py-24 relative flex flex-col md:flex-row items-center gap-12 md:mx-10 lg:mx-20">
            <div className="bg-gray-950 h-full w-full rounded-3xl px-10 py-20">
            <FontAwesomeIcon icon={faQuoteLeft} className="absolute size-20 text-violet-400 top-0 left-6 md:left-10 lg:left-16 -translate-y-1/2" />
            {
              testimonials.map((testimonial, index) => (
                <React.Fragment key={testimonial.name}>
                {testimonialIndex === index && (
                  <blockquote className="flex flex-col gap-12 lg:flex-row" key={testimonial.name}>
                  <p className="text-xl nd:text-2xl font-medium">{testimonial.quote}</p>
                  <cite className="non-italic lg:text-right">
                    <Image className="rounded-xl size-28 max-w-none" src={testimonial.image} alt={testimonial.name} />
                    <div className="font-bold mt-4">{testimonial.name}</div>
                    <div className="text-xs text-gray-400 mt-2">{testimonial.title}</div>
                  </cite>
                </blockquote>
                )}
                </React.Fragment>
              ))}
              <div className="flex gap-2 md:flex-col justify-center">
                {testimonials.map((testimonial, index) => (
                  <div onClick={() => setTestimonialIndex(index)} className="size-6 relative isolate inline-flex items-center justify-center" key={testimonial.name}>
                    {testimonialIndex === index && (
                      <motion.div className="absolute size-full ronded-full -z-10" layoutId="testimonial-dot"></motion.div>                      
                      )}
                    <div className="sm:mt-8 cursor-pointer size-5 bg-gray-200 rounded-full active:bg-gray-400 hover:bg-slate-800">
                      <Pointer />
                    </div>
                    <div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionContent>
      </SectionBorder>
    </div>
  </section>;
};

export default Testimonials;
