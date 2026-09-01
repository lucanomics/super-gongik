import { describe, expect, it } from "vitest";

import {
  buildImportCommitPlan,
  buildImportPreview,
  classifyEventType,
  createImportBatchDescriptor,
  fingerprintEventCandidate,
  getImportedEventIdsForRollback,
  mapColumns,
  normalizeEventRow,
  parseDateCell,
  parseDayCount,
  parseDelimitedText,
  parseDurationMinutes,
} from "../src";

describe("tabular import", () => {
  it("parses quoted CSV and maps Korean headers", () => {
    const parsed = parseDelimitedText(
      '사용일자,복무상황,사용시간,비고\n2026-06-12,오후반가,4시간,"병원, 진료"',
    );
    expect(parsed.headers).toEqual(["사용일자", "복무상황", "사용시간", "비고"]);
    expect(parsed.rows[0]?.비고).toBe("병원, 진료");

    const mappings = mapColumns(parsed.headers);
    expect(mappings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceHeader: "사용일자", target: "date" }),
        expect.objectContaining({ sourceHeader: "복무상황", target: "eventType" }),
        expect.objectContaining({ sourceHeader: "사용시간", target: "duration" }),
      ]),
    );
  });

  it("normalizes common civil date formats", () => {
    expect(parseDateCell("2026.09.01")).toBe("2026-09-01");
    expect(parseDateCell("2026년 9월 1일")).toBe("2026-09-01");
    expect(parseDateCell("20260901")).toBe("2026-09-01");
    expect(parseDateCell("2026-02-30")).toBeNull();
  });

  it("parses explicit durations without inventing day length", () => {
    expect(parseDurationMinutes("4시간")).toBe(240);
    expect(parseDurationMinutes("2시간 30분")).toBe(150);
    expect(parseDurationMinutes("30분")).toBe(30);
    expect(parseDurationMinutes("1일")).toBeNull();
    expect(parseDayCount("1일")).toBe(1);
    expect(parseDayCount("20일 4시간")).toBe(20);
    expect(parseDurationMinutes("20일 4시간")).toBe(240);
  });

  it("classifies common leave and attendance labels", () => {
    expect(classifyEventType("연가").eventType).toBe("ANNUAL_LEAVE");
    expect(classifyEventType("특휴").eventType).toBe("SPECIAL_LEAVE");
    expect(classifyEventType("복무기본교육").eventType).toBe("EDUCATION");
    expect(classifyEventType("정체불명휴가").eventType).toBeNull();
  });

  it("does not silently convert half-day leave to 240 minutes", () => {
    const row = {
      날짜: "2026-09-01",
      구분: "오후반가",
    };
    const candidate = normalizeEventRow(row, 2, mapColumns(Object.keys(row)));
    expect(candidate.eventType).toBe("ANNUAL_LEAVE");
    expect(candidate.durationMinutes).toBeNull();
    expect(candidate.warnings.map((warning) => warning.code)).toContain(
      "AMBIGUOUS_HALF_DAY",
    );
  });

  it("preserves aggregate institution leave balances as snapshots", async () => {
    const parsed = parseDelimitedText(
      "휴가종류,총부여,누적사용,잔여\n연가,28일,7일 4시간,20일 4시간",
    );
    const batch = createImportBatchDescriptor({
      id: "snapshot-batch",
      fileName: "잔여연가.csv",
      sourceFormat: "CSV",
      createdAt: "2026-09-01T00:00:00.000Z",
    });
    const preview = await buildImportPreview(parsed, batch);
    expect(preview.events).toHaveLength(0);
    expect(preview.snapshots).toHaveLength(1);
    expect(preview.snapshots[0]).toEqual(
      expect.objectContaining({
        leaveType: "ANNUAL_LEAVE",
        grantedDays: 28,
        usedDays: 7,
        usedMinutes: 240,
        remainingDays: 20,
        remainingMinutes: 240,
      }),
    );
  });
});

describe("preview and duplicate safety", () => {
  it("builds a preview and commit plan that skips existing fingerprints", async () => {
    const parsed = parseDelimitedText(
      "사용일자,복무상황,사용시간,비고\n2026-06-12,연가,4시간,병원\n2026-07-03,병가,8시간,진료",
    );
    const batch = createImportBatchDescriptor({
      id: "batch-1",
      fileName: "복무기록.csv",
      sourceFormat: "CSV",
      createdAt: "2026-09-01T00:00:00.000Z",
    });
    const preview = await buildImportPreview(parsed, batch);
    expect(preview.events).toHaveLength(2);
    expect(preview.events[0]?.fingerprint).toBeTruthy();

    const existing = new Set([preview.events[0]?.fingerprint ?? ""]);
    const plan = buildImportCommitPlan({
      preview,
      acceptedRowIndexes: new Set([2, 3]),
      existingFingerprints: existing,
    });

    expect(plan.events).toHaveLength(1);
    expect(plan.events[0]?.candidate.sourceRowIndex).toBe(3);
    expect(plan.skippedDuplicateFingerprints).toHaveLength(1);
    expect(plan.events[0]?.metadata.importBatchId).toBe("batch-1");
  });

  it("generates stable event fingerprints", async () => {
    const candidate = normalizeEventRow(
      { 날짜: "2026-09-01", 구분: "연가", 시간: "2시간" },
      2,
      mapColumns(["날짜", "구분", "시간"]),
    );
    expect(await fingerprintEventCandidate(candidate)).toBe(
      await fingerprintEventCandidate(candidate),
    );
  });

  it("selects only live events from the requested batch for rollback", () => {
    expect(
      getImportedEventIdsForRollback("batch-1", [
        { id: "a", metadata: { importBatchId: "batch-1" } },
        { id: "b", metadata: { importBatchId: "batch-2" } },
        {
          id: "c",
          metadata: { importBatchId: "batch-1" },
          deletedAt: "2026-09-01T00:00:00.000Z",
        },
      ]),
    ).toEqual(["a"]);
  });
});
