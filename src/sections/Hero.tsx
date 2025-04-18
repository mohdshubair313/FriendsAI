'use client'

import FaceImage from "@/assets/images/Face.jpg";
import Loader from "@/assets/images/loader-animated.svg";
import underlineImage from "@/assets/images/underline.svg?url";
import Orbit from "@/components/Orbit";
import { Planet } from "@/components/Planet";
import SectionBorder from "@/components/SectionBorder";
import SectionContent from "@/components/SectionContent";
import { Button } from "@/components/ui/button";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";


const useMousePosition = () => {
  const [innerWidth, setinnerWidth] = useState(1);
  const [innerheight, setinnerheight] = useState(1);
  const clientX = useMotionValue(0);
  const clientY = useMotionValue(0);
  const xProgress = useTransform(clientY, [0, innerheight], [0,1]);
  const yProgress = useTransform(clientX, [0, innerWidth], [0,1])

  useEffect(() => {
    setinnerWidth(window.innerWidth);
    setinnerheight(window.innerHeight)

    window.addEventListener('resize', () => {
      setinnerWidth(window.innerWidth);
      setinnerheight(window.innerHeight)
    })

  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', (e) => {
      clientX.set(e.clientX);
      clientY.set(e.clientY)
    })
  }, [clientX,clientY])

  return {xProgress, yProgress} 
};

export const Hero = () => {
  const {xProgress, yProgress} = useMousePosition()
  const sectionRef = useRef(null);

  const {scrollYProgress} = useScroll({
    target: sectionRef,
    offset: ['end start', 'start end']
  });
  const transfromedY = useTransform(scrollYProgress, [0,1], [200, -200])

  const springX = useSpring(xProgress, { damping: 15, stiffness: 100 });
  const springY = useSpring(yProgress, { damping: 15, stiffness: 100 });


  const tranfromedLargeX = useTransform(springX, [0,1], ['-25%', '25%'])
  const transfromedLargeY = useTransform(springY, [0,1], ["-25%", "25%"])
  const translateMediumX = useTransform(springX, [0,1], ["-50%", "50%"])
  const translateMediumY = useTransform(springY, [0,1], ["-50%", "50%"])
    return (
    <section ref={sectionRef}>
      <div className="container">
        <SectionBorder>
          <SectionContent className="relative isolate [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]">
            <div className="absolute -z-10 inset-0 bg-[radial-gradient(circle_farthest-corner,var(--color-fuchsia-900)_50%,var(--color-indigo-900)_75%,transparent)] [mask-image:radial-gradient(circle_farthest-side,black,transparent)] "></div>
            <div className="absolute inset-0 -z-10">
              <div className="absolute-center">
                <Orbit className="size-[350px]" />
              </div>
              <div className="absolute-center">
                <Orbit className="size-[600px]" />
              </div>
              <div className="absolute-center">
                <Orbit className="size-[850px]" />
              </div>
              <div className="absolute-center">
                <Orbit className="size-[110px]" />
              </div>
              <div className="absolute-center">
                <Orbit className="size-[1350px]" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-gray-100 text-center leading-tight max-w-4xl mx-auto">
              <p className="">Building dreams, fixing bugs, chasing deadlines – when was the last time you shared how you feel? </p><br /> Talk with {" "} 
              <span className="relative">
                 <span>Friends AI</span>
                <span
                  className="absolute w-full left-0 top-full -translate-y-1/2 h-4 bg-gradient-to-r from-amber-300 via-teal-300 to-fuchsia-400"
                  style={{
                    maskImage: `url(${underlineImage.src})`,
                    maskSize: "contain",
                    maskPosition: "center",
                    maskRepeat: "no-repeat",
                  }}
                ></span>
              </span>
            </h1>
            <p className="text-center text-lg md:text-xl mt-8 ">
            Connecting with others is hard, connecting with FriendsAI is effortless. Let us match your mood today.{" "}
            </p>
            <div className="flex justify-center mt-10 font-sans">
              <Link href="/chat">
                  <Button className="mt-10 transition-all hover:scale-105 hover:shadow-[0_0_25px_#a78bfa] animate-pulse">
                    Start Exploring
                  </Button>
                </Link>
            </div>

            <div className="relative isolate max-w-5xl mx-auto">
                <div className="absolute left-1/2 top-0 ">
                   <motion.div style={{x: tranfromedLargeX, y: transfromedLargeY,}}><Planet size='lg' color='violet' className='-translate-x-[304px] -translate-y-[76px] rotate-135' /></motion.div>
                   <motion.div style={{x: tranfromedLargeX, y: transfromedLargeY,}}><Planet size='sm' color='fuchsia' className='-translate-y-[200px] translate-x-[220px] -rotate-135 ' /></motion.div>
                   <motion.div style={{x: translateMediumX, y: translateMediumY,}}><Planet size='md' color='teal' className='-translate-y-[480px] -translate-x-[480px]' /></motion.div>
                </div>

                {/* text box in the image  */}
                <div className="absolute  left-0 z-10 top-[30%] -translate-x-10">
                  <motion.div className="bg-gray-800/70 backdrop-blur-md border-gray-700 rounded-xl p-4 w-72 " style={{y: transfromedY}}>
                    <div>Have you met the AI friend who’s as moody as you are – but always in the best way?</div>
                    <div className="text-right text-gray-400 text-sm font-semibold">Check it Out!</div>
                  </motion.div>
                </div>
              <div className="mt-20 rounded-2xl border-2 overflow-hidden border-gradient relative">
              <div className="mt-20 rounded-2xl border-2 overflow-hidden border-gradient relative max-w-full">
                  <Image src={FaceImage} alt="Robot Image" className="w-full h-full object-cover" />
                  <div className="bg-gray-950/80 items-center gap-4 px-4 py-2 rounded-2xl w-[320px] max-w-full">
                    <Loader className="text-violet-400" />
                    <div className="font-semibold text-xl text-gray-100">
                      AI is generating <span className="animate-cursor-blink">|</span>{" "}
                    </div>
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
