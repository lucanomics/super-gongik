import { classifyEventType } from "./classify";
import { findMappedHeader } from "./mapping";
import type {
  ColumnMapping,
  ImportWarning,
  ServiceEventCandidate,
  TabularCell,
  TabularRow,
} from "./types";

function cellToString(value: TabularCell): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

export function parseDateCell(value: TabularCell): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const source = cellToString(value).normalize("NFKC").trim();
  if (!source) return null;

  const compact = source.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) {
    return validateDateParts(
      Number(compact[1]),
      Number(compact[2]),
      Number(compact[3]),
    );
  }

  const delimited = source.match(
    /^(\d{4})\s*(?:년|[-./])\s*(\d{1,2})\s*(?:월|[-./])\s*(\d{1,2})\s*일?$/,
  );
  if (delimited) {
    return validateDateParts(
      Number(delimited[1]),
      Number(delimited[2]),
      Number(delimited[3]),
    );
  }

  return null;
}

function validateDateParts(
  year: number,
  month: number,
  day: number,
): string | null {
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseClockTime(value: TabularCell): string | null {
  const source = cellToString(value).normalize("NFKC").trim();
  if (!source) return null;

  const match = source.match(/^(\d{1,2})(?::|시\s*)(\d{1,2})?\s*분?$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function parseDurationMinutes(value: TabularCell): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Number.isInteger(value) ? value : Math.round(value * 60);
  }

  const source = cellToString(value).normalize("NFKC").replace(/\s+/g, "");
  if (!source) return null;

  const minuteOnly = source.match(/^(\d+)분$/);
  if (minuteOnly) return Number(minuteOnly[1]);

  const hourOnly = source.match(/^(\d+(?:\.\d+)?)시간$/);
  if (hourOnly) return Math.round(Number(hourOnly[1]) * 60);

  const hourMinute = source.match(/^(\d+)시간(\d+)분$/);
  if (hourMinute) return Number(hourMinute[1]) * 60 + Number(hourMinute[2]);

  const clock = source.match(/^(\d{1,2}):(\d{2})$/);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);

  return null;
}

function mappedValue(
  row: TabularRow,
  mappings: ColumnMapping[],
  target: Parameters<typeof findMappedHeader>[1],
): TabularCell {
  const header = findMappedHeader(mappings, target);
  return header ? row[header] : null;
}

export function normalizeEventRow(
  row: TabularRow,
  sourceRowIndex: number,
  mappings: ColumnMapping[],
): ServiceEventCandidate {
  const warnings: ImportWarning[] = [];
  const rawDate = mappedValue(row, mappings, "date");
  const date = parseDateCell(rawDate);
  if (!date) {
    warnings.push({
      code: rawDate ? "UNRECOGNIZED_DATE" : "MISSING_DATE",
      message: rawDate
        ? `날짜 '${cellToString(rawDate)}'를 해석하지 못했습니다.`
        : "날짜가 없습니다.",
    });
  }

  const classification = classifyEventType(
    mappedValue(row, mappings, "eventType"),
  );
  warnings.push(...classification.warnings);

  const rawDuration = mappedValue(row, mappings, "duration");
  const durationMinutes = parseDurationMinutes(rawDuration);
  const startTime = parseClockTime(mappedValue(row, mappings, "startTime"));
  const endTime = parseClockTime(mappedValue(row, mappings, "endTime"));
  const noteText = cellToString(mappedValue(row, mappings, "note"));

  if (rawDuration && durationMinutes === null) {
    warnings.push({
      code: "UNRECOGNIZED_DURATION",
      message: `사용시간 '${cellToString(rawDuration)}'을 분 단위로 해석하지 못했습니다.`,
    });
  }

  if (
    classification.halfDayHint &&
    durationMinutes === null &&
    !(startTime && endTime)
  ) {
    warnings.push({
      code: "AMBIGUOUS_HALF_DAY",
      message:
        "반가 표시는 확인했지만 기관별 근무시간을 가정하지 않기 위해 4시간으로 자동 변환하지 않았습니다.",
    });
  }

  const confidenceParts = [classification.confidence, date ? 1 : 0.25];
  if (durationMinutes !== null || (startTime && endTime)) {
    confidenceParts.push(1);
  }
  const confidence =
    confidenceParts.reduce((sum, value) => sum + value, 0) /
    confidenceParts.length;

  if (confidence < 0.7) {
    warnings.push({
      code: "LOW_CONFIDENCE",
      message: "자동 해석 신뢰도가 낮아 사용자 확인이 필요합니다.",
    });
  }

  return {
    sourceRowIndex,
    eventType: classification.eventType,
    date,
    allDay: durationMinutes === null && !startTime && !endTime,
    durationMinutes,
    startTime,
    endTime,
    note: noteText || null,
    confidence,
    warnings,
    fingerprint: null,
    raw: row,
  };
}
