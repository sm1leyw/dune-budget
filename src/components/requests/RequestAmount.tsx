"use client";
/**
 * components/requests/RequestAmount.tsx — ยอดเงินของคำขอสำหรับแสดงในตาราง
 * -----------------------------------------------------------------------------
 * คำขอเบิก   → ยอดขอเบิก เช่น "20,000"
 * คำขอคืนเงิน → ยอดส่วนต่าง เช่น "คืน 200" / "จ่ายเพิ่ม 1,500" / "ใช้พอดี" (ไม่ใช่ยอดใช้จริงทั้งหมด)
 *               พร้อมบรรทัดเล็ก "ใช้จริง 1,800" ให้ดูประกอบ
 */
import { getSettlement, settlementLabel } from "@/lib/clearance";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { getRequestById } from "@/store/requests";
import type { ReimburseRequest } from "@/types";

export function RequestAmount({ request, className }: { request: ReimburseRequest; className?: string }) {
  if (request.type !== "CLEARANCE") return <span className={className}>{formatNumber(request.totalAmount)}</span>;
  const s = getSettlement(request, getRequestById);
  return (
    <span className={cn("inline-flex flex-col items-end", className)}>
      <span className={s.kind === "EXTRA" ? "text-danger" : s.kind === "REFUND" ? "text-primary" : undefined}>{settlementLabel(s)}</span>
      <span className="text-badge font-normal text-text-muted">ใช้จริง {formatNumber(s.spent)}</span>
    </span>
  );
}
