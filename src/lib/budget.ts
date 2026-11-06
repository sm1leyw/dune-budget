/**
 * lib/budget.ts — คำนวณงบประมาณ (เจ้าของ: คนที่ 5)
 * -----------------------------------------------------------------------------
 * ฟังก์ชันล้วน: รับโครงการ + คำขอ + การปรับงบ → คืนตัวเลข
 * คนที่ 1 เขียนเวอร์ชันแรกไว้ให้ คนที่ 5 ปรับต่อได้ (ห้ามเปลี่ยนชื่อ/รูปแบบที่ส่งออกโดยไม่แจ้งทีม
 * เพราะคนที่ 2 ใช้เตือนเกินงบ และคนที่ 3 ใช้ทำรายงาน)
 *
 * นิยาม:
 *   allocated = งบตั้งต้นของหมวด + ผลรวมการปรับงบของหมวด
 *   used      = ผลรวมคำขอที่ "จ่ายแล้ว"
 *   reserved  = ผลรวมคำขอที่ "อยู่ระหว่างพิจารณา" (กันวงเงินไว้)
 *   remaining = allocated - used - reserved
 */
import { IN_PROGRESS_STATUSES } from "@/constants/status";
import type { BudgetAdjustment, Project, ReimburseRequest } from "@/types";

export interface BudgetSummary {
  allocated: number;
  used: number;
  reserved: number;
  remaining: number;
}

function sumRequests(requests: ReimburseRequest[], pick: (r: ReimburseRequest) => boolean): number {
  return requests.filter(pick).reduce((sum, r) => sum + r.totalAmount, 0);
}

/**
 * สรุปงบของหมวดเดียว
 *
 * รับเข้า: โครงการ, รหัสหมวด, คำขอทั้งหมด, การปรับงบทั้งหมด
 * ส่งออก: BudgetSummary
 */
export function getCategoryBudget(
  project: Project,
  categoryId: string,
  requests: ReimburseRequest[],
  adjustments: BudgetAdjustment[] = [],
): BudgetSummary {
  const category = project.categories.find((c) => c.id === categoryId);
  const base = category?.allocated ?? 0;
  const adjusted = adjustments
    .filter((a) => a.projectId === project.id && a.categoryId === categoryId)
    .reduce((sum, a) => sum + a.amount, 0);
  const inCategory = requests.filter((r) => r.projectId === project.id && r.categoryId === categoryId);

  const allocated = base + adjusted;
  const used = sumRequests(inCategory, (r) => r.status === "COMPLETED");
  const reserved = sumRequests(inCategory, (r) => IN_PROGRESS_STATUSES.includes(r.status));
  return { allocated, used, reserved, remaining: allocated - used - reserved };
}

/**
 * สรุปงบทั้งโครงการ (รวมทุกหมวด)
 * รับเข้า: โครงการ, คำขอทั้งหมด, การปรับงบทั้งหมด · ส่งออก: BudgetSummary
 */
export function getProjectBudget(
  project: Project,
  requests: ReimburseRequest[],
  adjustments: BudgetAdjustment[] = [],
): BudgetSummary {
  return project.categories
    .map((c) => getCategoryBudget(project, c.id, requests, adjustments))
    .reduce<BudgetSummary>(
      (acc, b) => ({
        allocated: acc.allocated + b.allocated,
        used: acc.used + b.used,
        reserved: acc.reserved + b.reserved,
        remaining: acc.remaining + b.remaining,
      }),
      { allocated: 0, used: 0, reserved: 0, remaining: 0 },
    );
}

/**
 * ยอดที่ขอเกินงบคงเหลือของหมวดหรือไม่ (คนที่ 2 ใช้แสดงคำเตือนในฟอร์ม)
 *
 * รับเข้า: งบคงเหลือของหมวด, ยอดที่กำลังขอ
 * ส่งออก: จำนวนที่เกิน (0 = ไม่เกิน)
 */
export function getOverBudgetAmount(remaining: number, requestedAmount: number): number {
  return Math.max(0, requestedAmount - remaining);
}
