"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, SkipForward, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setLocale, saveLocale } from "@/store/slices/localeSlice";
import { setPersona, savePersona } from "@/store/slices/personaSlice";
import { setVoiceStyle, saveVoice, loadVoice } from "@/store/slices/voiceSlice";
import { COUNTRIES, languagesForCountry, DEFAULT_COUNTRY, DEFAULT_LANGUAGE } from "@/lib/locale/catalog";
import { PERSONAS, PERSONA_KEYS } from "@/lib/chat/personas";
import { VOICE_STYLES, type VoiceStyleId } from "@/lib/voices/catalog";
import type { BuddyPersona } from "@/models/userModel";
import { cn } from "@/lib/utils";
import DoctorConsentModal, { hasDoctorConsent } from "./DoctorConsentModal";

/**
 * 4-step onboarding wizard shown on the user's first /live_talk visit.
 *   1. Country     → ISO code
 *   2. Language    → BCP-47 (filtered by country)
 *   3. Voice Style → maps to Sarvam speaker at TTS time
 *   4. AI Role     → persona key
 *
 * Each step writes through to Redux + Mongo immediately (no "save at end"
 * pattern — if the user closes the tab between step 2 and 3, their
 * country + language are already saved).
 *
 * Closes by either completing all 4 steps or skipping (→ defaults applied).
 */

type Step = "intro" | "country" | "language" | "voice" | "persona" | "done";

const STEP_ORDER: Step[] = ["intro", "country", "language", "voice", "persona", "done"];

interface OnboardingWizardProps {
  open: boolean;
  onClose: () => void;
}

export default function OnboardingWizard({ open, onClose }: OnboardingWizardProps) {
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const locale = useAppSelector((s) => s.locale);
  const persona = useAppSelector((s) => s.persona.selected);
  const voiceFromStore = useAppSelector((s) => s.voice);

  // Lazy-load saved voice style so the wizard reflects prior choice if
  // the user reopens via the Reconfigure button.
  useEffect(() => {
    if (voiceFromStore.status === "idle") void dispatch(loadVoice());
  }, [voiceFromStore.status, dispatch]);

  const [step, setStep] = useState<Step>("intro");
  const [country, setCountry] = useState<string>(locale.country || DEFAULT_COUNTRY);
  const [language, setLanguage] = useState<string>(locale.primaryLanguage || DEFAULT_LANGUAGE);
  const [voiceStyle, setLocalVoiceStyle] = useState<VoiceStyleId>(voiceFromStore.style);
  const [role, setRole] = useState<BuddyPersona>(persona);

  // Sync local state when the store loads the saved value (so re-opening
  // the wizard mid-session shows the user's existing pick highlighted).
  useEffect(() => {
    if (voiceFromStore.status === "ready") setLocalVoiceStyle(voiceFromStore.style);
  }, [voiceFromStore.status, voiceFromStore.style]);
  // True when Next was clicked on the persona step with Doctor picked + no
  // prior consent — the modal pops, we wait for accept/reject.
  const [showDoctorConsent, setShowDoctorConsent] = useState(false);

  const stepIdx = STEP_ORDER.indexOf(step);
  // 4 real steps (country/language/voice/persona), intro + done are bookends.
  const totalSteps = 4;
  const progressIdx = Math.min(Math.max(stepIdx - 1, 0), totalSteps);

  // Lock to chosen country's available languages.
  const availableLangs = useMemo(() => languagesForCountry(country), [country]);
  useEffect(() => {
    if (!availableLangs.some((l) => l.code === language) && availableLangs[0]) {
      setLanguage(availableLangs[0].code);
    }
  }, [availableLangs, language]);

  const goNext = () => {
    const next = STEP_ORDER[stepIdx + 1] ?? "done";
    if (next === "done") complete();
    else setStep(next);
  };
  const goBack = () => {
    const prev = STEP_ORDER[Math.max(0, stepIdx - 1)];
    setStep(prev);
  };

  // Side-effect: write a step's value to Redux + server when leaving the step.
  const commitStep = async (leaving: Step) => {
    if (leaving === "country" || leaving === "language") {
      dispatch(setLocale({ country, primaryLanguage: language }));
      void dispatch(saveLocale({ country, primaryLanguage: language }));
    }
    if (leaving === "persona") {
      dispatch(setPersona(role));
      void dispatch(savePersona(role));
    }
    if (leaving === "voice") {
      // Persist to Redux first (so live_talk's voiceStyleRef picks it up
      // immediately) then fire-and-forget the server write.
      dispatch(setVoiceStyle(voiceStyle));
      void dispatch(saveVoice(voiceStyle));
    }
  };

  const handleNext = async () => {
    // Doctor gate: on the persona step, if user picked Doctor and hasn't
    // acknowledged the disclaimer, intercept and show the modal first.
    if (step === "persona" && role === "doctor" && !hasDoctorConsent()) {
      setShowDoctorConsent(true);
      return;
    }
    await commitStep(step);
    goNext();
  };

  const complete = () => {
    // Mark onboarded so we don't re-prompt next visit.
    if (typeof window !== "undefined") {
      window.localStorage.setItem("livetalk:onboarded", "1");
    }
    onClose();
  };

  const skip = () => {
    // Just mark onboarded; the defaults we've already showed are already
    // sitting in Redux, so the live session works fine.
    complete();
  };

  if (!open) return null;

  return (
    <>
    <DoctorConsentModal
      open={showDoctorConsent}
      onAccept={async () => {
        setShowDoctorConsent(false);
        await commitStep(step);
        goNext();
      }}
      onReject={() => setShowDoctorConsent(false)}
    />
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Header — branding + step progress */}
        <header className="px-8 pt-7 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center">
                <Sparkles className="size-4 text-indigo-300" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                  Friends LiveTalk
                </p>
                <h1 className="text-base font-semibold text-zinc-100">
                  {step === "intro"
                    ? `Hey ${session?.user?.name?.split(" ")[0] ?? "there"} 👋`
                    : "Set up your AI"}
                </h1>
              </div>
            </div>
            {step !== "intro" && step !== "done" && (
              <button
                onClick={skip}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
              >
                <SkipForward className="size-3" />
                Skip
              </button>
            )}
          </div>
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  i < progressIdx ? "bg-indigo-400" : i === progressIdx - 1 ? "bg-indigo-300" : "bg-white/10"
                )}
              />
            ))}
          </div>
        </header>

        {/* Step body */}
        <div className="px-8 py-6 min-h-[280px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              {step === "intro" && <IntroBody onStart={() => setStep("country")} />}
              {step === "country" && (
                <CountryBody value={country} onPick={setCountry} />
              )}
              {step === "language" && (
                <LanguageBody
                  country={country}
                  value={language}
                  onPick={setLanguage}
                />
              )}
              {step === "voice" && (
                <VoiceBody value={voiceStyle} onPick={setLocalVoiceStyle} />
              )}
              {step === "persona" && (
                <PersonaBody value={role} onPick={setRole} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        {step !== "intro" && (
          <footer className="px-8 py-5 border-t border-white/5 flex items-center justify-between bg-zinc-950/40">
            <button
              onClick={goBack}
              disabled={stepIdx <= 1}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                stepIdx <= 1
                  ? "text-zinc-700 cursor-not-allowed"
                  : "text-zinc-300 hover:bg-white/5"
              )}
            >
              <ChevronLeft className="size-4" />
              Back
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all active:scale-95 shadow-lg shadow-indigo-500/30"
            >
              {step === "persona" ? (
                <>
                  Start LiveTalk
                  <Check className="size-4" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="size-4" />
                </>
              )}
            </button>
          </footer>
        )}
      </motion.div>
    </div>
    </>
  );
}

// ─── Step bodies ─────────────────────────────────────────────────────────────

function IntroBody({ onStart }: { onStart: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="mb-5 inline-flex size-16 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-500/20 border border-indigo-400/30 items-center justify-center text-3xl">
        🎙️
      </div>
      <h2 className="text-2xl font-bold text-zinc-100 mb-2 tracking-tight">
        Let's set up your AI companion
      </h2>
      <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto mb-7">
        Four quick choices: where you're from, your language, voice style, and which
        AI role you'd like to talk to. Takes 30 seconds. You can change any of these later.
      </p>
      <button
        onClick={onStart}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all active:scale-95 shadow-lg shadow-indigo-500/30"
      >
        Get started
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

function CountryBody({ value, onPick }: { value: string; onPick: (c: string) => void }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-100 mb-1">Where are you based?</h2>
      <p className="text-xs text-zinc-500 mb-5">
        Helps us match the right languages and voice styles.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {COUNTRIES.map((c) => {
          const active = value === c.code;
          return (
            <button
              key={c.code}
              onClick={() => onPick(c.code)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left",
                active
                  ? "bg-indigo-500/15 border-indigo-400/50 shadow-[0_0_18px_rgba(99,102,241,0.25)]"
                  : "bg-white/[0.03] border-white/10 hover:border-white/25"
              )}
            >
              <span className="text-2xl">{c.flag}</span>
              <span
                className={cn(
                  "text-sm font-medium",
                  active ? "text-indigo-100" : "text-zinc-300"
                )}
              >
                {c.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LanguageBody({
  country,
  value,
  onPick,
}: {
  country: string;
  value: string;
  onPick: (lang: string) => void;
}) {
  const langs = useMemo(() => languagesForCountry(country), [country]);
  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-100 mb-1">
        Which language do you want to talk in?
      </h2>
      <p className="text-xs text-zinc-500 mb-5">
        For Indian regional languages, we use Sarvam AI for native pronunciation.
      </p>
      <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1 no-scrollbar">
        {langs.map((l) => {
          const active = value === l.code;
          return (
            <button
              key={l.code}
              onClick={() => onPick(l.code)}
              className={cn(
                "px-3 py-2.5 rounded-xl border transition-all text-left",
                active
                  ? "bg-indigo-500/15 border-indigo-400/50 shadow-[0_0_18px_rgba(99,102,241,0.25)]"
                  : "bg-white/[0.03] border-white/10 hover:border-white/25"
              )}
            >
              <p
                className={cn(
                  "text-sm font-semibold",
                  active ? "text-indigo-100" : "text-zinc-200"
                )}
              >
                {l.name}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
                {l.code}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function VoiceBody({ value, onPick }: { value: VoiceStyleId; onPick: (v: VoiceStyleId) => void }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-100 mb-1">
        What should the AI sound like?
      </h2>
      <p className="text-xs text-zinc-500 mb-5">
        Pick the vibe. Routes to the right Sarvam speaker under the hood.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {VOICE_STYLES.map((v) => {
          const active = value === v.id;
          return (
            <button
              key={v.id}
              onClick={() => onPick(v.id)}
              className={cn(
                "p-3 rounded-xl border transition-all text-left",
                active
                  ? "bg-indigo-500/15 border-indigo-400/50 shadow-[0_0_18px_rgba(99,102,241,0.25)]"
                  : "bg-white/[0.03] border-white/10 hover:border-white/25"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{v.emoji}</span>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    active ? "text-indigo-100" : "text-zinc-200"
                  )}
                >
                  {v.name}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-snug">{v.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PersonaBody({
  value,
  onPick,
}: {
  value: BuddyPersona;
  onPick: (p: BuddyPersona) => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-100 mb-1">
        Which AI role do you want to talk to?
      </h2>
      <p className="text-xs text-zinc-500 mb-5">
        Each character has its own personality, behaviour, and look.
      </p>
      <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1 no-scrollbar">
        {PERSONA_KEYS.map((key) => {
          const p = PERSONAS[key];
          const active = value === key;
          return (
            <button
              key={key}
              onClick={() => onPick(key)}
              className={cn(
                "p-3 rounded-xl border transition-all text-left",
                active
                  ? "bg-indigo-500/15 border-indigo-400/50 shadow-[0_0_18px_rgba(99,102,241,0.25)]"
                  : "bg-white/[0.03] border-white/10 hover:border-white/25"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{p.emoji}</span>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    active ? "text-indigo-100" : "text-zinc-200"
                  )}
                >
                  {p.name}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-snug">{p.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
