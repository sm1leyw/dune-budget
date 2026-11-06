/**
 * types/project.ts — โครงการและงบประมาณ (ตกลงร่วมกันทั้งทีม)
 * เจ้าของ logic: คนที่ 5 · แก้ type ต้องเปิด PR ให้คนที่ 1 และ 5 review
 *
 * หมายเหตุ: ยอด "ใช้ไป" และ "กันวงเงิน" ไม่เก็บใน type นี้
 * แต่คำนวณสดจากคำขอใน lib/budget.ts เพื่อไม่ให้ตัวเลขไม่ตรงกัน
 */

export type ProjectStatus = "ACTIVE" | "COMPLETED";

/** หมวดค่าใช้จ่ายในโครงการ */
export interface BudgetCategory {
  /** เช่น "DUNE-001-C1" */
  id: string;
  name: string;
  /** งบที่จัดสรรตั้งต้น (ไม่รวมการปรับงบ — ดู BudgetAdjustment) */
  allocated: number;
}

export interface Project {
  /** เช่น "DUNE-001" */
  id: string;
  name: string;
  purpose: string;
  /** แผนกที่ใช้งบนี้ได้ */
  departments: string[];
  /** id ผู้รับผิดชอบโครงการ */
  ownerId: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  categories: BudgetCategory[];
}

/** การปรับงบ 1 ครั้ง (บวก = เพิ่มงบ, ลบ = ลดงบ) */
export interface BudgetAdjustment {
  id: string;
  projectId: string;
  categoryId: string;
  amount: number;
  reason: string;
  byUserId: string;
  at: string;
}
