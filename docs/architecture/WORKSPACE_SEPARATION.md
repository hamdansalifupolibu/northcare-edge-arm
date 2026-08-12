# Workspace separation

## Workspaces

| Workspace | Requires | Provides |
|---|---|---|
| `worker` | `worker` role + active Worker workspace | Clinical frontline features |
| `administration` | `admin` role + active Administration workspace | Account management features |

## Session fields (mobile)

- `availableRoles`
- `permittedWorkspaces`
- `activeWorkspace`
- Auth state may include `workspaceSelectionRequired`

## Rules

- Multi-role accounts must explicitly select a workspace after login.
- Single-role accounts may enter their only workspace directly.
- Switching workspace uses `router.replace` semantics and clears unsafe history / sensitive in-memory state.
- Deep links cannot bypass role + workspace checks.
- Backend remains authoritative for roles and permitted workspaces.
