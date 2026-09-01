"use client";

import { useCallback, useMemo, useState } from "react";

import type {
  ImportCommitPlan,
  LeaveSnapshotCandidate,
} from "@super-gongik/importer";

import {
  activeEvents,
  activeSnapshots,
  commitImportToState,
  importedFingerprints,
  loadServiceRecordState,
  rollbackImportInState,
  saveServiceRecordState,
  type ServiceRecordState,
} from "@/lib/service-record-storage";

export function useServiceRecords(serviceProfileId: string) {
  const [state, setState] = useState<ServiceRecordState>(() =>
    loadServiceRecordState(serviceProfileId),
  );

  const commitImport = useCallback(
    (plan: ImportCommitPlan, snapshots: LeaveSnapshotCandidate[]) => {
      setState((current) => {
        const next = commitImportToState({
          serviceProfileId,
          current,
          plan,
          snapshots,
        });
        saveServiceRecordState(serviceProfileId, next);
        return next;
      });
    },
    [serviceProfileId],
  );

  const rollbackImport = useCallback(
    (batchId: string) => {
      setState((current) => {
        const next = rollbackImportInState(current, batchId);
        saveServiceRecordState(serviceProfileId, next);
        return next;
      });
    },
    [serviceProfileId],
  );

  const setWorkdayMinutes = useCallback(
    (minutes: number | null) => {
      setState((current) => {
        const next = { ...current, workdayMinutes: minutes };
        saveServiceRecordState(serviceProfileId, next);
        return next;
      });
    },
    [serviceProfileId],
  );

  return {
    state,
    events: useMemo(() => activeEvents(state), [state]),
    snapshots: useMemo(() => activeSnapshots(state), [state]),
    fingerprints: useMemo(() => importedFingerprints(state), [state]),
    commitImport,
    rollbackImport,
    setWorkdayMinutes,
  };
}
