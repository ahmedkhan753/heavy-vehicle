"use client";

import AssistantMarkdown from "./AssistantMarkdown";

export default function AssistantMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[86%] rounded-2xl px-3 py-2 text-sm leading-6 ${
          isUser
            ? "whitespace-pre-wrap bg-[var(--hw-orange)] text-white"
            : "border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] text-[var(--hw-text-primary)]"
        }`}
      >
        {/* Only assistant replies are markdown. What the user typed is shown
            exactly as typed — parsing it would mangle a message that happens
            to contain an asterisk or underscore. */}
        {isUser ? message.content : <AssistantMarkdown content={message.content} />}
      </div>
    </div>
  );
}
