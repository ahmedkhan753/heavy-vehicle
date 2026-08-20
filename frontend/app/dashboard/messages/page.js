import Inbox from "@/components/chat/Inbox";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Messages",
};

export default async function MessagesPage({ searchParams }) {
  const params = (await searchParams) || {};
  const initialConversationId = params.c || "";

  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">Dashboard</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)]">Messages</h1>
      </div>
      <Inbox initialConversationId={initialConversationId} />
    </>
  );
}
