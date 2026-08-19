"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { useLanguage } from "@/Context/LanguageContext";
import { chatApi } from "@/lib/api";

const timeAgo = (v) => {
  if (!v) return "";
  const diff = Date.now() - new Date(v).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

export default function Inbox({ initialConversationId }) {
  const { user, isAuthenticated, loading } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();
  const [convos, setConvos] = useState([]);
  const [activeId, setActiveId] = useState(initialConversationId || "");
  const [thread, setThread] = useState(null); // { conversation, messages }
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [ready, setReady] = useState(false);
  const endRef = useRef(null);

  const myId = user?._id;

  async function loadConvos() {
    try {
      const res = await chatApi.conversations();
      const list = res?.data || [];
      setConvos(list);
      setActiveId((cur) => cur || list[0]?._id || "");
    } catch {
      setConvos([]);
    } finally {
      setReady(true);
    }
  }

  async function loadThread(id) {
    if (!id) return;
    try {
      const res = await chatApi.messages(id);
      setThread(res?.data || null);
    } catch {
      setThread(null);
    }
  }

  // Initial load + poll the conversation list.
  useEffect(() => {
    if (loading || !isAuthenticated) { if (!loading) setReady(true); return; }
    loadConvos();
    const t = setInterval(loadConvos, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [isAuthenticated, loading]);

  // Load + poll the open thread.
  useEffect(() => {
    if (!activeId) return;
    loadThread(activeId);
    const t = setInterval(() => loadThread(activeId), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [activeId]);

  // Auto-scroll on new messages.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages?.length]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim() || !activeId) return;
    setSending(true);
    const body = text.trim();
    setText("");
    try {
      await chatApi.send(activeId, body);
      await loadThread(activeId);
      loadConvos();
    } catch (err) {
      toast.error(err?.message || "Couldn't send");
      setText(body);
    } finally {
      setSending(false);
    }
  }

  if (loading || !ready) return <div className="h-96 animate-pulse rounded-xl bg-[var(--hw-bg-card)]" />;

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-8 text-center">
        <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("chat.signin")}</h2>
        <Link href="/auth/login?redirect=/dashboard/messages" className="mt-4 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">{t("chat.loginBtn")}</Link>
      </div>
    );
  }

  if (!convos.length) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-10 text-center">
        <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("chat.none")}</h2>
        <p className="mt-2 text-[var(--hw-text-secondary)]">{t("chat.noneBody")}</p>
        <Link href="/vehicles" className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">{t("chat.browse")}</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      {/* Conversation list */}
      <aside className={`min-w-0 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] ${activeId ? "hidden lg:block" : ""}`}>
        <div className="max-h-[70vh] overflow-y-auto">
          {convos.map((c) => (
            <button
              key={c._id}
              onClick={() => setActiveId(c._id)}
              className={`flex w-full items-start gap-3 border-b border-[var(--hw-border-subtle)] p-3 text-left transition last:border-b-0 ${activeId === c._id ? "bg-[var(--hw-soft-panel)]" : "hover:bg-[var(--hw-soft-panel)]"}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-bold text-[var(--hw-text-primary)]">{c.other?.name || "User"}</span>
                  <span className="shrink-0 text-[10px] text-[var(--hw-text-muted)]">{timeAgo(c.lastMessageAt)}</span>
                </div>
                <p className="truncate text-xs text-[var(--hw-text-muted)]">{c.vehicleTitle || c.vehicle?.title}</p>
                <p className="truncate text-sm text-[var(--hw-text-secondary)]">{c.lastMessage || t("chat.noMessages")}</p>
              </div>
              {c.unread > 0 ? <span className="mt-1 shrink-0 rounded-full bg-[var(--hw-orange)] px-2 py-0.5 text-[10px] font-black text-[var(--hw-text-inverse)]">{c.unread}</span> : null}
            </button>
          ))}
        </div>
      </aside>

      {/* Thread */}
      <section className={`flex min-h-[60vh] min-w-0 flex-col rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] ${activeId ? "" : "hidden lg:flex"}`}>
        {thread ? (
          <>
            <header className="flex items-center gap-3 border-b border-[var(--hw-border-subtle)] p-3">
              <button onClick={() => setActiveId("")} className="lg:hidden text-sm font-bold text-[var(--hw-orange)]">←</button>
              <div className="min-w-0">
                <p className="truncate font-black text-[var(--hw-text-primary)]">{thread.conversation?.other?.name || "User"}</p>
                {thread.conversation?.vehicle?._id ? (
                  <Link href={`/vehicles/${thread.conversation.vehicle._id}`} className="truncate text-xs text-[var(--hw-orange)] hover:underline">
                    {thread.conversation.vehicle.title}
                  </Link>
                ) : null}
              </div>
            </header>

            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {thread.messages.map((m) => {
                const mine = String(m.sender) === String(myId);
                return (
                  <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]" : "bg-[var(--hw-bg-deep)] text-[var(--hw-text-primary)]"}`}>
                      <p className="whitespace-pre-line break-words">{m.text}</p>
                      <p className={`mt-1 text-[10px] ${mine ? "text-[var(--hw-text-inverse)]/70" : "text-[var(--hw-text-muted)]"}`}>{timeAgo(m.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            <form onSubmit={send} className="flex items-center gap-2 border-t border-[var(--hw-border-subtle)] p-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("chat.typePlaceholder")}
                className="h-11 flex-1 rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]"
              />
              <button disabled={sending || !text.trim()} className="h-11 rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)] disabled:opacity-60">{t("chat.send")}</button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-[var(--hw-text-muted)]">{t("chat.select")}</div>
        )}
      </section>
    </div>
  );
}
