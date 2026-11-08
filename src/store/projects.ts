/**
 * store/projects.ts — โครงการและการปรับงบ (เจ้าของ: คนที่ 5)
 * -----------------------------------------------------------------------------
 * คนที่ 1 วางโครงให้ (อ่านข้อมูลได้แล้ว) — คนที่ 5 เพิ่มฟังก์ชันสร้าง/ปรับงบ/เสร็จสิ้นโครงการเอง
 *
 * ส่งออก:
 *   projectsStore, adjustmentsStore   store ดิบ
 *   useProjects()                     hook → Project[]
 *   useAdjustments()                  hook → BudgetAdjustment[]
 *   getProjectById(id)                → Project | undefined
 *   getCategoryName(project, catId)   → ชื่อหมวด หรือ "-"
 *
 * TODO (คนที่ 5): createProject, adjustBudget, completeProject
 */
/**
 * store/projects.ts — โครงการและการปรับงบ (เจ้าของ: คนที่ 5)
 * -----------------------------------------------------------------------------
 * ส่งออก:
 *   projectsStore, adjustmentsStore   store ดิบ
 *   useProjects()                     hook → Project[]
 *   useAdjustments()                  hook → BudgetAdjustment[]
 *   getProjectById(id)                → Project | undefined
 *   getCategoryName(project, catId)   → ชื่อหมวด หรือ "-"
 *   completeProject(id)               → เปลี่ยนสถานะโครงการเป็น COMPLETED
 */
import { createPersistentStore } from "@/lib/createStore";
import { INITIAL_ADJUSTMENTS, INITIAL_PROJECTS } from "@/data/mock/projects";
import type { BudgetAdjustment, Project } from "@/types";

export const projectsStore = createPersistentStore<Project[]>("dune_projects", INITIAL_PROJECTS);
export const adjustmentsStore = createPersistentStore<BudgetAdjustment[]>("dune_adjustments", INITIAL_ADJUSTMENTS);

/** hook: โครงการทั้งหมด */
export function useProjects(): Project[] {
  return projectsStore.useState();
}

/** hook: ประวัติการปรับงบทั้งหมด */
export function useAdjustments(): BudgetAdjustment[] {
  return adjustmentsStore.useState();
}

/** หาโครงการจาก id — รับเข้า: "DUNE-001" · ส่งออก: Project หรือ undefined */
export function getProjectById(id: string): Project | undefined {
  return projectsStore.getState().find((p) => p.id === id);
}

/** ชื่อหมวดค่าใช้จ่าย — รับเข้า: โครงการ (หรือ undefined), รหัสหมวด · ส่งออก: string */
export function getCategoryName(project: Project | undefined, categoryId: string): string {
  return project?.categories.find((c) => c.id === categoryId)?.name ?? "-";
}

/** เสร็จสิ้นโครงการ (เปลี่ยนสถานะเป็น COMPLETED) */
export function completeProject(id: string): void {
  const current = projectsStore.getState();
  const next = current.map((p) => (p.id === id ? { ...p, status: "COMPLETED" as const } : p));
  projectsStore.setState(next);
}
