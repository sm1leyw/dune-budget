/**
 * lib/projectClosure.ts — กติกาการเสร็จสิ้นโครงการ (ฟังก์ชันล้วน · test ได้ใน projectClosure.test.ts)
 * -----------------------------------------------------------------------------
 * เสร็จสิ้นโครงการได้เมื่อ "ไม่มีงานค้าง" ทั้ง 3 แบบ:
 *   pending            คำขอที่รอหัวหน้า / ผู้บริหาร / บัญชี
 *   sentBack           คำขอที่ถูกส่งกลับแก้ไข (ผู้ขอต้องแก้แล้วส่งใหม่ หรือยกเลิกก่อน)
 *   unclearedAdvances  คำขอเบิกล่วงหน้า (ตาราง A) ที่จ่ายแล้ว แต่ยังไม่มีคำขอคืนเงิน/เคลียร์ (ตาราง B) ที่จ่ายเสร็จ
 *
 * ส่งออก:
 *   getCompletionBlockers(projectId, requests) → { pending, sentBack, unclearedAdvances, canComplete }
 *   getEventKind(record)                       → "ADJUST" | "CREATE" | "COMPLETE" | "REOPEN"
 */
import { IN_PROGRESS_STATUSES } from "@/constants/status";
import type { BudgetAdjustment, ProjectEventKind, ReimburseRequest } from "@/types";

export interface CompletionBlockers {
  pending: ReimburseRequest[];
  sentBack: ReimburseRequest[];
  unclearedAdvances: ReimburseRequest[];
  canComplete: boolean;
}

export function getCompletionBlockers(projectId: string, requests: ReimburseRequest[]): CompletionBlockers {
  const inProject = requests.filter((r) => r.projectId === projectId);
  const pending = inProject.filter((r) => IN_PROGRESS_STATUSES.includes(r.status));
  const sentBack = inProject.filter((r) => r.status === "SENT_BACK");
  const clearedAdvanceIds = new Set(
    requests.filter((r) => r.type === "CLEARANCE" && r.status === "COMPLETED" && r.advanceRefId).map((r) => r.advanceRefId),
  );
  const unclearedAdvances = inProject.filter(
    (r) => r.type === "ADVANCE" && r.status === "COMPLETED" && !clearedAdvanceIds.has(r.id),
  );
  return {
    pending,
    sentBack,
    unclearedAdvances,
    canComplete: pending.length === 0 && sentBack.length === 0 && unclearedAdvances.length === 0,
  };
}

export function getEventKind(record: Pick<BudgetAdjustment, "id" | "kind">): ProjectEventKind {
  if (record.kind) return record.kind;
  return record.id.startsWith("CREATE-") ? "CREATE" : "ADJUST";
}
