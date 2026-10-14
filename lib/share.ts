import type { Filters, TeamMember } from './types';

export interface SharedState {
  filters: Filters;
  team: TeamMember[];
}

function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): string {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export const encodeState = (state: SharedState) => toBase64Url(JSON.stringify(state));

export function decodeState(s: string): Partial<SharedState> | null {
  try {
    return JSON.parse(fromBase64Url(s));
  } catch {
    return null;
  }
}
