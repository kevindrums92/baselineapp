import { describe, it, expect } from "vitest";
import { formatNumberWithThousands, parseFormattedNumber } from "./number.utils";

describe("number.utils", () => {
  describe("formatNumberWithThousands", () => {
    it("should format number with thousands separators", () => {
      expect(formatNumberWithThousands(1000)).toBe("1.000");
      expect(formatNumberWithThousands(1000000)).toBe("1.000.000");
      expect(formatNumberWithThousands(500000)).toBe("500.000");
      expect(formatNumberWithThousands(123456789)).toBe("123.456.789");
    });

    it("should format string numbers", () => {
      expect(formatNumberWithThousands("1000")).toBe("1.000");
      expect(formatNumberWithThousands("1000000")).toBe("1.000.000");
    });

    it("should handle numbers without thousands", () => {
      expect(formatNumberWithThousands(0)).toBe("0");
      expect(formatNumberWithThousands(100)).toBe("100");
      expect(formatNumberWithThousands(999)).toBe("999");
    });

    it("should return empty string for NaN", () => {
      expect(formatNumberWithThousands("invalid")).toBe("");
      expect(formatNumberWithThousands(NaN)).toBe("");
    });

    it("should not show decimals", () => {
      expect(formatNumberWithThousands(1000.99)).toBe("1.001");
      expect(formatNumberWithThousands(500000.50)).toBe("500.001");
    });
  });

  describe("parseFormattedNumber", () => {
    it("should parse formatted numbers", () => {
      expect(parseFormattedNumber("1.000")).toBe(1000);
      expect(parseFormattedNumber("1.000.000")).toBe(1000000);
      expect(parseFormattedNumber("500.000")).toBe(500000);
      expect(parseFormattedNumber("123.456.789")).toBe(123456789);
    });

    it("should parse unformatted numbers", () => {
      expect(parseFormattedNumber("1000")).toBe(1000);
      expect(parseFormattedNumber("1000000")).toBe(1000000);
    });

    it("should handle numbers without thousands", () => {
      expect(parseFormattedNumber("0")).toBe(0);
      expect(parseFormattedNumber("100")).toBe(100);
      expect(parseFormattedNumber("999")).toBe(999);
    });

    it("should return 0 for invalid input", () => {
      expect(parseFormattedNumber("")).toBe(0);
      expect(parseFormattedNumber("invalid")).toBe(0);
      expect(parseFormattedNumber("abc")).toBe(0);
    });
  });

  describe("round-trip conversion", () => {
    it("should preserve value after format and parse", () => {
      const values = [0, 100, 1000, 10000, 100000, 1000000, 123456789];

      values.forEach((value) => {
        const formatted = formatNumberWithThousands(value);
        const parsed = parseFormattedNumber(formatted);
        expect(parsed).toBe(value);
      });
    });
  });
});
