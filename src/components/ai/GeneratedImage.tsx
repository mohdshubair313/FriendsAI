"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
const GridReveal = dynamic(() => import("@/components/ui/grid-reveal"), {
  loading: () => <div className="aspect-square w-full animate-pulse rounded-2xl bg-white/5" />,
});

export default function GeneratedImage({ url, prompt, caption }: {
  url: string | null; prompt: string; caption?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  return (
    <div className="my-3 w-full max-w-md">
      {url && failedUrl === url ? (
        <div role="alert" className="rounded-2xl border border-white/10 p-5 text-sm text-zinc-300">
          <p>The image could not be loaded.</p>
          <button type="button" className="mt-3 text-indigo-300 underline" onClick={() => {
            setFailedUrl(null); setAttempt((n) => n + 1);
          }}>Retry image</button>
        </div>
      ) : (
        <GridReveal key={attempt} src={url} alt={prompt || "Generated image"}
          caption={caption} onError={() => setFailedUrl(url)} />
      )}
      {url && <a href={url} target="_blank" rel="noopener noreferrer"
        className="mt-2 inline-block text-xs text-indigo-300 hover:underline">Open full image</a>}
    </div>
  );
}
