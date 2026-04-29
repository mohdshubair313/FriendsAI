"use client";

export const dynamic = "force-dynamic";

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from "@/store/hooks";
import LiveTalkOverlay from '@/components/chatComponents/LiveTalkOverlay';
import LiveTalkTeaser from '@/components/chatComponents/LiveTalkTeaser';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ShieldAlert, Zap } from 'lucide-react';

export default function LiveTalkPage() {
  const { data: session, status: sessionStatus } = useSession();
  const isPremium = useAppSelector((s) => s.premium.isPremium);
  const premiumStatus = useAppSelector((s) => s.premium.status);
  const router = useRouter();

  const [isStreaming, setIsStreaming] = useState(true);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [outputAudioLevel, setOutputAudioLevel] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // Entitlement Gate
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/signin");
      return;
    }

    if (premiumStatus === "success" && !isPremium) {
      toast.error("LiveTalk is a Pro feature. Redirecting to Upgrade...");
      setTimeout(() => router.push("/premium"), 2000);
    }
  }, [sessionStatus, isPremium, premiumStatus, router]);

  const handleInterrupt = useCallback(async () => {
    try {
      await fetch("/api/voice/interrupt", { method: "POST" });
      setIsModelSpeaking(false);
      // No toast for auto-interrupt to keep it feeling natural
    } catch (err) {
      console.error("Failed to interrupt:", err);
    }
  }, []);

  // Auto-Interruption Logic: Sustained speech detection to avoid noise triggers
  const speechFramesRef = useRef(0);
  useEffect(() => {
    const INTERRUPT_THRESHOLD = 30; // 30% audio level
    const SUSTAINED_FRAMES = 3;      // Must be above threshold for 3 frames (~300ms)

    if (isModelSpeaking && audioLevel > INTERRUPT_THRESHOLD) {
      speechFramesRef.current += 1;
      if (speechFramesRef.current >= SUSTAINED_FRAMES) {
        handleInterrupt();
        speechFramesRef.current = 0;
      }
    } else {
      speechFramesRef.current = 0;
    }
  }, [audioLevel, isModelSpeaking, handleInterrupt]);

  if (sessionStatus === "loading" || premiumStatus === "loading" || isExiting) {
    return (
      <div className='flex h-screen items-center justify-center bg-black overflow-hidden'>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0%,transparent_70%)]" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 z-10"
        >
          <div className="relative">
            <div className="size-16 rounded-full border-t-2 border-indigo-500 animate-spin" />
            {isExiting && <div className="absolute inset-0 size-16 rounded-full border-r-2 border-red-500 animate-pulse" />}
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">
              {isExiting ? "Neural Link Severing" : "Authenticating Neural Link"}
            </span>
            {isExiting && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest"
              >
                Redirecting to Billing Dashboard...
              </motion.span>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Teaser State for Non-Pro Users
  if (premiumStatus === "success" && !isPremium) {
    return <LiveTalkTeaser />;
  }

  return (
    <LiveTalkOverlay 
      isStreaming={isStreaming}
      isModelSpeaking={isModelSpeaking}
      audioLevel={audioLevel}
      outputAudioLevel={outputAudioLevel}
      onClose={() => router.push("/chat")}
      onInterrupt={handleInterrupt}
      emotion="calm"
    />
  );
}
