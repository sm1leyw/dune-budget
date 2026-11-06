/**
 * components/ui/StatusBadge.tsx — ป้ายสถานะคำขอ (ตรงกับ "Status Badge" ใน Figma) · เจ้าของ: คนที่ 1
 * -----------------------------------------------------------------------------
 * Props:
 *   status   RequestStatus ของคำขอ → เลือกข้อความและสีให้เอง (ดู constants/status.ts)
 *   myTurn   true = แสดง "รอคุณพิจารณา" แทน (ส่งค่า isMyTurn(request, user) มา)
 *
 * ใช้แสดงสถานะเท่านั้น กดไม่ได้ ถ้าต้องการปุ่มในแถวตารางให้ใช้ <Button size="S">
 *
 * @example
 * <StatusBadge status={req.status} myTurn={isMyTurn(req, user)} />
 */
import { cn } from "@/lib/cn";
import { MY_TURN_LABEL, STATUS_META, type StatusTone } from "@/constants/status";
import type { RequestStatus } from "@/types";

const TONE: Record<StatusTone, string> = {
  warning: "bg-warning text-text-inverse",
  info: "bg-info text-text-inverse",
  success: "bg-primary text-text-inverse",
  danger: "bg-danger text-text-inverse",
  neutral: "bg-disabled text-text",
  myTurn: "bg-warning-soft text-warning-strong font-bold ring-[1.5px] ring-inset ring-warning",
};

export function StatusBadge({
  status,
  myTurn = false,
  className,
}: {
  status: RequestStatus;
  myTurn?: boolean;
  className?: string;
}) {
  const meta = myTurn ? { label: MY_TURN_LABEL, tone: "myTurn" as const } : STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex h-7 min-w-28 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 text-badge font-medium",
        TONE[meta.tone],
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}
