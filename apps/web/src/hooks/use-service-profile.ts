"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  SERVICE_PROFILE_CHANGE_EVENT,
  SERVICE_PROFILE_STORAGE_KEY,
  clearStoredServiceProfile,
  readStoredServiceProfile,
  saveStoredServiceProfile,
} from "@/lib/service-profile-storage";

function subscribe(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === SERVICE_PROFILE_STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SERVICE_PROFILE_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SERVICE_PROFILE_CHANGE_EVENT, callback);
  };
}

function getSnapshot() {
  return localStorage.getItem(SERVICE_PROFILE_STORAGE_KEY);
}

export function useServiceProfile() {
  const rawProfile = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const result = useMemo(
    () => readStoredServiceProfile(rawProfile),
    [rawProfile],
  );

  return {
    ...result,
    save: saveStoredServiceProfile,
    clear: clearStoredServiceProfile,
  };
}
