/**
 * One place for the password rules, so sign-up, reset and change agree.
 *
 * They used to hardcode `minLength={6}` independently, which is fine until one
 * of them moves and a founder can set a password on one screen that another
 * screen rejects.
 */

/** Matches the Supabase project's minimum. Raising it here alone would let
 *  sign-up accept passwords the change form then refuses. */
export const MIN_PASSWORD_LENGTH = 6;

export interface PasswordDraft {
  /** The proposed new password. */
  next: string;
  /** The retyped copy. */
  confirm: string;
  /** The existing password, when there is one to compare against. */
  current?: string;
}

/**
 * The single reason this draft can't be submitted yet, or null when it can.
 *
 * Returns one message rather than a list: showing "too short" and "doesn't
 * match" together while someone is still typing the first field is noise.
 * Callers that only want to enable a button can use {@link isPasswordReady}.
 */
export function passwordProblem({ next, confirm, current }: PasswordDraft): string | null {
  if (next.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (current && next === current) {
    return "That's the password you already have — pick a different one.";
  }
  if (next !== confirm) {
    return "The two passwords don't match.";
  }
  return null;
}

export function isPasswordReady(draft: PasswordDraft): boolean {
  return passwordProblem(draft) === null;
}

/**
 * The problem worth showing *while typing*.
 *
 * Suppresses complaints about fields the person hasn't finished — an empty
 * confirm box is incomplete, not wrong.
 */
export function visiblePasswordProblem(draft: PasswordDraft): string | null {
  if (draft.next.length === 0) return null;
  if (draft.confirm.length === 0 && draft.next.length >= MIN_PASSWORD_LENGTH) return null;
  return passwordProblem(draft);
}
