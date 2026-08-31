"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);

  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

export function OfflineBanner() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, () => true);

  if (isOnline) {
    return null;
  }

  return (
    <div className="offline-banner" role="status">
      오프라인 상태예요. 입력한 정보는 이 기기에 계속 저장됩니다.
    </div>
  );
}
