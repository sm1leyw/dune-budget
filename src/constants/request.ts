/**
 * constants/request.ts — ข้อความของประเภทคำขอและวิธีคืนเงิน (เจ้าของ: คนที่ 1)
 * -----------------------------------------------------------------------------
 * ใช้แสดงผลในฟอร์ม (คนที่ 2) และหน้ารายละเอียด/อนุมัติ (คนที่ 3, 4) — ห้ามพิมพ์ข้อความเองในหน้า
 */
import type { RefundMethod, RequestType } from "@/types";

/** ชื่อประเภทแบบฟอร์มแบบสั้น เช่นใน "ประเภทแบบฟอร์ม : คำขอเบิก" */
export const REQUEST_TYPE_LABEL: Record<RequestType, string> = {
  ADVANCE: "คำขอเบิก",
  CLEARANCE: "คืนเงิน (เคลียร์เงินยืม)",
};

/** การ์ดเลือกประเภทในขั้นตอนที่ 1 (ตาม Figma) */
export const REQUEST_TYPE_CARD: Record<RequestType, { table: string; title: string; description: string }> = {
  ADVANCE: {
    table: "ตาราง A",
    title: "ขอคำขอเบิกงบ",
    description: "สำหรับพนักงานที่ต้องการยืมเงินก้อนออกไปใช้จ่ายล่วงหน้าก่อนไปปฏิบัติงาน",
  },
  CLEARANCE: {
    table: "ตาราง B",
    title: "คืนเงิน",
    description: "สำหรับนำใบเสร็จจริงกลับมาเคลียร์ยอดเงินที่เคยยืมไป",
  },
};

export const REFUND_METHOD_LABEL: Record<RefundMethod, string> = {
  TRANSFER: "โอนเงินเข้าบัญชีบริษัท",
  CASH: "คืนเงินสดที่ฝ่ายบัญชี",
};
