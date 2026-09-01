"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  ImportCommitPlan,
  LeaveSnapshotCandidate,
} from "@super-gongik/importer";

import {
  activeEvents,
  activeSnapshots,
  commitImportToState,
  createEmptyServiceRecordState,
  importedFingerprints,
  loadServiceRecordState,
  rollbackImportInState,
  saveServiceRecordState,
  type ServiceRecordState,
} from "@/lib/service-record-storage";

export function useServiceRecords(serviceProfileId: string) {
  const [state, setState] = useState<ServiceRecordState>(
    createEmptyServiceRecordState,
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setState(loadServiceRecordState(serviceProfileId));
    setLoaded(true);
  }, [serviceProfileId]);

  const persist = useCallback(
    (next: ServiceRecordState) => {
      saveServiceRecordState(serviceProfileId, next);
      setState(next);
    },
    [serviceProfileId],
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
      persist({ ...state, workdayMinutes: minutes });
    },
    [persist, state],
  );

  return {
    state,
    loaded,
    events: useMemo(() => activeEvents(state), [state]),
    snapshots: useMemo(() => activeSnapshots(state), [state]),
    fingerprints: useMemo(() => importedFingerprints(state), [state]),
    commitImport,
    rollbackImport,
    setWorkdayMinutes,
  };
}
