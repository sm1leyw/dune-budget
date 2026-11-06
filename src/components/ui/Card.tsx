/**
 * components/ui/Card.tsx — การ์ดเนื้อหา · เจ้าของ: คนที่ 1
 * -----------------------------------------------------------------------------
 * ส่งออก:
 *   <Card>       กล่องพื้นขาว มุมโค้ง 16 เส้นขอบเขียวอ่อน (ทุกหน้าใช้ห่อเนื้อหา)
 *   <InfoBox>    กล่องพื้นเขียวอ่อนสำหรับข้อมูลอ่านอย่างเดียว เช่น รายละเอียด/วัตถุประสงค์
 *
 * Card props:
 *   title        หัวข้อการ์ด (ใช้ขนาด Section/Title)
 *   description  คำอธิบายใต้หัวข้อ
 *   actions      ปุ่มมุมขวาบนของการ์ด
 *   padding      "md" (ค่าเริ่มต้น) | "none" (เช่น การ์ดที่มีตารางเต็มกว้าง)
 *
 * @example
 * <Card title="คำขอล่าสุด" actions={<ButtonLink href="/my-requests" variant="secondary" size="S">ดูทั้งหมด</ButtonLink>}>
 *   ...
 * </Card>
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  title,
  description,
  actions,
  padding = "md",
  className,
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  padding?: "md" | "none";
  className?: string;
  children?: ReactNode;
}) {
  const hasHeader = title || description || actions;
  return (
    <section className={cn("rounded-lg border-[1.5px] border-border bg-surface", padding === "md" && "p-6", className)}>
      {hasHeader && (
        <header className={cn("mb-5 flex items-start justify-between gap-4", padding === "none" && "px-6 pt-6")}>
          <div className="min-w-0">
            {title && <h2 className="text-section font-bold text-text">{title}</h2>}
            {description && <p className="mt-1 text-caption text-text-muted">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function InfoBox({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-md bg-primary-soft p-4 text-body text-text", className)}>{children}</div>;
}
