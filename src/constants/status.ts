/**
 * constants/status.ts — ข้อความและสีของสถานะคำขอ (เจ้าของ: คนที่ 1)
 * -----------------------------------------------------------------------------
 * ใช้คู่กับ <StatusBadge /> — ไม่ต้องเขียน if/else เลือกสีเองในหน้าจอ
 */
import type { RequestStatus } from "@/types";

/** โทนสีของป้าย (map เป็น class ใน components/ui/StatusBadge.tsx) */
export type StatusTone = "warning" | "info" | "success" | "danger" | "neutral" | "myTurn";

export const STATUS_META: Record<RequestStatus, { label: string; tone: StatusTone }> = {
  WAITING_DEPT_HEAD: { label: "รอหัวหน้าอนุมัติ", tone: "warning" },
  WAITING_EXECUTIVE: { label: "รอผู้บริหารอนุมัติ", tone: "warning" },
  WAITING_ACCOUNTANT: { label: "รอบัญชีทำจ่าย", tone: "info" },
  COMPLETED: { label: "จ่ายแล้ว", tone: "success" },
  SENT_BACK: { label: "ส่งกลับแก้ไข", tone: "danger" },
  CANCELLED: { label: "ยกเลิกแล้ว", tone: "neutral" },
};

/** ป้ายพิเศษที่แสดงเฉพาะกับคนที่ต้องอนุมัติ/ทำจ่ายคำขอนั้นอยู่ (ดู isMyTurn ใน lib/workflow.ts) */
export const MY_TURN_LABEL = "รอคุณพิจารณา";

/** สถานะที่ยังอยู่ระหว่างพิจารณา */
export const IN_PROGRESS_STATUSES: RequestStatus[] = [
  "WAITING_DEPT_HEAD",
  "WAITING_EXECUTIVE",
  "WAITING_ACCOUNTANT",
];
