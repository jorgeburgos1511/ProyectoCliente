import { Project } from "@/models/Project";
import { Task } from "@/models/Task";
import { User } from "@/models/User";
import { Sprint } from "@/models/Sprint";

// Local JWT payload type for permissions (aligns with verifyUserToken return shape)
type JwtUserPayload = { sub: string; email: string; role: "admin" | "manager" | "developer" };
type JwtPayload = JwtUserPayload;

/**
 * Utility: get email domain (lowercase) or empty string.
 */
export function emailDomain(email?: string) {
  if (!email) return "";
  const at = email.indexOf("@");
  if (at === -1) return "";
  return email.slice(at + 1).toLowerCase();
}

/**
 * Basic role guards
 */
export const isAdmin = (u: Pick<JwtPayload, "role">) => u.role === "admin";
export const isManager = (u: Pick<JwtPayload, "role">) => u.role === "manager";
export const isDeveloper = (u: Pick<JwtPayload, "role">) => u.role === "developer";

/**
 * Project ownership
 */
export async function isProjectOwner(userId: string, projectId: string) {
  const p = await Project.findById(projectId).select({ ownerId: 1 }).lean<{ ownerId: string }>();
  return !!p && String(p.ownerId) === String(userId);
}

/**
 * Can manage sprints of a project (create/edit/finalize)?
 * Requires: manager|admin AND owner of the project
 */
export async function canManageSprints(user: JwtPayload, projectId: string) {
  if (!(isAdmin(user) || isManager(user))) return false;
  return isProjectOwner(user.sub, projectId);
}

/**
 * Can finalize (toggle completed) a project?
 * Requires: manager|admin AND owner of the project
 */
export async function canFinalizeProject(user: JwtPayload, projectId: string) {
  if (!(isAdmin(user) || isManager(user))) return false;
  return isProjectOwner(user.sub, projectId);
}

/**
 * Can edit any task in a project?
 * Requires: manager|admin AND owner of that project
 */
export async function canEditAnyTaskInProject(user: JwtPayload, projectId: string) {
  if (!(isAdmin(user) || isManager(user))) return false;
  return isProjectOwner(user.sub, projectId);
}

/**
 * Can edit own task (assignee)?
 */
export function canEditOwnTask(user: JwtPayload, task: { assigneeId?: string | null }) {
  return !!task.assigneeId && String(task.assigneeId) === String(user.sub);
}

/**
 * Validate that a target user is a developer in same domain as manager.
 */
export async function isAssignableDeveloperForManager(manager: JwtPayload, targetUserId: string) {
  if (!isManager(manager) && !isAdmin(manager)) return false;
  const u = await User.findById(targetUserId).select({ email: 1, role: 1 }).lean<{ email: string; role: "admin" | "manager" | "developer" }>();
  if (!u) return false;
  if (u.role !== "developer") return false;
  // Admin can assign any developer; manager restricted to same domain
  if (isAdmin(manager)) return true;
  const managerDomain = emailDomain(manager.email);
  const devDomain = emailDomain(u.email as string);
  return managerDomain && managerDomain === devDomain;
}

/**
 * Helper to enforce that a manager can only see developers of same domain.
 * Admin can see all; developers cannot list users for assignment.
 */
export function userListFilterByRequester(
  requester: JwtPayload
): { role?: "developer"; domain?: string; allowed: boolean } {
  if (isAdmin(requester)) {
    return { allowed: true }; // no filter by default
  }
  if (isManager(requester)) {
    return { role: "developer", domain: emailDomain(requester.email), allowed: true };
  }
  return { allowed: false };
}

/**
 * Check if a user participates in a project.
 * True if:
 *  - user is owner of the project
 *  - user is in project.members
 *  - user is in any sprint.members of that project
 *  - user has any task in that project assigned (assigneeId=userId)
 */
export async function participatesInProject(userId: string, projectId: string) {
  const p = await Project.findById(projectId)
    .select({ ownerId: 1, members: 1 })
    .lean<{ ownerId: string; members: string[] }>();
  if (!p) return false;

  if (String(p.ownerId) === String(userId)) return true;
  if (Array.isArray(p.members) && p.members.some((m) => String(m) === String(userId))) return true;

  const sprint = await Sprint.findOne({ projectId: String(projectId), members: String(userId) })
    .select({ _id: 1 })
    .lean();
  if (sprint) return true;

  const task = await Task.findOne({ projectId: String(projectId), assigneeId: String(userId) })
    .select({ _id: 1 })
    .lean();
  if (task) return true;

  return false;
}
