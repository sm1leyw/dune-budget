/**
 * lib/workflow.ts — กติกาการอนุมัติ (เจ้าของ: คนที่ 4)
 * -----------------------------------------------------------------------------
 * เป็นฟังก์ชันล้วน (pure function): รับข้อมูลเข้า → คืนผลลัพธ์ ไม่แก้ข้อมูลเอง
 * คนที่ 1 ย้ายกติกาเดิมมาจาก DataContext.tsx ให้ (ตามที่ทีมตกลง)
 * คนที่ 4 ต้องเขียน unit test ให้ไฟล์นี้ (ตัวอย่างอยู่ใน workflow.test.ts)
 *
 * กติกา (ตามโค้ดเดิมของทีม):
 *   ผู้ยื่นเป็นพนักงาน/บัญชี:  ≤ 5,000 → บัญชี | 5,001–30,000 → หัวหน้า | > 30,000 → ผู้บริหาร
 *   ผู้ยื่นเป็นหัวหน้าแผนก:     ≤ 30,000 → บัญชี | > 30,000 → ผู้บริหาร
 *   ผู้ยื่นเป็นผู้บริหาร:        → บัญชีทันที
 *   หัวหน้า/ผู้บริหารอนุมัติ → บัญชี · บัญชีทำจ่าย → จ่ายแล้ว
 *   ห้ามอนุมัติ/ทำจ่ายคำขอของตัวเอง
 */
import { DIRECT_TO_ACCOUNTANT_MAX, EXECUTIVE_THRESHOLD } from "@/constants/approval";
import type { ReimburseRequest, RequestStatus, User, UserRole } from "@/types";

/**
 * สถานะแรกหลังยื่นคำขอ (ใช้ตอนยื่นใหม่ และตอนแก้ไขแล้วยื่นซ้ำ)
 *
 * รับเข้า: role ของผู้ยื่น, ยอดรวมของคำขอ
 * ส่งออก: RequestStatus เช่น "WAITING_DEPT_HEAD"
 */
export function getInitialStatus(requesterRole: UserRole, totalAmount: number): RequestStatus {
  if (requesterRole === "EXECUTIVE") return "WAITING_ACCOUNTANT";

  if (requesterRole === "DEPT_HEAD") {
    return totalAmount <= EXECUTIVE_THRESHOLD ? "WAITING_ACCOUNTANT" : "WAITING_EXECUTIVE";
  }

  // EMPLOYEE และ ACCOUNTANT ใช้ flow มาตรฐาน
  if (totalAmount <= DIRECT_TO_ACCOUNTANT_MAX) return "WAITING_ACCOUNTANT";
  if (totalAmount <= EXECUTIVE_THRESHOLD) return "WAITING_DEPT_HEAD";
  return "WAITING_EXECUTIVE";
}

/**
 * สถานะถัดไปเมื่อผู้มีสิทธิ์กดอนุมัติ/ทำจ่าย
 *
 * รับเข้า: สถานะปัจจุบัน
 * ส่งออก: สถานะใหม่ (ถ้าสถานะนั้นอนุมัติไม่ได้ จะคืนค่าเดิม)
 */
export function getStatusAfterApprove(status: RequestStatus): RequestStatus {
  switch (status) {
    case "WAITING_DEPT_HEAD":
    case "WAITING_EXECUTIVE":
      return "WAITING_ACCOUNTANT";
    case "WAITING_ACCOUNTANT":
      return "COMPLETED";
    default:
      return status;
  }
}

/**
 * role ที่ต้องดำเนินการกับคำขอในสถานะนี้
 *
 * รับเข้า: สถานะ
 * ส่งออก: UserRole หรือ null ถ้าไม่ต้องมีใครอนุมัติแล้ว (จ่ายแล้ว/ส่งกลับ/ยกเลิก)
 */
export function getApproverRole(status: RequestStatus): UserRole | null {
  switch (status) {
    case "WAITING_DEPT_HEAD":
      return "DEPT_HEAD";
    case "WAITING_EXECUTIVE":
      return "EXECUTIVE";
    case "WAITING_ACCOUNTANT":
      return "ACCOUNTANT";
    default:
      return null;
  }
}

/**
 * ตอนนี้ถึงตาผู้ใช้คนนี้อนุมัติ/ทำจ่ายคำขอนี้หรือไม่
 * ใช้ตัดสินว่าจะแสดงป้าย "รอคุณพิจารณา" และปุ่มอนุมัติหรือไม่
 *
 * รับเข้า: คำขอ, ผู้ใช้ที่ login (หรือ null)
 * ส่งออก: boolean
 */
export function isMyTurn(request: ReimburseRequest, user: User | null): boolean {
  if (!user) return false;
  if (request.requesterId === user.id) return false; // ห้ามอนุมัติของตัวเอง
  return getApproverRole(request.status) === user.role;
}

/**
 * ผู้ยื่นแก้ไขคำขอนี้ได้หรือไม่ (ได้เฉพาะตอนถูกส่งกลับแก้ไข)
 * รับเข้า: คำขอ, ผู้ใช้ · ส่งออก: boolean
 */
export function canEdit(request: ReimburseRequest, user: User | null): boolean {
  return !!user && request.requesterId === user.id && request.status === "SENT_BACK";
}

/**
 * ผู้ยื่นยกเลิกคำขอนี้ได้หรือไม่ (ได้เฉพาะตอนถูกส่งกลับแก้ไข — ตามที่ทีมตกลง)
 * รับเข้า: คำขอ, ผู้ใช้ · ส่งออก: boolean
 */
export function canCancel(request: ReimburseRequest, user: User | null): boolean {
  return canEdit(request, user);
}
