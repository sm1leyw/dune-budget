"use client";
/**
 * components/ui/AttachmentChip.tsx — ป้ายไฟล์แนบที่กดเปิดดูได้
 * -----------------------------------------------------------------------------
 * <AttachmentChip name="slip.pdf" data={item.fileData} />
 *   - มีไฟล์ (data หรือเป็นไฟล์ตัวอย่าง) → ปุ่ม กดแล้วเปิดไฟล์ในแท็บใหม่
 *   - มีแต่ชื่อ ไม่มีไฟล์ → ป้ายสีเทา "ไม่มีไฟล์ให้เปิด"
 *   - ไม่มีชื่อ → ข้อความ "ไม่มีไฟล์แนบ"
 */
import { FileText } from "lucide-react";
import { cn } from "@/lib/cn";
import { openAttachment, resolveFileData } from "@/lib/files";

export function AttachmentChip({ name, data, className }: { name?: string; data?: string; className?: string }) {
  if (!name) return <span className="text-caption text-text-muted">ไม่มีไฟล์แนบ</span>;
  const url = resolveFileData(name, data);
  const base = "inline-flex max-w-[220px] items-center gap-1.5 rounded-full px-3 py-1 text-badge";
  if (!url) {
    return (
      <span className={cn(base, "bg-disabled/50 text-text-muted", className)} title="ไม่มีไฟล์ให้เปิด (บันทึกไว้แค่ชื่อไฟล์)">
        <FileText className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">{name}</span>
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => openAttachment(url)}
      title={`เปิดดูไฟล์ ${name}`}
      className={cn(base, "bg-primary-soft text-primary transition hover:bg-primary/15", className)}
    >
      <FileText className="size-3.5 shrink-0" aria-hidden />
      <span className="truncate underline-offset-2 hover:underline">{name}</span>
    </button>
  );
}
