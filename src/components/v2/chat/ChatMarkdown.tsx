"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./CodeBlock";

interface ChatMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Premium markdown renderer for assistant messages.
 * - Inline code: subtle pill
 * - Fenced code: defers to CodeBlock with copy
 * - Tables: hairline grid, sticky header
 * - Lists / blockquotes / links: tuned for the V2 dark aesthetic
 */
export function ChatMarkdown({ content, className }: ChatMarkdownProps) {
  return (
    <div
      className={cn(
        "v2-md v2-font-sans text-[15px] leading-[1.72] text-white/85",
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children, ...p }) => (
            <h2
              className="v2-font-sans mb-3 mt-7 text-[22px] font-semibold tracking-tight text-white"
              {...p}
            >
              {children}
            </h2>
          ),
          h2: ({ children, ...p }) => (
            <h3
              className="v2-font-sans mb-3 mt-6 text-[18px] font-semibold tracking-tight text-white"
              {...p}
            >
              {children}
            </h3>
          ),
          h3: ({ children, ...p }) => (
            <h4
              className="v2-font-sans mb-2 mt-5 text-[16px] font-semibold tracking-tight text-white"
              {...p}
            >
              {children}
            </h4>
          ),
          p: ({ children, ...p }) => (
            <p className="my-3" {...p}>
              {children}
            </p>
          ),
          a: ({ children, href, ...p }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-cyan-300 underline decoration-cyan-300/30 underline-offset-[3px] transition-colors hover:text-cyan-200 hover:decoration-cyan-300/70"
              {...p}
            >
              {children}
            </a>
          ),
          strong: ({ children, ...p }) => (
            <strong className="font-semibold text-white" {...p}>
              {children}
            </strong>
          ),
          em: ({ children, ...p }) => (
            <em className="italic text-white/90" {...p}>
              {children}
            </em>
          ),
          ul: ({ children, ...p }) => (
            <ul className="my-3 list-none space-y-1.5 pl-1" {...p}>
              {children}
            </ul>
          ),
          ol: ({ children, ...p }) => (
            <ol className="my-3 list-none space-y-1.5 pl-1 [counter-reset:list]" {...p}>
              {children}
            </ol>
          ),
          li: ({ children, ...p }) => {
            const isOrdered =
              (p as unknown as { ordered?: boolean }).ordered === true;
            return (
              <li
                className={cn(
                  "relative pl-6 text-white/85",
                  isOrdered
                    ? "[counter-increment:list] before:absolute before:left-0 before:top-0 before:text-[12px] before:font-medium before:text-white/45 before:content-[counter(list)'.']"
                    : "before:absolute before:left-1 before:top-[0.7em] before:h-[5px] before:w-[5px] before:rounded-full before:bg-white/35 before:content-['']"
                )}
                {...p}
              >
                {children}
              </li>
            );
          },
          blockquote: ({ children, ...p }) => (
            <blockquote
              className="my-4 border-l-2 border-violet-400/60 bg-white/[0.025] px-4 py-2 italic text-white/75 [&>p]:my-1"
              {...p}
            >
              {children}
            </blockquote>
          ),
          hr: (p) => (
            <hr className="my-6 border-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" {...p} />
          ),
          table: ({ children, ...p }) => (
            <div className="my-5 overflow-x-auto rounded-xl border border-white/[0.08] bg-white/[0.02]">
              <table className="w-full border-collapse text-[13.5px]" {...p}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...p }) => (
            <thead className="bg-white/[0.03]" {...p}>
              {children}
            </thead>
          ),
          th: ({ children, ...p }) => (
            <th
              className="border-b border-white/[0.08] px-4 py-2.5 text-left v2-text-eyebrow font-medium text-white/70"
              {...p}
            >
              {children}
            </th>
          ),
          td: ({ children, ...p }) => (
            <td
              className="border-b border-white/[0.05] px-4 py-2.5 text-white/80 last:border-b-0"
              {...p}
            >
              {children}
            </td>
          ),
          code: ({ className: codeClass, children, ...p }) => {
            const match = /language-(\w+)/.exec(codeClass || "");
            const isBlock = !!match;
            const text = String(children).replace(/\n$/, "");
            if (!isBlock) {
              return (
                <code
                  className="rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[12.5px] text-cyan-100/90"
                  {...p}
                >
                  {children}
                </code>
              );
            }
            return (
              <CodeBlock language={match?.[1]} rawText={text}>
                {children}
              </CodeBlock>
            );
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
