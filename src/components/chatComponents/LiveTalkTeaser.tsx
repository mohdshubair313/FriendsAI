"use client";

import { motion } from "framer-motion";
import { Zap, Bot, ShieldAlert, Sparkles, Video, Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function LiveTalkTeaser() {
  const router = useRouter();

  return (
    <div className="relative h-screen w-full bg-black flex items-center justify-center overflow-hidden p-6">
      {/* Background: Blurred Avatar Teaser */}
      <div className="absolute inset-0 opacity-20 filter blur-[80px] pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full animate-pulse" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-4xl glass rounded-[3rem] border-white/5 overflow-hidden shadow-2xl"
      >
        <div className="flex flex-col md:flex-row h-full min-h-[500px]">
          {/* Visual Teaser Area */}
          <div className="flex-1 bg-zinc-900/40 relative flex items-center justify-center border-r border-white/5">
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
             
             {/* The "Locked" Avatar */}
             <div className="relative">
                <div className="size-48 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center blur-sm scale-110">
                   <Bot className="size-32 text-indigo-500/40" />
                </div>
                <motion.div 
                   animate={{ scale: [1, 1.1, 1] }}
                   transition={{ repeat: Infinity, duration: 2 }}
                   className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-16 rounded-2xl bg-black border border-indigo-500/50 flex items-center justify-center z-20 shadow-2xl"
                >
                   <ShieldAlert className="size-8 text-indigo-400" />
                </motion.div>
             </div>

             {/* Dynamic Capabilities Floating Labels */}
             <div className="absolute top-10 left-10 flex flex-col gap-2 opacity-40">
                <CapabilityTag icon={Video} label="Low-Latency Video" />
                <CapabilityTag icon={Mic} label="Emotional Voice Synthesis" />
                <CapabilityTag icon={Sparkles} label="Face Tracking" />
             </div>
          </div>

          {/* Upsell Content */}
          <div className="w-full md:w-[400px] p-10 flex flex-col justify-center">
            <div className="size-12 rounded-2xl bg-indigo-600 flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20">
               <Zap className="size-6 text-white" />
            </div>
            
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic leading-tight mb-4">
               Unlock the <br />
               <span className="text-indigo-400">Digital Soul.</span>
            </h1>
            
            <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-8">
               Experience full-duplex conversational AI with a real-time multimodal avatar. 
               Spherial Pro members get unlimited low-latency WebRTC sessions and emotional intelligence.
            </p>

            <div className="space-y-3">
               <button 
                  onClick={() => router.push("/premium")}
                  className="w-full group flex items-center justify-between px-6 py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all shadow-xl shadow-white/5 active:scale-95"
               >
                  <span>Initialize Upgrade</span>
                  <Zap className="size-4 fill-black group-hover:animate-pulse" />
               </button>
               
               <button 
                  onClick={() => router.push("/chat")}
                  className="w-full py-4 rounded-2xl border border-white/5 text-zinc-500 font-black uppercase tracking-widest text-[10px] hover:text-white transition-all"
               >
                  Return to Base Interface
               </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating Meta Info */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 opacity-20 grayscale">
         <span className="text-[10px] font-black uppercase tracking-widest text-white">Multimodal Pipeline: Active</span>
         <span className="text-[10px] font-black uppercase tracking-widest text-white">Neural Engine v2.4</span>
      </div>
    </div>
  );
}

function CapabilityTag({ icon: Icon, label }: any) {
   return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
         <Icon className="size-3 text-indigo-400" />
         <span className="text-[8px] font-black uppercase tracking-widest text-white">{label}</span>
      </div>
   );
}
