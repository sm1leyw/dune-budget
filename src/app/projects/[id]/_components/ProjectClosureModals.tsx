"use client";
/**
 * app/projects/[id]/_components/ProjectClosureModals.tsx — popup เสร็จสิ้นโครงการ / เปิดโครงการอีกครั้ง (ฝ่ายบัญชี)
 * -----------------------------------------------------------------------------
 * <CompleteProjectModal>  ตาม Figma "Modal / ยืนยันเสร็จสิ้นโครงการ" + ตรวจเงื่อนไขจริง + แนบหลักฐาน + หมายเหตุ
 *   - เงื่อนไขไม่ผ่าน → แสดง ✗ สีแดง พร้อมเลขที่คำขอที่ค้าง (กดเปิดดูได้) และกดยืนยันไม่ได้
 *   - ต้องแนบหลักฐาน (รายงานสรุปปิดโครงการ) อย่างน้อย 1 ไฟล์
 * <ReopenProjectModal>    เปิดโครงการกลับมาใช้งาน — ต้องระบุเหตุผล
 */
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, FileText, RotateCcw, X } from "lucide-react";
import { AttachmentChip, Button, Field, Modal, Textarea } from "@/components/ui";
import { PATHS } from "@/config/routes";
import type { BudgetSummary } from "@/lib/budget";
import { cn } from "@/lib/cn";
import { ACCEPT_ATTR, MAX_FILE_MB, prepareAttachment } from "@/lib/files";
import { formatNumber } from "@/lib/format";
import type { CompletionBlockers } from "@/lib/projectClosure";
import { completeProject, reopenProject } from "@/store/projects";
import type { Attachment, Project, ReimburseRequest } from "@/types";

/** 1 แถวในกล่องเงื่อนไข: ✓ เขียว = ผ่าน · ✗ แดง = ยังไม่ผ่าน (แสดงคำขอที่ค้าง) */
function ConditionRow({ ok, label, items }: { ok: boolean; label: ReactNode; items?: ReimburseRequest[] }) {
  return (
    <li className="flex items-start gap-2">
      {ok ? (
        <Check className="mt-0.5 size-3.5 shrink-0 stroke-[2.5] text-primary" aria-label="ผ่าน" />
      ) : (
        <X className="mt-0.5 size-3.5 shrink-0 stroke-[2.5] text-danger" aria-label="ยังไม่ผ่าน" />
      )}
      <div className={cn("min-w-0", !ok && "text-danger")}>
        <span>{label}</span>
        {!ok && items && items.length > 0 && (
          <span className="mt-0.5 flex flex-wrap gap-1.5">
            {items.map((r) => (
              <Link key={r.id} href={PATHS.approvalDetail(r.id)} className="underline underline-offset-2 hover:text-text">
                {r.id}
              </Link>
            ))}
          </span>
        )}
      </div>
    </li>
  );
}

export function CompleteProjectModal({
  open,
  onClose,
  project,
  budget,
  blockers,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  project: Project;
  budget: BudgetSummary;
  blockers: CompletionBlockers;
  userId: string;
}) {
  const [files, setFiles] = useState<Attachment[]>([]);
  const [note, setNote] = useState("");
  const [fileError, setFileError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [reading, setReading] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  function close() {
    setFiles([]);
    setNote("");
    setFileError("");
    setSubmitError("");
    onClose();
  }

  async function addFiles(list: FileList | null) {
    const picked = Array.from(list ?? []);
    setInputKey((k) => k + 1);
    if (picked.length === 0) return;
    setReading(true);
    const added: Attachment[] = [];
    const problems: string[] = [];
    let reserved = files.reduce((sum, f) => sum + (f.data?.length ?? 0), 0);
    for (const file of picked) {
      const result = await prepareAttachment(file, reserved);
      if (result.error !== undefined) problems.push(`${file.name}: ${result.error}`);
      else {
        added.push(result.attachment);
        reserved += result.attachment.data?.length ?? 0;
      }
    }
    setReading(false);
    setFiles((prev) => [...prev.filter((f) => !added.some((a) => a.name === f.name)), ...added]);
    setFileError(problems.join(" · "));
  }

  function confirm() {
    setSubmitError("");
    if (files.length === 0) {
      setFileError("กรุณาแนบหลักฐานการปิดโครงการอย่างน้อย 1 ไฟล์");
      return;
    }
    try {
      completeProject(project.id, { byUserId: userId, note, attachments: files });
      close();
    } catch (e) {
      setSubmitError((e as Error).message);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title={
        <span className="flex flex-col gap-4">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Check className="size-6 stroke-[2.5]" aria-hidden />
          </span>
          ยืนยันเสร็จสิ้นโครงการ
        </span>
      }
      description={
        <>
          {project.name} ({project.id}) — เมื่อเสร็จสิ้นแล้วจะไม่สามารถยื่นคำขอเบิกใหม่ในโครงการนี้ได้ และงบคงเหลือ{" "}
          {formatNumber(budget.remaining)} บาท จะคืนเข้างบกลางของแผนก
        </>
      }
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            ยกเลิก
          </Button>
          <Button onClick={confirm} disabled={!blockers.canComplete || reading}>
            ยืนยันเสร็จสิ้นโครงการ
          </Button>
        </>
      }
    >
      <ul className="space-y-2 rounded-md bg-primary-soft p-4 text-caption text-text">
        <ConditionRow
          ok={blockers.pending.length === 0}
          label={blockers.pending.length === 0 ? "ไม่มีคำขอที่รออนุมัติหรือรอทำจ่าย" : `มีคำขอที่รออนุมัติหรือรอทำจ่าย ${blockers.pending.length} รายการ`}
          items={blockers.pending}
        />
        <ConditionRow
          ok={blockers.sentBack.length === 0}
          label={
            blockers.sentBack.length === 0
              ? "ไม่มีคำขอที่ถูกส่งกลับแก้ไขค้างอยู่"
              : `มีคำขอที่ถูกส่งกลับแก้ไข ${blockers.sentBack.length} รายการ (ผู้ขอต้องแก้แล้วส่งใหม่ หรือยกเลิกก่อน)`
          }
          items={blockers.sentBack}
        />
        <ConditionRow
          ok={blockers.unclearedAdvances.length === 0}
          label={
            blockers.unclearedAdvances.length === 0
              ? "ไม่มีเงินยืมที่ค้างเคลียร์"
              : `มีเงินยืมที่ค้างเคลียร์ ${blockers.unclearedAdvances.length} รายการ (ต้องมีคำขอคืนเงิน/เคลียร์ที่จ่ายเสร็จแล้ว)`
          }
          items={blockers.unclearedAdvances}
        />
        <ConditionRow
          ok
          label={`สรุปยอด : งบอนุมัติ ${formatNumber(budget.allocated)} · จ่ายจริง ${formatNumber(budget.used)} · คงเหลือ ${formatNumber(budget.remaining)} บาท`}
        />
      </ul>

      {blockers.canComplete && (
        <div className="mt-5 space-y-4">
          <Field label="หลักฐานการปิดโครงการ" required error={fileError} hint={`เช่น รายงานสรุปผลโครงการ · PDF, JPG, PNG ไม่เกิน ${MAX_FILE_MB} MB ต่อไฟล์`}>
            <div className="space-y-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border-[1.5px] border-primary px-3 py-1.5 text-caption font-medium text-primary transition hover:bg-primary-soft">
                <FileText className="size-4" aria-hidden />
                {reading ? "กำลังอ่านไฟล์…" : files.length > 0 ? "แนบไฟล์เพิ่ม" : "เลือกไฟล์"}
                <input key={inputKey} type="file" multiple accept={ACCEPT_ATTR} className="sr-only" onChange={(e) => void addFiles(e.target.files)} />
              </label>
              {files.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {files.map((f) => (
                    <li key={f.name} className="flex items-center gap-1">
                      <AttachmentChip name={f.name} data={f.data} />
                      <button
                        type="button"
                        aria-label={`ลบไฟล์ ${f.name}`}
                        onClick={() => setFiles((prev) => prev.filter((x) => x.name !== f.name))}
                        className="rounded-full p-0.5 text-text-muted hover:bg-danger/5 hover:text-danger"
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Field>
          <Field label="หมายเหตุการปิดโครงการ" htmlFor="close-note" hint="ไม่บังคับ เช่น ผลการดำเนินงาน หรือเหตุผลที่ปิดก่อนกำหนด">
            <Textarea id="close-note" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-20" />
          </Field>
        </div>
      )}

      {submitError && (
        <p role="alert" className="mt-4 text-caption text-danger">
          {submitError}
        </p>
      )}
    </Modal>
  );
}

export function ReopenProjectModal({
  open,
  onClose,
  project,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  project: Project;
  userId: string;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  function close() {
    setReason("");
    setError("");
    onClose();
  }

  function confirm() {
    try {
      reopenProject(project.id, { byUserId: userId, reason });
      close();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={
        <span className="flex items-center gap-2">
          <RotateCcw className="size-5 text-primary" aria-hidden /> เปิดโครงการอีกครั้ง
        </span>
      }
      description={`${project.name} (${project.id}) จะกลับมาเป็น "ดำเนินการอยู่" และเปิดรับคำขอเบิกได้อีกครั้ง ประวัติการเสร็จสิ้นเดิมยังเก็บไว้ในหน้าประวัติ`}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            ยกเลิก
          </Button>
          <Button onClick={confirm}>เปิดโครงการอีกครั้ง</Button>
        </>
      }
    >
      <Field label="เหตุผลการเปิดโครงการอีกครั้ง" htmlFor="reopen-reason" required error={error}>
        <Textarea id="reopen-reason" value={reason} invalid={!!error} onChange={(e) => setReason(e.target.value)} />
      </Field>
    </Modal>
  );
}
