/**
 * store/approvals.ts — การอนุมัติ / ทำจ่าย / ส่งกลับแก้ไข (เจ้าของ: คนที่ 4)
 * -----------------------------------------------------------------------------
 * คนที่ 1 วางโครงให้ คนที่ 4 ดูแลต่อ
 *
 * ส่งออก:
 *   approveRequest(id, user, paymentData)  → หัวหน้า/ผู้บริหาร "อนุมัติ" หรือ บัญชี "ทำจ่าย" พร้อมแนบสลิป
 *   sendBackRequest(id, user, note)        → ส่งกลับให้ผู้ยื่นแก้ไข (ต้องมีหมายเหตุ)
 */
import { getStatusAfterApprove, isMyTurn } from "@/lib/workflow";
import { nowISO } from "@/lib/format";
import { getRequestById, requestsStore } from "@/store/requests";
import type { User, PaymentInfo } from "@/types";

/**
 * อนุมัติ (หัวหน้า/ผู้บริหาร) หรือทำจ่าย (บัญชี)
 * รับเข้า: id คำขอ, ผู้ใช้ที่ login, ข้อมูลการจ่ายเงิน(เฉพาะบัญชี) · โยน Error ถ้าไม่ใช่ตาของผู้ใช้
 */
export function approveRequest(id: string, user: User, paymentData?: PaymentInfo): void {
  const current = getRequestById(id);

  if (!current || !isMyTurn(current, user)) {
    throw new Error("คุณไม่มีสิทธิ์ดำเนินการกับคำขอนี้");
  }

  const time = nowISO();
  const nextStatus = getStatusAfterApprove(current.status);
  const action = user.role === "ACCOUNTANT" ? "PAY" : "APPROVE";

  // บันทึกข้อมูลลง store
  requestsStore.setState((prev) =>
    prev.map((r) =>
      r.id === id
        ? {
          ...r,
          status: nextStatus,
          updatedAt: time,
          history: [...r.history, { action, byUserId: user.id, at: time }],
          // ถ้ามี paymentData ส่งมาด้วย ให้เพิ่มฟิลด์ paymentInfo เข้าไปใน object
          ...(paymentData ? { paymentInfo: paymentData } : {})
        }
        : r,
    ),
  );
}

/**
 * ส่งกลับให้ผู้ยื่นแก้ไข
 * รับเข้า: id คำขอ, ผู้ใช้ที่ login, หมายเหตุ (ห้ามว่าง) · โยน Error ถ้าทำไม่ได้
 */
export function sendBackRequest(id: string, user: User, note: string): void {
  const current = getRequestById(id);
  if (!current || !isMyTurn(current, user)) throw new Error("คุณไม่มีสิทธิ์ดำเนินการกับคำขอนี้");
  if (!note.trim()) throw new Error("กรุณาระบุหมายเหตุการส่งกลับแก้ไข");

  const time = nowISO();
  requestsStore.setState((prev) =>
    prev.map((r) =>
      r.id === id
        ? {
          ...r,
          status: "SENT_BACK",
          sentBackNote: note.trim(),
          updatedAt: time,
          history: [...r.history, { action: "SEND_BACK", byUserId: user.id, at: time, note: note.trim() }],
        }
        : r,
    ),
  );
}