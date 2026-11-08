/**
 * app/reports/_components/report-utils.ts — ใช้เฉพาะหน้ารายงาน (เจ้าของ: คนที่ 3)
 * -----------------------------------------------------------------------------
 * งบของแผนก = ผลรวมงบของโครงการที่มีแผนกนั้นอยู่ใน project.departments
 *
 * ส่งออก:
 *   getReportDepartments(projects)        รายชื่อแผนกทั้งหมด (จากผู้ใช้ + โครงการ) ส่วนกลางอยู่ท้ายสุด
 *   getDepartmentProjects(projects, dept) โครงการของแผนกนั้น
 *   sumBudgets(list)                      รวม BudgetSummary หลายก้อน
 *   formatMoney(n)                        "1,000,000.00" (ทศนิยม 2 ตำแหน่งตาม Figma)
 */
import type { BudgetSummary } from "@/lib/budget";
import { USERS } from "@/store/session";
import type { Project } from "@/types";

const CENTRAL_PREFIX = "ส่วนกลาง";

export function getReportDepartments(projects: Project[]): string[] {
  const names = new Set<string>();
  USERS.forEach((u) => names.add(u.department));
  projects.forEach((p) => p.departments.forEach((d) => names.add(d)));
  return [...names].sort((a, b) => Number(a.startsWith(CENTRAL_PREFIX)) - Number(b.startsWith(CENTRAL_PREFIX)));
}

export function getDepartmentProjects(projects: Project[], department: string): Project[] {
  return projects.filter((p) => p.departments.includes(department));
}

export function sumBudgets(list: BudgetSummary[]): BudgetSummary {
  return list.reduce<BudgetSummary>(
    (acc, b) => ({
      allocated: acc.allocated + b.allocated,
      used: acc.used + b.used,
      reserved: acc.reserved + b.reserved,
      remaining: acc.remaining + b.remaining,
    }),
    { allocated: 0, used: 0, reserved: 0, remaining: 0 },
  );
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}
