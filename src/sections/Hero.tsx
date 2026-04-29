"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import FaceImage from "@/assets/images/Face.jpg";
import Loader from "@/assets/images/loader-animated.svg";
import Orbit from "@/components/Orbit";
import { Planet } from "@/components/Planet";
import SectionBorder from "@/components/SectionBorder";
import SectionContent from "@/components/SectionContent";

const useMousePosition = () => {
  const [innerWidth, setInnerWidth] = useState(1);
  const [innerHeight, setInnerHeight] = useState(1);
  const clientX = useMotionValue(0);
  const clientY = useMotionValue(0);
  const xProgress = useTransform(clientY, [0, innerHeight], [0, 1]);
  const yProgress = useTransform(clientX, [0, innerWidth], [0, 1]);

  useEffect(() => {
    const updateSize = () => {
      setInnerWidth(window.innerWidth);
      setInnerHeight(window.innerHeight);
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      clientX.set(e.clientX);
      clientY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [clientX, clientY]);

  return { xProgress, yProgress };
};

export const Hero = () => {
  const { xProgress, yProgress } = useMousePosition();
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["end start", "start end"],
  });

  const transY = useTransform(scrollYProgress, [0, 1], [200, -200]);
  const springX = useSpring(xProgress, { damping: 15, stiffness: 100 });
  const springY = useSpring(yProgress, { damping: 15, stiffness: 100 });
  const largeX = useTransform(springX, [0, 1], ["-25%", "25%"]);
  const largeY = useTransform(springY, [0, 1], ["-25%", "25%"]);
  const midX = useTransform(springX, [0, 1], ["-50%", "50%"]);
  const midY = useTransform(springY, [0, 1], ["-50%", "50%"]);

  return (
    <section ref={sectionRef} className="scroll-mt-16">
      <div className="container mx-auto">
        <SectionBorder>
          <SectionContent className="relative isolate">
            {/* Warm ambient radial glow */}
            <div className="absolute -z-10 inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-5%,rgba(120,53,15,0.32)_0%,rgba(28,20,12,0.12)_55%,transparent_75%)]" />
            <div className="absolute -z-10 inset-0 bg-[radial-gradient(circle_at_75%_55%,rgba(194,120,60,0.07)_0%,transparent_50%)]" />

            {/* Orbital rings */}
            <div className="absolute inset-0 -z-10 pointer-events-none">
              {[350, 600, 850, 1100, 1350].map((size, idx) => (
                <div key={idx} className={`absolute-center ${idx > 2 ? "hidden md:block" : ""}`}>
                  <Orbit className={`size-[${Math.round(size * 0.6)}px] md:size-[${size}px] border-stone-800/40`} />
                </div>
              ))}
            </div>

            {/* Eyebrow badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center mb-7"
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400/90 text-xs font-medium tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Emotionally Intelligent AI
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.08 }}
              className="text-4xl sm:text-5xl md:text-6xl font-semibold text-stone-100 text-center leading-[1.15] max-w-4xl mx-auto tracking-tight"
            >
              Building dreams, chasing deadlines —
              <br className="hidden sm:block" />
              when did you last{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                share how you feel?
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.18 }}
              className="text-center text-base sm:text-lg text-stone-500 mt-6 max-w-2xl mx-auto leading-relaxed"
            >
              Connecting with others is hard. Connecting with Friends AI is effortless.{" "}
              <span className="text-stone-400">Let us match your mood today.</span>
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.28 }}
              className="flex flex-col sm:flex-row justify-center mt-10 gap-3"
            >
              <Link href="/chat">
                <button className="group px-7 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-xl text-sm transition-all duration-300 hover:shadow-[0_0_28px_rgba(245,158,11,0.38)] hover:-translate-y-0.5 w-full sm:w-auto">
                  Start Exploring
                  <span className="ml-1.5 inline-block transition-transform duration-300 group-hover:translate-x-0.5">→</span>
                </button>
              </Link>
              <Link href="#features">
                <button className="px-7 py-3 text-stone-400 hover:text-stone-200 border border-stone-800 hover:border-stone-700 rounded-xl text-sm transition-all duration-300 hover:bg-stone-800/40 w-full sm:w-auto">
                  See how it works
                </button>
              </Link>
            </motion.div>

            {/* Planet Visuals + Tooltip */}
            <div className="relative isolate max-w-5xl mx-auto mt-16 sm:mt-20">
              <div className="absolute left-1/2 top-0">
                <motion.div style={{ x: largeX, y: largeY }}>
                  <Planet size="lg" color="amber" className="-translate-x-[100px] -translate-y-[40px] md:-translate-x-[304px] md:-translate-y-[76px] rotate-135 opacity-70" />
                </motion.div>
                <motion.div style={{ x: largeX, y: largeY }}>
                  <Planet size="sm" color="orange" className="-translate-y-[100px] translate-x-[80px] md:-translate-y-[200px] md:translate-x-[220px] -rotate-135 opacity-60" />
                </motion.div>
                <motion.div style={{ x: midX, y: midY }}>
                  <Planet size="md" color="gold" className="-translate-y-[200px] -translate-x-[150px] md:-translate-y-[480px] md:-translate-x-[480px] opacity-50" />
                </motion.div>
              </div>

              {/* Floating Tooltip */}
              <motion.div
                className="absolute left-0 z-10 top-[30%] -translate-x-10 bg-stone-900/80 backdrop-blur-xl border border-stone-700/50 rounded-2xl p-4 w-60 sm:w-[17rem] shadow-[0_8px_32px_rgba(0,0,0,0.35)] hidden sm:block"
                style={{ y: transY }}
              >
                <p className="text-stone-300 text-sm leading-relaxed">
                  Have you met the AI friend who&apos;s as nuanced as you — but always in your corner?
                </p>
                <p className="text-right text-amber-400 text-xs font-semibold mt-2 tracking-wide">
                  Discover More →
                </p>
              </motion.div>

              {/* Hero image */}
              <div className="mt-20 rounded-2xl border border-stone-800/60 overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.55)] relative max-w-full">
                <Image src={FaceImage} alt="Friends AI Interface" className="w-full h-auto object-cover" />
                <div className="bg-stone-950/90 backdrop-blur-md flex items-center gap-3 px-5 py-3">
                  <Image src={Loader} alt="Loading" width={18} height={18} />
                  <div className="font-medium text-sm text-stone-300">
                    AI is generating <span className="animate-cursor-blink text-amber-400">|</span>
                  </div>
                </div>
              </div>
            </div>
          </SectionContent>
        </SectionBorder>
      </div>
    </section>
  );
};

export default Hero;
