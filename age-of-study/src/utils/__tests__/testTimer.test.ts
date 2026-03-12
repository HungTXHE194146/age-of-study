import { describe, expect, it } from "vitest";
import {
  calculateRemainingSeconds,
  shouldTriggerOneMinuteWarning,
} from "../testTimer";

describe("testTimer", () => {
  describe("calculateRemainingSeconds", () => {
    it("keeps full time when test has just started", () => {
      expect(
        calculateRemainingSeconds({
          limitSeconds: 600,
          startedAtMs: 1000,
          nowMs: 1000,
        }),
      ).toBe(600);
    });

    it("uses real elapsed wall-clock time", () => {
      expect(
        calculateRemainingSeconds({
          limitSeconds: 600,
          startedAtMs: 0,
          nowMs: 120_000,
        }),
      ).toBe(480);
    });

    it("counts elapsed time in whole seconds", () => {
      expect(
        calculateRemainingSeconds({
          limitSeconds: 120,
          startedAtMs: 0,
          nowMs: 1_999,
        }),
      ).toBe(119);
    });

    it("clamps remaining time at zero", () => {
      expect(
        calculateRemainingSeconds({
          limitSeconds: 10,
          startedAtMs: 0,
          nowMs: 15_000,
        }),
      ).toBe(0);
    });
  });

  describe("shouldTriggerOneMinuteWarning", () => {
    it("triggers when crossing from above 60 seconds to 60 or below", () => {
      expect(shouldTriggerOneMinuteWarning(61, 60)).toBe(true);
      expect(shouldTriggerOneMinuteWarning(200, 45)).toBe(true);
    });

    it("does not trigger when already at or below threshold", () => {
      expect(shouldTriggerOneMinuteWarning(60, 59)).toBe(false);
      expect(shouldTriggerOneMinuteWarning(30, 20)).toBe(false);
      expect(shouldTriggerOneMinuteWarning(120, 119)).toBe(false);
    });
  });
});