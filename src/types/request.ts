/**
 * types/request.ts — คำขอเบิก (ตกลงร่วมกันทั้งทีม, เจ้าของ: คนที่ 1)
 * แก้ไฟล์นี้ต้องเปิด PR ให้คนที่ 1 review เพราะทุกคนใช้
 */

/**
 * สถานะของคำขอ (1 สถานะ = 1 ป้ายบนหน้าจอ ดู constants/status.ts)
 * ลำดับ: ยื่น → (หัวหน้า) → (ผู้บริหาร) → บัญชี → จ่ายแล้ว
 * กติกาว่าไปขั้นไหนอยู่ใน lib/workflow.ts
 */
export type RequestStatus =
  | "WAITING_DEPT_HEAD" // รอหัวหน้าแผนกอนุมัติ
  | "WAITING_EXECUTIVE" // รอผู้บริหารอนุมัติ
  | "WAITING_ACCOUNTANT" // รอบัญชีตรวจสอบและทำจ่าย
  | "COMPLETED" // จ่ายแล้ว
  | "SENT_BACK" // ส่งกลับแก้ไข (ผู้ขอแก้แล้วยื่นใหม่ หรือยกเลิกได้)
  | "CANCELLED"; // ผู้ขอยกเลิกคำขอ (ยกเลิกได้เฉพาะตอนถูกส่งกลับแก้ไข)

/** ประเภทแบบฟอร์ม: ตาราง A = ขอเบิก/ยืมเงินล่วงหน้า, ตาราง B = คืนเงิน/เคลียร์เงินยืม */
export type RequestType = "ADVANCE" | "CLEARANCE";

/** รายการค่าใช้จ่ายย่อย 1 แถว */
export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  /** วันที่แบบ ISO "2026-11-02" — แสดงผลด้วย formatThaiDate() */
  date: string;
  /** ชื่อไฟล์หลักฐาน (ช่วง frontend เก็บแค่ชื่อไฟล์) */
  fileName?: string;
}

/** การกระทำที่เกิดกับคำขอ — ใช้แสดงลำดับขั้นการอนุมัติ (timeline) */
export type RequestAction = "SUBMIT" | "RESUBMIT" | "APPROVE" | "PAY" | "SEND_BACK" | "CANCEL";

export interface RequestEvent {
  action: RequestAction;
  /** id ของผู้กระทำ */
  byUserId: string;
  /** เวลาแบบ ISO */
  at: string;
  /** หมายเหตุ เช่น เหตุผลที่ส่งกลับแก้ไข */
  note?: string;
}

export interface PaymentInfo {
  method: "CASH" | "CHECK" | "TRANSFER";
  refNumber?: string;
  amount: number;
  date: string;
  fileName: string;
}


export interface ReimburseRequest {
  /** รหัสคำขอ เช่น "REQ-2026-0001" (สร้างด้วย nextRequestId()) */
  id: string;
  type: RequestType;
  /** รหัสโครงการ เช่น "DUNE-001" → หาข้อมูลโครงการด้วย getProjectById() */
  projectId: string;
  /** รหัสหมวดค่าใช้จ่ายในโครงการ เช่น "DUNE-001-C1" */
  categoryId: string;
  /** id ผู้ยื่น → หาชื่อ/แผนกด้วย getUserById() */
  requesterId: string;
  /** รายละเอียด/วัตถุประสงค์ */
  purpose: string;
  /** ช่วงเวลาดำเนินการ (ISO) */
  startDate: string;
  endDate: string;
  items: ExpenseItem[];
  /** ยอดรวม = ผลรวม items[].amount (คำนวณตอนบันทึก) */
  totalAmount: number;
  /** ตาราง B เท่านั้น: อ้างอิงคำขอตาราง A ที่ยืมเงินไป */
  advanceRefId?: string;
  status: RequestStatus;
  /** หมายเหตุล่าสุดตอนถูกส่งกลับแก้ไข */
  sentBackNote?: string;
  createdAt: string;
  updatedAt: string;
  /** ประวัติการกระทำ เรียงจากเก่าไปใหม่ */
  history: RequestEvent[];
}

// เพิ่ม type นี้เข้าไปในไฟล์ types/request.ts
export interface PaymentInfo {
  method: "CASH" | "CHECK" | "TRANSFER";
  refNumber?: string;
  amount: number;
  date: string;
  fileName: string;
  fileData?: string; // <--- เพิ่มบรรทัดนี้เข้าไป
}

// แล้วไปหา interface ReimburseRequest เติมฟิลด์ paymentInfo เข้าไป (บรรทัดล่างๆ)
export interface ReimburseRequest {
  // ... (โค้ดเดิม) ...
  history: RequestEvent[];
  paymentInfo?: PaymentInfo; // <--- เพิ่มบรรทัดนี้เข้าไป
}