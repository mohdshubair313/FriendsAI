"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X } from "lucide-react";
import VoiceOrb from "@/components/ai/VoiceOrb";
import MatrixOrb from "@/components/ui/matrix-orb";
import { AiStatus } from "@/components/ui/ai-status";
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
    onerror: (() => void) | null;
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
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [supported, setSupported] = useState(false);
    const sendRef = useRef(onSendMessage);
    const onCloseRef = useRef(onClose);
    const closeRef = useRef<HTMLButtonElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    useEffect(() => { sendRef.current = onSendMessage; }, [onSendMessage]);
    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    // Track which assistant message we already spoke. Without this, the
    // streaming runner triggers `lastMessage` updates on every token, so
    // SpeechSynthesis would queue 50+ partial utterances per reply.
    const lastSpokenRef = useRef<string>(lastMessage ?? "");

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
                setSupported(true);
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = true;
                recognition.lang = "en-US";

                recognition.onstart = () => setIsListening(true);
                recognition.onend = () => setIsListening(false);
                recognition.onerror = () => {
                    setIsListening(false);
                    toast.error("Microphone unavailable. Check your browser permission and try again.");
                };

                recognition.onresult = (event: SpeechRecognitionEvent) => {
                    const current = event.resultIndex;
                    const transcriptText = event.results[current][0].transcript;
                    setTranscript(transcriptText);

                    if (event.results[current].isFinal) {
                        sendRef.current(transcriptText);
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
        return () => {
            const recognition = recognitionRef.current;
            if (recognition) {
                recognition.onstart = recognition.onend = recognition.onresult = recognition.onerror = null;
                recognition.stop();
            }
        };
    }, []);

    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        closeRef.current?.focus();
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") onCloseRef.current();
            if (event.key === "Tab") {
                const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
                if (!buttons?.length) return;
                const first = buttons[0], last = buttons[buttons.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }
        };
        document.addEventListener("keydown", onKey);
        return () => { document.removeEventListener("keydown", onKey); previous?.focus(); };
    }, []);

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
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = utterance.onerror = () => setIsSpeaking(false);
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
            synthRef.current?.cancel();
            setIsSpeaking(false);
            recognitionRef.current?.start();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="voice-title"
                    initial={{ opacity: 0, y: "100%" }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-[120] bg-black text-white flex flex-col items-center justify-center overflow-hidden"
                >
                    {/* Background Gradient Animation */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-900/40 via-black to-black animate-pulse-slow" />

                    {/* Close Button */}
                    <button
                        ref={closeRef} aria-label="Close voice mode"
                        onClick={onClose}
                        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-50"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Main Content */}
                    <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-10 max-w-2xl px-6 text-center">

                        {/* Status Text */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-2"
                        >
                            <h2 id="voice-title" className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
                                Voice conversation
                            </h2>
                            <AiStatus className="mx-auto" timer={isProcessing}
                                state={isProcessing ? "thinking" : isListening ? "listening" : isSpeaking ? "speaking" : "ready"}
                                states={{ listening: { label: "Listening", active: true }, speaking: { label: "Speaking", active: true }, ready: { label: "Tap the mic to speak", active: false } }} />
                            <p className="text-gray-400 text-lg min-h-[2rem]">
                                {transcript || (!supported ? "Speech recognition is unavailable in this browser." : "")}
                            </p>
                        </motion.div>

                        {/* Visualizer / Avatar */}
                        <VoiceOrb color={isListening ? "#14b8a6" : "#8b5cf6"} size={240} />
                        <MatrixOrb size={42} color="#c4b5fd" className="gap-0 [&>span]:sr-only"
                            state={isProcessing ? "thinking" : isListening || isSpeaking ? "listening" : "idle"}
                            labels={{ listening: isSpeaking ? "Speaking" : "Listening" }} />

                        {/* Controls */}
                        <div className="flex items-center gap-6">
                            <Button
                                size="lg"
                                onClick={toggleListening}
                                disabled={isProcessing || !supported}
                                aria-label={isListening ? "Stop microphone" : "Start microphone"}
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
