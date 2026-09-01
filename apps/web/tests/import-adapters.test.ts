import { describe, expect, it } from "vitest";

import { tabularFromPositionedPdfText } from "@/lib/file-import-adapters";

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
