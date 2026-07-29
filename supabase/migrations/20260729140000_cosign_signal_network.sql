-- The Co-Sign Signal Network: peer verification of portfolio work.
--
-- Someone who worked with you on a project can vouch for it. The claim is
-- worth something only if the person being vouched for cannot manufacture it,
-- so the integrity rules live in the database rather than the UI:
--
--   * you cannot co-sign your own work        (CHECK + policy)
--   * you cannot co-sign on someone's behalf  (cosigner_user_id = auth.uid())
--   * you cannot address a request to the wrong person — the target is
--     derived from the portfolio item's owner, not taken from the client
--   * only the target can accept or decline   (UPDATE policy)
--   * accepting cannot rewrite the claim      (immutability trigger)
--
-- Naming note: the spec called this table's parent "projects". This codebase
-- calls them portfolio_items, so the FK points there — same concept.

create type public.cosign_relationship as enum ('contributor', 'client', 'verified_peer');
create type public.cosign_status as enum ('pending', 'accepted', 'declined');

create table public.portfolio_cosigns (
  id                uuid primary key default gen_random_uuid(),
  portfolio_item_id uuid not null references public.portfolio_items(id) on delete cascade,
  -- Denormalised from the item's owner so policies and reads don't need a join
  -- on every row. The insert policy pins it to the true owner, and the
  -- immutability trigger stops it drifting afterwards.
  target_user_id    uuid not null references public.profiles(id) on delete cascade,
  cosigner_user_id  uuid not null references public.profiles(id) on delete cascade,
  relationship_type public.cosign_relationship not null,
  note              text check (note is null or char_length(note) <= 280),
  status            public.cosign_status not null default 'pending',
  -- The owner can highlight the endorsements they care about.
  featured          boolean not null default false,
  created_at        timestamptz not null default now(),
  responded_at      timestamptz,

  -- Vouching for yourself is not vouching. Enforced here as well as in the
  -- policy so it holds even for a future service-role script.
  constraint cosign_no_self check (target_user_id <> cosigner_user_id),
  -- One verdict per person per project; re-asking is an update, not a new row.
  constraint cosign_once unique (portfolio_item_id, cosigner_user_id)
);

create index portfolio_cosigns_target_idx   on public.portfolio_cosigns (target_user_id, status);
create index portfolio_cosigns_cosigner_idx on public.portfolio_cosigns (cosigner_user_id, status);
create index portfolio_cosigns_item_idx     on public.portfolio_cosigns (portfolio_item_id) where status = 'accepted';

alter table public.portfolio_cosigns enable row level security;

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

-- Accepted co-signs are public claims — that is the entire point of them.
create policy "Anyone reads accepted co-signs"
  on public.portfolio_cosigns for select to anon, authenticated
  using (status = 'accepted');

-- A pending request is visible to the two people it concerns and nobody else:
-- the founder who has to answer it, and the peer who sent it.
create policy "Participants read their own pending co-signs"
  on public.portfolio_cosigns for select to authenticated
  using (auth.uid() = target_user_id or auth.uid() = cosigner_user_id);

create policy "Admins read co-signs"
  on public.portfolio_cosigns for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

-- You may only create a co-sign *as yourself*, on someone else's published
-- work, addressed to that work's real owner, and it starts pending.
--
-- target_user_id is checked against the item's actual owner rather than
-- trusted: without that, a request could be filed against a third party who
-- would then see a pending endorsement for work that isn't theirs.
create policy "Peers request a co-sign on someone else's work"
  on public.portfolio_cosigns for insert to authenticated
  with check (
    cosigner_user_id = auth.uid()
    and target_user_id <> auth.uid()
    and status = 'pending'
    and exists (
      select 1
      from public.portfolio_items pi
      join public.profiles p on p.id = pi.profile_id
      left join public.profile_flags f on f.profile_id = p.id
      where pi.id = portfolio_item_id
        and pi.profile_id = target_user_id
        and p.is_published = true
        and f.archived_at is null
    )
  );

-- Only the person being vouched for answers. The `using` clause is what stops
-- someone approving a request addressed to another founder.
create policy "Targets answer their own co-sign requests"
  on public.portfolio_cosigns for update to authenticated
  using (auth.uid() = target_user_id)
  with check (auth.uid() = target_user_id);

-- A peer may withdraw a request they sent, while it is still unanswered.
create policy "Cosigners withdraw pending requests"
  on public.portfolio_cosigns for delete to authenticated
  using (auth.uid() = cosigner_user_id and status = 'pending');

create policy "Admins manage co-signs"
  on public.portfolio_cosigns for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

grant select on public.portfolio_cosigns to anon, authenticated;
grant insert, update, delete on public.portfolio_cosigns to authenticated;

-- Accepting must not let the endorsement be rewritten. RLS can gate *rows*
-- but not *columns*, so without this the target could flip a lukewarm
-- "client" note into a glowing "contributor" one and then accept it — an
-- endorsement they wrote for themselves, wearing a peer's name.
create or replace function public.enforce_cosign_immutability()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if new.portfolio_item_id is distinct from old.portfolio_item_id
     or new.target_user_id   is distinct from old.target_user_id
     or new.cosigner_user_id is distinct from old.cosigner_user_id
     or new.relationship_type is distinct from old.relationship_type
     or new.note             is distinct from old.note
     or new.created_at       is distinct from old.created_at then
    raise exception 'A co-sign''s claim cannot be edited — only answered.';
  end if;

  if new.status is distinct from old.status then
    -- An answer is final; re-opening would let a decline be quietly reversed.
    if old.status <> 'pending' then
      raise exception 'This co-sign has already been answered.';
    end if;
    new.responded_at := now();
  end if;

  return new;
end;
$$;

create trigger portfolio_cosigns_immutable
  before update on public.portfolio_cosigns
  for each row execute function public.enforce_cosign_immutability();

/* ------------------------------------------------------------------ */
/* Reads for the UI                                                    */
/* ------------------------------------------------------------------ */

-- The network shown on a public profile. SECURITY DEFINER because rendering it
-- needs the cosigner's name and slug, and `profiles` is not readable by anon —
-- the same reason get_public_profile_by_slug exists.
--
-- Returns both directions: people who vouched for this founder's work, and
-- work of others this founder vouched for. A one-directional web would show
-- two connected people an inconsistent picture of the same relationship.
create or replace function public.list_profile_cosigns(_slug text)
returns table (
  id uuid,
  direction text,
  relationship_type public.cosign_relationship,
  note text,
  featured boolean,
  created_at timestamptz,
  portfolio_item_id uuid,
  project_title text,
  peer_slug text,
  peer_name text,
  peer_headline text,
  peer_photo_url text
)
language sql
stable
security definer
set search_path to 'public'
as $$
  with me as (
    select p.id from public.profiles p
    left join public.profile_flags f on f.profile_id = p.id
    where p.slug = _slug and p.is_published = true and f.archived_at is null
  )
  select
    c.id,
    case when c.target_user_id = me.id then 'received' else 'given' end as direction,
    c.relationship_type,
    c.note,
    c.featured,
    c.created_at,
    c.portfolio_item_id,
    pi.title,
    peer.slug,
    coalesce(nullif(peer.identity->>'name', ''), peer.slug),
    nullif(peer.identity->>'headline', ''),
    nullif(peer.identity->>'photo_url', '')
  from me
  join public.portfolio_cosigns c
    on c.target_user_id = me.id or c.cosigner_user_id = me.id
  join public.portfolio_items pi on pi.id = c.portfolio_item_id
  -- The other party in the relationship, whichever end we are looking from.
  join public.profiles peer
    on peer.id = case when c.target_user_id = me.id then c.cosigner_user_id else c.target_user_id end
  left join public.profile_flags pf on pf.profile_id = peer.id
  where c.status = 'accepted'
    -- Never surface someone who has since unpublished or been archived.
    and peer.is_published = true
    and pf.archived_at is null
  order by c.featured desc, c.created_at desc;
$$;

-- Incoming requests awaiting this founder's answer, with enough about the
-- sender to make a judgement without leaving the dashboard.
create or replace function public.my_pending_cosigns()
returns table (
  id uuid,
  relationship_type public.cosign_relationship,
  note text,
  created_at timestamptz,
  portfolio_item_id uuid,
  project_title text,
  peer_slug text,
  peer_name text,
  peer_headline text,
  peer_photo_url text
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    c.id, c.relationship_type, c.note, c.created_at,
    c.portfolio_item_id, pi.title,
    peer.slug,
    coalesce(nullif(peer.identity->>'name', ''), peer.slug),
    nullif(peer.identity->>'headline', ''),
    nullif(peer.identity->>'photo_url', '')
  from public.portfolio_cosigns c
  join public.portfolio_items pi on pi.id = c.portfolio_item_id
  join public.profiles peer on peer.id = c.cosigner_user_id
  where c.target_user_id = auth.uid() and c.status = 'pending'
  order by c.created_at desc;
$$;

revoke execute on function public.my_pending_cosigns() from anon;
