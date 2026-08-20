"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { useLanguage } from "@/Context/LanguageContext";
import { commentApi } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import QuickAuthModal from "@/components/auth/QuickAuthModal";

const timeAgo = (v) => {
  if (!v) return "";
  const diff = Date.now() - new Date(v).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export default function Comments({ listingId, listingType = "vehicle", sellerId }) {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);

  const myId = user?._id;
  const isAdmin = user?.role === "admin";
  const ownsListing = isAuthenticated && String(myId) === String(sellerId);

  async function load() {
    try {
      const res = await commentApi.list(listingId, listingType);
      setComments(res?.data || []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [listingId, listingType]);

  // Group into top-level comments + their replies.
  const threaded = useMemo(() => {
    const tops = comments.filter((c) => !c.parentId);
    const repliesByParent = comments.reduce((acc, c) => {
      if (c.parentId) (acc[c.parentId] = acc[c.parentId] || []).push(c);
      return acc;
    }, {});
    return tops.map((t) => ({ ...t, replies: repliesByParent[t._id] || [] }));
  }, [comments]);

  async function remove(id) {
    if (!window.confirm(t("comments.deleteConfirm"))) return;
    try {
      await commentApi.remove(id);
      toast.success("Deleted");
      await load();
    } catch (err) {
      toast.error(err?.message || "Could not delete");
    }
  }

  const canDelete = (c) => isAdmin || ownsListing || String(c.user?._id) === String(myId);

  return (
    <div className="rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
      <h2 className="text-xl font-black text-[var(--hw-text-primary)]">
        {t("comments.title")} {comments.length ? `(${comments.length})` : ""}
      </h2>

      {/* Composer */}
      {isAuthenticated ? (
        <CommentForm listingId={listingId} listingType={listingType} onPosted={load} />
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-[var(--hw-border-default)] p-4 text-center text-sm text-[var(--hw-text-secondary)]">
          <button type="button" onClick={() => setAuthOpen(true)} className="font-bold text-[var(--hw-orange)] hover:underline">{t("comments.login")}</button> {t("comments.loginRest")}
          <QuickAuthModal open={authOpen} onClose={() => setAuthOpen(false)} redirectPath={`/${listingType === "part" ? "parts" : "vehicles"}/${listingId}`} />
        </div>
      )}

      {/* List */}
      <div className="mt-6 grid gap-4">
        {loading ? (
          <p className="text-sm text-[var(--hw-text-muted)]">{t("comments.loading")}</p>
        ) : threaded.length === 0 ? (
          <p className="text-sm text-[var(--hw-text-muted)]">{t("comments.none")}</p>
        ) : (
          threaded.map((c) => (
            <div key={c._id} className="rounded-lg border border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)] p-4">
              <CommentBody c={c} canDelete={canDelete(c)} onDelete={() => remove(c._id)} />

              {/* Replies */}
              {c.replies.length ? (
                <div className="mt-3 grid gap-3 border-l-2 border-[var(--hw-border-default)] pl-4">
                  {c.replies.map((r) => (
                    <CommentBody key={r._id} c={r} canDelete={canDelete(r)} onDelete={() => remove(r._id)} small />
                  ))}
                </div>
              ) : null}

              {/* Reply control */}
              {isAuthenticated ? (
                replyTo === c._id ? (
                  <div className="mt-3 pl-4">
                    <CommentForm listingId={listingId} listingType={listingType} parentId={c._id} onPosted={() => { setReplyTo(null); load(); }} compact />
                  </div>
                ) : (
                  <button onClick={() => setReplyTo(c._id)} className="mt-2 text-xs font-bold text-[var(--hw-orange)] hover:underline">{t("comments.reply")}</button>
                )
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CommentBody({ c, canDelete, onDelete, small }) {
  const { t } = useLanguage();
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className={`font-bold text-[var(--hw-text-primary)] ${small ? "text-sm" : ""}`}>{c.user?.name || "User"}</span>
        {c.isSeller ? <span className="rounded-full bg-[var(--hw-orange)] px-2 py-0.5 text-[10px] font-black uppercase text-[var(--hw-text-inverse)]">{t("comments.seller")}</span> : null}
        <span className="text-xs text-[var(--hw-text-muted)]">{timeAgo(c.createdAt)}</span>
        {canDelete ? (
          <button onClick={onDelete} className="ms-auto text-xs font-bold text-[var(--hw-text-muted)] hover:text-[var(--hw-red,#ef4444)]">{t("comments.delete")}</button>
        ) : null}
      </div>
      {c.offerAmount ? (
        <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-[var(--hw-soft-panel)] px-2 py-1 text-sm font-black text-[var(--hw-green)]">
          💰 {t("comments.offerLabel")}: {formatPrice(c.offerAmount)}
        </p>
      ) : null}
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[var(--hw-text-secondary)]">{c.text}</p>
    </div>
  );
}

function CommentForm({ listingId, listingType, parentId, onPosted, compact }) {
  const toast = useToast();
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [showOffer, setShowOffer] = useState(false);
  const [offer, setOffer] = useState("");
  const [posting, setPosting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    try {
      await commentApi.create({
        listingId,
        listingType,
        parentId: parentId || undefined,
        text: text.trim(),
        offerAmount: showOffer && offer ? Number(offer) : undefined,
      });
      setText(""); setOffer(""); setShowOffer(false);
      toast.success("Posted");
      onPosted?.();
    } catch (err) {
      toast.error(err?.message || "Could not post");
    } finally {
      setPosting(false);
    }
  }

  return (
    <form onSubmit={submit} className={compact ? "" : "mt-4"}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={1000}
        placeholder={parentId ? t("comments.replyPlaceholder") : t("comments.placeholder")}
        className="min-h-20 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] p-3 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]"
      />
      {showOffer ? (
        <input
          type="number" min="1" value={offer} onChange={(e) => setOffer(e.target.value)}
          placeholder={t("comments.offerPlaceholder")}
          className="hw-ltr mt-2 h-11 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]"
        />
      ) : null}
      <div className="mt-2 flex items-center gap-2">
        <button disabled={posting} className="h-10 rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)] disabled:opacity-60">
          {posting ? t("comments.posting") : parentId ? t("comments.reply") : t("comments.post")}
        </button>
        {!parentId ? (
          <button type="button" onClick={() => setShowOffer((v) => !v)} className={`h-10 rounded-lg border px-4 text-sm font-bold transition ${showOffer ? "border-[var(--hw-green)] text-[var(--hw-green)]" : "border-[var(--hw-border-strong)] text-[var(--hw-text-secondary)] hover:border-[var(--hw-orange)]"}`}>
            {showOffer ? t("comments.removeOffer") : `💰 ${t("comments.makeOffer")}`}
          </button>
        ) : null}
      </div>
    </form>
  );
}
