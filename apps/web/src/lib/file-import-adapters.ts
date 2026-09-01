import {
  mapColumns,
  parseDelimitedText,
  type ImportSourceFormat,
  type TabularAdapterResult,
  type TabularCell,
  type TabularRow,
} from "@super-gongik/importer";
import type { Cell, Worksheet } from "exceljs";

export interface ParsedImportFile {
  tabular: TabularAdapterResult;
  fileSha256: string;
}

export interface PositionedPdfText {
  page: number;
  x: number;
  y: number;
  text: string;
}

function fileExtension(name: string) {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "";
}

export function formatFromFile(file: Pick<File, "name" | "type">): ImportSourceFormat {
  const extension = fileExtension(file.name);
  if (extension === "csv" || extension === "tsv") return "CSV";
  if (extension === "xlsx") return "XLSX";
  if (extension === "pdf" || file.type === "application/pdf") return "PDF_TEXT";
  return "UNKNOWN";
}

async function sha256File(file: Blob) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function cellText(value: TabularCell) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return String(value).trim();
}

function excelCellValue(cell: Cell): TabularCell {
  if (cell.value instanceof Date) return cell.value;
  if (typeof cell.value === "boolean") return cell.value;
  return cell.text.trim();
}

function uniqueHeaders(values: TabularCell[]) {
  const seen = new Map<string, number>();
  return values.map((value, index) => {
    const base = cellText(value) || `열 ${index + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base} (${count + 1})`;
  });
}

function worksheetRows(worksheet: Worksheet) {
  const rows: Array<{ rowNumber: number; values: TabularCell[] }> = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const width = Math.max(row.cellCount, row.actualCellCount);
    const values = Array.from({ length: width }, (_, index) =>
      excelCellValue(row.getCell(index + 1)),
    );
    if (values.some((value) => cellText(value))) {
      rows.push({ rowNumber, values });
    }
  });
  return rows;
}

function chooseExcelTable(worksheets: Worksheet[]) {
  let best:
    | {
        worksheet: Worksheet;
        rows: ReturnType<typeof worksheetRows>;
        headerIndex: number;
        score: number;
      }
    | undefined;

  for (const worksheet of worksheets) {
    const rows = worksheetRows(worksheet);
    rows.slice(0, 30).forEach((row, headerIndex) => {
      const score = mapColumns(row.values.map(cellText)).length;
      if (!best || score > best.score) {
        best = { worksheet, rows, headerIndex, score };
      }
    });
  }

  return best;
}

export async function parseXlsxFile(file: File): Promise<TabularAdapterResult> {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  const bytes = new Uint8Array(await file.arrayBuffer());
  await workbook.xlsx.load(bytes as unknown as Buffer);

  const table = chooseExcelTable(workbook.worksheets);
  if (!table || table.score < 2) {
    throw new Error(
      "엑셀에서 날짜/휴가종류 등으로 보이는 표 머리글을 찾지 못했습니다.",
    );
  }

  const headerValues = table.rows[table.headerIndex]?.values ?? [];
  const headers = uniqueHeaders(headerValues);
  const rows: TabularRow[] = [];

  for (const source of table.rows.slice(table.headerIndex + 1)) {
    const row: TabularRow = {};
    let populated = false;
    headers.forEach((header, index) => {
      const value = source.values[index] ?? "";
      row[header] = value;
      if (cellText(value)) populated = true;
    });
    if (populated) rows.push(row);
  }

  return {
    format: "XLSX",
    headers,
    rows,
    sourceLabel: table.worksheet.name,
  };
}

interface PdfRow {
  page: number;
  y: number;
  cells: PositionedPdfText[];
}

function groupPdfRows(items: PositionedPdfText[]) {
  const rows: PdfRow[] = [];
  const sorted = [...items].sort(
    (a, b) => a.page - b.page || b.y - a.y || a.x - b.x,
  );

  for (const item of sorted) {
    const current = rows.find(
      (row) => row.page === item.page && Math.abs(row.y - item.y) <= 2.5,
    );
    if (current) {
      current.cells.push(item);
      current.y = (current.y + item.y) / 2;
    } else {
      rows.push({ page: item.page, y: item.y, cells: [item] });
    }
  }

  return rows
    .map((row) => ({
      ...row,
      cells: row.cells.sort((a, b) => a.x - b.x),
    }))
    .sort((a, b) => a.page - b.page || b.y - a.y);
}

function headerScore(row: PdfRow) {
  return mapColumns(row.cells.map((item) => item.text.trim())).length;
}

export function tabularFromPositionedPdfText(
  items: PositionedPdfText[],
): TabularAdapterResult {
  const rows = groupPdfRows(items);
  const header = rows
    .map((row, index) => ({ row, index, score: headerScore(row) }))
    .sort((a, b) => b.score - a.score)[0];

  if (!header || header.score < 2) {
    throw new Error(
      "PDF에서 표 구조를 찾지 못했습니다. 스캔 문서라면 OCR 분석이 필요합니다.",
    );
  }

  const headerCells = header.row.cells;
  const headers = uniqueHeaders(headerCells.map((cell) => cell.text));
  const anchors = headerCells.map((cell) => cell.x);
  const boundaries = anchors.slice(0, -1).map((x, index) => {
    const next = anchors[index + 1] ?? x;
    return (x + next) / 2;
  });

  const tableRows: TabularRow[] = [];
  for (const row of rows.slice(header.index + 1)) {
    if (headerScore(row) >= 2) continue;
    const buckets = headers.map(() => [] as string[]);

    for (const item of row.cells) {
      let column = boundaries.findIndex((boundary) => item.x < boundary);
      if (column < 0) column = headers.length - 1;
      buckets[column]?.push(item.text.trim());
    }

    const result: TabularRow = {};
    let populated = false;
    headers.forEach((name, index) => {
      const value = (buckets[index] ?? []).filter(Boolean).join(" ").trim();
      result[name] = value;
      if (value) populated = true;
    });
    if (populated) tableRows.push(result);
  }

  return {
    format: "PDF_TEXT",
    headers,
    rows: tableRows,
    sourceLabel: `PDF ${Math.max(...items.map((item) => item.page), 1)}페이지`,
  };
}

export async function parsePdfFile(file: File): Promise<TabularAdapterResult> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  if (!pdfjs.GlobalWorkerOptions.workerPort && typeof Worker !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerPort = new Worker(
      new URL(
        "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
        import.meta.url,
      ),
      { type: "module" },
    );
  }

  const task = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    isEvalSupported: false,
  });
  const document = await task.promise;
  const items: PositionedPdfText[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    for (const item of content.items) {
      if (!("str" in item) || !("transform" in item)) continue;
      const text = item.str.trim();
      if (!text) continue;
      items.push({
        page: pageNumber,
        x: item.transform[4] ?? 0,
        y: item.transform[5] ?? 0,
        text,
      });
    }
  }

  if (items.length === 0) {
    throw new Error(
      "이 PDF에서는 선택 가능한 텍스트를 찾지 못했습니다. 스캔 PDF OCR 기능이 필요합니다.",
    );
  }

  return tabularFromPositionedPdfText(items);
}

export async function parseImportFile(file: File): Promise<ParsedImportFile> {
  const format = formatFromFile(file);
  let tabular: TabularAdapterResult;

  if (format === "CSV") {
    tabular = parseDelimitedText(await file.text());
  } else if (format === "XLSX") {
    tabular = await parseXlsxFile(file);
  } else if (format === "PDF_TEXT") {
    tabular = await parsePdfFile(file);
  } else {
    throw new Error("CSV, TSV, XLSX 또는 PDF 파일을 선택해 주세요.");
  }

  return {
    tabular,
    fileSha256: await sha256File(file),
  };
}
