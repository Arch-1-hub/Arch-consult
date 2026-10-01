import { requireStaff } from "@/lib/admin";
import MessageThread from "@/components/messaging/MessageThread";

export const dynamic = "force-dynamic";

export default async function ConsultantMessageThread({
  params,
}: {
  params: { clientId: string };
}) {
  const { supabase, user } = await requireStaff();

  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, sender_id, sender_role, body, created_at")
    .eq("client_id", params.clientId)
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <p className="text-ash">
        Could not load this conversation. This client may not be assigned to
        you.
      </p>
    );
  }

  return (
    <MessageThread
      clientId={params.clientId}
      currentUserId={user.id}
      initial={messages ?? []}
    />
  );
}
