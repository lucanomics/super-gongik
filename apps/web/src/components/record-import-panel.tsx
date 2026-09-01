"use client";

import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Upload,
} from "lucide-react";
import { type ChangeEvent, useMemo, useState } from "react";

import {
  buildImportCommitPlan,
  buildImportPreview,
  createImportBatchDescriptor,
  fingerprintEventCandidate,
  type CanonicalColumn,
  type ColumnMapping,
  type ImportPreview,
  type ImportableServiceEventType,
  type ServiceEventCandidate,
  type TabularAdapterResult,
} from "@super-gongik/importer";

import { Button } from "@/components/ui/button";
import { parseImportFile } from "@/lib/file-import-adapters";
import type { StoredImportRecord } from "@/lib/service-record-storage";

const EVENT_OPTIONS: Array<{
  value: ImportableServiceEventType;
  label: string;
}> = [
  { value: "ANNUAL_LEAVE", label: "연가" },
  { value: "SICK_LEAVE", label: "병가" },
  { value: "OFFICIAL_LEAVE", label: "공가" },
  { value: "SPECIAL_LEAVE", label: "특별휴가" },
  { value: "COMPASSIONATE_LEAVE", label: "청원/경조휴가" },
  { value: "OUTING", label: "외출" },
  { value: "LATE_ARRIVAL", label: "지각" },
  { value: "EARLY_LEAVE", label: "조퇴" },
  { value: "EDUCATION", label: "교육" },
  { value: "TRAINING", label: "훈련" },
  { value: "USER_NOTE", label: "기타 기록" },
];

const COLUMN_OPTIONS: Array<{ value: CanonicalColumn; label: string }> = [
  { value: "date", label: "날짜" },
  { value: "eventType", label: "휴가/복무 종류" },
  { value: "duration", label: "사용 시간/일수" },
  { value: "startTime", label: "시작 시간" },
  { value: "endTime", label: "종료 시간" },
  { value: "note", label: "비고/사유" },
  { value: "granted", label: "총 부여" },
  { value: "used", label: "누적 사용" },
  { value: "remaining", label: "잔여" },
  { value: "asOfDate", label: "기준일" },
];

interface EventOverride {
  date?: string;
  eventType?: ImportableServiceEventType | "";
  durationMinutes?: string;
}

export function RecordImportPanel({
  fingerprints,
  imports,
  workdayMinutes,
  onSetWorkdayMinutes,
  onCommit,
  onRollback,
}: {
  fingerprints: ReadonlySet<string>;
  imports: StoredImportRecord[];
  workdayMinutes: number | null;
  onSetWorkdayMinutes: (minutes: number | null) => void;
  onCommit: Parameters<typeof buildImportCommitPlan>[0] extends never
    ? never
    : (
        plan: ReturnType<typeof buildImportCommitPlan>,
        snapshots: ImportPreview["snapshots"],
      ) => void;
  onRollback: (batchId: string) => void;
}) {
  const [status, setStatus] = useState<"IDLE" | "PARSING" | "PREVIEW">("IDLE");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [tabular, setTabular] = useState<TabularAdapterResult | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [acceptedRows, setAcceptedRows] = useState<Set<number>>(new Set());
  const [acceptedSnapshots, setAcceptedSnapshots] = useState<Set<number>>(
    new Set(),
  );
  const [overrides, setOverrides] = useState<Record<number, EventOverride>>({});

  const duplicateCount = useMemo(() => {
    if (!preview) return 0;
    return preview.events.filter(
      (event) => event.fingerprint && fingerprints.has(event.fingerprint),
    ).length;
  }, [fingerprints, preview]);

  async function applyPreview(
    nextTabular: TabularAdapterResult,
    nextPreview: ImportPreview,
  ) {
    setTabular(nextTabular);
    setPreview(nextPreview);
    setOverrides({});
    setAcceptedRows(
      new Set(
        nextPreview.events
          .filter(
            (event) =>
              event.date &&
              event.eventType &&
              !event.warnings.some(
                (warning) => warning.code === "AMBIGUOUS_HALF_DAY",
              ),
          )
          .map((event) => event.sourceRowIndex),
      ),
    );
    setAcceptedSnapshots(
      new Set(
        nextPreview.snapshots
          .filter(
            (snapshot) => snapshot.leaveType && snapshot.confidence >= 0.7,
          )
          .map((snapshot) => snapshot.sourceRowIndex),
      ),
    );
    setStatus("PREVIEW");
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setStatus("PARSING");
    setError("");
    setMessage("");

    try {
      const parsed = await parseImportFile(file);
      const batch = createImportBatchDescriptor({
        fileName: file.name,
        sourceFormat: parsed.tabular.format,
        fileSha256: parsed.fileSha256,
      });
      await applyPreview(
        parsed.tabular,
        await buildImportPreview(parsed.tabular, batch),
      );
    } catch (reason) {
      setStatus("IDLE");
      setError(
        reason instanceof Error
          ? reason.message
          : "파일을 분석하지 못했습니다.",
      );
    }
  }

  async function updateMapping(header: string, target: CanonicalColumn | "") {
    if (!tabular || !preview) return;
    const nextMappings: ColumnMapping[] = preview.mappings
      .filter((mapping) => mapping.sourceHeader !== header)
      .filter((mapping) => !target || mapping.target !== target);

    if (target) {
      nextMappings.push({ sourceHeader: header, target, confidence: 1 });
    }

    const rebuilt = await buildImportPreview(
      tabular,
      preview.batch,
      nextMappings,
    );
    await applyPreview(tabular, rebuilt);
  }

  function updateOverride(row: number, patch: EventOverride) {
    setOverrides((current) => ({
      ...current,
      [row]: { ...current[row], ...patch },
    }));
  }

  function toggleRow(row: number) {
    setAcceptedRows((current) => {
      const next = new Set(current);
      if (next.has(row)) next.delete(row);
      else next.add(row);
      return next;
    });
  }

  function toggleSnapshot(row: number) {
    setAcceptedSnapshots((current) => {
      const next = new Set(current);
      if (next.has(row)) next.delete(row);
      else next.add(row);
      return next;
    });
  }

  async function adjustedCandidate(
    candidate: ServiceEventCandidate,
  ): Promise<ServiceEventCandidate> {
    const override = overrides[candidate.sourceRowIndex];
    const durationInput = override?.durationMinutes?.trim();
    const durationMinutes = durationInput
      ? Number(durationInput)
      : candidate.durationMinutes;
    const adjusted: ServiceEventCandidate = {
      ...candidate,
      date: override?.date ?? candidate.date,
      eventType:
        override?.eventType === ""
          ? null
          : (override?.eventType ?? candidate.eventType),
      durationMinutes:
        durationMinutes !== null &&
        durationMinutes !== undefined &&
        Number.isFinite(durationMinutes) &&
        durationMinutes >= 0
          ? durationMinutes
          : null,
    };
    adjusted.allDay =
      adjusted.durationMinutes === null &&
      !adjusted.startTime &&
      !adjusted.endTime;
    adjusted.fingerprint =
      adjusted.date && adjusted.eventType
        ? await fingerprintEventCandidate(adjusted)
        : null;
    return adjusted;
  }

  async function commit() {
    if (!preview) return;
    setError("");

    const events = await Promise.all(
      preview.events.map((candidate) => adjustedCandidate(candidate)),
    );
    const adjustedPreview: ImportPreview = { ...preview, events };
    const plan = buildImportCommitPlan({
      preview: adjustedPreview,
      acceptedRowIndexes: acceptedRows,
      existingFingerprints: fingerprints,
    });
    const snapshots = adjustedPreview.snapshots.filter((snapshot) =>
      acceptedSnapshots.has(snapshot.sourceRowIndex),
    );

    if (plan.events.length === 0 && snapshots.length === 0) {
      setError(
        "가져올 새 기록이 없습니다. 중복 또는 미선택 항목을 확인해 주세요.",
      );
      return;
    }

    onCommit(plan, snapshots);
    setMessage(
      `${plan.events.length}개 복무기록과 ${snapshots.length}개 기관 잔액 기록을 저장했어요.`,
    );
    setStatus("IDLE");
    setPreview(null);
    setTabular(null);
  }

  return (
    <section className="record-import" aria-labelledby="record-import-title">
      <div className="record-import__heading">
        <div>
          <h2 id="record-import-title">복무기록 가져오기</h2>
          <p>
            기관에서 받은 파일을 기기 안에서 분석해 휴가 기록으로 복원합니다.
          </p>
        </div>
        <Upload aria-hidden="true" size={24} />
      </div>

      <div className="record-import__privacy">
        원본 파일은 기본적으로 서버에 업로드하지 않습니다. CSV, XLSX, 텍스트
        PDF는 이 브라우저에서 처리합니다.
      </div>

      <label className="record-import__dropzone">
        <input
          accept=".csv,.tsv,.xlsx,.pdf,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          disabled={status === "PARSING"}
          onChange={handleFile}
          type="file"
        />
        <span className="record-import__icons" aria-hidden="true">
          <FileSpreadsheet size={26} />
          <FileText size={26} />
        </span>
        <strong>
          {status === "PARSING" ? "파일 분석 중…" : "CSV · XLSX · PDF 선택"}
        </strong>
        <small>스캔 PDF는 현재 OCR 분석 대상으로 따로 표시됩니다.</small>
      </label>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="save-message" role="status">
          {message}
        </p>
      ) : null}

      {preview && tabular ? (
        <div className="import-preview">
          <div className="import-preview__summary">
            <CheckCircle2 aria-hidden="true" size={21} />
            <div>
              <strong>{preview.batch.fileName}</strong>
              <p>
                복무기록 {preview.events.length}건 · 기관 잔액{" "}
                {preview.snapshots.length}건
                {duplicateCount ? ` · 기존 중복 ${duplicateCount}건` : ""}
              </p>
            </div>
          </div>

          <details className="mapping-editor">
            <summary>열 인식 결과 확인</summary>
            <div className="mapping-editor__rows">
              {tabular.headers.map((header) => {
                const mapping = preview.mappings.find(
                  (item) => item.sourceHeader === header,
                );
                return (
                  <label key={header}>
                    <span>{header}</span>
                    <select
                      value={mapping?.target ?? ""}
                      onChange={(event) =>
                        void updateMapping(
                          header,
                          event.target.value as CanonicalColumn | "",
                        )
                      }
                    >
                      <option value="">무시</option>
                      {COLUMN_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </div>
          </details>

          {preview.events.length ? (
            <div className="import-event-list">
              {preview.events.map((candidate) => {
                const override = overrides[candidate.sourceRowIndex];
                const duplicate = Boolean(
                  candidate.fingerprint &&
                  fingerprints.has(candidate.fingerprint),
                );
                return (
                  <article
                    className={
                      candidate.warnings.length
                        ? "import-event import-event--warning"
                        : "import-event"
                    }
                    key={candidate.sourceRowIndex}
                  >
                    <label className="import-event__check">
                      <input
                        checked={acceptedRows.has(candidate.sourceRowIndex)}
                        disabled={duplicate}
                        onChange={() => toggleRow(candidate.sourceRowIndex)}
                        type="checkbox"
                      />
                      <span>행 {candidate.sourceRowIndex}</span>
                    </label>
                    <input
                      aria-label={`행 ${candidate.sourceRowIndex} 날짜`}
                      type="date"
                      value={override?.date ?? candidate.date ?? ""}
                      onChange={(event) =>
                        updateOverride(candidate.sourceRowIndex, {
                          date: event.target.value,
                        })
                      }
                    />
                    <select
                      aria-label={`행 ${candidate.sourceRowIndex} 종류`}
                      value={override?.eventType ?? candidate.eventType ?? ""}
                      onChange={(event) =>
                        updateOverride(candidate.sourceRowIndex, {
                          eventType: event.target.value as
                            ImportableServiceEventType | "",
                        })
                      }
                    >
                      <option value="">종류 확인 필요</option>
                      {EVENT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      aria-label={`행 ${candidate.sourceRowIndex} 사용 분`}
                      inputMode="numeric"
                      min="0"
                      placeholder={candidate.allDay ? "전일" : "사용 분"}
                      type="number"
                      value={
                        override?.durationMinutes ??
                        candidate.durationMinutes?.toString() ??
                        ""
                      }
                      onChange={(event) =>
                        updateOverride(candidate.sourceRowIndex, {
                          durationMinutes: event.target.value,
                        })
                      }
                    />
                    <div className="import-event__meta">
                      {duplicate ? <span>이미 가져온 기록</span> : null}
                      {!duplicate && candidate.warnings.length ? (
                        <span>
                          <AlertTriangle aria-hidden="true" size={14} />
                          {candidate.warnings[0]?.message}
                        </span>
                      ) : null}
                      {candidate.note ? <small>{candidate.note}</small> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}

          {preview.snapshots.length ? (
            <div className="snapshot-list">
              <h3>기관이 기록한 휴가 잔액</h3>
              {preview.snapshots.map((snapshot) => (
                <label key={snapshot.sourceRowIndex}>
                  <input
                    checked={acceptedSnapshots.has(snapshot.sourceRowIndex)}
                    onChange={() => toggleSnapshot(snapshot.sourceRowIndex)}
                    type="checkbox"
                  />
                  <span>행 {snapshot.sourceRowIndex}</span>
                  <strong>
                    잔여 {snapshot.remainingDays ?? "—"}일
                    {snapshot.remainingMinutes
                      ? ` ${Math.floor(snapshot.remainingMinutes / 60)}시간 ${snapshot.remainingMinutes % 60}분`
                      : ""}
                  </strong>
                </label>
              ))}
            </div>
          ) : null}

          <div className="import-preview__actions">
            <Button variant="outline" onClick={() => setStatus("IDLE")}>
              취소
            </Button>
            <Button onClick={() => void commit()}>선택 기록 가져오기</Button>
          </div>
        </div>
      ) : null}

      <label className="workday-setting">
        <span>부분 휴가 환산용 1일 근무시간</span>
        <div>
          <input
            inputMode="numeric"
            min="1"
            placeholder="예: 480"
            type="number"
            value={workdayMinutes ?? ""}
            onChange={(event) => {
              const value = Number(event.target.value);
              onSetWorkdayMinutes(
                event.target.value && Number.isFinite(value) && value > 0
                  ? value
                  : null,
              );
            }}
          />
          <span>분</span>
        </div>
        <small>비워두면 부분 휴가를 임의로 일수 환산하지 않습니다.</small>
      </label>

      {imports.length ? (
        <div className="import-history">
          <h3>가져오기 기록</h3>
          {imports.slice(0, 8).map((record) => (
            <article key={record.id}>
              <div>
                <strong>{record.fileName}</strong>
                <p>
                  {new Date(record.createdAt).toLocaleString("ko-KR")} · 기록{" "}
                  {record.eventCount}건
                </p>
              </div>
              {record.status === "ACTIVE" ? (
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `${record.fileName}에서 가져온 기록만 취소할까요?`,
                      )
                    ) {
                      onRollback(record.id);
                    }
                  }}
                  type="button"
                >
                  <RotateCcw aria-hidden="true" size={15} />
                  취소
                </button>
              ) : (
                <span>취소됨</span>
              )}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
