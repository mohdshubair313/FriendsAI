"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Link from "next/link";
import { User, Mail, MessageSquare, ArrowLeft, Send } from "lucide-react";
import Logo from "@/components/Logo";
import { feedbackSchema } from "@/lib/schemas";

const FeedbackPage = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = feedbackSchema.safeParse(form);
    if (!parsed.success) {
      return toast.error(parsed.error.errors[0]?.message ?? "Please fill in all fields correctly");
    }

    setIsLoading(true);
    const toastId = toast.loading("Sending feedback...");

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to send feedback", { id: toastId });
        return;
      }

      toast.success("Feedback sent! Thank you.", { id: toastId });
      setForm({ name: "", email: "", message: "" });
    } catch {
      toast.error("Something went wrong. Please try again.", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse,rgba(120,53,15,0.2)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Nav */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo className="size-8" />
            <span className="text-base font-semibold text-stone-100 group-hover:text-amber-400 transition-colors">
              Friends AI
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-stone-500 hover:text-stone-300 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-stone-900/60 backdrop-blur-xl border border-stone-800/60 rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
        >
          {/* Header */}
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400/90 text-xs font-medium tracking-wide mb-4">
              <MessageSquare className="w-3 h-3" />
              Feedback
            </span>
            <h1 className="text-2xl font-semibold text-stone-100">Share your thoughts</h1>
            <p className="text-sm text-stone-500 mt-1.5">
              Your feedback shapes Friends AI. We read every message.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Name */}
            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5 block">
                Your Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" />
                <input
                  name="name"
                  type="text"
                  placeholder="Jane Doe"
                  value={form.name}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-stone-800/60 border border-stone-700/60 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 text-stone-100 placeholder-stone-500 rounded-xl outline-none transition-all duration-200 text-sm disabled:opacity-50"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5 block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" />
                <input
                  name="email"
                  type="email"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-stone-800/60 border border-stone-700/60 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 text-stone-100 placeholder-stone-500 rounded-xl outline-none transition-all duration-200 text-sm disabled:opacity-50"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-stone-400 uppercase tracking-wide">
                  Your Message
                </label>
                <span className="text-xs text-stone-600">
                  {form.message.length}/2000
                </span>
              </div>
              <textarea
                name="message"
                placeholder="Tell us what you think, what could be better, or what you love..."
                value={form.message}
                onChange={handleChange}
                disabled={isLoading}
                required
                rows={5}
                maxLength={2000}
                className="w-full px-4 py-3 bg-stone-800/60 border border-stone-700/60 focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 text-stone-100 placeholder-stone-500 rounded-xl outline-none transition-all duration-200 text-sm disabled:opacity-50 resize-none"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-xl transition-all duration-200 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Send className="w-4 h-4" />
              {isLoading ? "Sending..." : "Send Feedback"}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default FeedbackPage;
