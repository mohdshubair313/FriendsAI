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
import Button from "@/components/Button";
import Orbit from "@/components/Orbit";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import Logo from "@/components/Logo";
import Image from "next/image";
import { motion } from "framer-motion";
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect";

const words = [
  {
    text: "Your",
  },
  {
    text: "AI Friend",
  },
  {
    text: "for Every",
  },
  {
    text: "Emotion",
  },
  {
    text: "Start Today.",
    className: "text-gray-400",
  },
];


export const features = [
  "Pick a mood, and let’s make your day better",
  "Start a conversation now – your mood, your friend, your way!",
  "Your Personal AI Companion, Tailored to Your Feelings.",
];

export const logos = [
  {
    src: sadMood,
    alt: "Sad Mood",
    rotate: 0,
  },
  {
    src: coolmood,
    alt: "Cool mood",
    rotate: 45,
  },
  {
    src: crymood,
    alt: "cry mood",
    rotate: 90,
  },
  {
    src: dhattiMood,
    alt: "Focused Mood",
    rotate: 135,
  },
  {
    src: moneyideaMood,
    alt: "modey Idea Mood",
    rotate: 180,
  },
  {
    src: thinkingMood,
    alt: "Thinking Mood",
    rotate: 225,
  },
  {
    src: loveMood,
    alt: "love Mood",
    rotate: 270,
  },
  {
    src: pareshaanMood,
    alt: "stress Mood",
    rotate: 315,
  },
];

export const Features = () => {
  return (
   <section>
    <div className="container">
        <SectionBorder borderTop>
        <div className="flex flex-col items-center justify-center">
      <TypewriterEffectSmooth words={words} />
    </div>
          {/* <h1 className="text-7xl mt-14 ml-4 flex justify-center items-center font-serif">Your AI Friend for Every Emotion </h1> */}
          <SectionContent className="md:px-20 lg:px-40">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
              <div className="flex justify-center">
                  <ul className="mt-8 mr-5 flex flex-col gap-6">
                    {features.map((feature) => (
                      <li className="flex items-center gap-4" key={feature}>
                        <FontAwesomeIcon icon={faCircleCheck} className="size-6 text-violet-400" />
                        <span className="text-2xl font-medium"> {feature} </span> 
                      </li>
                    ))}
                  </ul>
                </div>
                  <div className="flex justify-center">
                    <div className="size-[270px] md:size-[450px] relative flex-shrink-0">
                      <div className="absolute inset-0 ">
                      <Orbit className="size-full" />
                      </div>
                      <div className="absolute-center ">
                      <Orbit className="size-[180px] md:size-[300px] " />
                      </div>
                      <div className="absolute-center">
                        <Logo className="size-24" />
                      </div>
                        { logos.map(({src, alt, rotate}) => (
                          <motion.div className="absolute 
                            inset-0" initial={{rotate:rotate,}} animate={{ 
                            rotate: [rotate, rotate + 180,rotate + 180, rotate + 360,
                            rotate + 360,
                            ],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 10,
                            }} key={alt}>
                          <div className="inline-flex size-10 md:size-14 items-center justify-center border border-[var(--color-border)] rounded-lg absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-0 bg-gray-950" style={{transform: "translate(-50%,-50%) rotate(-0deg)"}}>
                          <Image src={src} alt={alt} className="size-6 md:size-9" />
                          </div>
                        </motion.div>
                    ))}

                  </div>
              </div>
            </div>

            <Button variant="primary" className="mt-5 ">Try it Now!</Button>
          </SectionContent>
        </SectionBorder>
    </div>
  </section>
  );
}

export default Features;