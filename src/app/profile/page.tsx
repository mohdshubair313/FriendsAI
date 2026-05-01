"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Crown,
  Sparkles,
  Mail,
  User as UserIcon,
  Globe,
  Languages,
  ImageIcon,
  Mic,
  Bot,
  Video,
  CheckCircle2,
  XCircle,
  LogOut,
  Calendar,
  Github,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ProfileData {
  user: {
    id: string;
    username: string;
    email: string;
    image: string | null;
    providers: string[];
    createdAt: string;
    onboardingCompletedAt: string | null;
    locale: {
      country?: string;
      state?: string;
      city?: string;
      timezone?: string;
      primaryLanguage?: string;
    } | null;
    preferences: {
      buddyPersona?: string;
      ttsVoiceId?: string;
    } | null;
  };
  subscription: {
    tier: "free" | "pro";
    isPremium: boolean;
    features: {
      imageGeneration: boolean;
      voiceConversational: boolean;
      advancedAgents: boolean;
      liveAvatar: boolean;
    };
    remaining: {
      imagesToday: number;
      voiceSecondsToday: number;
    };
  };
}

const FEATURE_CATALOG = [
  { key: "imageGeneration", label: "Image generation", icon: ImageIcon },
  { key: "voiceConversational", label: "Voice conversations", icon: Mic },
  { key: "advancedAgents", label: "Advanced agents", icon: Bot },
  { key: "liveAvatar", label: "Live avatar (Pro)", icon: Video },
] as const;

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/signin");
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (alive) setData(json);
      } catch (err: any) {
        if (alive) setError(err?.message ?? "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [sessionStatus]);

  if (loading || sessionStatus === "loading") {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="size-8 rounded-full border-2 border-indigo-500/40 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-dvh items-center justify-center px-6 text-center">
        <div>
          <p className="text-rose-300 text-sm mb-2">Couldn't load your profile.</p>
          <p className="text-zinc-500 text-xs">{error}</p>
        </div>
      </div>
    );
  }

  const { user, subscription } = data;
  const isPro = subscription.isPremium;
  const initials = (user.username || user.email || "U").trim().charAt(0).toUpperCase();

  return (
    <div className="h-dvh overflow-y-auto no-scrollbar">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-1">Your account</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Profile</h1>
        </motion.header>

        {/* Identity card */}
        <Card>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                className="size-20 rounded-2xl object-cover ring-1 ring-white/10"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="size-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl font-semibold text-white truncate">{user.username}</h2>
                <PlanBadge isPro={isPro} />
              </div>
              <p className="text-sm text-zinc-400 truncate flex items-center gap-1.5">
                <Mail className="size-3.5" />
                {user.email}
              </p>
              <p className="text-xs text-zinc-500 mt-1.5 flex items-center gap-1.5">
                <Calendar className="size-3" />
                Joined {fmtDate(user.createdAt)}
              </p>
            </div>
            {!isPro && (
              <Link
                href="/premium"
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-semibold transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.45)]"
              >
                <Sparkles className="size-4" />
                Upgrade to Pro
              </Link>
            )}
          </div>
        </Card>

        {/* Subscription card */}
        <Card title="Subscription">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mb-5">
            <Field label="Plan" value={isPro ? "Pro" : "Free"} highlight={isPro} />
            <Field
              label="Status"
              value={isPro ? "Active" : "No active subscription"}
              valueClass={isPro ? "text-emerald-400" : "text-zinc-300"}
            />
          </div>

          <div className="border-t border-white/5 pt-5">
            <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-3 font-medium">Features</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FEATURE_CATALOG.map(({ key, label, icon: Icon }) => {
                const enabled = subscription.features[key as keyof typeof subscription.features];
                return (
                  <li
                    key={key}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm border",
                      enabled
                        ? "border-emerald-500/15 bg-emerald-500/5 text-zinc-100"
                        : "border-white/5 bg-white/[0.02] text-zinc-500"
                    )}
                  >
                    <Icon className={cn("size-4 shrink-0", enabled ? "text-emerald-400" : "text-zinc-600")} />
                    <span className="flex-1">{label}</span>
                    {enabled ? (
                      <CheckCircle2 className="size-4 text-emerald-400" />
                    ) : (
                      <XCircle className="size-4 text-zinc-600" />
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Daily quotas — only meaningful on free where they're capped */}
          {!isPro && (
            <div className="border-t border-white/5 pt-5 mt-5">
              <p className="text-[11px] uppercase tracking-widest text-zinc-500 mb-3 font-medium">Today's usage</p>
              <div className="grid grid-cols-2 gap-3">
                <Quota label="Images" value={subscription.remaining.imagesToday} suffix="left" />
                <Quota label="Voice" value={Math.round(subscription.remaining.voiceSecondsToday)} suffix="sec left" />
              </div>
            </div>
          )}
        </Card>

        {/* Account details */}
        <Card title="Account">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            <Field
              label="User ID"
              value={user.id}
              valueClass="font-mono text-xs text-zinc-400 truncate"
            />
            <Field label="Sign-in methods" value={
              <div className="flex flex-wrap gap-1.5">
                {user.providers.length === 0 && <span className="text-zinc-500 text-sm">—</span>}
                {user.providers.map((p) => (
                  <ProviderChip key={p} name={p} />
                ))}
              </div>
            } />
            <Field label="Onboarded" value={fmtDate(user.onboardingCompletedAt)} />
            <Field label="Account created" value={fmtDate(user.createdAt)} />
          </div>
        </Card>

        {/* Locale + Preferences */}
        {(user.locale || user.preferences) && (
          <Card title="Preferences">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              {user.locale && (
                <>
                  <Field
                    label="Country"
                    value={
                      <span className="inline-flex items-center gap-1.5">
                        <Globe className="size-3.5 text-zinc-500" />
                        {user.locale.country ?? "—"}
                      </span>
                    }
                  />
                  <Field
                    label="Language"
                    value={
                      <span className="inline-flex items-center gap-1.5">
                        <Languages className="size-3.5 text-zinc-500" />
                        {user.locale.primaryLanguage ?? "—"}
                      </span>
                    }
                  />
                  {user.locale.timezone && <Field label="Timezone" value={user.locale.timezone} />}
                  {user.locale.city && <Field label="City" value={user.locale.city} />}
                </>
              )}
              {user.preferences?.buddyPersona && (
                <Field label="Default persona" value={user.preferences.buddyPersona} />
              )}
              {user.preferences?.ttsVoiceId && (
                <Field label="TTS voice" value={user.preferences.ttsVoiceId} />
              )}
            </div>
          </Card>
        )}

        {/* Quick actions */}
        <Card title="Account actions">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 text-sm font-medium transition-all border border-white/5"
            >
              Back to chat
              <ExternalLink className="size-3.5" />
            </Link>
            {!isPro && (
              <Link
                href="/premium"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-200 text-sm font-medium transition-all border border-indigo-500/30"
              >
                <Crown className="size-4" />
                See Pro plans
              </Link>
            )}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-sm font-medium transition-all border border-rose-500/20 ml-auto"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </Card>

        <p className="mt-8 text-center text-xs text-zinc-600">
          Need help with your account? <Link href="/feedback" className="text-zinc-400 hover:text-indigo-300">Contact support</Link>
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-5 rounded-2xl border border-white/5 bg-white/[0.02] p-5 md:p-6 backdrop-blur-sm"
    >
      {title && (
        <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-medium mb-4">
          {title}
        </h3>
      )}
      {children}
    </motion.section>
  );
}

function Field({
  label,
  value,
  valueClass,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] text-zinc-500 mb-0.5">{label}</p>
      <p
        className={cn(
          "text-sm",
          highlight ? "text-amber-300 font-semibold" : "text-zinc-200",
          valueClass
        )}
      >
        {value}
      </p>
    </div>
  );
}

function PlanBadge({ isPro }: { isPro: boolean }) {
  if (isPro) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-widest">
        <Crown className="size-3" />
        Pro
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
      Free
    </span>
  );
}

function Quota({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3">
      <p className="text-[11px] text-zinc-500 mb-0.5">{label}</p>
      <p className="text-lg font-semibold text-white">
        {value}
        <span className="text-xs font-medium text-zinc-500 ml-1.5">{suffix}</span>
      </p>
    </div>
  );
}

function ProviderChip({ name }: { name: string }) {
  const display = name.charAt(0).toUpperCase() + name.slice(1);
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300 text-[11px] font-medium">
      {name === "github" && <Github className="size-3" />}
      {name === "google" && <UserIcon className="size-3" />}
      {name === "email" && <Mail className="size-3" />}
      {display}
    </span>
  );
}
