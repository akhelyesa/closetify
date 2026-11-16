import { describe, expect, it } from "vitest"

import { isTabActive, TABS } from "./tabs"

describe("isTabActive", () => {
  it("is active on the tab's own page", () => {
    expect(isTabActive("/closet", "/closet")).toBe(true)
  })

  it("stays active on pages below the tab", () => {
    expect(isTabActive("/closet/3f2a", "/closet")).toBe(true)
  })

  it("is not active on other tabs", () => {
    expect(isTabActive("/profile", "/closet")).toBe(false)
  })

  it("does not match a path that only starts with the same letters", () => {
    expect(isTabActive("/closetify", "/closet")).toBe(false)
  })
})

describe("TABS", () => {
  it("has the 5 tabs in order", () => {
    expect(TABS.map((tab) => tab.label)).toEqual([
      "Today",
      "Closet",
      "Outfits",
      "Planner",
      "Profile",
    ])
  })
})
