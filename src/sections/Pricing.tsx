"use client";

import Script from "next/script";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import SectionBorder from "@/components/SectionBorder";
import SectionContent from "@/components/SectionContent";
import { twMerge } from "tailwind-merge";
import { ButtonProp } from "@/components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import Loader from "@/assets/images/loader-animated.svg";
import Link from "next/link";
import {RazorpayOptions} from "@/lib/types"

export const pricingTiers = [
  {
    title: "Basic",
    description: "Your everyday AI friend to chat and vibe with.",
    price: "Free",
    buttonText: "Get Started",
    features: [
      "Access to Friends AI for natural conversations",
      "Mood-based chat adaptation (Motivator, Supportive, Friendly)",
      "Basic message history for recent chats",
      "Explore AI’s personality and mood-matching features",
    ],
    color: "amber",
    className: "lg:py-12 lg:my-6",
  },
  {
    title: "Premium",
    description: "Unlock the full potential of your AI friend.",
    price: 99,
    buttonText: "Upgrade to Premium",
    features: [
      "All Companion Plan features included",
      "Unlimited message history and chat access",
      "Priority response time with emotionally tailored replies",
      "Enhanced mood-matching capabilities with deeper interaction",
      "Custom AI personalities tailored to your preferences",
      "Priority access to updates and new AI moods",
    ],
    color: "violet",
    className: "lg:py-18 lg:my-0",
  },
  {
    title: "Enterprise",
    description: "Your personal AI companion, always by your side.",
    price: null,
    buttonText: "Contact Us",
    features: [
      "All Best Friend Plan features included",
      "Deep emotional support for mental well-being",
      "Exclusive AI-generated content (poems, letters, and advice)",
      "AI therapist mode with mindfulness exercises",
      "Collaborative brainstorming and personalized creativity sessions",
      "Exclusive 24/7 priority AI assistant for personalized tasks",
    ],
    color: "teal",
    className: "lg:py-12 lg:my-6",
  },
] satisfies {
  title: string;
  description: string;
  price: string | number | null;
  buttonText: string;
  buttonVariant?: ButtonProp["variant"];
  features: string[];
  color: string;
  className: string;
}[];

export const Pricing = () => {
  const AMOUNT = 100;
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/create-order", { method: "POST" });
      const data = await response.json();
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: AMOUNT * 100,
        currency: "INR",
        name: "Friends AI",
        description: "Upgrade to Premium",
        order_id: data.orderId,
        handler: function () {
          router.push("/premium");
        },
        prefill: {
          name: "John Doe",
          email: "john@gmail.com",
          contact: "98432xxxxx",
        },
        theme: {
          color: "#FF00FF",
        },
      };
      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (error) {
      console.log("Payment failed", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section>
      <div className="container">
        <SectionBorder borderTop>
          <SectionContent>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-center text-gray-200">
              Flexible plans for every need
            </h2>

            <div className="mt-12 flex flex-col lg:flex-row lg:items-start gap-8 lg:justify-between">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.title}
                  className={twMerge(
                    "border border-[var(--color-border)] rounded-3xl px-6 py-12 w-full max-w-[360px] sm:max-w-[420px] mx-auto lg:mx-0 flex-1",
                    tier.className
                  )}
                >
                  <h3
                    className={twMerge(
                      "font-semibold text-4xl",
                      tier.color === "violet" && "text-violet-400",
                      tier.color === "amber" && "text-amber-300",
                      tier.color === "teal" && "text-teal-300"
                    )}
                  >
                    {tier.title}
                  </h3>
                  <p className="mt-4 text-gray-400">{tier.description}</p>

                  <div className="mt-8">
                    {typeof tier.price === "number" && (
                      <span className="text-2xl font-semibold text-gray-200 align-top">
                        ₹
                      </span>
                    )}
                    <span className="text-7xl font-semibold text-gray-200">
                      {tier.price || <>&nbsp;</>}
                    </span>
                  </div>

                  <Script src="https://checkout.razorpay.com/v1/checkout.js" />

                  {tier.title === "Premium" ? (
                    <Button
                      className="mt-8 w-full h-12 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50"
                      variant="ghost"
                      onClick={handlePayment}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        tier.buttonText
                      )}
                    </Button>
                  ) : (
                    <Link href={tier.buttonText === "Contact Us" ? "/feedback" : "/chat"}>
                      <Button className="mt-8" variant="secondary">
                        {tier.buttonText}
                      </Button>
                    </Link>
                  )}

                  <ul className="flex flex-col gap-4 mt-8">
                    {tier.features.map((feature) => (
                      <li
                        key={feature}
                        className="border-t border-[var(--color-border)] py-4 flex gap-4"
                      >
                        <FontAwesomeIcon icon={faCheckCircle} className="size-6 text-violet-400" />
                        <span className="font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </SectionContent>
        </SectionBorder>
      </div>
    </section>
  );
};

export default Pricing;
