import "client-only";

import { parseServiceProfile, type ServiceProfile } from "@super-gongik/domain";

export const SERVICE_PROFILE_STORAGE_KEY = "super-gongik.service-profile.v1";
export const SERVICE_PROFILE_CHANGE_EVENT =
  "super-gongik:service-profile-change";

export type StoredProfileRead =
  | { profile: ServiceProfile; error: null }
  | { profile: null; error: "CORRUPTED_LOCAL_PROFILE" | null };

export function readStoredServiceProfile(
  raw: string | null,
): StoredProfileRead {
  if (!raw) {
    return { profile: null, error: null };
  }

  try {
    return { profile: parseServiceProfile(JSON.parse(raw)), error: null };
  } catch {
    return { profile: null, error: "CORRUPTED_LOCAL_PROFILE" };
  }
}

export function saveStoredServiceProfile(profile: ServiceProfile) {
  localStorage.setItem(SERVICE_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event(SERVICE_PROFILE_CHANGE_EVENT));
}

export function clearStoredServiceProfile() {
  localStorage.removeItem(SERVICE_PROFILE_STORAGE_KEY);
  window.dispatchEvent(new Event(SERVICE_PROFILE_CHANGE_EVENT));
}
