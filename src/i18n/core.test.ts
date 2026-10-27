import { describe, expect, it } from "vitest";
import { LANGUAGE_KEY, loadLanguage, translate, formatDate } from "./core";
describe("language preference and presentation", () => {
  it("defaults to Chinese for first visits and unrecognized preferences", () => {
    expect(loadLanguage({ getItem: () => null })).toBe("zh");
    expect(loadLanguage({ getItem: () => "fr" })).toBe("zh");
  });
  it("restores an explicit English preference using its independent storage key", () => {
    expect(
      loadLanguage({ getItem: (key) => (key === LANGUAGE_KEY ? "en" : null) }),
    ).toBe("en");
  });
  it("still defaults to Chinese when storage is unavailable", () => {
    expect(
      loadLanguage({
        getItem: () => {
          throw new Error("Storage denied");
        },
      }),
    ).toBe("zh");
  });
  it("translates UI labels and seeded example text without changing English mode", () => {
    expect(translate("Create a wish", "zh")).toBe("创建愿望");
    expect(translate("Create a wish", "en")).toBe("Create a wish");
    expect(translate("A greener block, a little gift.", "zh")).toBe(
      "街区更绿了，心意也到了。",
    );
  });
  it("keeps monetary parameters exact and translates singular participant counts", () => {
    expect(translate("Commit $0.29 demo funds", "zh")).toBe(
      "承诺投入 $0.29 演示资金",
    );
    expect(translate("1 person joined", "zh")).toBe("1 人已加入");
    expect(translate("2 people joined", "zh")).toBe("2 人已加入");
    expect(translate("$10 each · first 3 people", "zh")).toBe(
      "前 3 位参与者每人 $10",
    );
  });
  it("keeps personal-gift restrictions in the complete translated message", () => {
    expect(
      translate(
        "A personal gift for Maya Chen. Public enrollment is unavailable.",
        "zh",
      ),
    ).toBe("这是送给玛雅·陈的专属礼物，不开放公开加入。");
  });
  it("preserves arbitrary custom text, non-text children, and replacement-symbol text", () => {
    expect(translate("我的自定义愿望 and my own words", "zh")).toBe(
      "我的自定义愿望 and my own words",
    );
    const data = { cents: 100, condition: "Custom promise" };
    expect(translate(data, "zh")).toBe(data);
    expect(
      translate(
        "Proposal rejected: My $& reason. Enrollment remains closed.",
        "zh",
      ),
    ).toContain("My $& reason.");
  });
  it("localizes dates while retaining UTC and the same underlying instant", () => {
    const at = Date.UTC(2026, 9, 27, 12, 30);
    expect(formatDate(at, "zh")).toContain("2026年10月27日");
    expect(formatDate(at, "zh")).toContain("12:30");
    expect(formatDate(at, "zh")).toContain("UTC");
    expect(formatDate(at, "en")).toContain("Oct 27, 2026");
  });
});
