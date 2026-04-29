"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  Zap, 
  Sparkles, 
  Shield, 
  Headset, 
  ChevronRight,
  Crown,
  LayoutDashboard,
  BarChart3,
  CreditCard,
  ShieldCheck,
  X,
  BrainCircuit
} from "lucide-react";
import { motion } from "framer-motion";
import PremiumSuccessPopup from "@/components/PremiumSuccessPopup";
import UsageMeter from "@/components/chatComponents/UsageMeter";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { fetchPremiumStatus } from "@/store/slices/premiumSlice";

export default function PremiumPage() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isPremium = useAppSelector((s) => s.premium.isPremium);
  const remaining = useAppSelector((s) => s.premium.remaining);
  const premiumStatus = useAppSelector((s) => s.premium.status);
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    if (premiumStatus === "idle") {
      dispatch(fetchPremiumStatus());
    }

    // Polling background sync (Server-of-Truth)
    const pollInterval = setInterval(() => {
      dispatch(fetchPremiumStatus());
    }, 10000); // Sync every 10 seconds

    return () => clearInterval(pollInterval);
  }, [premiumStatus, dispatch]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/create-order", { method: "POST" });
      const data = await res.json();
      
      if (data.orderId) {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: data.amount,
          currency: data.currency,
          name: "Spherial AI Pro",
          description: "Unlock Multimodal Agentic Intelligence",
          order_id: data.orderId,
          handler: async function (response: any) {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response)
            });
            if (verifyRes.ok) {
              setIsPopupOpen(true);
            }
          },
          theme: { color: "#6366f1" }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      console.error("Subscription failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-12 overflow-y-auto no-scrollbar">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[160px]" />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="size-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Crown className="size-5 text-white" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400">Premium Ecosystem</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.9]">
              The Future <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">is Pro.</span>
            </h1>
            <p className="mt-6 text-zinc-500 text-lg font-medium leading-relaxed">
              Experience Spherial AI without limits. Access the full orchestration engine, 
              real-time digital avatars, and high-fidelity media generation.
            </p>
          </motion.div>

          {/* Usage Quick Glance (Pro Only Feature) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full md:w-80 glass p-6 rounded-[2rem] border-white/10"
          >
            <div className="flex items-center justify-between mb-6">
               <span className="text-xs font-black uppercase tracking-widest text-white">Neural Usage</span>
               <div className="flex items-center gap-1">
                  <div className="size-1 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[8px] font-black uppercase text-zinc-500">Live</span>
               </div>
            </div>
            <div className="space-y-6">
               <UsageMeter 
                  label="LiveTalk Minutes" 
                  used={isPremium ? Math.floor((5000 - remaining.voiceSecondsToday) / 60) : (5 - Math.floor(remaining.voiceSecondsToday / 60))} 
                  total={isPremium ? 500 : 5} 
                  unit="min" 
               />
               <UsageMeter 
                  label="Image Studio" 
                  used={isPremium ? (100 - remaining.imagesToday) : (3 - remaining.imagesToday)} 
                  total={isPremium ? 100 : 3} 
                  unit="img" 
                  color="bg-purple-500" 
               />
               <UsageMeter 
                  label="Neural Computes" 
                  used={isPremium ? 850 : 0} 
                  total={isPremium ? 10000 : 50} 
                  unit="ops" 
                  color="bg-cyan-500" 
               />
            </div>
          </motion.div>
        </div>

        {/* Pricing Table Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {/* Basic Plan */}
          <motion.div
            whileHover={{ y: -8 }}
            className="group glass p-10 rounded-[3rem] border-white/5 bg-white/[0.01] flex flex-col"
          >
            <div className="mb-8">
              <h3 className="text-xl font-black uppercase tracking-widest text-zinc-500 mb-2">Base Core</h3>
              <div className="text-4xl font-black italic tracking-tighter">FREE</div>
              <p className="mt-2 text-xs font-bold text-zinc-600 uppercase tracking-widest">Limited Intelligence Tier</p>
            </div>

            <ul className="space-y-4 mb-12 flex-1">
              <TierItem icon={CheckCircle2} label="Standard Agent Orchestration" />
              <TierItem icon={CheckCircle2} label="Basic Textual Memory" />
              <TierItem icon={X} label="Low-Latency LiveTalk Avatars" active={false} />
              <TierItem icon={X} label="Flux Pro Image Generation" active={false} />
              <TierItem icon={X} label="Advanced Reasoning Traces" active={false} />
            </ul>

            <button disabled className="w-full py-4 rounded-2xl bg-zinc-800 text-zinc-500 font-black uppercase tracking-widest text-xs cursor-not-allowed">
              {isPremium ? "Downgrade Unavailable" : "Active Plan"}
            </button>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            whileHover={{ y: -8 }}
            className="group relative p-[1px] rounded-[3rem] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-500 animate-shimmer" />
            <div className="relative h-full glass p-10 rounded-[3rem] bg-black/90 flex flex-col">
              <div className="absolute top-8 right-8 px-3 py-1 rounded-full bg-indigo-500 text-[10px] font-black uppercase text-white shadow-xl shadow-indigo-500/20">
                MOST POPULAR
              </div>
              
              <div className="mb-8">
                <h3 className="text-xl font-black uppercase tracking-widest text-indigo-400 mb-2">Neural Pro</h3>
                <div className="text-4xl font-black italic tracking-tighter flex items-end gap-1">
                  ₹999 <span className="text-sm font-bold text-zinc-500 not-italic uppercase tracking-widest">/month</span>
                </div>
                <p className="mt-2 text-xs font-bold text-indigo-400 uppercase tracking-widest">Full Agentic Singularity</p>
              </div>

              <ul className="space-y-4 mb-12 flex-1">
                <TierItem icon={Zap} label="Everything in Base Core" color="text-indigo-400" />
                <TierItem icon={Sparkles} label="Unlimited LiveTalk Avatars" color="text-indigo-400" />
                <TierItem icon={Sparkles} label="High-Fidelity Media Synthesis" color="text-indigo-400" />
                <TierItem icon={BrainCircuit} label="Advanced Reasoning Traces" color="text-indigo-400" />
                <TierItem icon={ShieldCheck} label="Dedicated Compute Priority" color="text-indigo-400" />
              </ul>

              <button 
                onClick={handleSubscribe}
                disabled={loading || isPremium}
                className={cn(
                  "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all",
                  isPremium 
                    ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                    : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-500/20"
                )}
              >
                {loading ? "Initializing Node..." : isPremium ? "Active Subscription" : "Initialize Upgrade"}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Pro Badge Gallery */}
        <div className="flex flex-wrap items-center justify-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
           <Badge icon={Shield} label="SOC2 COMPLIANT" />
           <Badge icon={CreditCard} label="SECURE BILLING" />
           <Badge icon={Headset} label="24/7 PRIORITY" />
           <Badge icon={LayoutDashboard} label="ADMIN CONTROLS" />
        </div>
      </div>

      <PremiumSuccessPopup isOpen={isPopupOpen} onClose={() => { setIsPopupOpen(false); router.push("/chat"); }} />
    </div>
  );
}

function TierItem({ icon: Icon, label, active = true, color = "text-zinc-400" }: any) {
  return (
    <li className={cn("flex items-center gap-4 text-sm font-bold tracking-tight", active ? "text-zinc-200" : "text-zinc-600")}>
      <Icon className={cn("size-5", active ? color : "text-zinc-800")} />
      {label}
    </li>
  );
}

function Badge({ icon: Icon, label }: any) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4" />
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
    </div>
  );
}
