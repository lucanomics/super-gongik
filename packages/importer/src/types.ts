export type ImportSourceFormat =
  | "CSV"
  | "XLSX"
  | "PDF_TEXT"
  | "PDF_OCR"
  | "HWP"
  | "HWPX"
  | "UNKNOWN";

export type CanonicalColumn =
  | "date"
  | "eventType"
  | "duration"
  | "startTime"
  | "endTime"
  | "note"
  | "granted"
  | "used"
  | "remaining"
  | "asOfDate";

export type TabularCell = string | number | boolean | Date | null | undefined;
export type TabularRow = Record<string, TabularCell>;

export type ImportableServiceEventType =
  | "ANNUAL_LEAVE"
  | "SICK_LEAVE"
  | "OFFICIAL_LEAVE"
  | "SPECIAL_LEAVE"
  | "COMPASSIONATE_LEAVE"
  | "OUTING"
  | "LATE_ARRIVAL"
  | "EARLY_LEAVE"
  | "EDUCATION"
  | "TRAINING"
  | "USER_NOTE";

export interface ColumnMapping {
  sourceHeader: string;
  target: CanonicalColumn;
  confidence: number;
}

export type ImportWarningCode =
  | "MISSING_DATE"
  | "MISSING_EVENT_TYPE"
  | "MISSING_DURATION"
  | "UNRECOGNIZED_DATE"
  | "UNRECOGNIZED_EVENT_TYPE"
  | "UNRECOGNIZED_DURATION"
  | "AMBIGUOUS_HALF_DAY"
  | "AMBIGUOUS_DAY_FRACTION"
  | "LOW_CONFIDENCE";

export interface ImportWarning {
  code: ImportWarningCode;
  message: string;
}

export interface ServiceEventCandidate {
  sourceRowIndex: number;
  eventType: ImportableServiceEventType | null;
  date: string | null;
  allDay: boolean;
  durationDays: number | null;
  durationMinutes: number | null;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
  confidence: number;
  warnings: ImportWarning[];
  fingerprint: string | null;
  raw: TabularRow;
}

export interface LeaveSnapshotCandidate {
  sourceRowIndex: number;
  leaveType: ImportableServiceEventType | null;
  asOfDate: string | null;
  grantedDays: number | null;
  grantedMinutes: number | null;
  usedDays: number | null;
  usedMinutes: number | null;
  remainingDays: number | null;
  remainingMinutes: number | null;
  confidence: number;
  warnings: ImportWarning[];
  raw: TabularRow;
}

export interface ImportBatchDescriptor {
  id: string;
  fileName: string;
  sourceFormat: ImportSourceFormat;
  fileSha256: string | null;
  createdAt: string;
}

export interface ImportPreview {
  batch: ImportBatchDescriptor;
  mappings: ColumnMapping[];
  events: ServiceEventCandidate[];
  snapshots: LeaveSnapshotCandidate[];
  unresolvedRowIndexes: number[];
}

export interface ImportedEventMetadata {
  importBatchId: string;
  importSourceFormat: ImportSourceFormat;
  importSourceFileName: string;
  importFingerprint: string;
  importConfidence: number;
  importSourceRowIndex: number;
  importDayCount?: number;
}

export interface ImportCommitPlan {
  batch: ImportBatchDescriptor;
  events: Array<{
    candidate: ServiceEventCandidate;
    metadata: ImportedEventMetadata;
  }>;
  skippedDuplicateFingerprints: string[];
}

export interface TabularAdapterResult {
  format: ImportSourceFormat;
  headers: string[];
  rows: TabularRow[];
  sourceLabel?: string | null;
}

export interface ImportFileAdapter<TInput = unknown> {
  canHandle(input: TInput): boolean;
  parse(input: TInput): Promise<TabularAdapterResult>;
}
