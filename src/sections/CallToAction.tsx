"use client";

import SectionBorder from "@/components/SectionBorder";
import SectionContent from "@/components/SectionContent";
import underlineImage from "@/assets/images/underline.svg";
import Button from "@/components/Button";
import React from "react";
import { FloatingDock } from "@/components/ui/floating-dock";
import {
  IconMoodPuzzled,
  IconMoodWrrr,
  IconMoodHappy,
  IconMoodEmptyFilled,
  IconMoodTongueWink2,
  IconMoodConfuzed,
} from "@tabler/icons-react";
import Image from "next/image";
import Logo from "@/components/Logo";

export const CallToAction = () => {

  const links = [
    {
      title: "Annoyed Mood(Andheka)",
      icon: (
        <IconMoodConfuzed className="h-full w-full text-gray-950 dark:text-neutral-300" />
      ),
      href: "#",
    },
 
    {
      title: "Chronic pain Mood (Takleef)",
      icon: (
        <IconMoodWrrr className="h-full w-full text-gray-950 dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "Happy Mood (chakde padte)",
      icon: (
        <IconMoodHappy className="h-full w-full text-gray-950 dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "Friends AI",
      icon: (
        <Logo className="h-full w-full text-gray-950 dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "Empty Mood (ghum shum)",
      icon: (
        <IconMoodEmptyFilled className="h-full w-full text-gray-950 dark:text-neutral-300" />
      ),
      href: "#",
    },
 
    {
      title: "Joking Mood (mazaakiya)",
      icon: (
        <IconMoodTongueWink2 className="h-full w-full text-gray-950 dark:text-neutral-300" />
      ),
      href: "#",
    },
    {
      title: "Confused Mood (hakka-bakka)",
      icon: (
        <IconMoodPuzzled className="h-full w-full text-gray-950 dark:text-neutral-300" />
      ),
      href: "#",
    },
  ];


  return <section>
    <div className="container mx-auto px-4">
      <SectionBorder borderTop>
        <SectionContent>
          <h1 className="text-gray-200 flex justify-center items-center pt-5 font-semibold text-2xl bordertop ">
            Join the AI Revolution with {" "}
            <span className="relative isolate">
            <span>&nbsp; Friends AI</span>
            <span className="absolute w-full left-0 top-full -translate-y-1/2 h-4 bg-gradient-to-r from-amber-300 via-teal-300 to-fuchsia-400"
                  style={{
                    maskImage: `url(${underlineImage.src})`,
                    maskSize: "contain",
                    maskPosition: "center",
                    maskRepeat: "no-repeat",
                  }}></span>
              </span>
          </h1>
          <p className="text-center text-xl mt-8">
          Connecting with others is hard; connecting with FriendsAI is effortless. Let us match your mood today
          </p>
          <div className="flex justify-center mt-8 rounded">
              <Button className="flex justify-center items-center rounded hover:scale-110 transition-all duration-300" variant="secondary">
                Try it now
              </Button>
            </div>
        </SectionContent>

        <div className="flex items-center justify-center pb-24 w-full">
      <FloatingDock
        items={links}
      />
    </div>
      </SectionBorder>
    </div>
  </section>;
};

export default CallToAction;
