/**
 * constants/roles.ts — ชื่อ role ภาษาไทย (เจ้าของ: คนที่ 1)
 */
import type { UserRole } from "@/types";

/** ชื่อ role ที่แสดงบนหน้าจอ เช่น ROLE_LABEL.DEPT_HEAD → "หัวหน้าแผนก" */
export const ROLE_LABEL: Record<UserRole, string> = {
  EMPLOYEE: "พนักงานทั่วไป",
  DEPT_HEAD: "หัวหน้าแผนก",
  EXECUTIVE: "ผู้บริหาร",
  ACCOUNTANT: "ฝ่ายบัญชี",
};
