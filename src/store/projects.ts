/**
 * store/projects.ts — โครงการและการปรับงบ (เจ้าของ: คนที่ 5)
 * -----------------------------------------------------------------------------
 * ส่งออก:
 *   projectsStore, adjustmentsStore   store ดิบ
 *   useProjects()                     hook → Project[]
 *   useAdjustments()                  hook → BudgetAdjustment[]
 *   getProjectById(id)                → Project | undefined
 *   getCategoryName(project, catId)   → ชื่อหมวด หรือ "-"
 *   completeProject(id, input)        → ตรวจเงื่อนไข แล้วเปลี่ยนเป็น COMPLETED + บันทึกหลักฐานลงประวัติ
 *   reopenProject(id, input)          → เปิดโครงการอีกครั้ง (ต้องมีเหตุผล) + บันทึกลงประวัติ
 *   adjustBudget(input)               → บันทึกการเพิ่ม/ลดงบของหมวด (ADJ-...)
 *   createProject(input)              → สร้างโครงการใหม่ + บันทึกประวัติ (CREATE-...)
 */
import { createPersistentStore } from "@/lib/createStore";
import { INITIAL_ADJUSTMENTS, INITIAL_PROJECTS } from "@/data/mock/projects";
import { getProjectBudget } from "@/lib/budget";
import { getCompletionBlockers } from "@/lib/projectClosure";
import { requestsStore } from "@/store/requests";
import type { Attachment, BudgetAdjustment, Project, ProjectCompletion } from "@/types";

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

/**
 * เสร็จสิ้นโครงการ — ตรวจเงื่อนไข (lib/projectClosure) ก่อนเสมอ ถ้าไม่ผ่านจะ throw Error
 * บันทึกรายการ kind "COMPLETE" ในประวัติ (เก็บไฟล์หลักฐาน + หมายเหตุ) และสรุปยอด ณ วันปิดไว้ที่ project.completion
 */
export function completeProject(
  id: string,
  input: { byUserId: string; note?: string; attachments: Attachment[] },
): void {
  const project = getProjectById(id);
  if (!project) throw new Error("ไม่พบโครงการ");
  if (project.status === "COMPLETED") throw new Error("โครงการนี้เสร็จสิ้นไปแล้ว");
  if (input.attachments.length === 0) throw new Error("กรุณาแนบหลักฐานการปิดโครงการอย่างน้อย 1 ไฟล์");
  const requests = requestsStore.getState();
  if (!getCompletionBlockers(id, requests).canComplete) throw new Error("ยังมีคำขอค้างอยู่ในโครงการนี้ จึงเสร็จสิ้นไม่ได้");

  const budget = getProjectBudget(project, requests, adjustmentsStore.getState());
  const at = new Date().toISOString();
  const recordId = `CLOSE-${Date.now()}`;
  const note = input.note?.trim() || undefined;
  adjustmentsStore.setState([
    ...adjustmentsStore.getState(),
    {
      id: recordId,
      kind: "COMPLETE",
      projectId: id,
      categoryId: "",
      amount: 0, // ไม่กระทบยอดงบ
      reason: note ?? "เสร็จสิ้นโครงการ",
      byUserId: input.byUserId,
      at,
      attachments: input.attachments,
    },
  ]);
  const completion: ProjectCompletion = {
    at,
    byUserId: input.byUserId,
    recordId,
    note,
    allocated: budget.allocated,
    used: budget.used,
    remaining: budget.remaining,
  };
  projectsStore.setState(projectsStore.getState().map((p) => (p.id === id ? { ...p, status: "COMPLETED", completion } : p)));
}

/** เปิดโครงการที่เสร็จสิ้นแล้วกลับมาใช้งาน (ฝ่ายบัญชี) — ต้องมีเหตุผล · บันทึกรายการ kind "REOPEN" ในประวัติ */
export function reopenProject(id: string, input: { byUserId: string; reason: string }): void {
  const project = getProjectById(id);
  if (!project) throw new Error("ไม่พบโครงการ");
  if (project.status !== "COMPLETED") throw new Error("โครงการนี้ยังไม่ได้เสร็จสิ้น");
  if (!input.reason.trim()) throw new Error("กรุณาระบุเหตุผลการเปิดโครงการอีกครั้ง");
  adjustmentsStore.setState([
    ...adjustmentsStore.getState(),
    {
      id: `REOPEN-${Date.now()}`,
      kind: "REOPEN",
      projectId: id,
      categoryId: "",
      amount: 0,
      reason: input.reason.trim(),
      byUserId: input.byUserId,
      at: new Date().toISOString(),
    },
  ]);
  projectsStore.setState(
    projectsStore.getState().map((p) => (p.id === id ? { ...p, status: "ACTIVE", completion: undefined } : p)),
  );
}

/** บันทึกการเพิ่ม/ลดงบของหมวดในโครงการ */
export function adjustBudget(input: Omit<BudgetAdjustment, "id" | "at">): void {
  const adjustment: BudgetAdjustment = {
    ...input,
    id: `ADJ-${Date.now()}`,
    kind: "ADJUST",
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
    kind: "CREATE",
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