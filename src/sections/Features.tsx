'use client'

import coolmood from "../assets/images/cool.png"
import crymood from "../assets/images/cry.png"
import pareshaanMood from "../assets/images/pareshaan.png"
import dhattiMood from "../assets/images/dhatti.png"
import loveMood from "../assets/images/love.png"
import moneyideaMood from "../assets/images/moneyidea.png"
import thinkingMood from "../assets/images/thinking.png"
import sadMood from "../assets/images/sad.png"
import SectionBorder from "@/components/SectionBorder";
import SectionContent from "@/components/SectionContent";
import Orbit from "@/components/Orbit";
import Logo from "@/components/Logo";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { Check } from "lucide-react";

const features = [
  {
    title: "Mood-aware conversations",
    description: "Pick a mood and let the AI adapt its tone, energy, and responses to match exactly where you are emotionally.",
  },
  {
    title: "Always by your side",
    description: "Start a conversation now — your mood, your friend, your way. No judgment, no effort, just genuine connection.",
  },
  {
    title: "Deeply personal",
    description: "Your AI companion grows with you, tailored to your unique feelings and evolving communication style.",
  },
];

export const logos = [
  { src: sadMood, alt: "Sad Mood", rotate: 0 },
  { src: coolmood, alt: "Cool mood", rotate: 45 },
  { src: crymood, alt: "Cry mood", rotate: 90 },
  { src: dhattiMood, alt: "Focused Mood", rotate: 135 },
  { src: moneyideaMood, alt: "Money Idea Mood", rotate: 180 },
  { src: thinkingMood, alt: "Thinking Mood", rotate: 225 },
  { src: loveMood, alt: "Love Mood", rotate: 270 },
  { src: pareshaanMood, alt: "Stress Mood", rotate: 315 },
];

export const Features = () => {
  return (
    <section id="features">
      <div className="container">
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
                Features
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="text-3xl md:text-4xl lg:text-5xl font-semibold text-stone-100 text-center max-w-xl mx-auto leading-tight tracking-tight"
            >
              Your AI friend for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                every emotion
              </span>
            </motion.h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mt-20 items-center">
              {/* Feature list */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <ul className="flex flex-col gap-8">
                  {features.map((feature, i) => (
                    <motion.li
                      key={feature.title}
                      initial={{ opacity: 0, x: -14 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                      className="flex gap-4"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center mt-0.5">
                        <Check className="w-3.5 h-3.5 text-amber-400" strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="text-stone-100 font-semibold text-base sm:text-lg leading-snug">
                          {feature.title}
                        </h3>
                        <p className="text-stone-500 text-sm mt-1.5 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </motion.li>
                  ))}
                </ul>

                <Link href="/chat">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-12 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-stone-100 border border-stone-800 hover:border-amber-500/40 rounded-xl text-sm font-medium transition-all duration-300"
                  >
                    Try it free →
                  </motion.button>
                </Link>
              </motion.div>

              {/* Orbital mood animation */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="flex justify-center"
              >
                <div className="size-[270px] md:size-[420px] relative flex-shrink-0">
                  <div className="absolute inset-0">
                    <Orbit className="size-full border-stone-700/25" />
                  </div>
                  <div className="absolute-center">
                    <Orbit className="size-[180px] md:size-[280px] border-stone-800/40" />
                  </div>
                  <div className="absolute-center">
                    <Logo className="size-20" />
                  </div>
                  {logos.map(({ src, alt, rotate }) => (
                    <motion.div
                      key={alt}
                      className="absolute inset-0"
                      initial={{ rotate }}
                      animate={{ rotate: [rotate, rotate + 360] }}
                      transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    >
                      <motion.div
                        animate={{ rotate: [-rotate, -rotate - 360] }}
                        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                        className="inline-flex size-10 md:size-12 items-center justify-center border border-stone-700/50 rounded-xl absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-stone-900/80 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                      >
                        <Image src={src} alt={alt} className="size-6 md:size-8" />
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </SectionContent>
        </SectionBorder>
      </div>
    </section>
  );
};

export default Features;
