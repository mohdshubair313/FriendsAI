"use client";

import { motion } from "framer-motion";
import { Sparkles, Terminal, Zap, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const suggestions = [
    {
        icon: <Terminal className="w-4 h-4 text-purple-400" />,
        label: "Write code",
        prompt: "Write a Python script to scrape a website...",
    },
    {
        icon: <Zap className="w-4 h-4 text-amber-400" />,
        label: "Brainstorm",
        prompt: "Give me 5 creative ideas for a startup...",
    },
    {
        icon: <MessageSquare className="w-4 h-4 text-blue-400" />,
        label: "Draft email",
        prompt: "Draft a professional email to a client...",
    },
    {
        icon: <Sparkles className="w-4 h-4 text-pink-400" />,
        label: "Creative writing",
        prompt: "Write a short story about a time traveler...",
    },
];

export default function EmptyState({ onSelect }: { onSelect: (prompt: string) => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto px-4 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 mb-6 shadow-xl shadow-purple-500/10">
                    <Sparkles className="w-8 h-8 text-foreground" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight mb-2">
                    How can I help you today?
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                    I'm Nova, your advanced AI assistant. Ask me anything or choose a suggestion below.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {suggestions.map((item, index) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.3 }}
                    >
                        <Button
                            variant="outline"
                            className="w-full justify-start h-auto py-4 px-4 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                            onClick={() => onSelect(item.prompt)}
                        >
                            <div className="mr-4 p-2 rounded-lg bg-black/20 group-hover:bg-black/30 transition-colors">
                                {item.icon}
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-sm mb-0.5">{item.label}</div>
                                <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                                    {item.prompt}
                                </div>
                            </div>
                        </Button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
