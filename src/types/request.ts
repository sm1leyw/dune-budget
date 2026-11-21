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


import type { Attachment } from "./project";

/** วิธีคืนเงินส่วนต่าง (ตาราง B เท่านั้น) — ข้อความแสดงผลอยู่ใน constants/request.ts */
export type RefundMethod = "TRANSFER" | "CASH";

/** ประเภทแบบฟอร์ม: ตาราง A = ขอเบิก/ยืมเงินล่วงหน้า, ตาราง B = คืนเงิน/เคลียร์เงินยืม */
export type RequestType = "ADVANCE" | "CLEARANCE";

/** รายการค่าใช้จ่ายย่อย 1 แถว */
export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  /** วันที่แบบ ISO "2026-11-02" — แสดงผลด้วย formatThaiDate() */
  date: string;
  /** ชื่อไฟล์หลักฐาน */
  fileName?: string;
  /** ไฟล์สำหรับเปิดดู: Base64 Data URL (ไฟล์ที่ผู้ใช้แนบ) หรือที่อยู่ไฟล์ เช่น "/mock-files/x.pdf" (ข้อมูลตัวอย่าง) */
  fileData?: string;
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
  /** PAYOUT = บริษัทจ่ายเงินออก (ค่าเริ่มต้น) · REFUND_RECEIVED = บริษัทรับเงินคืนจากพนักงาน */
  direction?: "PAYOUT" | "REFUND_RECEIVED";
  method: "CASH" | "CHECK" | "TRANSFER";
  refNumber?: string;
  amount: number;
  date: string;
  fileName: string;
  fileData?: string;
}


export interface ReimburseRequest {
  /** รหัสคำขอ: คำขอเบิก "REQ-2026-0001" · คำขอคืนเงิน "RFD-2026-0001" (สร้างด้วย nextRequestId()) */
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
  /** ตาราง B เท่านั้น: ยอดที่ยืมไป (บันทึกจากใบยืมตอนยื่น) — ยอดคืน/จ่ายเพิ่มคำนวณด้วย getSettlement() ใน lib/clearance.ts */
  advanceAmount?: number;
  status: RequestStatus;
  /** หมายเหตุล่าสุดตอนถูกส่งกลับแก้ไข */
  sentBackNote?: string;
  createdAt: string;
  updatedAt: string;
  /** ประวัติการกระทำ เรียงจากเก่าไปใหม่ */
  history: RequestEvent[];
  /** หลักฐานการจ่ายเงินออกที่บัญชีบันทึกตอนปิดคำขอ (คำขอเบิก / จ่ายส่วนต่างของคำขอคืนเงิน) — กรณีรับเงินคืนไม่มี */
  paymentInfo?: PaymentInfo;
  /** ตาราง B ที่มียอดต้องคืนเท่านั้น: วิธีที่พนักงานจะคืนเงินส่วนต่าง */
  refundMethod?: RefundMethod;
  /** ตาราง B ที่คืนเงินแบบโอน: สลิปโอนคืนที่พนักงานแนบตอนยื่น (บัญชีตรวจแล้วกดยืนยันรับเงินคืน ไม่ต้องแนบเอง) */
  refundSlip?: Attachment;
}
