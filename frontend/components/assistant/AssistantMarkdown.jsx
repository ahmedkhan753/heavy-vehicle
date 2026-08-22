"use client";

import { Fragment } from "react";

/**
 * A deliberately small markdown renderer for assistant replies.
 *
 * The model answers in markdown, but the bubble used to print it verbatim —
 * so "**Post your ad**" reached the user as literal asterisks and every
 * reply looked like unformatted noise. This renders the handful of things
 * the assistant actually emits: headings, bullet and numbered lists, bold,
 * italic, inline code, and links.
 *
 * Everything is built as React elements rather than an HTML string — no
 * dangerouslySetInnerHTML anywhere. Model output is untrusted text (it can
 * quote a user, or a listing description), so it must never be able to
 * introduce markup. Anything unrecognised falls through as plain text.
 */

// Splits one line into bold / italic / code / link spans.
const INLINE = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

// Recursive: emphasis frequently wraps a link — the model reliably writes
// **[Post your ad](/post-ad)**. Rendering a bold span's contents as plain
// text left that link as visible "[label](/href)" punctuation, so bold and
// italic re-enter the parser on their inner text. Depth-capped since each
// level strips delimiters and can only shrink the string.
function renderInline(text, keyPrefix, depth = 0) {
  const parts = String(text).split(INLINE).filter(Boolean);

  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    const inner = (s) => (depth < 4 ? renderInline(s, key, depth + 1) : s);

    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return <strong key={key} className="font-bold text-[var(--hw-text-primary)]">{inner(part.slice(2, -2))}</strong>;
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return <em key={key}>{inner(part.slice(1, -1))}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} className="rounded bg-[var(--hw-soft-panel)] px-1 py-0.5 text-[12px]">
          {part.slice(1, -1)}
        </code>
      );
    }

    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      const [, label, href] = link;
      // Only allow the schemes an assistant reply legitimately needs.
      const safe = /^(https?:\/\/|\/|mailto:|tel:)/i.test(href);
      if (!safe) return <Fragment key={key}>{label}</Fragment>;
      const internal = href.startsWith("/");
      return (
        <a
          key={key}
          href={href}
          {...(internal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
          className="font-bold text-[var(--hw-orange)] underline underline-offset-2"
        >
          {label}
        </a>
      );
    }

    return <Fragment key={key}>{part}</Fragment>;
  });
}

const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*(\d+)[.)]\s+(.*)$/;
const HEADING = /^\s*(#{1,6})\s+(.*)$/;

export default function AssistantMarkdown({ content }) {
  const lines = String(content || "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let list = null; // { type: "ul" | "ol", items: [] }
  let para = [];

  const flushParagraph = () => {
    if (!para.length) return;
    blocks.push({ kind: "p", text: para.join(" ") });
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    blocks.push({ kind: list.type, items: list.items });
    list = null;
  };

  for (const line of lines) {
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "h", text: heading[2] });
      continue;
    }

    const bullet = line.match(BULLET);
    if (bullet) {
      flushParagraph();
      if (!list || list.type !== "ul") { flushList(); list = { type: "ul", items: [] }; }
      list.items.push(bullet[1]);
      continue;
    }

    const numbered = line.match(NUMBERED);
    if (numbered) {
      flushParagraph();
      if (!list || list.type !== "ol") { flushList(); list = { type: "ol", items: [] }; }
      list.items.push(numbered[2]);
      continue;
    }

    flushList();
    para.push(line.trim());
  }
  flushParagraph();
  flushList();

  return (
    <div className="grid gap-2">
      {blocks.map((block, i) => {
        if (block.kind === "h") {
          return (
            <p key={i} className="text-[13px] font-black text-[var(--hw-text-primary)]">
              {renderInline(block.text, `h${i}`)}
            </p>
          );
        }
        if (block.kind === "ul") {
          return (
            <ul key={i} className="grid gap-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2">
                  <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[var(--hw-orange)]" />
                  <span className="min-w-0">{renderInline(item, `u${i}-${j}`)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.kind === "ol") {
          return (
            <ol key={i} className="grid gap-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2">
                  <span aria-hidden className="shrink-0 font-bold text-[var(--hw-orange)]">{j + 1}.</span>
                  <span className="min-w-0">{renderInline(item, `o${i}-${j}`)}</span>
                </li>
              ))}
            </ol>
          );
        }
        return <p key={i}>{renderInline(block.text, `p${i}`)}</p>;
      })}
    </div>
  );
}
