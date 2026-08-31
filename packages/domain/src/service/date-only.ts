export const SEOUL_TIME_ZONE = "Asia/Seoul" as const;

export type DateOnly = `${number}-${number}-${number}`;

type CivilDate = {
  year: number;
  month: number;
  day: number;
};

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_IN_MILLISECONDS = 86_400_000;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function parseDateOnly(value: string): CivilDate {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) {
    throw new RangeError(`Invalid date-only value: ${value}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));

  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    throw new RangeError(`Invalid calendar date: ${value}`);
  }

  return { year, month, day };
}

export function isDateOnly(value: string): value is DateOnly {
  try {
    parseDateOnly(value);
    return true;
  } catch {
    return false;
  }
}

export function formatDateOnly({ year, month, day }: CivilDate): DateOnly {
  return `${year}-${pad(month)}-${pad(day)}` as DateOnly;
}

export function compareDateOnly(left: DateOnly, right: DateOnly): number {
  return left.localeCompare(right);
}

export function addDays(date: DateOnly, amount: number): DateOnly {
  const { year, month, day } = parseDateOnly(date);
  const result = new Date(Date.UTC(year, month - 1, day + amount));

  return formatDateOnly({
    year: result.getUTCFullYear(),
    month: result.getUTCMonth() + 1,
    day: result.getUTCDate(),
  });
}

export function addCalendarMonths(date: DateOnly, months: number): DateOnly {
  const source = parseDateOnly(date);
  const absoluteMonth = source.year * 12 + (source.month - 1) + months;
  const year = Math.floor(absoluteMonth / 12);
  const monthIndex = absoluteMonth - year * 12;
  const lastDayOfTargetMonth = new Date(
    Date.UTC(year, monthIndex + 1, 0),
  ).getUTCDate();

  return formatDateOnly({
    year,
    month: monthIndex + 1,
    day: Math.min(source.day, lastDayOfTargetMonth),
  });
}

export function differenceInCalendarDays(
  laterDate: DateOnly,
  earlierDate: DateOnly,
): number {
  const later = parseDateOnly(laterDate);
  const earlier = parseDateOnly(earlierDate);
  const laterTimestamp = Date.UTC(later.year, later.month - 1, later.day);
  const earlierTimestamp = Date.UTC(
    earlier.year,
    earlier.month - 1,
    earlier.day,
  );

  return Math.round((laterTimestamp - earlierTimestamp) / DAY_IN_MILLISECONDS);
}

export function dateOnlyInTimeZone(
  instant: Date,
  timeZone: string = SEOUL_TIME_ZONE,
): DateOnly {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}` as DateOnly;
}

export function formatKoreanDate(date: DateOnly): string {
  const { year, month, day } = parseDateOnly(date);
  return `${year}. ${pad(month)}. ${pad(day)}.`;
}
