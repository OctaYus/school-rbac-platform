import { describe, expect, it } from "vitest";

import { csvCell } from "@/lib/security/csv";

describe("csvCell (formula-injection safe)", () => {
  it("quotes ordinary values and escapes embedded quotes", () => {
    expect(csvCell("Ava Bennett")).toBe('"Ava Bennett"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
  });

  it("neutralises spreadsheet formula triggers", () => {
    expect(csvCell("=1+1")).toBe(`"'=1+1"`);
    expect(csvCell("+44 7700")).toBe(`"'+44 7700"`);
    expect(csvCell("-2")).toBe(`"'-2"`);
    expect(csvCell("@SUM(A1)")).toBe(`"'@SUM(A1)"`);
    expect(csvCell('=HYPERLINK("http://evil")')).toBe(`"'=HYPERLINK(""http://evil"")"`);
  });

  it("guards control-character prefixes", () => {
    expect(csvCell("\t=1")).toBe(`"'\t=1"`);
  });
});
