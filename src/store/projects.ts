/**
 * store/projects.ts — โครงการและการปรับงบ (เจ้าของ: คนที่ 5)
 * -----------------------------------------------------------------------------
 * ส่งออก:
 *   projectsStore, adjustmentsStore   store ดิบ
 *   useProjects()                     hook → Project[]
 *   useAdjustments()                  hook → BudgetAdjustment[]
 *   getProjectById(id)                → Project | undefined
 *   getCategoryName(project, catId)   → ชื่อหมวด หรือ "-"
 *   completeProject(id, byUserId)     → เปลี่ยนสถานะเป็น COMPLETED + บันทึกเวลา/ผู้กด
 *   adjustBudget(input)               → บันทึกการเพิ่ม/ลดงบของหมวด (ADJ-...)
 *   createProject(input)              → สร้างโครงการใหม่ + บันทึกประวัติ (CREATE-...)
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

/** เสร็จสิ้นโครงการ (เปลี่ยนสถานะเป็น COMPLETED) พร้อมบันทึกเวลาและผู้กด */
export function completeProject(id: string, byUserId?: string): void {
  const current = projectsStore.getState();
  const completedAt = new Date().toISOString();
  const next = current.map((p) =>
    p.id === id ? { ...p, status: "COMPLETED" as const, completedAt, completedBy: byUserId } : p,
  );
  projectsStore.setState(next);
}

/** บันทึกการเพิ่ม/ลดงบของหมวดในโครงการ */
export function adjustBudget(input: Omit<BudgetAdjustment, "id" | "at">): void {
  const adjustment: BudgetAdjustment = {
    ...input,
    id: `ADJ-${Date.now()}`,
    at: new Date().toISOString(),
  };
  adjustmentsStore.setState([...adjustmentsStore.getState(), adjustment]);
}

/** สร้างโครงการใหม่ พร้อมหมวดงบประมาณ */
export function createProject(input: Omit<Project, "id" | "status">): Project {
  const sequence = projectsStore.getState().length + 1;
  const id = `DUNE-${String(sequence).padStart(3, "0")}`;
  const project: Project = {
    ...input,
    id,
    status: "ACTIVE",
    categories: input.categories.map((category, index) => ({
      ...category,
      id: `${id}-C${index + 1}`,
    })),
  };
  projectsStore.setState([...projectsStore.getState(), project]);

  // บันทึกกิจกรรมสร้างโครงการให้ปรากฏในหน้าประวัติด้วย
  // ใช้ amount = 0 เพื่อไม่ให้กระทบยอดคำนวณงบประมาณ
  const creationRecord: BudgetAdjustment = {
    id: `CREATE-${Date.now()}`,
    projectId: project.id,
    categoryId: "",
    amount: 0,
    reason: "สร้างโครงการใหม่และจัดสรรงบประมาณ",
    byUserId: input.ownerId,
    at: new Date().toISOString(),
    // ไม่คัดลอกไฟล์ซ้ำ — หน้าประวัติดึงเอกสารจาก project.attachments แทน (ประหยัดพื้นที่ localStorage)
  };
  adjustmentsStore.setState([...adjustmentsStore.getState(), creationRecord]);

  return project;
}