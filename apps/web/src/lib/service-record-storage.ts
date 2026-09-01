import type {
  ImportCommitPlan,
  ImportSourceFormat,
  ImportableServiceEventType,
  LeaveSnapshotCandidate,
} from "@super-gongik/importer";

const STORAGE_PREFIX = "super-gongik:service-records:v1";

export interface StoredServiceEvent {
  id: string;
  serviceProfileId: string;
  eventType: ImportableServiceEventType;
  startsAt: string;
  endsAt: string | null;
  durationMinutes: number | null;
  allDay: boolean;
  title: string | null;
  note: string | null;
  status: "CONFIRMED";
  metadata: {
    importBatchId?: string;
    importSourceFormat?: ImportSourceFormat;
    importSourceFileName?: string;
    importFingerprint?: string;
    importConfidence?: number;
    importSourceRowIndex?: number;
  };
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  revision: number;
  deviceId: string;
}

export interface StoredLeaveSnapshot {
  id: string;
  serviceProfileId: string;
  importBatchId: string;
  leaveType: ImportableServiceEventType | null;
  asOfDate: string | null;
  grantedDays: number | null;
  grantedMinutes: number | null;
  usedDays: number | null;
  usedMinutes: number | null;
  remainingDays: number | null;
  remainingMinutes: number | null;
  confidence: number;
  sourceRowIndex: number;
  createdAt: string;
  deletedAt: string | null;
}

export interface StoredImportRecord {
  id: string;
  serviceProfileId: string;
  fileName: string;
  sourceFormat: ImportSourceFormat;
  fileSha256: string | null;
  createdAt: string;
  eventCount: number;
  snapshotCount: number;
  skippedDuplicateCount: number;
  status: "ACTIVE" | "ROLLED_BACK";
  rolledBackAt: string | null;
}

export interface ServiceRecordState {
  schemaVersion: 1;
  workdayMinutes: number | null;
  events: StoredServiceEvent[];
  snapshots: StoredLeaveSnapshot[];
  imports: StoredImportRecord[];
}

export function createEmptyServiceRecordState(): ServiceRecordState {
  return {
    schemaVersion: 1,
    workdayMinutes: null,
    events: [],
    snapshots: [],
    imports: [],
  };
}

function storageKey(serviceProfileId: string) {
  return `${STORAGE_PREFIX}:${serviceProfileId}`;
}

function getDeviceId() {
  const key = "super-gongik:device-id:v1";
  const current = window.localStorage.getItem(key);
  if (current) return current;
  const created = crypto.randomUUID();
  window.localStorage.setItem(key, created);
  return created;
}

export function loadServiceRecordState(
  serviceProfileId: string,
): ServiceRecordState {
  if (typeof window === "undefined") return createEmptyServiceRecordState();
  const raw = window.localStorage.getItem(storageKey(serviceProfileId));
  if (!raw) return createEmptyServiceRecordState();

  try {
    const parsed = JSON.parse(raw) as Partial<ServiceRecordState>;
    if (parsed.schemaVersion !== 1) return createEmptyServiceRecordState();
    return {
      schemaVersion: 1,
      workdayMinutes:
        typeof parsed.workdayMinutes === "number" && parsed.workdayMinutes > 0
          ? parsed.workdayMinutes
          : null,
      events: Array.isArray(parsed.events) ? parsed.events : [],
      snapshots: Array.isArray(parsed.snapshots) ? parsed.snapshots : [],
      imports: Array.isArray(parsed.imports) ? parsed.imports : [],
    };
  } catch {
    return createEmptyServiceRecordState();
  }
}

export function saveServiceRecordState(
  serviceProfileId: string,
  state: ServiceRecordState,
) {
  window.localStorage.setItem(storageKey(serviceProfileId), JSON.stringify(state));
}

function toSeoulDateTime(date: string, clock: string | null) {
  return `${date}T${clock ?? "00:00"}:00+09:00`;
}

function durationBetween(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const [startHours, startMinutes] = start.split(":").map(Number);
  const [endHours, endMinutes] = end.split(":").map(Number);
  const duration = endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
  return duration > 0 ? duration : null;
}

export function commitImportToState(input: {
  serviceProfileId: string;
  current: ServiceRecordState;
  plan: ImportCommitPlan;
  snapshots: LeaveSnapshotCandidate[];
}): ServiceRecordState {
  const now = new Date().toISOString();
  const deviceId = getDeviceId();

  const events = input.plan.events.map(({ candidate, metadata }) => ({
    id: crypto.randomUUID(),
    serviceProfileId: input.serviceProfileId,
    eventType: candidate.eventType!,
    startsAt: toSeoulDateTime(candidate.date!, candidate.startTime),
    endsAt: candidate.endTime
      ? toSeoulDateTime(candidate.date!, candidate.endTime)
      : null,
    durationMinutes:
      candidate.durationMinutes ??
      durationBetween(candidate.startTime, candidate.endTime),
    allDay: candidate.allDay,
    title: null,
    note: candidate.note,
    status: "CONFIRMED" as const,
    metadata,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    revision: 1,
    deviceId,
  }));

  const snapshots: StoredLeaveSnapshot[] = input.snapshots.map((snapshot) => ({
    id: crypto.randomUUID(),
    serviceProfileId: input.serviceProfileId,
    importBatchId: input.plan.batch.id,
    leaveType: snapshot.leaveType,
    asOfDate: snapshot.asOfDate,
    grantedDays: snapshot.grantedDays,
    grantedMinutes: snapshot.grantedMinutes,
    usedDays: snapshot.usedDays,
    usedMinutes: snapshot.usedMinutes,
    remainingDays: snapshot.remainingDays,
    remainingMinutes: snapshot.remainingMinutes,
    confidence: snapshot.confidence,
    sourceRowIndex: snapshot.sourceRowIndex,
    createdAt: now,
    deletedAt: null,
  }));

  const importRecord: StoredImportRecord = {
    id: input.plan.batch.id,
    serviceProfileId: input.serviceProfileId,
    fileName: input.plan.batch.fileName,
    sourceFormat: input.plan.batch.sourceFormat,
    fileSha256: input.plan.batch.fileSha256,
    createdAt: input.plan.batch.createdAt,
    eventCount: events.length,
    snapshotCount: snapshots.length,
    skippedDuplicateCount: input.plan.skippedDuplicateFingerprints.length,
    status: "ACTIVE",
    rolledBackAt: null,
  };

  return {
    ...input.current,
    events: [...input.current.events, ...events],
    snapshots: [...input.current.snapshots, ...snapshots],
    imports: [importRecord, ...input.current.imports],
  };
}

export function rollbackImportInState(
  current: ServiceRecordState,
  batchId: string,
): ServiceRecordState {
  const now = new Date().toISOString();
  return {
    ...current,
    events: current.events.map((event) =>
      event.metadata.importBatchId === batchId && !event.deletedAt
        ? {
            ...event,
            deletedAt: now,
            updatedAt: now,
            revision: event.revision + 1,
          }
        : event,
    ),
    snapshots: current.snapshots.map((snapshot) =>
      snapshot.importBatchId === batchId && !snapshot.deletedAt
        ? { ...snapshot, deletedAt: now }
        : snapshot,
    ),
    imports: current.imports.map((record) =>
      record.id === batchId && record.status === "ACTIVE"
        ? { ...record, status: "ROLLED_BACK", rolledBackAt: now }
        : record,
    ),
  };
}

export function activeEvents(state: ServiceRecordState) {
  return state.events.filter((event) => !event.deletedAt);
}

export function activeSnapshots(state: ServiceRecordState) {
  return state.snapshots.filter((snapshot) => !snapshot.deletedAt);
}

export function importedFingerprints(state: ServiceRecordState) {
  return new Set(
    activeEvents(state)
      .map((event) => event.metadata.importFingerprint)
      .filter((value): value is string => Boolean(value)),
  );
}
