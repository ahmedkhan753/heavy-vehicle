"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { assistantApi } from "@/lib/api";
import { useLanguage } from "@/Context/LanguageContext";
import AssistantButton from "./AssistantButton";
import AssistantWindow from "./AssistantWindow";
import {
  ASSISTANT_STORAGE_KEY,
  assistantLabels,
  createGreetingMessage,
  suggestedQuestions,
} from "./assistantContent";



export default function HeavyWheelsAssistant() {
  const pathname = usePathname();
  const { lang, isRtl } = useLanguage();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(() => [createGreetingMessage("en")]);
  const endRef = useRef(null);

  const labels = assistantLabels[lang] || assistantLabels.en;
  const suggestions = useMemo(
    () => suggestedQuestions[lang] || suggestedQuestions.en,
    [lang]
  );

  // Reset to greeting when language changes
  useEffect(() => {
    setMessages([createGreetingMessage(lang)]);
    setInput("");
  }, [lang]);

  // Close chatbot when pressing Escape key
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        handleClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, lang]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  // Clearing the thread is what "New chat" is for. Closing the window is not
  // the same intent — people minimise it to look something up on the page and
  // expect their conversation to still be there when they reopen it.
  function resetConversation() {
    setMessages([createGreetingMessage(lang)]);
    setInput("");
    setLoading(false);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ASSISTANT_STORAGE_KEY);
    }
  }

  function handleClose() {
    setOpen(false);
  }

  async function sendPrompt(promptText) {
    const nextPrompt = String(promptText || input || "").trim();
    if (!nextPrompt || loading) return;

    const userMessage = { role: "user", content: nextPrompt };
    const history = messages.slice(-12);

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await assistantApi.chat({
        message: nextPrompt,
        history,
        locale: lang,
      });

      const replyContent = response?.message || (response?.success === false ? labels.error : null);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: replyContent || labels.error,
        },
      ]);
    } catch (err) {
      const errorContent = err?.message || err?.raw?.message || labels.error;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorContent,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // On auth screens the floating button sits directly over the submit
  // button on short mobile viewports (the form is short enough that the
  // fixed-position bubble always lands on its last field/CTA) — hide it
  // there rather than trying to dodge a moving target.
  if (pathname?.startsWith("/auth")) return null;

  return (
    <>
      <AssistantButton
        open={open}
        label={labels.open}
        onClick={() => setOpen((prev) => !prev)}
      />

      {open ? (
        <AssistantWindow
          labels={labels}
          messages={messages}
          suggestions={suggestions}
          input={input}
          loading={loading}
          endRef={endRef}
          isRtl={isRtl}
          onClose={handleClose}
          onReset={resetConversation}
          onInputChange={setInput}
          onSend={sendPrompt}
        />
      ) : null}
    </>
  );
}
