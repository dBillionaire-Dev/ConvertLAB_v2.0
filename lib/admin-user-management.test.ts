import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

describe("admin user management", () => {
  it("has protected update/delete endpoints and preserves aliases through device touches", () => {
    const route = readFileSync(resolve(process.cwd(), "app/api/admin/users/route.ts"), "utf8")
    const analytics = readFileSync(resolve(process.cwd(), "app/api/analytics/route.ts"), "utf8")
    const presence = readFileSync(resolve(process.cwd(), "app/api/analytics/presence/route.ts"), "utf8")
    const sql = readFileSync(resolve(process.cwd(), "supabase/analytics.sql"), "utf8")
    const component = readFileSync(resolve(process.cwd(), "components/admin-user-management.tsx"), "utf8")

    expect(route).toContain('export async function PATCH')
    expect(route).toContain('export async function DELETE')
    expect(route).toContain('isAdminAuthenticated')
    expect(route).toContain('calculation_events')
    expect(route).toContain('convertlab_devices')
    expect(analytics).toContain('/rest/v1/rpc/convertlab_touch_device')
    expect(presence).toContain('/rest/v1/rpc/convertlab_touch_device')
    expect(sql).toContain('create or replace function public.convertlab_touch_device')
    expect(sql).toContain('on conflict (anonymous_id) do update set')
    expect(sql).not.toMatch(/on conflict \(anonymous_id\) do update set[\s\S]{0,600}display_name\s*=/)
    expect(component).toContain("function assignedUserName(anonymousId: string)")
    expect(component).toContain("const renamed = item.displayName !== assignedName")
    expect(component).toContain("{renamed ? (")
    expect(component).not.toContain('>{item.anonymousId}</div>')
  })
})
