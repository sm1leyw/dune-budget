"use client";
/**
 * components/request-form/RequestForm.tsx — ฟอร์ม 4 ขั้น (ตัวหลัก) · เจ้าของ: คนที่ 2
 * -----------------------------------------------------------------------------
 * ใช้ในหน้า /requests/new และ /requests/[id]/edit
 *
 * Props:
 *   user           ผู้ใช้ที่ login
 *   initial        ค่าเริ่มต้นของฟอร์ม (ใหม่ = emptyForm(), แก้ไข = fromRequest(req))
 *   requestId      รหัสที่แสดงในขั้นที่ 4 (ใหม่ = nextRequestId(), แก้ไข = req.id)
 *   editingId      ใส่เมื่อแก้ไขคำขอเดิม → ล็อกประเภท และไม่นับยอดของคำขอนี้ตอนคิดงบคงเหลือ
 *   submitLabel    ข้อความปุ่มยืนยัน (ไม่ใส่ = เลือกตามประเภท)
 *   onSubmit(input, advance?) → id ของคำขอที่บันทึก · โยน Error ได้ (จะแสดงเป็นกล่องแดง)
 *   onSubmitted(id) เรียกหลังบันทึกสำเร็จ (เช่น router.push ไปหน้ารายละเอียด)
 *
 * การทำงาน:
 *   - กด "ขั้นตอนถัดไป" → validateStep() ถ้าไม่ผ่านจะแสดงข้อความใต้ช่อง และไม่ไปต่อ
 *   - เกินงบ: แสดงทันทีที่พิมพ์ + ปิดปุ่มถัดไป (ตาม Figma)
 *   - ปุ่มยืนยันมี loading กันกดซ้ำ
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, Card, Stepper } from "@/components/ui";
import { formatBaht } from "@/lib/format";
import { getOverBudgetAmount } from "@/lib/budget";
import type { RequestInput } from "@/store/requests";
import type { ReimburseRequest, User } from "@/types";
import { parseAmount, STEP_LABELS, toRequestInput, type RequestFormValues } from "./formModel";
import { validateAll, validateStep, type FormErrors } from "./validation";
import { useFormData } from "./useFormData";
import { StepType } from "./StepType";
import { StepDetailsAdvance } from "./StepDetailsAdvance";
import { StepDetailsClearance } from "./StepDetailsClearance";
import { StepItems } from "./StepItems";
import { StepReview } from "./StepReview";

const STEP_TITLE: Record<"ADVANCE" | "CLEARANCE", { title: string; description?: string }[]> = {
  ADVANCE: [
    { title: "ขั้นตอนที่ 1 : เลือกประเภทการทำรายการเงินสด" },
    { title: "ขั้นตอนที่ 2 : กรอกข้อมูลงบประมาณ", description: "กรุณากรอกข้อมูลให้ครบ และถูกต้อง" },
    { title: "ขั้นตอนที่ 3 : กรอกข้อมูลบันทึกรายงานค่าใช้จ่ายและแนบไฟล์เอกสารจริง", description: "กรุณาตรวจสอบไฟล์ก่อนแนบไฟล์" },
    { title: "ขั้นตอนที่ 4 : ตรวจสอบสรุปข้อมูลผู้ขอเบิกและรายการทั้งหมด" },
  ],
  CLEARANCE: [
    { title: "ขั้นตอนที่ 1 : เลือกประเภทการทำรายการเงินสด" },
    {
      title: "ขั้นตอนที่ 2 : กรอกข้อมูลการคืนเงิน",
      description: "เลือกใบคำขอเบิกเดิมที่ต้องการเคลียร์ยอดเงินยืม ระบบจะคำนวณยอดเงินที่ต้องคืนให้อัตโนมัติ",
    },
    { title: "ขั้นตอนที่ 3 : แนบหลักฐานการคืนเงิน", description: "แนบใบเสร็จให้ครบตามยอดใช้จ่ายจริง (ไฟล์ PDF/JPG/PNG ไม่เกิน 10 MB)" },
    { title: "ขั้นตอนที่ 4 : ตรวจสอบสรุปข้อมูลการคืนเงินและใบเสร็จทั้งหมด" },
  ],
};

export function RequestForm({
  user,
  initial,
  today,
  requestId,
  editingId,
  submitLabel,
  onSubmit,
  onSubmitted,
}: {
  user: User;
  initial: RequestFormValues;
  today: string;
  requestId: string;
  editingId?: string;
  submitLabel?: string;
  onSubmit: (input: RequestInput) => string;
  onSubmitted: (id: string) => void;
}) {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<RequestFormValues>(initial);
  /** ขั้นที่ผู้ใช้เคยกด "ถัดไป" แล้ว → เริ่มแสดงข้อความผิดพลาดของขั้นนั้น */
  const [attempted, setAttempted] = useState<Set<number>>(new Set());
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const data = useFormData(values, user, editingId);
  const stepErrors = useMemo(() => validateStep(step, values, data.validationContext), [step, values, data.validationContext]);

  // เกินงบ (ตาราง A): แสดงทันทีโดยไม่ต้องรอกดถัดไป
  const amount = parseAmount(values.amount);
  const overBudget =
    values.type === "ADVANCE" && data.categoryRemaining !== undefined && !Number.isNaN(amount)
      ? getOverBudgetAmount(data.categoryRemaining, amount)
      : 0;

  const visibleErrors: FormErrors = attempted.has(step) ? stepErrors : overBudget > 0 && step === 2 ? { amount: stepErrors.amount } : {};

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  function patch(p: Partial<RequestFormValues>) {
    setValues((v) => ({ ...v, ...p }));
    setSubmitError("");
  }

  function next() {
    setAttempted((s) => new Set(s).add(step));
    if (Object.keys(stepErrors).length === 0) setStep((s) => Math.min(4, s + 1));
  }

  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  function submit() {
    const errors = validateAll(values, data.validationContext);
    if (Object.keys(errors).length > 0) {
      setSubmitError("ข้อมูลบางส่วนยังไม่ถูกต้อง กรุณาย้อนกลับไปตรวจสอบ");
      return;
    }
    setSubmitting(true);
    try {
      const id = onSubmit(toRequestInput(values, data.advance as ReimburseRequest | undefined));
      onSubmitted(id);
    } catch (e) {
      setSubmitError((e as Error).message || "บันทึกไม่สำเร็จ กรุณาลองใหม่");
      setSubmitting(false);
    }
  }

  const head = STEP_TITLE[values.type][step - 1];
  const finalLabel = submitLabel ?? (values.type === "ADVANCE" ? "ยืนยันและยื่นคำขอเบิก" : "ยืนยันและยื่นคำขอคืนเงิน");

  return (
    <div ref={topRef} className="scroll-mt-24 space-y-6">
      <Stepper steps={STEP_LABELS[values.type]} current={step} className="mx-auto max-w-[960px] justify-between" />

      <Card
        title={head.title}
        description={head.description}
        actions={
          overBudget > 0 && step === 2 ? (
            <p role="alert" className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/5 px-4 py-2.5 text-caption font-bold text-danger">
              <AlertTriangle className="size-4 shrink-0" aria-hidden />
              ไม่สามารถไปขั้นตอนถัดไปได้ : ยอดขอเบิกเกินงบคงเหลือ {formatBaht(overBudget)}
            </p>
          ) : undefined
        }
      >
        {step === 1 && (
          <StepType
            value={values.type}
            locked={!!editingId}
            error={visibleErrors.type}
            onChange={(type) => {
              patch({ type });
              setAttempted(new Set());
            }}
          />
        )}
        {step === 2 && values.type === "ADVANCE" && (
          <StepDetailsAdvance values={values} onChange={patch} errors={visibleErrors} data={data} user={user} today={today} />
        )}
        {step === 2 && values.type === "CLEARANCE" && (
          <StepDetailsClearance values={values} onChange={patch} errors={visibleErrors} data={data} user={user} today={today} />
        )}
        {step === 3 && <StepItems values={values} onChange={patch} errors={visibleErrors} today={today} />}
        {step === 4 && <StepReview values={values} data={data} user={user} today={today} requestId={requestId} />}

        {submitError && (
          <p role="alert" className="mt-6 rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-body text-danger">
            {submitError}
          </p>
        )}

        <div className="mt-8 flex justify-end gap-3">
          {step > 1 && (
            <Button variant="secondary" onClick={back} disabled={submitting}>
              ย้อนกลับ
            </Button>
          )}
          {step < 4 ? (
            <Button onClick={next} disabled={step === 2 && overBudget > 0}>
              ขั้นตอนถัดไป
            </Button>
          ) : (
            <Button onClick={submit} loading={submitting}>
              {finalLabel}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
