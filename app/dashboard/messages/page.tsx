import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MessageThread from "@/components/messaging/MessageThread";

export const dynamic = "force-dynamic";

export default async function DashboardMessagesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/dashboard/messages");

  const { data: assignment } = await supabase
    .from("client_assignments")
    .select("consultant_id, profiles:consultant_id(full_name)")
    .eq("client_id", user.id)
    .maybeSingle();

  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, sender_id, sender_role, body, created_at")
    .eq("client_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return <p className="text-ash">Could not load messages: {error.message}</p>;
  }

  const consultantName = (assignment as any)?.profiles?.full_name;

  return (
    <div>
      <h1 className="font-display text-2xl text-paper-white">Messages</h1>
      <p className="mt-1 text-sm text-ash">
        {consultantName
          ? `Direct line to ${consultantName}, your Arch Consult consultant.`
          : "Send a message and an Arch Consult team member will reply here."}
      </p>
      <div className="mt-6">
        <MessageThread clientId={user.id} currentUserId={user.id} initial={messages ?? []} />
      </div>
    </div>
  );
}
