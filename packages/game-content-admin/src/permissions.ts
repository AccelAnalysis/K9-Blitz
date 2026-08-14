import type { AdminPermission, AdminRole } from "./types.ts";

const ROLE_PERMISSIONS: Readonly<Record<AdminRole, ReadonlySet<AdminPermission>>> = {
  player: new Set(["content:read"]),
  content_editor: new Set(["content:read", "content:draft:write", "inventory:write"]),
  content_publisher: new Set([
    "content:read",
    "content:draft:write",
    "content:publish",
    "content:retire",
    "inventory:write",
    "audit:read",
  ]),
  game_admin: new Set(["content:read", "configuration:write", "audit:read"]),
  system_admin: new Set([
    "content:read",
    "content:draft:write",
    "content:publish",
    "content:retire",
    "configuration:write",
    "inventory:write",
    "audit:read",
    "administration:manage",
  ]),
};

export function hasPermission(role: AdminRole, permission: AdminPermission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function assertPermission(role: AdminRole, permission: AdminPermission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Role ${role} does not have permission ${permission}.`);
  }
}
