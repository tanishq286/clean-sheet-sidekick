import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, MailOpen, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

/**
 * Messages sent through the contact form on your public profile.
 *
 * Reads the table directly rather than through an RPC: RLS already restricts
 * `profile_messages` to `profile_id = auth.uid()`, so the filter is enforced
 * server-side whatever the client asks for.
 */
interface Message {
  id: string;
  sender_name: string;
  sender_email: string;
  intent: string | null;
  budget: number | null;
  timeline: string | null;
  body: string;
  created_at: string;
  read_at: string | null;
}

const INTENT_LABEL: Record<string, string> = {
  project: "Project inquiry",
  role: "Full-time role",
  mentorship: "Mentorship",
  hello: "Saying hello",
};

function when(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function InboxCard() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["my-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as Message[];
    },
  });

  const unread = messages.filter((m) => m.read_at === null).length;

  const open = async (m: Message) => {
    const next = expanded === m.id ? null : m.id;
    setExpanded(next);
    // Mark read on first open only — reopening shouldn't rewrite the row.
    if (next && m.read_at === null) {
      await supabase
        .from("profile_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("id", m.id);
      qc.invalidateQueries({ queryKey: ["my-messages"] });
    }
  };

  const remove = async (m: Message) => {
    if (!confirm(`Delete the message from ${m.sender_name}? This can't be undone.`)) return;
    const { data, error } = await supabase
      .from("profile_messages").delete().eq("id", m.id).select("id");
    if (error) return toast({ title: "Couldn't delete", description: error.message, variant: "destructive" });
    // RLS refusals delete 0 rows without raising, so confirm one actually went.
    if (!data?.length) return toast({ title: "Couldn't delete that message", variant: "destructive" });
    toast({ title: "Message deleted" });
    qc.invalidateQueries({ queryKey: ["my-messages"] });
  };

  if (isLoading) {
    return <div className="h-28 animate-pulse rounded-xl border bg-muted/40" />;
  }

  if (messages.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h3 className="font-semibold">No messages yet</h3>
        <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">
          When someone uses the contact form on your public profile, their message arrives here —
          you don&apos;t need to watch an inbox for it.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-semibold">
          Messages{" "}
          <span className="text-sm font-normal text-muted-foreground tabular-nums">
            {unread > 0 ? `${unread} unread` : `${messages.length} total`}
          </span>
        </h3>
      </div>

      <ul className="divide-y">
        {messages.map((m) => {
          const isOpen = expanded === m.id;
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => void open(m)}
                aria-expanded={isOpen}
                className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-muted/50"
              >
                {m.read_at === null ? (
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--highlightColor, #FF6B35)" }} />
                ) : (
                  <MailOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className={m.read_at === null ? "font-semibold" : "font-medium"}>
                      {m.sender_name}
                    </span>
                    <span className="text-xs text-muted-foreground">{m.sender_email}</span>
                    {m.intent && (
                      <span className="rounded-full border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {INTENT_LABEL[m.intent] ?? m.intent}
                      </span>
                    )}
                  </span>
                  <span className={`mt-1 block text-sm text-muted-foreground ${isOpen ? "" : "line-clamp-1"}`}>
                    {m.body}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{when(m.created_at)}</span>
              </button>

              {isOpen && (
                <div className="flex flex-wrap items-center gap-2 px-4 pb-4 pl-11">
                  {m.budget != null && (
                    <span className="text-xs text-muted-foreground">
                      Budget ≈ ${m.budget.toLocaleString()}
                      {m.timeline ? ` · ${m.timeline}` : ""}
                    </span>
                  )}
                  <Button asChild size="sm" variant="outline">
                    <a href={`mailto:${m.sender_email}?subject=${encodeURIComponent(`Re: your message`)}`}>
                      Reply by email
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => void remove(m)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
