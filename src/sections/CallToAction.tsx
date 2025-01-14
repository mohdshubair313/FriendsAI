"use client";

import underlineImage from "@/assets/images/underline.svg";
import Logo from "@/components/Logo";
import SectionBorder from "@/components/SectionBorder";
import SectionContent from "@/components/SectionContent";
import { FloatingDock } from "@/components/ui/floating-dock";

import {
  IconMoodConfuzed,
  IconMoodEmptyFilled,
  IconMoodHappy,
  IconMoodPuzzled,
  IconMoodTongueWink2,
  IconMoodWrrr,
} from "@tabler/icons-react";
import Link from "next/link";

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
          <h1 className="text-gray-200 flex justify-center items-center pt-1 font-semibold text-2xl bordertop ">
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
          Connecting with others is hard connecting with FriendsAI is effortless. Let us match your mood today
          </p>
          <div className="flex justify-center mt-8 rounded">
            <Link href="/chat">
                <button className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
                  <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                    <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                      Start Today
                    </span>
                </button>
              </Link>
            </div>
        </SectionContent>

        <div className="flex items-center justify-center pb-12 w-full">
      <FloatingDock
        items={links}
      />
    </div>
      </SectionBorder>
    </div>
  </section>;
};

export default CallToAction;
