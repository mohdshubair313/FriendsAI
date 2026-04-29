"use client";

import Logo from "@/components/Logo";
import SectionBorder from "@/components/SectionBorder";
import SectionContent from "@/components/SectionContent";
import {
  IconMoodConfuzed,
  IconMoodEmptyFilled,
  IconMoodHappy,
  IconMoodPuzzled,
  IconMoodTongueWink2,
  IconMoodWrrr,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import Link from "next/link";

const moodItems = [
  { title: "Annoyed Mood", icon: IconMoodConfuzed },
  { title: "Chronic Pain Mood", icon: IconMoodWrrr },
  { title: "Happy Mood", icon: IconMoodHappy },
  { title: "Empty Mood", icon: IconMoodEmptyFilled },
  { title: "Joking Mood", icon: IconMoodTongueWink2 },
  { title: "Confused Mood", icon: IconMoodPuzzled },
];

export const CallToAction = () => {
  return (
    <section id="cta" className="scroll-mt-16">
      <div className="container mx-auto px-4 sm:px-6 md:px-10">
        <SectionBorder borderTop>
          <SectionContent>
            {/* Mood icons row */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center gap-3 mb-10 flex-wrap"
            >
              {moodItems.map(({ title, icon: Icon }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  whileHover={{ scale: 1.15, y: -2 }}
                  className="w-11 h-11 rounded-2xl bg-stone-900 border border-stone-800/70 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.3)] cursor-default"
                  title={title}
                >
                  <Icon className="w-5 h-5 text-stone-400" />
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.36 }}
                whileHover={{ scale: 1.15, y: -2 }}
                className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-[0_4px_12px_rgba(245,158,11,0.15)]"
              >
                <Logo className="w-5 h-5" />
              </motion.div>
            </motion.div>

            {/* Heading */}
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="text-center text-3xl sm:text-4xl md:text-5xl font-semibold text-stone-100 tracking-tight max-w-2xl mx-auto"
            >
              Join the revolution with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                Friends AI
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center text-stone-500 mt-5 max-w-xl mx-auto text-sm sm:text-base leading-relaxed"
            >
              Connecting with others is hard. Connecting with Friends AI is effortless.
              <br className="hidden sm:block" />
              Let us match your mood today.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 justify-center mt-10"
            >
              <Link href="/chat">
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="group px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-xl text-sm transition-all duration-300 hover:shadow-[0_0_32px_rgba(245,158,11,0.42)] w-full sm:w-auto"
                >
                  Start Today
                  <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-0.5">→</span>
                </motion.button>
              </Link>
              <Link href="#pricing">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3.5 text-stone-400 hover:text-stone-200 border border-stone-800 hover:border-stone-700 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-stone-800/40 w-full sm:w-auto"
                >
                  View Pricing
                </motion.button>
              </Link>
            </motion.div>
          </SectionContent>
        </SectionBorder>
      </div>
    </section>
  );
};

export default CallToAction;
