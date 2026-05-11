"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Check, X } from "lucide-react";
import { PERSONAS } from "@/lib/chat/personas";

const CONSENT_VERSION = "v1";
const STORAGE_KEY = `livetalk:doctor-consent-${CONSENT_VERSION}`;

interface DoctorConsentModalProps {
  open: boolean;
  onAccept: () => void;
  onReject: () => void;
}

/**
 * Disclaimer modal shown the first time a user picks the Doctor persona.
 *
 * Why a modal and not inline text:
 *   - The user is about to talk *medical symptoms* to an AI. Any ambiguity
 *     about whether this is real medical advice could harm someone.
 *   - Explicit acknowledgement creates a record of consent.
 *   - One-time prompt (versioned via CONSENT_VERSION) means returning
 *     users aren't nagged.
 *
 * The acknowledgement is purely client-side (localStorage). For a real
 * regulated deployment you'd also want to write the consent timestamp to
 * a server-side audit log — but for a casual companion app, localStorage
 * + versioning is enough.
 */
export default function DoctorConsentModal({
  open,
  onAccept,
  onReject,
}: DoctorConsentModalProps) {
  const doctor = PERSONAS.doctor;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-md rounded-2xl bg-zinc-950 border border-emerald-500/20 shadow-2xl overflow-hidden"
          >
            <header className="px-6 pt-6 pb-3 border-b border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <AlertTriangle className="size-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-amber-400/80 font-bold">
                    Before you start
                  </p>
                  <h2 className="text-base font-semibold text-zinc-100">
                    Talking to {doctor.name}
                  </h2>
                </div>
              </div>
            </header>

            <div className="px-6 py-5">
              {doctor.consentMessage?.split("\n\n").map((para, i) => (
                <p
                  key={i}
                  className="text-sm text-zinc-300 leading-relaxed mb-3 last:mb-0"
                >
                  {para}
                </p>
              ))}
            </div>

            <footer className="px-6 py-4 border-t border-white/5 bg-zinc-900/40 flex items-center justify-end gap-2">
              <button
                onClick={onReject}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
              >
                <X className="size-4" />
                Cancel
              </button>
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem(STORAGE_KEY, "1");
                  }
                  onAccept();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all active:scale-95 shadow-lg shadow-emerald-500/30"
              >
                <Check className="size-4" />
                I understand, continue
              </button>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Returns true if the user has already acknowledged Doctor's disclaimer. */
export function hasDoctorConsent(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}
