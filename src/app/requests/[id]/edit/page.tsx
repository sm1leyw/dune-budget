"use client";
/**
 * /requests/[id]/edit — แก้ไขคำขอที่ถูกส่งกลับ แล้วยื่นใหม่ · เจ้าของ: คนที่ 2
 * -----------------------------------------------------------------------------
 * เข้าได้เฉพาะ canEdit(request, user) = เจ้าของคำขอ + สถานะ "ส่งกลับแก้ไข"
 * ยืนยันแล้ว → resubmitRequest() → กลับไปหน้ารายละเอียดคำขอ
 */
import { useParams } from "next/navigation";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export default function RequestsDetailEditPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      <p className="mb-4 text-caption text-text-muted">id จาก URL: {id}</p>
      <PagePlaceholder />
    </>
  );
}
