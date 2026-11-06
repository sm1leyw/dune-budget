/**
 * config/navigation.ts — เมนูด้านซ้ายแยกตาม role (เจ้าของ: คนที่ 1)
 * -----------------------------------------------------------------------------
 * ส่งออก:
 *   NAV_BY_ROLE[role]   NavItem[] เรียงตามลำดับที่แสดง
 *   getActiveHref(items, pathname) → href ของเมนูที่ควรเป็นสีเขียว (active)
 *
 * NavItem.badge = "myTurn" → Sidebar จะแสดงจำนวนคำขอที่ "รอคุณพิจารณา" ต่อท้ายเมนู
 * จะเพิ่ม/ย้ายเมนู → แก้ที่นี่ที่เดียว (ห้าม hard-code เมนูในหน้าอื่น)
 */
import {
  ClipboardCheck,
  FilePlus2,
  FileText,
  FolderKanban,
  History,
  LayoutDashboard,
  ChartColumn,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types";
import { PATHS } from "./routes";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: "myTurn";
  /** path อื่นที่ให้เมนูนี้ active ด้วย เช่น หน้ารายละเอียดลูก */
  activePrefixes?: string[];
}

const dashboard: NavItem = { label: "หน้าหลัก", href: PATHS.dashboard, icon: LayoutDashboard };
const newRequest: NavItem = { label: "ยื่นขอเบิกเงิน", href: PATHS.newRequest, icon: FilePlus2 };
const myRequests: NavItem = { label: "คำขอของฉัน", href: PATHS.myRequests, icon: FileText, activePrefixes: ["/requests/"] };
const projects: NavItem = {
  label: "โครงการและงบประมาณ",
  href: PATHS.projects,
  icon: FolderKanban,
  activePrefixes: ["/projects/"],
};
const approvals: NavItem = {
  label: "รออนุมัติ / ประวัติการอนุมัติ",
  href: PATHS.approvals,
  icon: ClipboardCheck,
  badge: "myTurn",
  activePrefixes: ["/approvals/"],
};

export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  EMPLOYEE: [dashboard, newRequest, myRequests, projects],
  DEPT_HEAD: [dashboard, approvals, newRequest, myRequests, projects],
  EXECUTIVE: [dashboard, approvals, newRequest, myRequests, projects, { label: "รายงานงบประมาณองค์กร", href: PATHS.reports, icon: ChartColumn }],
  ACCOUNTANT: [
    dashboard,
    { ...approvals, label: "รายการรอเบิกจ่าย" },
    projects,
    newRequest,
    { ...myRequests, label: "ประวัติการเบิกของบัญชี" },
    { label: "รายงานงบประมาณองค์กร", href: PATHS.reports, icon: ChartColumn },
    { label: "ประวัติการปรับงบ / เพิ่มโครงการ", href: PATHS.adjustments, icon: History },
  ],
};

/**
 * หาเมนูที่ active — เลือกเมนูที่ path ตรงกันยาวที่สุด
 * เช่น /projects/adjustments → "ประวัติการปรับงบ" ไม่ใช่ "โครงการและงบประมาณ"
 * รับเข้า: เมนูของ role, pathname · ส่งออก: href ของเมนู หรือ undefined
 */
export function getActiveHref(items: NavItem[], pathname: string): string | undefined {
  let best: { href: string; length: number } | undefined;
  for (const item of items) {
    for (const prefix of [item.href, ...(item.activePrefixes ?? [])]) {
      const hit = pathname === prefix || (prefix !== item.href ? pathname.startsWith(prefix) : pathname.startsWith(prefix + "/"));
      if (hit && (!best || prefix.length > best.length)) best = { href: item.href, length: prefix.length };
    }
  }
  return best?.href;
}
