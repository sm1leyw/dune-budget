/**
 * components/ui/Misc.tsx — ชิ้นส่วนเล็ก ๆ ที่ใช้หลายหน้า · เจ้าของ: คนที่ 1
 * -----------------------------------------------------------------------------
 * ส่งออก:
 *   <StatCard label value unit? hint? highlight?>  การ์ดตัวเลขสรุปบนแดชบอร์ด
 *                                                  highlight = เน้นสีส้ม (ใช้กับ "รอคุณพิจารณา")
 *   <EmptyState title description? action?>        ข้อความตอนไม่มีข้อมูล
 *   <Avatar name size?>                            วงกลมอักษรตัวแรกของชื่อ (ใช้แทนรูปโปรไฟล์)
 */
import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  unit,
  hint,
  highlight = false,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border-[1.5px] bg-surface p-5",
        highlight ? "border-warning bg-warning-soft" : "border-border",
      )}
    >
      <p className={cn("text-caption", highlight ? "font-bold text-warning-strong" : "text-text-muted")}>{label}</p>
      <p className="mt-2 text-[32px] font-bold leading-tight text-text">
        {value}
        {unit && <span className="ml-1.5 text-body font-medium text-text-muted">{unit}</span>}
      </p>
      {hint && <p className="mt-1 text-caption text-text-muted">{hint}</p>}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Inbox className="size-7" />
      </span>
      <p className="text-body font-bold text-text">{title}</p>
      {description && <p className="max-w-md text-caption text-text-muted">{description}</p>}
      {action}
    </div>
  );
}

const AVATAR_SIZE = { sm: "size-10 text-lg", md: "size-14 text-2xl", lg: "size-28 text-5xl" };

export function Avatar({ name, size = "sm", className }: { name: string; size?: keyof typeof AVATAR_SIZE; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-primary", AVATAR_SIZE[size], className)}
    >
      {name.trim().charAt(0) || "?"}
    </span>
  );
}
