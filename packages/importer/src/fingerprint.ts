import type { ServiceEventCandidate } from "./types";

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256(value: string | ArrayBuffer): Promise<string> {
  const input =
    typeof value === "string"
      ? new TextEncoder().encode(value)
      : new Uint8Array(value);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return toHex(digest);
}

export async function fingerprintEventCandidate(
  candidate: ServiceEventCandidate,
): Promise<string> {
  const canonical = JSON.stringify({
    date: candidate.date,
    eventType: candidate.eventType,
    allDay: candidate.allDay,
    durationMinutes: candidate.durationMinutes,
    startTime: candidate.startTime,
    endTime: candidate.endTime,
    note: candidate.note?.trim() || null,
  });
  return sha256(canonical);
}
