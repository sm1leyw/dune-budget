/**
 * lib/clearance.ts — กติกาคำขอคืนเงิน / เคลียร์เงินยืม (ตาราง B) · ฟังก์ชันล้วน · test ใน clearance.test.ts
 * -----------------------------------------------------------------------------
 * คำขอคืนเงิน 1 ใบ = นำใบเสร็จจริงมาเคลียร์ใบยืม (ตาราง A) ที่ "จ่ายแล้ว" 1 ใบ
 *   borrowed = ยอดที่ยืมไป (ใบยืมเดิม)
 *   spent    = ยอดใช้จริงตามใบเสร็จ (= totalAmount ของคำขอคืนเงิน)
 *   refund   = borrowed − spent ถ้าเป็นบวก → พนักงานคืนเงินส่วนต่างให้บริษัท
 *   extra    = spent − borrowed ถ้าเป็นบวก → บริษัทจ่ายส่วนต่างเพิ่มให้พนักงาน
 *
 * สายอนุมัติ: ใช้ "ยอดที่บริษัทต้องจ่ายเพิ่ม" (extra) ตัดสิน — คืนเงิน/ใช้พอดี = 0 → ไปบัญชีตรวจทันที
 *   (เงินก้อนที่ยืมถูกอนุมัติไปแล้วตอนยื่นใบยืม ไม่ต้องอนุมัติซ้ำ)
 *
 * ส่งออก:
 *   getSettlement(request, findRequest?)  → { kind, borrowed, spent, refund, extra }
 *   getRoutingAmount(request, findRequest?) → ยอดที่ใช้ตัดสินสายอนุมัติ
 *   settlementLabel(settlement)            → ข้อความสั้น เช่น "คืน 200" / "จ่ายเพิ่ม 1,500" / "ใช้พอดี"
 */
import { formatNumber } from "@/lib/format";
import type { ReimburseRequest } from "@/types";

export type SettlementKind = "REFUND" | "EXTRA" | "EXACT";

export interface Settlement {
  kind: SettlementKind;
  borrowed: number;
  spent: number;
  /** ยอดที่พนักงานต้องคืนบริษัท (0 ถ้าไม่ต้องคืน) */
  refund: number;
  /** ยอดที่บริษัทต้องจ่ายเพิ่ม (0 ถ้าไม่ต้องจ่าย) */
  extra: number;
}

type FindRequest = (id: string) => ReimburseRequest | undefined;

/** คำนวณยอดคืน/จ่ายเพิ่มของคำขอคืนเงิน · ยอดยืมใช้ค่าที่บันทึกไว้ในคำขอ (advanceAmount) ก่อน ถ้าไม่มีจึงค้นจากใบยืม */
export function getSettlement(request: ReimburseRequest, findRequest?: FindRequest): Settlement {
  const spent = request.totalAmount;
  const borrowed =
    request.advanceAmount ?? (request.advanceRefId ? findRequest?.(request.advanceRefId)?.totalAmount : undefined) ?? spent;
  const diff = Math.round((borrowed - spent) * 100) / 100;
  return {
    kind: diff > 0 ? "REFUND" : diff < 0 ? "EXTRA" : "EXACT",
    borrowed,
    spent,
    refund: Math.max(0, diff),
    extra: Math.max(0, -diff),
  };
}

/** ยอดที่ใช้ตัดสินว่าใครต้องอนุมัติ: คำขอเบิก = ยอดขอเบิก · คำขอคืนเงิน = ยอดที่บริษัทต้องจ่ายเพิ่ม */
export function getRoutingAmount(request: ReimburseRequest, findRequest?: FindRequest): number {
  return request.type === "CLEARANCE" ? getSettlement(request, findRequest).extra : request.totalAmount;
}

export function settlementLabel(s: Settlement): string {
  if (s.kind === "REFUND") return `คืน ${formatNumber(s.refund)}`;
  if (s.kind === "EXTRA") return `จ่ายเพิ่ม ${formatNumber(s.extra)}`;
  return "ใช้พอดี";
}
