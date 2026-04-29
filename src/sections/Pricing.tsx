"use client";

import Script from "next/script";
import React, { useState } from "react";
import SectionBorder from "@/components/SectionBorder";
import SectionContent from "@/components/SectionContent";
import { twMerge } from "tailwind-merge";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { RazorpayOptions } from "@/lib/types";

export const pricingTiers = [
  {
    title: "Basic",
    description: "Your everyday AI companion to chat and connect with.",
    price: "Free",
    buttonText: "Get Started",
    features: [
      "Natural conversations with Friends AI",
      "Mood-based chat adaptation",
      "Basic message history",
      "Explore AI personality features",
    ],
    featured: false,
    className: "lg:py-12 lg:my-6",
  },
  {
    title: "Premium",
    description: "Unlock the full emotional depth of your AI friend.",
    price: 99,
    buttonText: "Upgrade to Premium",
    features: [
      "All Basic plan features included",
      "Unlimited message history",
      "Priority emotionally tailored replies",
      "Enhanced mood-matching capabilities",
      "Custom AI personalities",
      "Early access to new AI moods",
    ],
    featured: true,
    className: "lg:py-18 lg:my-0",
  },
  {
    title: "Enterprise",
    description: "Dedicated AI presence, always by your side.",
    price: null,
    buttonText: "Contact Us",
    features: [
      "All Premium plan features included",
      "Deep emotional support",
      "Exclusive AI-generated content",
      "AI therapist mode",
      "Collaborative brainstorming sessions",
      "24/7 priority AI assistance",
    ],
    featured: false,
    className: "lg:py-12 lg:my-6",
  },
] as const;

export const Pricing = () => {
  const AMOUNT = 99;
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
        handler: async function (response) {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            if (verifyRes.ok) {
              router.push("/premium");
            } else {
              const { toast } = await import("sonner");
              toast.error("Payment verification failed. Please contact support.");
            }
          } catch {
            const { toast } = await import("sonner");
            toast.error("Payment verification failed. Please try again.");
          }
        },
        prefill: {
          name: "John Doe",
          email: "john@gmail.com",
          contact: "98432xxxxx",
        },
        theme: {
          color: "#F59E0B",
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
    <section id="pricing">
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
                Pricing
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="text-3xl md:text-4xl lg:text-5xl font-semibold text-center text-stone-100 tracking-tight"
            >
              Flexible plans for every need
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-center text-stone-500 mt-4 max-w-md mx-auto text-sm"
            >
              Start free, upgrade when you&apos;re ready.
            </motion.p>

            <Script src="https://checkout.razorpay.com/v1/checkout.js" />

            <div className="mt-14 flex flex-col lg:flex-row lg:items-start gap-6 lg:justify-center">
              {pricingTiers.map((tier, i) => (
                <motion.div
                  key={tier.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={twMerge(
                    "relative border rounded-2xl px-7 py-10 w-full max-w-[340px] sm:max-w-[380px] mx-auto lg:mx-0 flex-1 flex flex-col",
                    tier.featured
                      ? "border-amber-500/40 bg-stone-900/80 shadow-[0_0_40px_rgba(245,158,11,0.08),inset_0_1px_0_rgba(245,158,11,0.15)]"
                      : "border-stone-800/60 bg-stone-900/40",
                    tier.className
                  )}
                >
                  {tier.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500 text-stone-950 text-xs font-semibold tracking-wide">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div>
                    <h3 className={twMerge(
                      "font-semibold text-2xl",
                      tier.featured ? "text-amber-400" : "text-stone-300"
                    )}>
                      {tier.title}
                    </h3>
                    <p className="mt-2 text-stone-500 text-sm leading-relaxed">{tier.description}</p>

                    <div className="mt-7 flex items-end gap-1">
                      {typeof tier.price === "number" ? (
                        <>
                          <span className="text-lg font-semibold text-stone-300 mb-1">₹</span>
                          <span className="text-5xl font-semibold text-stone-100 leading-none">{tier.price}</span>
                          <span className="text-stone-500 text-sm mb-1">/mo</span>
                        </>
                      ) : tier.price === "Free" ? (
                        <span className="text-5xl font-semibold text-stone-100 leading-none">Free</span>
                      ) : (
                        <span className="text-2xl font-semibold text-stone-300 leading-none">Custom</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 flex-1">
                    <ul className="flex flex-col gap-3.5">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <div className={twMerge(
                            "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5",
                            tier.featured
                              ? "bg-amber-500/20 border border-amber-500/30"
                              : "bg-stone-800 border border-stone-700/50"
                          )}>
                            <Check className={twMerge(
                              "w-3 h-3",
                              tier.featured ? "text-amber-400" : "text-stone-400"
                            )} strokeWidth={2.5} />
                          </div>
                          <span className="text-stone-400 text-sm leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8">
                    {tier.title === "Premium" ? (
                      <button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm transition-all duration-300 hover:shadow-[0_0_24px_rgba(245,158,11,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          tier.buttonText
                        )}
                      </button>
                    ) : (
                      <Link href={tier.buttonText === "Contact Us" ? "/feedback" : "/chat"}>
                        <button className={twMerge(
                          "w-full py-3 rounded-xl text-sm font-medium transition-all duration-300",
                          tier.featured
                            ? "bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700"
                            : "bg-transparent text-stone-400 hover:text-stone-200 border border-stone-800 hover:border-stone-700"
                        )}>
                          {tier.buttonText}
                        </button>
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </SectionContent>
        </SectionBorder>
      </div>
    </section>
  );
};

export default Pricing;
