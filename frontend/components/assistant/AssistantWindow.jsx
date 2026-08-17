"use client";

import BrandLogo from "@/components/layout/BrandLogo";
import AssistantMessage from "./AssistantMessage";
import AssistantInput from "./AssistantInput";
import SuggestedQuestions from "./SuggestedQuestions";
import TypingIndicator from "./TypingIndicator";

export default function AssistantWindow({
  labels,
  messages,
  suggestions,
  input,
  loading,
  endRef,
  isRtl,
  onClose,
  onReset,
  onInputChange,
  onSend,
}) {
  return (
    <section
      dir={isRtl ? "rtl" : "ltr"}
      className="fixed inset-x-3 bottom-3 top-3 z-50 flex overflow-hidden rounded-2xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] shadow-2xl shadow-black/25 sm:inset-auto sm:bottom-4 sm:right-4 sm:top-auto sm:h-[min(620px,calc(100vh-2rem))] sm:w-[min(92vw,420px)] lg:bottom-6"
      aria-label={labels.title}
    >
      <div className="flex min-h-0 w-full flex-col">
        <div className="flex items-center justify-between border-b border-[var(--hw-border-default)] bg-[var(--hw-orange)] px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <BrandLogo className="h-6 w-auto" />
            </div>
            <div>
              <div className="text-sm font-extrabold">{labels.title}</div>
              <div className="flex items-center gap-1.5 text-[10px] text-orange-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                <span>{labels.online}</span>
                <span aria-hidden="true">-</span>
                <span>{labels.subtitle}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReset}
              className="rounded-full px-2 py-1 text-[11px] font-bold text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              {labels.reset}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-2xl font-bold leading-none text-white/90 transition hover:text-white"
              aria-label={labels.close}
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col bg-[var(--hw-bg-base)]">
          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((message, index) => (
              <AssistantMessage key={`${message.role}-${index}`} message={message} />
            ))}
            {loading ? <TypingIndicator label={labels.thinking} /> : null}
            <div ref={endRef} />
          </div>

          <div className="border-t border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3">
            <SuggestedQuestions
              items={suggestions}
              disabled={loading}
              onSelect={onSend}
            />
            <AssistantInput
              value={input}
              loading={loading}
              placeholder={labels.placeholder}
              sendLabel={labels.send}
              onChange={onInputChange}
              onSend={() => onSend()}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
