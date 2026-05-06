"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ImageIcon,
  Sparkles,
  Loader2,
  X,
  Download,
  Calendar,
  AlertCircle,
  RefreshCcw,
} from "lucide-react";
import Link from "next/link";

import ChatNavbar from "@/components/chatComponents/ChatNavbar";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

/**
 * Image Studio
 *
 * Gallery view of every image the logged-in user has generated. Pulled
 * from /api/media/list (which returns succeeded MediaJob rows joined with
 * the Cloudinary URL).
 *
 * Shape:
 *   - Top: ChatNavbar (consistent with /chat) + a "Generate new" CTA
 *   - Body: responsive grid (2/3/4/5 cols depending on viewport)
 *   - Click image → fullscreen lightbox with prompt + download
 *   - Empty / loading / error states all handled inline
 */

interface ImageItem {
  id: string;
  conversationId: string | null;
  prompt: string;
  modelId: string;
  url: string;
  createdAt: string;
  finishedAt: string;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return "just now";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ImageStudioPage() {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const isPremium = useAppSelector((s) => s.premium.isPremium);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ImageItem | null>(null);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/media/list", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { images: ImageItem[] };
      setImages(json.images);
    } catch (err) {
      console.error("[images] load failed:", err);
      setError("Couldn't load your images. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/signin?callbackUrl=/images");
      return;
    }
    if (sessionStatus === "authenticated") {
      void fetchImages();
    }
  }, [sessionStatus, fetchImages, router]);

  // Close lightbox on Escape
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  if (sessionStatus === "loading") {
    return (
      <div className="h-dvh flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="relative h-dvh flex flex-col overflow-hidden">
      <ChatNavbar isPremium={isPremium} />

      <main className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
          {/* Header */}
          <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <span className="size-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <ImageIcon className="size-5 text-white" />
                </span>
                Image Studio
              </h1>
              <p className="text-zinc-400 text-sm mt-2">
                {loading
                  ? "Fetching your gallery…"
                  : images.length === 0
                    ? "Your generated images will live here."
                    : `${images.length} image${images.length === 1 ? "" : "s"} generated`}
              </p>
            </div>
            <Link
              href="/chat"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              <Sparkles className="size-4" />
              Generate new
            </Link>
          </div>

          {/* Body */}
          {loading ? (
            <GallerySkeleton />
          ) : error ? (
            <ErrorPanel message={error} onRetry={fetchImages} />
          ) : images.length === 0 ? (
            <EmptyState />
          ) : (
            <Grid images={images} onSelect={setSelected} />
          )}
        </div>
      </main>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <Lightbox image={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Grid({
  images,
  onSelect,
}: {
  images: ImageItem[];
  onSelect: (img: ImageItem) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
      {images.map((img, i) => (
        <motion.button
          key={img.id}
          type="button"
          onClick={() => onSelect(img)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.4) }}
          className="group relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/5 hover:border-indigo-400/40 transition-all"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt={img.prompt}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
            <div className="space-y-1">
              <p className="text-[11px] text-white/95 line-clamp-3 text-left leading-snug">
                {img.prompt}
              </p>
              <p className="text-[10px] text-zinc-400">{timeAgo(img.finishedAt)}</p>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

function GallerySkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-2xl bg-white/5 animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="size-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
        <ImageIcon className="size-8 text-purple-300" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">No images yet</h2>
      <p className="text-zinc-400 text-sm mb-6 max-w-md">
        Head to the chat and try{" "}
        <code className="px-1.5 py-0.5 rounded-md bg-white/10 text-indigo-300 text-[12.5px]">
          /image a calico cat in space
        </code>{" "}
        to make your first one.
      </p>
      <Link
        href="/chat"
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
      >
        <Sparkles className="size-4" />
        Open chat
      </Link>
    </div>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="size-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-5">
        <AlertCircle className="size-7 text-red-400" />
      </div>
      <p className="text-zinc-300 text-sm mb-5 max-w-md">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 text-sm transition-all"
      >
        <RefreshCcw className="size-4" />
        Retry
      </button>
    </div>
  );
}

function Lightbox({
  image,
  onClose,
}: {
  image: ImageItem;
  onClose: () => void;
}) {
  // Cloudinary download — append fl_attachment so the browser saves
  // instead of opening inline. Inserted after `/upload/`.
  const downloadUrl = image.url.includes("/upload/")
    ? image.url.replace("/upload/", "/upload/fl_attachment/")
    : image.url;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-5xl w-full max-h-full flex flex-col gap-4"
      >
        {/* Close (top right) */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-2 -right-2 md:top-2 md:right-2 z-10 size-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-colors"
        >
          <X className="size-4" />
        </button>

        {/* Image */}
        <div className="flex-1 min-h-0 rounded-2xl overflow-hidden bg-black/50 border border-white/10 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={image.prompt}
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>

        {/* Meta panel */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold mb-1.5">
                Prompt
              </p>
              <p className="text-sm text-zinc-100 leading-relaxed break-words">
                {image.prompt}
              </p>
              <div className="flex items-center gap-3 mt-3 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {new Date(image.finishedAt).toLocaleString()}
                </span>
                <span className="text-zinc-600">·</span>
                <span className="font-mono">{image.modelId}</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {image.conversationId && (
                <Link
                  href={`/chat?c=${image.conversationId}`}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 text-xs transition-all"
                >
                  Open chat
                </Link>
              )}
              <a
                href={downloadUrl}
                download
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-lg",
                  "bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all"
                )}
              >
                <Download className="size-3.5" />
                Download
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
