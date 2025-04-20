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
      title: "Annoyed Mood (Andheka)",
      icon: <IconMoodConfuzed className="h-full w-full text-gray-950 dark:text-neutral-300" />,
      href: "#",
    },
    {
      title: "Chronic Pain Mood (Takleef)",
      icon: <IconMoodWrrr className="h-full w-full text-gray-950 dark:text-neutral-300" />,
      href: "#",
    },
    {
      title: "Happy Mood (Chakde Padte)",
      icon: <IconMoodHappy className="h-full w-full text-gray-950 dark:text-neutral-300" />,
      href: "#",
    },
    {
      title: "Friends AI",
      icon: <Logo className="h-full w-full text-gray-950 dark:text-neutral-300" />,
      href: "#",
    },
    {
      title: "Empty Mood (Ghum Shum)",
      icon: <IconMoodEmptyFilled className="h-full w-full text-gray-950 dark:text-neutral-300" />,
      href: "#",
    },
    {
      title: "Joking Mood (Mazaakiya)",
      icon: <IconMoodTongueWink2 className="h-full w-full text-gray-950 dark:text-neutral-300" />,
      href: "#",
    },
    {
      title: "Confused Mood (Hakka-Bakka)",
      icon: <IconMoodPuzzled className="h-full w-full text-gray-950 dark:text-neutral-300" />,
      href: "#",
    },
  ];

  return (
    <section id="cta" className="scroll-mt-16">
      <div className="container mx-auto px-4 sm:px-6 md:px-10">
        <SectionBorder borderTop>
          <SectionContent>
            {/* Title */}
            <h2 className="text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-200">
              Join the AI Revolution with{" "}
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
            </h2>

            {/* Subtext */}
            <p className="text-center text-base sm:text-lg md:text-xl mt-6 sm:mt-8 max-w-3xl mx-auto">
              Connecting with others is hard. Connecting with FriendsAI is effortless. Let us match your mood today.
            </p>

            {/* CTA Button */}
            <div className="flex justify-center mt-8">
              <Link href="/chat">
                <button className="relative inline-flex h-12 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2">
                  <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-6 py-1 text-sm sm:text-base font-medium text-white backdrop-blur-3xl">
                    Start Today
                  </span>
                </button>
              </Link>
            </div>
          </SectionContent>

          {/* Floating Dock Section */}
          <div className="flex items-center justify-center pt-8 pb-16">
            <FloatingDock items={links} />
          </div>
        </SectionBorder>
      </div>
    </section>
  );
};

export default CallToAction;
