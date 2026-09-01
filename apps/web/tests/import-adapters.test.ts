import { describe, expect, it } from "vitest";

import {
  formatFromFile,
  tabularFromMarkdownTables,
  tabularFromPositionedPdfText,
} from "../src/lib/file-import-adapters";

describe("file format detection", () => {
  it("recognizes HWP and HWPX sources", () => {
    expect(formatFromFile({ name: "근태대장.hwp", type: "application/x-hwp" })).toBe(
      "HWP",
    );
    expect(formatFromFile({ name: "휴가현황.hwpx", type: "" })).toBe("HWPX");
  });
});

describe("HWP/HWPX table reconstruction", () => {
  it("reconstructs a personal leave table from extracted Markdown", () => {
    const tabular = tabularFromMarkdownTables(
      `| 사용일자 | 복무상황 | 사용시간 | 비고 |
| --- | --- | --- | --- |
| 2026-06-12 | 연가 | 4시간 | 병원 |`,
      "HWP",
    );

    expect(tabular.format).toBe("HWP");
    expect(tabular.rows).toEqual([
      {
        사용일자: "2026-06-12",
        복무상황: "연가",
        사용시간: "4시간",
        비고: "병원",
      },
    ]);
  });

  it("does not turn a policy allocation table into personal usage records", () => {
    expect(() =>
      tabularFromMarkdownTables(
        `| 의무복무기간 | 복무기간에 따른 연가일수 |
| --- | --- |
| 21개월 | 소집된 날부터 1년 이내 15일 / 1년 초과 13일 |`,
        "HWP",
      ),
    ).toThrow(/규정표|사용기록/);
  });
});

describe("PDF table reconstruction", () => {
  it("reconstructs a positioned text table fixture", () => {
    const tabular = tabularFromPositionedPdfText([
      { page: 1, x: 10, y: 700, text: "사용일자" },
      { page: 1, x: 110, y: 700, text: "복무상황" },
      { page: 1, x: 210, y: 700, text: "사용시간" },
      { page: 1, x: 310, y: 700, text: "비고" },
      { page: 1, x: 10, y: 680, text: "2026-06-12" },
      { page: 1, x: 110, y: 680, text: "연가" },
      { page: 1, x: 210, y: 680, text: "4시간" },
      { page: 1, x: 310, y: 680, text: "병원" },
    ]);

    expect(tabular.headers).toEqual([
      "사용일자",
      "복무상황",
      "사용시간",
      "비고",
    ]);
    expect(tabular.rows).toEqual([
      {
        사용일자: "2026-06-12",
        복무상황: "연가",
        사용시간: "4시간",
        비고: "병원",
      },
    ]);
  });

  it("refuses a PDF fixture without a recognizable table header", () => {
    expect(() =>
      tabularFromPositionedPdfText([
        { page: 1, x: 10, y: 700, text: "복무 확인서" },
        { page: 1, x: 10, y: 680, text: "아무 표도 없음" },
      ]),
    ).toThrow(/표 구조/);
  });
});
