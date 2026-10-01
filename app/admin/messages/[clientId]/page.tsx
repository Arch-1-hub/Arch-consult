import { requireAdmin } from "@/lib/admin";
import MessageThread from "@/components/messaging/MessageThread";

export const dynamic = "force-dynamic";

export default async function AdminMessageThread({
  params,
}: {
  params: { clientId: string };
}) {
  const { supabase, user } = await requireAdmin();

  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, sender_id, sender_role, body, created_at")
    .eq("client_id", params.clientId)
    .order("created_at", { ascending: true });

  if (error) {
    return <p className="text-ash">Could not load this conversation.</p>;
  }

  return (
    <MessageThread
      clientId={params.clientId}
      currentUserId={user.id}
      initial={messages ?? []}
      emptyHint="No messages yet in this client's thread."
    />
  );
}
