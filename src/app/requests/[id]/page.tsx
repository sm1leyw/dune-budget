"use client";
/**
 * /requests/[id] — เจ้าของ: คนที่ 3
 * หน้าชั่วคราว: สิ่งที่ต้องทำเขียนไว้ใน config/routes.ts (แสดงบนหน้าจอด้วย)
 * เริ่มทำ: ลบ <PagePlaceholder /> แล้วเขียนหน้าจริงแทน
 *
 * อ่าน id จาก URL ด้วย useParams (หน้าเป็น client component):
 *   const { id } = useParams<{ id: string }>();
 *   const request = useRequest(id);   // หรือ getProjectById(id) สำหรับหน้าโครงการ
 */
import { useParams } from "next/navigation";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export default function RequestsDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      <p className="mb-4 text-caption text-text-muted">id จาก URL: {id}</p>
      <PagePlaceholder />
    </>
  );
}
