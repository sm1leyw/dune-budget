/**
 * components/layout/PageActions.tsx — แถวบนสุดของเนื้อหา: คำอธิบายหน้า (ซ้าย) + ปุ่ม (ขวา) · เจ้าของ: คนที่ 1
 * -----------------------------------------------------------------------------
 * ใช้เป็นบรรทัดแรกในหน้าเมื่อหน้านั้นมีปุ่มหลัก เช่น "สร้างคำขอเบิก", "เพิ่มโครงการ"
 * (ชื่อหน้าแสดงใน Header อยู่แล้ว ไม่ต้องใส่ซ้ำ)
 *
 * Props: description?  children = ปุ่ม (ปุ่ม primary ไว้ขวาสุด)
 *
 * @example
 * <PageActions description="คำขอทั้งหมดที่คุณยื่น">
 *   <ButtonLink href={PATHS.newRequest} icon={<Plus />}>สร้างคำขอเบิก</ButtonLink>
 * </PageActions>
 */
import type { ReactNode } from "react";

export function PageActions({ description, children }: { description?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <p className="text-body text-text-muted">{description}</p>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}
