import { describe, expect, it } from "vitest";
import { publicAuthor, supportSeries, type ProposalActivity } from "./proposal-activity";

const event = (id: number, action: ProposalActivity["action"], supportDelta: number, timestamp: string | null): ProposalActivity => ({ id, user: 542, action, supportDelta, timestamp });

describe("proposal support history", () => {
  it("accumulates supports without counting disagreements", () => {
    const series = supportSeries([
      event(1, "Apoyar", 1, "2026-10-24T18:20:00Z"),
      event(2, "Discrepar", -1, "2026-10-24T18:21:00Z"),
      event(3, "Apoyar", 1, "2026-10-24T18:22:00Z"),
    ]);
    expect(series.map((p) => p.cumulative)).toEqual([1, 1, 2]);
  });
  it("keeps undated historical supports as a baseline, not invented chart nodes", () => {
    const series = supportSeries([event(1, "Apoyar", 1, null), event(2, "Discrepar", 0, "2026-10-24T18:20:00Z")]);
    expect(series).toHaveLength(1);
    expect(series[0]?.cumulative).toBe(1);
    expect(series[0]?.timestamp).toBe("2026-10-24T18:20:00Z");
  });
  it("uses only the sequential public author number", () => {
    expect(publicAuthor(542)).toBe("Usuario #542");
    expect(() => publicAuthor(-1)).toThrow();
    expect(() => publicAuthor(5.42)).toThrow();
  });
});