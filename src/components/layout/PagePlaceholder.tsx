"use client";
/**
 * components/layout/PagePlaceholder.tsx — หน้าชั่วคราวสำหรับหน้าที่ยังไม่ได้ทำ · เจ้าของ: คนที่ 1
 * -----------------------------------------------------------------------------
 * อ่านข้อมูลจาก config/routes.ts แล้วแสดงว่า "ใครต้องทำหน้านี้ ทำอะไร ใช้ฟังก์ชันไหน"
 * เจ้าของหน้า: ลบ <PagePlaceholder /> ในไฟล์ page.tsx ของตัวเองแล้วเขียนหน้าจริงแทนได้เลย
 */
import { usePathname } from "next/navigation";
import { Construction } from "lucide-react";
import { matchRoute } from "@/config/routes";
import { Card } from "@/components/ui";

export function PagePlaceholder() {
  const pathname = usePathname();
  const route = matchRoute(pathname);
  if (!route) return null;

  return (
    <Card>
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning-strong">
          <Construction className="size-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-caption text-text-muted">
            หน้านี้ยังไม่ได้ทำ · เจ้าของ <strong className="text-text">{route.owner}</strong> · ไฟล์{" "}
            <code className="rounded-sm bg-primary-soft px-1.5 py-0.5 text-caption">src/app{route.path}/page.tsx</code>
          </p>
          <h2 className="mt-2 text-section font-bold">สิ่งที่ต้องทำ</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-body">
            {route.todo.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          {route.uses && (
            <>
              <h3 className="mt-6 text-body font-bold">ใช้ของที่มีอยู่แล้ว</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {route.uses.map((u) => (
                  <li key={u} className="rounded-sm bg-primary-soft px-2.5 py-1 text-caption text-primary">
                    {u}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
