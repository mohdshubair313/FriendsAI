"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import FaceImage from "@/assets/images/Face.jpg";
import Loader from "@/assets/images/loader-animated.svg";
import underlineImage from "@/assets/images/underline.svg?url";
import Orbit from "@/components/Orbit";
import { Planet } from "@/components/Planet";
import SectionBorder from "@/components/SectionBorder";
import SectionContent from "@/components/SectionContent";
import { Button } from "@/components/ui/button";

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
            {/* Background Orb Layers */}
            <div className="absolute -z-10 inset-0 bg-[radial-gradient(circle_farthest-corner,var(--color-fuchsia-900)_50%,var(--color-indigo-900)_75%,transparent)] [mask-image:radial-gradient(circle_farthest-side,black,transparent)]" />
            <div className="absolute inset-0 -z-10 pointer-events-none">
              {[350, 600, 850, 1100, 1350].map((size, idx) => (
                <div key={idx} className="absolute-center">
                  <Orbit className={`size-[${size}px]`} />
                </div>
              ))}
            </div>

            {/* Hero Text */}
            <h1 className="text-3xl sm:text-lg md:text-5xl font-semibold text-gray-100 text-center leading-tight max-w-4xl mx-auto">
              <p>Building dreams, fixing bugs, chasing deadlines – when was the last time you shared how you feel?</p>
              <br />
              Talk with{" "}
              <span className="relative inline-block">
                <span>Friends AI</span>
                <span
                  className="absolute w-full left-0 top-full -translate-y-1/2 h-4 bg-gradient-to-r from-amber-300 via-teal-300 to-fuchsia-400"
                  style={{
                    maskImage: `url(${underlineImage.src})`,
                    maskSize: "contain",
                    maskPosition: "center",
                    maskRepeat: "no-repeat",
                  }}
                />
              </span>
            </h1>
            <p className="text-center text-base sm:text-lg md:text-xl mt-6 sm:mt-8 max-w-3xl mx-auto">
              Connecting with others is hard. Connecting with FriendsAI is effortless. Let us match your mood today.
            </p>

            {/* CTA Button */}
            <div className="flex justify-center mt-8 sm:mt-10">
              <Link href="/chat">
                <Button className="transition-all hover:scale-105 hover:shadow-[0_0_25px_#a78bfa] animate-pulse">
                  Start Exploring
                </Button>
              </Link>
            </div>

            {/* Planet Visuals + Tooltip */}
            <div className="relative isolate max-w-5xl mx-auto mt-16">
              <div className="absolute left-1/2 top-0">
                <motion.div style={{ x: largeX, y: largeY }}>
                  <Planet size="lg" color="violet" className="-translate-x-[304px] -translate-y-[76px] rotate-135" />
                </motion.div>
                <motion.div style={{ x: largeX, y: largeY }}>
                  <Planet size="sm" color="fuchsia" className="-translate-y-[200px] translate-x-[220px] -rotate-135" />
                </motion.div>
                <motion.div style={{ x: midX, y: midY }}>
                  <Planet size="md" color="teal" className="-translate-y-[480px] -translate-x-[480px]" />
                </motion.div>
              </div>

              {/* Floating Tooltip */}
              <motion.div
                className="absolute left-0 z-10 top-[30%] -translate-x-10 bg-gray-800/70 backdrop-blur-md border border-gray-700 rounded-xl p-4 w-[18rem] sm:w-72"
                style={{ y: transY }}
              >
                <div>Have you met the AI friend who’s as moody as you are – but always in the best way?</div>
                <div className="text-right text-gray-400 text-sm font-semibold mt-2">Check it Out!</div>
              </motion.div>

              {/* Robot Image with Loader */}
              <div className="mt-20 rounded-2xl border-2 overflow-hidden border-gradient relative max-w-full">
                <Image src={FaceImage} alt="Robot Image" className="w-full h-auto object-cover" />
                <div className="bg-gray-950/80 flex items-center gap-4 px-4 py-2 rounded-2xl max-w-full">
                  <Loader className="text-violet-400" />
                  <div className="font-semibold text-xl text-gray-100">
                    AI is generating <span className="animate-cursor-blink">|</span>
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
