"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Mic, MicOff, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type SpeechRecognitionAlternative = {
    transcript: string;
};

type SpeechRecognitionResult = {
    isFinal: boolean;
    0: SpeechRecognitionAlternative;
};

type SpeechRecognitionEvent = {
    resultIndex: number;
    results: SpeechRecognitionResult[];
};

type SpeechRecognitionInstance = {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    start: () => void;
    stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface VoiceModeProps {
    isOpen: boolean;
    onClose: () => void;
    onSendMessage: (message: string) => void;
    isProcessing: boolean;
    lastMessage?: string;
}

export default function VoiceMode({
    isOpen,
    onClose,
    onSendMessage,
    isProcessing,
    lastMessage,
}: VoiceModeProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    // Track which assistant message we already spoke. Without this, the
    // streaming runner triggers `lastMessage` updates on every token, so
    // SpeechSynthesis would queue 50+ partial utterances per reply.
    const lastSpokenRef = useRef<string>("");

    // Initialize Speech Recognition and Synthesis
    useEffect(() => {
        if (typeof window !== "undefined") {
            // Speech Recognition
            const speechWindow = window as Window & {
                SpeechRecognition?: SpeechRecognitionConstructor;
                webkitSpeechRecognition?: SpeechRecognitionConstructor;
            };
            const SpeechRecognition =
                speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = true;
                recognition.lang = "en-US";

                recognition.onstart = () => setIsListening(true);
                recognition.onend = () => setIsListening(false);

                recognition.onresult = (event: SpeechRecognitionEvent) => {
                    const current = event.resultIndex;
                    const transcriptText = event.results[current][0].transcript;
                    setTranscript(transcriptText);

                    if (event.results[current].isFinal) {
                        onSendMessage(transcriptText);
                        setTranscript("");
                    }
                };

                recognitionRef.current = recognition;
            } else {
                toast.error("Speech recognition not supported in this browser.");
            }

            // Speech Synthesis
            synthRef.current = window.speechSynthesis;
        }
    }, [onSendMessage]);

    // Handle Text-to-Speech for AI responses.
    //
    // Fires only when:
    //   • the assistant has finished streaming (`!isProcessing`),
    //   • there is text to speak,
    //   • we haven't already spoken this exact text.
    //
    // The third check is the important one: streaming updates `lastMessage`
    // on every token, so without de-duping we'd queue dozens of partial
    // utterances per reply.
    useEffect(() => {
        if (!lastMessage || !synthRef.current || isProcessing) return;
        if (lastSpokenRef.current === lastMessage) return;
        lastSpokenRef.current = lastMessage;

        synthRef.current.cancel();

        // Strip markdown so the voice doesn't read "asterisk asterisk".
        const spoken = lastMessage
            .replace(/```[\s\S]*?```/g, " ")
            .replace(/`([^`]+)`/g, "$1")
            .replace(/[*_#>]/g, "")
            .replace(/\[(.*?)\]\([^)]*\)/g, "$1")
            .replace(/\s{2,}/g, " ")
            .trim();
        if (!spoken) return;

        const utterance = new SpeechSynthesisUtterance(spoken);
        const voices = synthRef.current.getVoices();
        const preferredVoice = voices.find(
            (v) => v.name.includes("Google US English") || v.name.includes("Samantha") || v.lang === "en-US"
        );
        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.rate = 1;
        utterance.pitch = 1;
        synthRef.current.speak(utterance);
    }, [lastMessage, isProcessing]);

    // Stop any in-flight speech when the modal closes.
    useEffect(() => {
        return () => {
            if (typeof window !== "undefined") window.speechSynthesis?.cancel();
        };
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
        }
    };

    // Visualizer bars animation variants
    const barVariants: Variants = {
        initial: { height: 20 },
        animate: {
            height: [20, 60, 20, 80, 30],
            transition: {
                repeat: Infinity,
                duration: 1.5,
                ease: "easeInOut" as const,
            },
        },
        idle: {
            height: 20,
            transition: { duration: 0.5 },
        },
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: "100%" }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-50 bg-black text-white flex flex-col items-center justify-center overflow-hidden"
                >
                    {/* Background Gradient Animation */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-900/40 via-black to-black animate-pulse-slow" />

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Main Content */}
                    <div className="relative z-10 flex flex-col items-center gap-12 max-w-2xl px-6 text-center">

                        {/* Status Text */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-2"
                        >
                            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
                                {isProcessing ? "AI is thinking..." : isListening ? "Listening..." : "Tap to Speak"}
                            </h2>
                            <p className="text-gray-400 text-lg min-h-[2rem]">
                                {transcript || (isProcessing ? "" : "Go ahead, I'm listening.")}
                            </p>
                        </motion.div>

                        {/* Visualizer / Avatar */}
                        <div className="relative w-64 h-64 flex items-center justify-center">
                            {/* Glow Effect */}
                            <div className={`absolute inset-0 bg-violet-500/30 blur-[60px] rounded-full transition-opacity duration-500 ${isListening || isProcessing ? "opacity-100" : "opacity-30"}`} />

                            {/* Central Circle */}
                            <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-[0_0_40px_rgba(139,92,246,0.5)] flex items-center justify-center overflow-hidden">
                                {isProcessing ? (
                                    <Loader2 className="w-16 h-16 animate-spin text-white/80" />
                                ) : (
                                    <div className="flex items-center justify-center gap-1.5 h-full">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <motion.div
                                                key={i}
                                                variants={barVariants}
                                                initial="initial"
                                                animate={isListening ? "animate" : "idle"}
                                                custom={i}
                                                className="w-2 bg-white/80 rounded-full"
                                                style={{ animationDelay: `${i * 0.1}s` }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-6">
                            <Button
                                size="lg"
                                onClick={toggleListening}
                                disabled={isProcessing}
                                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${isListening
                                        ? "bg-red-500 hover:bg-red-600 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                                        : "bg-white text-black hover:bg-gray-200 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                                    }`}
                            >
                                {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
