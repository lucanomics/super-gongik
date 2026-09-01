import { classifyEventType } from "./classify";
import { fingerprintEventCandidate } from "./fingerprint";
import { findMappedHeader, mapColumns } from "./mapping";
import {
  normalizeEventRow,
  parseDateCell,
  parseDayCount,
  parseDurationMinutes,
} from "./normalize";
import type {
  ColumnMapping,
  ImportBatchDescriptor,
  ImportCommitPlan,
  ImportPreview,
  ImportSourceFormat,
  LeaveSnapshotCandidate,
  ServiceEventCandidate,
  TabularAdapterResult,
  TabularRow,
} from "./types";

export function createImportBatchDescriptor(input: {
  fileName: string;
  sourceFormat: ImportSourceFormat;
  fileSha256?: string | null;
  createdAt?: string;
  id?: string;
}): ImportBatchDescriptor {
  return {
    id: input.id ?? crypto.randomUUID(),
    fileName: input.fileName,
    sourceFormat: input.sourceFormat,
    fileSha256: input.fileSha256 ?? null,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

function getValue(
  row: TabularRow,
  mappings: ReturnType<typeof mapColumns>,
  target: Parameters<typeof findMappedHeader>[1],
) {
  const header = findMappedHeader(mappings, target);
  return header ? row[header] : null;
}

function isSnapshotShape(mappings: ReturnType<typeof mapColumns>) {
  return mappings.some((mapping) =>
    ["granted", "used", "remaining"].includes(mapping.target),
  );
}

function normalizeSnapshotRow(
  row: TabularRow,
  sourceRowIndex: number,
  mappings: ReturnType<typeof mapColumns>,
): LeaveSnapshotCandidate {
  const classification = classifyEventType(
    getValue(row, mappings, "eventType"),
  );
  const granted = getValue(row, mappings, "granted");
  const used = getValue(row, mappings, "used");
  const remaining = getValue(row, mappings, "remaining");

  return {
    sourceRowIndex,
    leaveType: classification.eventType,
    asOfDate:
      parseDateCell(getValue(row, mappings, "asOfDate")) ??
      parseDateCell(getValue(row, mappings, "date")),
    grantedDays: parseDayCount(granted),
    grantedMinutes: parseDurationMinutes(granted),
    usedDays: parseDayCount(used),
    usedMinutes: parseDurationMinutes(used),
    remainingDays: parseDayCount(remaining),
    remainingMinutes: parseDurationMinutes(remaining),
    confidence: classification.confidence,
    warnings: classification.warnings,
    raw: row,
  };
}

export async function buildImportPreview(
  tabular: TabularAdapterResult,
  batch: ImportBatchDescriptor,
  mappingOverride?: ColumnMapping[],
): Promise<ImportPreview> {
  const mappings = mappingOverride ?? mapColumns(tabular.headers);
  const hasDateColumn = mappings.some((mapping) => mapping.target === "date");
  const snapshotShape = isSnapshotShape(mappings);
  const events: ServiceEventCandidate[] = [];
  const snapshots: LeaveSnapshotCandidate[] = [];
  const unresolvedRowIndexes: number[] = [];

  for (let index = 0; index < tabular.rows.length; index += 1) {
    const row = tabular.rows[index];
    const sourceRowIndex = index + 2;

    if (snapshotShape && !hasDateColumn) {
      const snapshot = normalizeSnapshotRow(row, sourceRowIndex, mappings);
      snapshots.push(snapshot);
      if (!snapshot.leaveType || snapshot.confidence < 0.7) {
        unresolvedRowIndexes.push(sourceRowIndex);
      }
      continue;
    }

    const candidate = normalizeEventRow(row, sourceRowIndex, mappings);
    if (candidate.date && candidate.eventType) {
      candidate.fingerprint = await fingerprintEventCandidate(candidate);
    }
    events.push(candidate);

    if (
      !candidate.date ||
      !candidate.eventType ||
      candidate.confidence < 0.7 ||
      candidate.warnings.some((warning) =>
        ["AMBIGUOUS_HALF_DAY", "AMBIGUOUS_DAY_FRACTION"].includes(
          warning.code,
        ),
      )
    ) {
      unresolvedRowIndexes.push(sourceRowIndex);
    }
  }

  return { batch, mappings, events, snapshots, unresolvedRowIndexes };
}

export function buildImportCommitPlan(input: {
  preview: ImportPreview;
  acceptedRowIndexes: ReadonlySet<number>;
  existingFingerprints?: ReadonlySet<string>;
}): ImportCommitPlan {
  const existing = input.existingFingerprints ?? new Set<string>();
  const skippedDuplicateFingerprints: string[] = [];
  const events: ImportCommitPlan["events"] = [];

  for (const candidate of input.preview.events) {
    if (!input.acceptedRowIndexes.has(candidate.sourceRowIndex)) continue;
    if (!candidate.date || !candidate.eventType || !candidate.fingerprint) {
      continue;
    }
    if (
      candidate.durationDays !== null &&
      !Number.isInteger(candidate.durationDays)
    ) {
      continue;
    }

    if (existing.has(candidate.fingerprint)) {
      skippedDuplicateFingerprints.push(candidate.fingerprint);
      continue;
    }

    events.push({
      candidate,
      metadata: {
        importBatchId: input.preview.batch.id,
        importSourceFormat: input.preview.batch.sourceFormat,
        importSourceFileName: input.preview.batch.fileName,
        importFingerprint: candidate.fingerprint,
        importConfidence: candidate.confidence,
        importSourceRowIndex: candidate.sourceRowIndex,
        ...(candidate.durationDays !== null
          ? { importDayCount: candidate.durationDays }
          : {}),
      },
    });
  }

  return {
    batch: input.preview.batch,
    events,
    skippedDuplicateFingerprints,
  };
}

export function getImportedEventIdsForRollback(
  batchId: string,
  events: ReadonlyArray<{
    id: string;
    metadata?: { importBatchId?: string | null } | null;
    deletedAt?: string | null;
  }>,
): string[] {
  return events
    .filter(
      (event) => !event.deletedAt && event.metadata?.importBatchId === batchId,
    )
    .map((event) => event.id);
}
