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
  /** เวลาที่กดเสร็จสิ้นโครงการ (ISO) — มีเมื่อ status = COMPLETED */
  completedAt?: string;
  /** id ผู้กดเสร็จสิ้นโครงการ */
  completedBy?: string;
  /** เอกสารจัดตั้งโครงการที่แนบตอนสร้าง (TOR, หนังสืออนุมัติ ฯลฯ) */
  attachments?: Attachment[];
}

/** ไฟล์แนบ 1 ไฟล์ — data = Base64 Data URL หรือที่อยู่ไฟล์ เช่น "/mock-files/tor.pdf" */
export interface Attachment {
  name: string;
  data?: string;
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
  /** เอกสารอนุมัติการปรับงบที่แนบมา */
  attachments?: Attachment[];
}
