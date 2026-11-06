"use client";
/**
 * components/ui/Modal.tsx — popup · เจ้าของ: คนที่ 1
 * -----------------------------------------------------------------------------
 * ส่งออก:
 *   <Modal>         popup ทั่วไป (ใส่เนื้อหาเองได้ เช่น ฟอร์มหมายเหตุส่งกลับแก้ไข)
 *   <ConfirmModal>  popup ยืนยันสำเร็จรูป (ยืนยันอนุมัติ, ยืนยันยกเลิกคำขอ, ยืนยันเสร็จสิ้นโครงการ)
 *
 * Modal props:
 *   open, onClose       เปิด/ปิด (กด Esc หรือคลิกพื้นหลังก็ปิด)
 *   title, description  หัวข้อและคำอธิบาย
 *   footer              ปุ่มด้านล่าง (ปุ่มรองซ้าย ปุ่มหลักขวา)
 *   size                "sm" (480) | "md" (640, ค่าเริ่มต้น) | "lg" (880)
 *
 * ConfirmModal props:
 *   open, onClose, onConfirm, title, description
 *   confirmLabel (ค่าเริ่มต้น "ยืนยัน"), cancelLabel (ค่าเริ่มต้น "กลับ")
 *   tone "primary" | "danger" (ปุ่มยืนยันเป็นสีแดงทึบ)
 *   loading  กันกดยืนยันซ้ำระหว่างบันทึก
 *
 * @example
 * <ConfirmModal open={open} onClose={() => setOpen(false)} tone="danger"
 *   title="ยกเลิกคำขอนี้ใช่ไหม?" confirmLabel="ยกเลิกคำขอ" cancelLabel="ไม่ใช่ กลับ"
 *   onConfirm={() => cancelRequest(id, user)} />
 */
import { useEffect, useId, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

const WIDTH = { sm: "max-w-[480px]", md: "max-w-[640px]", lg: "max-w-[880px]" };

export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  size = "md",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof WIDTH;
  children?: ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div aria-hidden className="absolute inset-0 bg-[#0d1a14]/45" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn("relative w-full rounded-lg bg-surface p-8 shadow-modal", WIDTH[size])}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิด"
          className="absolute right-4 top-4 rounded-sm p-1 text-text-muted transition hover:bg-primary-soft hover:text-text"
        >
          <X className="size-5" />
        </button>
        <h2 id={titleId} className="pr-8 text-title font-bold text-text">
          {title}
        </h2>
        {description && <p className="mt-2 text-body text-text-muted">{description}</p>}
        {children && <div className="mt-6">{children}</div>}
        {footer && <div className="mt-8 flex flex-wrap justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "ยืนยัน",
  cancelLabel = "กลับ",
  tone = "primary",
  loading = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  loading?: boolean;
  children?: ReactNode;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "dangerSolid" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
