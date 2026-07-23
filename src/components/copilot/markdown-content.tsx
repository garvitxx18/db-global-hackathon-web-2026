"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

export function MarkdownContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "copilot-md text-[13px] leading-snug text-foreground",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-1.5 mt-0 text-[15px] font-semibold tracking-tight text-slate-900 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-1 mt-2.5 border-b border-slate-100 pb-1 text-[13px] font-semibold tracking-tight text-slate-900 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-1 mt-2 text-[12.5px] font-semibold text-slate-800 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-0.5 mt-1.5 text-[12px] font-semibold text-slate-700 first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-1.5 text-[13px] leading-relaxed text-slate-700 last:mb-0">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-600">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="mb-1.5 list-none space-y-0.5 pl-3.5 last:mb-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-1.5 list-decimal space-y-1 pl-4 last:mb-0 [&>li]:before:hidden">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="relative text-[13px] leading-relaxed text-slate-700 before:absolute before:-left-3 before:top-[0.55em] before:size-1 before:rounded-full before:bg-slate-400">
              <div className="min-w-0">{children}</div>
            </li>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-sky-700 underline decoration-sky-200 underline-offset-2 hover:text-sky-900"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-1.5 border-l-2 border-slate-300 bg-slate-50/80 py-1 pl-2.5 pr-2 text-[12.5px] text-slate-600 last:mb-0">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-2 border-slate-200" />,
          code: ({ className: codeClassName, children, ...props }) => {
            const isBlock = Boolean(codeClassName?.includes("language-"));
            if (isBlock) {
              return (
                <code className={cn("font-mono text-[11.5px]", codeClassName)} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code
                className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11.5px] text-slate-800"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-1.5 overflow-x-auto rounded-lg border border-slate-200 bg-slate-950 px-2.5 py-2 text-[11.5px] leading-relaxed text-slate-100 last:mb-0">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="mb-1.5 overflow-hidden rounded-lg border border-slate-200 last:mb-0">
              <table className="w-full border-collapse text-left text-[12px]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-2 py-1.5 font-medium">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-t border-slate-100 px-2 py-1.5 text-slate-700">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
