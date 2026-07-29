import { supabase } from "@/integrations/supabase/client";

/**
 * Call a Postgres function that isn't in the generated `Database` types.
 *
 * This exists because of a bug that silently broke the public profile page,
 * Discover, view analytics and account deletion at the same time — and looked
 * like a network problem for days.
 *
 * The tempting way to work around the missing types is to pull the method off
 * the client and cast it:
 *
 *     const rpc = supabase.rpc as unknown as (fn: string) => Promise<…>;
 *     await rpc("list_public_profiles");        // ✗ throws
 *
 * `rpc` is a prototype method whose body is `return this.rest.rpc(...)`.
 * Assigning it to a variable detaches it, so `this` is undefined and the call
 * throws `TypeError: Cannot read properties of undefined (reading 'rest')`
 * *before issuing any request*. Nothing reaches the network, nothing appears
 * in the Supabase logs, and the only visible symptom is a rejected promise —
 * which React Query renders as "couldn't reach the server", pointing every
 * investigation at the network instead of at this line.
 *
 * Note that `(supabase.rpc as Cast)(fn)` is fine — parenthesising a member
 * expression preserves the binding. Only assignment breaks it. That subtlety
 * is exactly why this belongs in one helper rather than at each call site.
 */
export async function callRpc<T>(
  fn: string,
  args?: Record<string, unknown>,
): Promise<{ data: T | null; error: { message: string } | null }> {
  // Cast the *client*, not the method, so the call stays a method call and
  // `this` survives.
  const client = supabase as unknown as {
    rpc(
      fn: string,
      args?: Record<string, unknown>,
    ): Promise<{ data: T | null; error: { message: string } | null }>;
  };
  return client.rpc(fn, args);
}

/** Postgres `RETURNS TABLE`/`SETOF` functions arrive as an array even when the
 *  body has `LIMIT 1`; single-row callers all had to unwrap this by hand. */
export function firstRow<T>(data: T | T[] | null): T | null {
  if (data === null) return null;
  return Array.isArray(data) ? (data[0] ?? null) : data;
}
