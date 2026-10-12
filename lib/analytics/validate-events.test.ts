import { describe, expect, it } from "vitest"
import { parseEvents } from "./validate-events"

const NOW = Date.parse("2026-10-12T12:00:00.000Z")
const ID_A = "11111111-1111-4111-8111-111111111111"
const ID_B = "22222222-2222-4222-8222-222222222222"

function event(overrides: Record<string, unknown> = {}) {
  return {
    id: ID_A,
    anonymousId: "device-1",
    calculatorId: "bmi",
    calculatorName: "BMI",
    category: "clinical",
    occurredAt: "2026-10-12T11:00:00.000Z",
    appVersion: "2.0.0",
    wasOffline: false,
    source: "web",
    environment: "production",
    ...overrides,
  }
}

describe("parseEvents", () => {
  it("rejects payloads that are not an events array", () => {
    expect(parseEvents(null, NOW)).toBeNull()
    expect(parseEvents({}, NOW)).toBeNull()
    expect(parseEvents({ events: [] }, NOW)).toBeNull()
    expect(parseEvents({ events: "x" }, NOW)).toBeNull()
  })

  it("keeps good events when a bad one is in the same batch", () => {
    const result = parseEvents({ events: [event(), event({ id: "not-a-uuid" }), event({ id: ID_B })] }, NOW)!
    expect(result.valid.map((e) => e.id)).toEqual([ID_A, ID_B])
    expect(result.rejected).toEqual(["not-a-uuid"])
  })

  it("repairs over-long and missing fields instead of dropping the event", () => {
    const result = parseEvents(
      { events: [event({ calculatorName: "x".repeat(500), category: "", appVersion: undefined, source: "weird" })] },
      NOW,
    )!
    expect(result.valid).toHaveLength(1)
    expect(result.valid[0].calculatorName).toHaveLength(200)
    expect(result.valid[0].category).toBe("unknown")
    expect(result.valid[0].appVersion).toBe("unknown")
    expect(result.valid[0].source).toBe("web")
  })

  it("accepts timestamps with offsets and normalises them to UTC", () => {
    const result = parseEvents({ events: [event({ occurredAt: "2026-10-12T10:00:00+01:00" })] }, NOW)!
    expect(result.valid[0].occurredAt).toBe("2026-10-12T09:00:00.000Z")
  })

  it("clamps future timestamps from drifting device clocks to now", () => {
    const result = parseEvents({ events: [event({ occurredAt: "2027-01-01T00:00:00.000Z" })] }, NOW)!
    expect(result.valid[0].occurredAt).toBe(new Date(NOW).toISOString())
  })

  it("keeps old offline timestamps untouched", () => {
    const result = parseEvents({ events: [event({ occurredAt: "2026-10-03T08:15:00.000Z", wasOffline: true })] }, NOW)!
    expect(result.valid[0].occurredAt).toBe("2026-10-03T08:15:00.000Z")
    expect(result.valid[0].wasOffline).toBe(true)
  })

  it("collapses a duplicate ID inside one request", () => {
    const result = parseEvents({ events: [event(), event()] }, NOW)!
    expect(result.valid).toHaveLength(1)
    expect(result.rejected).toEqual([])
  })
})
