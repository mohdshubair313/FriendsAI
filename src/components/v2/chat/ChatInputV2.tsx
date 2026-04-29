"use client";

import { cn } from "@/lib/utils";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import * as React from "react";
import type { ChatAttachment } from "./types";

interface ChatInputV2Props {
  onSubmit: (text: string, files?: File[]) => void;
  onStop?: () => void;
  onVoice?: () => void;
  isStreaming?: boolean;
  isPremium?: boolean;
  /** Disable submit while there's nothing to send. */
  disabled?: boolean;
  placeholder?: string;
  /** Optional initial value (controlled by parent if needed). */
  initialValue?: string;
  /** Drop a value to programmatically set the textarea content. */
  injectValue?: string;
  /** Hard cap. */
  maxLength?: number;
  className?: string;
}

const MIN_HEIGHT = 56; // px — single line + padding
const MAX_HEIGHT = 240; // px

/**
 * The V2 input.
 *
 * - Auto-expanding textarea with no layout-shift on growth
 * - Animated aurora glow that turns on while focused or while typing
 * - Drag-and-drop file uploads with chip previews
 * - Magnetic send button (spring physics translate)
 * - Cmd/Ctrl + Enter or Enter to submit (Shift+Enter inserts newline)
 * - prefers-reduced-motion respected
 */
export function ChatInputV2({
  onSubmit,
  onStop,
  onVoice,
  isStreaming = false,
  isPremium = false,
  placeholder = "Message Friends — anything goes",
  initialValue = "",
  injectValue,
  maxLength = 8000,
  className,
}: ChatInputV2Props) {
  const [value, setValue] = React.useState(initialValue);
  const [files, setFiles] = React.useState<File[]>([]);
  const [previews, setPreviews] = React.useState<ChatAttachment[]>([]);
  const [focused, setFocused] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);

  const taRef = React.useRef<HTMLTextAreaElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
  }, []);

  // Inject from outside (e.g. clicking a suggestion chip).
  React.useEffect(() => {
    if (typeof injectValue === "string") {
      setValue(injectValue);
      requestAnimationFrame(() => taRef.current?.focus());
    }
  }, [injectValue]);

  // Auto-resize.
  React.useLayoutEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(Math.max(el.scrollHeight, MIN_HEIGHT), MAX_HEIGHT);
    el.style.height = `${next}px`;
  }, [value]);

  const canSubmit = (value.trim().length > 0 || files.length > 0) && !isStreaming;
  const showAurora = focused || value.length > 0 || isDragOver;

  const submit = () => {
    if (!canSubmit) return;
    const text = value.trim();
    onSubmit(text, files.length ? files : undefined);
    setValue("");
    revokePreviews(previews);
    setFiles([]);
    setPreviews([]);
    requestAnimationFrame(() => taRef.current?.focus());
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isModEnter = (e.metaKey || e.ctrlKey) && e.key === "Enter";
    if (isModEnter || (e.key === "Enter" && !e.shiftKey)) {
      e.preventDefault();
      submit();
    }
  };

  const acceptFiles = (incoming: FileList | File[] | null) => {
    if (!incoming) return;
    const list = Array.from(incoming);
    const ALLOWED = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/gif",
      "application/pdf",
      "text/plain",
      "text/markdown",
    ];
    const MAX_SIZE = 10 * 1024 * 1024;
    const valid = list.filter(
      (f) => ALLOWED.includes(f.type) && f.size <= MAX_SIZE
    );
    if (!valid.length) return;
    setFiles((prev) => [...prev, ...valid]);
    setPreviews((prev) => [
      ...prev,
      ...valid.map((f) => ({
        id: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2, 6)}`,
        name: f.name,
        size: f.size,
        type: f.type,
        url: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
      })),
    ]);
  };

  const removePreview = (id: string) => {
    setPreviews((prev) => {
      const next = prev.filter((p) => {
        if (p.id === id && p.url) URL.revokeObjectURL(p.url);
        return p.id !== id;
      });
      return next;
    });
    const idx = previews.findIndex((p) => p.id === id);
    if (idx >= 0) setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Cleanup blob URLs on unmount.
  React.useEffect(() => {
    return () => revokePreviews(previews);
    // We intentionally only run on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn("relative w-full", className)}>
      {/* Aurora bed — sits behind the panel when active */}
      <AnimatePresence>
        {showAurora && (
          <motion.div
            key="aurora"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            aria-hidden
            className="pointer-events-none absolute -inset-6 -z-[1]"
          >
            <div
              className={cn(
                "absolute inset-0 blur-3xl",
                isDragOver ? "opacity-100" : "opacity-70"
              )}
              style={{
                background:
                  "radial-gradient(40% 60% at 25% 50%, rgba(99,102,241,0.35), transparent 65%), radial-gradient(40% 60% at 75% 50%, rgba(168,85,247,0.28), transparent 65%), radial-gradient(50% 50% at 50% 100%, rgba(34,211,238,0.22), transparent 70%)",
                animation: reduced
                  ? undefined
                  : "v2-aurora-drift 14s ease-in-out infinite alternate",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        layout
        onDragEnter={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setIsDragOver(true);
          }
        }}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setIsDragOver(true);
          }
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setIsDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          acceptFiles(e.dataTransfer.files);
        }}
        className={cn(
          "relative isolate overflow-hidden rounded-3xl",
          "v2-glass-strong border-white/[0.1]",
          "transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          focused && "border-white/[0.16] shadow-[0_0_0_1px_rgba(99,102,241,0.18),0_24px_60px_-20px_rgba(99,102,241,0.45)]",
          isDragOver && "border-cyan-400/40 shadow-[0_0_0_1px_rgba(34,211,238,0.35),0_24px_60px_-12px_rgba(34,211,238,0.35)]"
        )}
      >
        {/* Inner top gradient hairline for spatial depth */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
        />

        {/* Drag-over hint overlay */}
        <AnimatePresence>
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-black/40 backdrop-blur-sm"
            >
              <div className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-1.5 text-[12.5px] text-cyan-100">
                Drop files to attach
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attachments row */}
        <AnimatePresence initial={false}>
          {previews.length > 0 && (
            <motion.div
              key="attachments"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <ul
                className="flex flex-wrap gap-2 border-b border-white/[0.06] px-4 py-3"
                aria-label="Attached files"
              >
                {previews.map((p) => (
                  <li key={p.id}>
                    <AttachmentChip
                      preview={p}
                      onRemove={() => removePreview(p.id)}
                    />
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main row */}
        <div className="flex items-end gap-2 px-3 pb-3 pt-3">
          <input
            ref={fileRef}
            type="file"
            multiple
            className="sr-only"
            accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.txt,.md"
            onChange={(e) => {
              acceptFiles(e.target.files);
              if (fileRef.current) fileRef.current.value = "";
            }}
          />

          <IconButton
            label="Attach files"
            onClick={() => fileRef.current?.click()}
          >
            <PaperclipIcon />
          </IconButton>

          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, maxLength))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            rows={1}
            aria-label="Message Friends AI"
            className={cn(
              "v2-font-sans flex-1 resize-none bg-transparent px-2 py-3 text-[15.5px] leading-[1.55]",
              "text-white placeholder:text-white/35",
              "focus:outline-none",
              "scrollbar-thin"
            )}
            style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
          />

          {isPremium && onVoice && (
            <IconButton
              label="Start voice mode"
              onClick={onVoice}
              tone="cyan"
            >
              <MicIcon />
            </IconButton>
          )}

          <SendButton
            canSubmit={canSubmit}
            isStreaming={isStreaming}
            onSubmit={submit}
            onStop={onStop}
          />
        </div>

        {/* Foot hints */}
        <div className="flex items-center justify-between gap-3 border-t border-white/[0.04] px-4 py-2 text-[11px] text-white/35">
          <span className="hidden sm:inline">
            <Kbd>⏎</Kbd> Send · <Kbd>⇧⏎</Kbd> New line
          </span>
          <span className="ml-auto tabular-nums">
            {value.length}/{maxLength}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------------------- send button (magnetic) ---------------------- */

function SendButton({
  canSubmit,
  isStreaming,
  onSubmit,
  onStop,
}: {
  canSubmit: boolean;
  isStreaming: boolean;
  onSubmit: () => void;
  onStop?: () => void;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 320, damping: 22, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 320, damping: 22, mass: 0.5 });
  const innerX = useTransform(sx, (v) => v * 0.4);
  const innerY = useTransform(sy, (v) => v * 0.4);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set(((e.clientX - cx) / (rect.width / 2)) * 7);
    y.set(((e.clientY - cy) / (rect.height / 2)) * 7);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const stopMode = isStreaming;

  return (
    <motion.button
      ref={ref}
      type="button"
      onMouseMove={onMove}
      onMouseLeave={reset}
      onClick={stopMode ? onStop : onSubmit}
      disabled={!stopMode && !canSubmit}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 400, damping: 24 }}
      aria-label={stopMode ? "Stop generation" : "Send message"}
      className={cn(
        "relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl",
        "v2-press transition-[background-color,color,opacity] duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
        stopMode
          ? "bg-rose-400/15 text-rose-200 ring-1 ring-inset ring-rose-400/25"
          : canSubmit
            ? "bg-white text-black shadow-[0_8px_28px_-10px_rgba(255,255,255,0.55)]"
            : "bg-white/[0.05] text-white/30"
      )}
    >
      {!stopMode && canSubmit && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 [animation:v2-shine_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/45 to-transparent"
          style={{ width: "30%", left: 0 }}
        />
      )}
      <motion.span
        style={{ x: innerX, y: innerY }}
        className="relative z-[1] inline-flex items-center justify-center"
      >
        {stopMode ? <StopIcon /> : <ArrowUpIcon />}
      </motion.span>
    </motion.button>
  );
}

/* ---------------------- attachment chip ---------------------- */

function AttachmentChip({
  preview,
  onRemove,
}: {
  preview: ChatAttachment;
  onRemove: () => void;
}) {
  const isImage = preview.type.startsWith("image/");
  return (
    <div
      className={cn(
        "group/chip relative flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-1.5 pl-1.5 pr-3"
      )}
    >
      {isImage && preview.url ? (
        <span className="block h-9 w-9 overflow-hidden rounded-lg ring-1 ring-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.url}
            alt={preview.name}
            className="h-full w-full object-cover"
          />
        </span>
      ) : (
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.04] text-white/65 ring-1 ring-white/10">
          <DocIcon />
        </span>
      )}
      <div className="min-w-0 leading-tight">
        <div className="max-w-[180px] truncate text-[12.5px] font-medium text-white/80">
          {preview.name}
        </div>
        <div className="text-[11px] text-white/40">
          {formatBytes(preview.size)}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${preview.name}`}
        className="ml-1 grid h-5 w-5 place-items-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

/* ---------------------- icon button ---------------------- */

function IconButton({
  label,
  onClick,
  tone = "neutral",
  children,
}: {
  label: string;
  onClick?: () => void;
  tone?: "neutral" | "cyan";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "v2-press grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
        "text-white/55 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
        tone === "cyan" && "hover:text-cyan-200"
      )}
    >
      {children}
    </button>
  );
}

/* ---------------------- helpers ---------------------- */

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-[1px] font-mono text-[10.5px] text-white/65">
      {children}
    </kbd>
  );
}

function revokePreviews(list: ChatAttachment[]) {
  for (const p of list) {
    if (p.url) {
      try {
        URL.revokeObjectURL(p.url);
      } catch {
        /* ignore */
      }
    }
  }
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/* ---------------------- icons ---------------------- */

function PaperclipIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M14.4 7.4l-5.9 5.9a3.1 3.1 0 1 1-4.4-4.4l6.6-6.6a2.1 2.1 0 0 1 3 3l-6.6 6.6a1.1 1.1 0 1 1-1.5-1.5l5.6-5.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect
        x="6.5"
        y="2"
        width="5"
        height="9"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3.5 9a5.5 5.5 0 0 0 11 0M9 14.5V16.5M6 16.5h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M9 14V4M4.5 8.5L9 4l4.5 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path
        d="M2.5 2.5l5 5M7.5 2.5l-5 5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M9 1.5H4a1.5 1.5 0 0 0-1.5 1.5v10A1.5 1.5 0 0 0 4 14.5h8a1.5 1.5 0 0 0 1.5-1.5V6L9 1.5zM9 1.5V6h4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
