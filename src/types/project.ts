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
  /** ข้อมูลการเสร็จสิ้นโครงการ — มีเมื่อ status = COMPLETED (ล้างออกเมื่อเปิดโครงการอีกครั้ง) */
  completion?: ProjectCompletion;
  /** เอกสารจัดตั้งโครงการที่แนบตอนสร้าง (TOR, หนังสืออนุมัติ ฯลฯ) */
  attachments?: Attachment[];
}

/** สรุปการเสร็จสิ้นโครงการ (ยอดเงินเป็นค่า ณ วันที่ปิด) */
export interface ProjectCompletion {
  /** เวลาที่ปิด (ISO) */
  at: string;
  byUserId: string;
  /** id รายการในประวัติ (BudgetAdjustment kind = "COMPLETE") ซึ่งเก็บไฟล์หลักฐานไว้ */
  recordId: string;
  note?: string;
  allocated: number;
  used: number;
  /** งบคงเหลือที่คืนเข้าส่วนกลาง */
  remaining: number;
}

/** ประเภทรายการในประวัติโครงการ — ข้อมูลเก่าไม่มี kind: id ขึ้นต้น "CREATE-" = สร้างโครงการ, นอกนั้น = ปรับงบ */
export type ProjectEventKind = "ADJUST" | "CREATE" | "COMPLETE" | "REOPEN";

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
  /** เอกสารที่แนบมา (เอกสารอนุมัติปรับงบ / หลักฐานปิดโครงการ) */
  attachments?: Attachment[];
  /** ประเภทรายการ (ไม่มี = ดูจาก id ตามคำอธิบายของ ProjectEventKind) */
  kind?: ProjectEventKind;
}
