/**
 * components/request-form/ReadOnlyField.tsx — ช่องที่ระบบเติมให้ แก้ไม่ได้ · เจ้าของ: คนที่ 2
 * -----------------------------------------------------------------------------
 * ใช้กับ: วันที่ยื่น, ชื่อผู้ขอเบิก, แผนก, ยอดเงินยืมเดิม, ยอดเงินที่ต้องคืน
 * Props: label, value, emphasis (true = ตัวหนาสีเขียวบนพื้นเขียวอ่อน ใช้กับตัวเลขที่ระบบคำนวณ), tone "danger"
 *
 * ทำไมไม่ใช้ <Input disabled>: ช่อง disabled อ่านยากและ screen reader ข้าม — อันนี้เป็นข้อความธรรมดา
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function ReadOnlyField({
  label,
  value,
  emphasis = false,
  tone,
  hint,
}: {
  label: string;
  value: ReactNode;
  emphasis?: boolean;
  tone?: "danger";
  hint?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-body font-medium text-text">{label}</span>
      <div
        className={cn(
          "flex min-h-12 items-center rounded-md border-[1.5px] px-4 text-body",
          emphasis ? "border-border bg-primary-soft text-lg font-bold text-primary" : "border-border bg-surface text-text",
          tone === "danger" && "text-danger",
        )}
      >
        {value}
      </div>
      {hint && <p className="text-caption text-text-muted">{hint}</p>}
    </div>
  );
}
