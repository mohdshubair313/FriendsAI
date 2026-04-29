"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  X, 
  PhoneOff, 
  Settings, 
  Maximize2,
  Zap,
  Bot,
  BrainCircuit,
  MessageCircle,
  Hand
} from "lucide-react";
import { useRouter } from "next/navigation";
import AudioVisualizer from "./AudioVisualizer";
import LatencyIndicator from "./LatencyIndicator";
import { cn } from "@/lib/utils";

interface LiveTalkOverlayProps {
  onClose: () => void;
  isStreaming: boolean;
  isModelSpeaking: boolean;
  audioLevel: number;
  outputAudioLevel: number;
  onInterrupt: () => void;
  emotion?: "analytical" | "empathetic" | "excited" | "calm";
  latency?: number;
  jitter?: number;
}

export default function LiveTalkOverlay({ 
  onClose, 
  isStreaming, 
  isModelSpeaking, 
  audioLevel, 
  outputAudioLevel,
  onInterrupt,
  emotion = "calm",
  latency = 24,
  jitter = 2
}: LiveTalkOverlayProps) {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isInterrupted, setIsInterrupted] = useState(false);

  const handleInterruptClick = () => {
    setIsInterrupted(true);
    onInterrupt();
    setTimeout(() => setIsInterrupted(false), 800);
  };

  // Dynamic Glow based on emotion
  const emotionColors = {
    analytical: "from-cyan-500/10 to-blue-600/5",
    empathetic: "from-amber-500/10 to-rose-600/5",
    excited: "from-purple-500/10 to-indigo-600/5",
    calm: "from-indigo-500/10 to-emerald-600/5"
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col overflow-hidden">
      {/* Immersive Background Ambient Glow */}
      <div className={cn(
        "absolute inset-0 transition-colors duration-1000 pointer-events-none opacity-40 bg-gradient-to-br",
        emotionColors[emotion]
      )} />

      {/* Header Bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20">
            <Bot className="size-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">Spherial LiveTalk</h1>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-[10px] font-black uppercase text-white animate-pulse">PRO LIVE</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="size-2 rounded-full bg-green-500 animate-ping" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">End-to-End Encrypted Session</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-3 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-all">
            <Settings className="size-5" />
          </button>
          <button 
            onClick={onClose}
            className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area: The Stage */}
      <div className="relative flex-1 flex items-center justify-center px-12 pb-32">
        {/* Avatar Stage with Layout Transition */}
        <motion.div 
           layoutId="livetalk-stage"
           className="relative w-full max-w-4xl aspect-video rounded-[3rem] overflow-hidden glass border-white/5 shadow-2xl bg-zinc-900/40"
        >
           {/* Emotion Glow Ring */}
           <motion.div 
             animate={{ 
               borderColor: isInterrupted ? "rgba(239, 68, 68, 0.8)" : (emotion === "analytical" ? "rgba(6, 182, 212, 0.2)" : "rgba(99, 102, 241, 0.2)"),
               scale: isInterrupted ? [1, 1.05, 1] : 1,
               borderWidth: isInterrupted ? 4 : 2
             }}
             className="absolute inset-0 rounded-[3rem] border-2 transition-colors duration-1000" 
           />

           <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                layoutId="bot-avatar"
                animate={{ 
                  scale: isModelSpeaking ? [1, 1.02, 1] : 1,
                  rotate: isModelSpeaking ? [0, 0.5, -0.5, 0] : 0
                }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="relative"
              >
                {/* Simplified Avatar Representation */}
                <div className="size-48 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 blur-[40px] opacity-20 absolute-center" />
                <Bot className={cn(
                   "size-32 transition-all duration-500",
                   isModelSpeaking ? "text-white drop-shadow-[0_0_30px_rgba(99,102,241,0.5)]" : "text-zinc-700"
                )} />
              </motion.div>
           </div>

           {/* Avatar Overlay Labels */}
           <div className="absolute bottom-10 left-10 flex items-center gap-3">
              <div className="px-4 py-2 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md flex items-center gap-2">
                 <div className={cn("size-2 rounded-full", isModelSpeaking ? "bg-indigo-500 animate-pulse" : "bg-zinc-600")} />
                 <span className="text-xs font-bold text-white uppercase tracking-widest">Neural Core</span>
              </div>
              {isModelSpeaking && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="px-4 py-2 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest"
                >
                  Speaking
                </motion.div>
              )}
           </div>

           {/* Audio Waveform Integrated */}
           <div className="absolute bottom-10 right-10">
              <AudioVisualizer level={isModelSpeaking ? outputAudioLevel : audioLevel} isSpeaking={isModelSpeaking} />
           </div>
        </motion.div>

        {/* Local Camera Mini-Preview */}
        <motion.div 
          drag
          dragConstraints={{ left: -400, right: 400, top: -400, bottom: 200 }}
          className="absolute top-20 right-20 w-64 aspect-video rounded-3xl overflow-hidden glass border-white/10 shadow-2xl z-20 cursor-grab active:cursor-grabbing"
        >
          <div className="absolute inset-0 bg-zinc-900/80 flex items-center justify-center">
             <VideoOff className="size-8 text-zinc-700" />
          </div>
          <div className="absolute bottom-4 left-4 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-[8px] font-bold text-white uppercase tracking-widest">
            Local Preview
          </div>
        </motion.div>
      </div>

      {/* Control Bar (Zoom Style) */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-6">
        <motion.div 
          layoutId="omni-input"
          className="flex items-center gap-4 px-8 py-5 rounded-[2.5rem] bg-zinc-900/80 border border-white/10 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,1)]"
        >
           <ControlCircle 
             icon={isMuted ? MicOff : Mic} 
             active={!isMuted} 
             onClick={() => setIsMuted(!isMuted)} 
             color={isMuted ? "bg-red-500/20 text-red-500" : "bg-white/5 text-zinc-400"}
           />
           <ControlCircle 
             icon={isCameraOff ? VideoOff : Video} 
             active={!isCameraOff} 
             onClick={() => setIsCameraOff(!isCameraOff)}
             color={isCameraOff ? "bg-red-500/20 text-red-500" : "bg-white/5 text-zinc-400"}
           />
           
           <div className="w-px h-8 bg-white/10 mx-2" />

           {/* THE HALT BUTTON (Phase 3) */}
           <button
             onClick={handleInterruptClick}
             disabled={!isModelSpeaking}
             className={cn(
               "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-tighter transition-all active:scale-95",
               isModelSpeaking 
                 ? "bg-red-600 text-white shadow-lg shadow-red-500/20 animate-pulse" 
                 : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
             )}
           >
             <Hand className="size-5" />
             Interrupt Agent
           </button>

           <div className="w-px h-8 bg-white/10 mx-2" />

           <ControlCircle 
             icon={MessageCircle} 
             onClick={() => setShowChat(!showChat)}
             color="bg-white/5 text-zinc-400"
           />
           
           <button
             onClick={onClose}
             className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-black font-black uppercase tracking-tighter hover:bg-zinc-200 transition-all active:scale-95 shadow-xl"
           >
             <PhoneOff className="size-5 fill-black" />
             End Session
           </button>
        </motion.div>
      </div>
      
      {/* Session Metadata Floating Label */}
      <div className="absolute bottom-12 left-12 z-30">
         <LatencyIndicator latency={latency} jitter={jitter} />
      </div>
    </div>
  );
}

function ControlCircle({ icon: Icon, active, onClick, color }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "size-12 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90",
        color
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
