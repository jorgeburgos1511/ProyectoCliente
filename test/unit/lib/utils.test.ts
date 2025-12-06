import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("dedupes conflicting tailwind classes by last one wins", () => {
    // tailwind-merge collapses conflicting classes keeping the last
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("handles conditional values and falsy values", () => {
    expect(cn("a", false && "b", null as any, undefined as any, "c")).toBe("a c");
  });
});
