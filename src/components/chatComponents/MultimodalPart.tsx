"use client";

import { motion } from "framer-motion";
import { Download, Maximize2, ExternalLink, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface MultimodalPartProps {
  type: "image" | "video";
  url: string;
  alt?: string;
}

export default function MultimodalPart({ type, url, alt }: MultimodalPartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative group mt-4 mb-2 rounded-2xl overflow-hidden border border-white/10 bg-black/40 max-w-lg shadow-2xl"
    >
      <div className="relative aspect-video w-full">
        <Image
          src={url}
          alt={alt || "Generated Content"}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized={url.includes("blob:")} // Handle local preview blobs
        />
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button 
            className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all hover:scale-110"
            title="Download"
            onClick={() => window.open(url, "_blank")}
          >
            <Download className="size-5" />
          </button>
          <button 
            className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all hover:scale-110"
            title="Full View"
          >
            <Maximize2 className="size-5" />
          </button>
        </div>
      </div>

      {/* Metadata / Footer */}
      <div className="px-4 py-3 flex items-center justify-between bg-zinc-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded bg-indigo-500/20 flex items-center justify-center">
            <ImageIcon className="size-3.5 text-indigo-400" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            {type === "image" ? "Generated Image" : "Processed Video"}
          </span>
        </div>
        <button className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
          REGENERATE <ExternalLink className="size-2.5" />
        </button>
      </div>
    </motion.div>
  );
}
