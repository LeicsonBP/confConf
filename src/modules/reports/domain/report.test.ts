import { describe, expect, it } from "vitest";
import {
  REPORT_CATEGORIES,
  REPORT_VALUES,
  reportCategoryLabel,
  reportStatusLabel,
} from "./report";

describe("relatos de problema", () => {
  it("expõe categorias e valores", () => {
    expect(REPORT_CATEGORIES).toHaveLength(3);
    expect(REPORT_VALUES).toEqual(["recebi_eu_mesmo", "nao_recebi", "outro"]);
  });

  it("rotula categoria e status", () => {
    expect(reportCategoryLabel("nao_recebi")).toContain("Ainda não recebi");
    expect(reportCategoryLabel("desconhecido")).toBe("desconhecido");
    expect(reportStatusLabel("resolvido")).toBe("Resolvido");
    expect(reportStatusLabel("outro_status")).toBe("outro_status");
  });
});
