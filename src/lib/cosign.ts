import { callRpc } from "@/lib/rpc";
import { supabase } from "@/integrations/supabase/client";

export type CoSignRelationship = "contributor" | "client" | "verified_peer";

export const RELATIONSHIP_LABEL: Record<CoSignRelationship, string> = {
  contributor: "Co-Creator",
  client: "Client",
  verified_peer: "Peer Verified",
};

export const RELATIONSHIP_BLURB: Record<CoSignRelationship, string> = {
  contributor: "We built this together",
  client: "I hired them for this",
  verified_peer: "I can vouch for this work",
};

/** One accepted endorsement, as shown on a public profile. */
export interface ProfileCoSign {
  id: string;
  /** "received" = someone vouched for this founder. "given" = they vouched for someone. */
  direction: "received" | "given";
  relationship_type: CoSignRelationship;
  note: string | null;
  featured: boolean;
  created_at: string;
  portfolio_item_id: string;
  project_title: string | null;
  peer_slug: string;
  peer_name: string;
  peer_headline: string | null;
  peer_photo_url: string | null;
}

export interface PendingCoSign {
  id: string;
  relationship_type: CoSignRelationship;
  note: string | null;
  created_at: string;
  portfolio_item_id: string;
  project_title: string | null;
  peer_slug: string;
  peer_name: string;
  peer_headline: string | null;
  peer_photo_url: string | null;
}

export async function fetchProfileCoSigns(slug: string): Promise<ProfileCoSign[]> {
  const { data, error } = await callRpc<ProfileCoSign[]>("list_profile_cosigns", { _slug: slug });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchPendingCoSigns(): Promise<PendingCoSign[]> {
  const { data, error } = await callRpc<PendingCoSign[]>("my_pending_cosigns");
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * File a co-sign request.
 *
 * `target_user_id` is sent, but is not trusted: the insert policy re-derives
 * the portfolio item's real owner and rejects the row if they disagree. So a
 * tampered client cannot file an endorsement against a third party.
 */
export async function requestCoSign(args: {
  portfolioItemId: string;
  targetUserId: string;
  cosignerUserId: string;
  relationship: CoSignRelationship;
  note?: string;
}): Promise<void> {
  const { error } = await supabase.from("portfolio_cosigns").insert({
    portfolio_item_id: args.portfolioItemId,
    target_user_id: args.targetUserId,
    cosigner_user_id: args.cosignerUserId,
    relationship_type: args.relationship,
    note: args.note?.trim() ? args.note.trim().slice(0, 280) : null,
  });
  if (error) {
    // The unique constraint is the common, expected collision — say something
    // human rather than surfacing a Postgres constraint name.
    if (error.code === "23505") throw new Error("You've already co-signed this project.");
    if (error.code === "23514" || error.code === "42501") {
      throw new Error("You can't co-sign this — check it isn't your own work.");
    }
    throw new Error(error.message);
  }
}

/** Accept or decline. RLS restricts this to the person being vouched for. */
export async function answerCoSign(id: string, accept: boolean): Promise<void> {
  const { data, error } = await supabase
    .from("portfolio_cosigns")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("id", id)
    .select("id");
  if (error) throw new Error(error.message);
  // An RLS refusal updates 0 rows without raising, so a null error alone
  // would have reported success on a request belonging to someone else.
  if (!data?.length) throw new Error("That co-sign is no longer yours to answer.");
}

export async function setCoSignFeatured(id: string, featured: boolean): Promise<void> {
  const { data, error } = await supabase
    .from("portfolio_cosigns")
    .update({ featured })
    .eq("id", id)
    .select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Couldn't update that co-sign.");
}
