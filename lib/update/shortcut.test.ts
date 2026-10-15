import { describe, expect, it } from "vitest"
import { isDiagnosticsShortcut } from "./shortcut"

const press = (over: Partial<Parameters<typeof isDiagnosticsShortcut>[0]>) =>
  isDiagnosticsShortcut({ code: "KeyD", metaKey: false, shiftKey: false, ctrlKey: false, altKey: false, ...over })

describe("diagnostics shortcut", () => {
  it("fires on Win+Shift+D", () => {
    expect(press({ metaKey: true, shiftKey: true })).toBe(true)
  })
  it("fires on the Ctrl+Alt+Shift+D fallback", () => {
    expect(press({ ctrlKey: true, altKey: true, shiftKey: true })).toBe(true)
  })
  it("does not fire on look-alike combinations that other things use", () => {
    expect(press({ metaKey: true })).toBe(false) // Win+D (show desktop)
    expect(press({ shiftKey: true })).toBe(false) // typing a capital D
    expect(press({ ctrlKey: true, shiftKey: true })).toBe(false) // browser: bookmark all tabs
    expect(press({ metaKey: true, shiftKey: true, ctrlKey: true })).toBe(false)
    expect(press({ ctrlKey: true, altKey: true })).toBe(false)
  })
  it("ignores held-down repeats and other letters", () => {
    expect(press({ metaKey: true, shiftKey: true, repeat: true })).toBe(false)
    expect(press({ code: "KeyS", metaKey: true, shiftKey: true })).toBe(false)
  })
  it("works on any keyboard layout (by physical key), and falls back to the letter when there is no code", () => {
    expect(press({ code: undefined, key: "D", metaKey: true, shiftKey: true })).toBe(true)
  })
})
