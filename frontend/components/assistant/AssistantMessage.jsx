"use client";

export default function AssistantMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[86%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-6 ${
          isUser
            ? "bg-[var(--hw-orange)] text-white"
            : "border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] text-[var(--hw-text-primary)]"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
