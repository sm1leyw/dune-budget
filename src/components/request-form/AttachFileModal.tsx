"use client";
/**
 * components/request-form/AttachFileModal.tsx — popup แนบไฟล์หลักฐาน (Figma "ขั้นตอนที่ 3.5") · เจ้าของ: คนที่ 2
 * -----------------------------------------------------------------------------
 * Props:
 *   open, onClose
 *   onSave(fileName)   เรียกเมื่อกด "บันทึก" — ตอนนี้ส่งแค่ชื่อไฟล์ (ยังไม่มี backend ให้อัปโหลด)
 *   title              หัวข้อ popup (ตาราง A: แนบหลักฐานการเบิกจ่าย · B: แนบใบเสร็จ)
 *
 * เลือกไฟล์ได้ 2 แบบ: กดปุ่ม "เลือกไฟล์" หรือ ลากไฟล์มาวาง
 * ตรวจชนิด (PDF/JPG/PNG) และขนาด (≤ 10 MB) ด้วย validateFile()
 * TODO (ตอนมี backend): อัปโหลดไฟล์จริงแล้วเก็บ URL แทนชื่อไฟล์
 */
import { useRef, useState, type DragEvent } from "react";
import { FileText, X } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ACCEPT_ATTR, validateFile } from "./validation";

const CHECKLIST = [
  "ชื่อผู้ขายและวันที่บนหลักฐานอ่านได้ชัดเจน",
  "ยอดเงินบนหลักฐานตรงกับคำขอ",
  "เก็บเอกสารฉบับจริงไว้เพื่อส่งกับบัญชี",
];

export function AttachFileModal({
  open,
  onClose,
  onSave,
  title = "แนบหลักฐานการเบิกจ่าย",
}: {
  open: boolean;
  onClose: () => void;
  onSave: (fileName: string, fileData: string) => void;
  title?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  function pick(f: File | undefined) {
    if (!f) return;
    const problem = validateFile(f);
    if (problem) {
      setFile(null);
      setError(problem);
    } else {
      setFile(f);
      setError("");
    }
  }

  function close() {
    setFile(null);
    setError("");
    onClose();
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files[0]);
  }

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title={<span className="text-primary">{title}</span>}
      description="กรุณาตรวจสอบไฟล์ก่อนแนบ"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            กลับ
          </Button>
          <Button
            disabled={!file}
            onClick={() => {
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                onSave(file.name, reader.result as string);
                close();
              };
              reader.readAsDataURL(file);
            }}
          >
            บันทึก
          </Button>
        </>
      }
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex min-h-[192px] flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed p-6 text-center transition",
          dragging ? "border-primary bg-primary/5" : "border-transparent bg-primary-soft",
        )}
      >
        <FileText className="size-8 text-primary" aria-hidden />
        {file ? (
          <span className="flex items-center gap-2 rounded-full border border-primary bg-surface px-3 py-1 text-caption text-primary">
            {file.name}
            <button type="button" aria-label="ลบไฟล์" onClick={() => setFile(null)} className="rounded-full hover:bg-primary-soft">
              <X className="size-4" />
            </button>
          </span>
        ) : (
          <Button variant="secondary" size="S" onClick={() => inputRef.current?.click()}>
            เลือกไฟล์
          </Button>
        )}
        <p className="text-caption font-bold text-text">รองรับ PDF, JPG และ PNG ขนาดไม่เกิน 10 MB ต่อไฟล์</p>
        <p className="text-caption text-text-muted">คลิกเพื่อเลือกไฟล์ หรือ ลากไฟล์มาวาง</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = ""; // ให้เลือกไฟล์เดิมซ้ำได้
          }}
        />
      </div>
      {error && (
        <p role="alert" className="mt-3 text-caption text-danger">
          {error}
        </p>
      )}

      <h3 className="mt-6 text-body font-bold text-text">ตรวจสอบก่อนดำเนินการ</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-caption text-text-muted">
        {CHECKLIST.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
    </Modal>
  );
}
