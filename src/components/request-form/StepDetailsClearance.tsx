"use client";
/**
 * components/request-form/StepDetailsClearance.tsx — ขั้นตอนที่ 2 ตาราง B: ข้อมูลการคืนเงิน · เจ้าของ: คนที่ 2
 * -----------------------------------------------------------------------------
 * Props เหมือน StepDetailsAdvance
 *
 * ผู้ใช้เลือกใบยืมเดิม → ระบบแสดงยอดยืมเดิม · ผู้ใช้กรอกยอดใช้จริง → ระบบคำนวณส่วนต่าง (lib/clearance.ts)
 *   ใช้น้อยกว่ายืม → แสดง "ยอดเงินที่ต้องคืนบริษัท" + ต้องเลือกวิธีคืนเงิน · ไปบัญชีตรวจรับเงินคืนทันที
 *                   คืนแบบโอน → พนักงานแนบสลิปโอนคืนเอง (บัญชีตรวจสลิปแล้วกดยืนยัน ไม่ต้องแนบหลักฐาน)
 *   ใช้พอดี       → ไม่ต้องคืน ไม่ต้องเลือกวิธีคืนเงิน · ไปบัญชีตรวจใบเสร็จทันที
 *   ใช้เกินยืม     → "ยอดที่บริษัทต้องจ่ายเพิ่ม" (ต้องไม่เกินงบคงเหลือของหมวด) · สายอนุมัติตามยอดส่วนเกิน
 * โครงการ/หมวด/ช่วงวันที่ ไม่ต้องกรอก — ใช้ของใบยืมเดิม (ดู toRequestInput ใน formModel.ts)
 */
import { useState } from "react";
import { Paperclip } from "lucide-react";
import { AttachmentChip, Field, Input, Select, Textarea } from "@/components/ui";
import { ACCEPT_ATTR, MAX_FILE_MB, prepareAttachment } from "@/lib/files";
import { REFUND_METHOD_LABEL } from "@/constants/request";
import { formatNumber, formatThaiDate } from "@/lib/format";
import { getInitialStatus } from "@/lib/workflow";
import { getProjectById } from "@/store/projects";
import type { RefundMethod, User } from "@/types";
import { parseAmount, type RequestFormValues } from "./formModel";
import type { FormErrors } from "./validation";
import type { FormData } from "./useFormData";
import { ReadOnlyField } from "./ReadOnlyField";

const REFUND_OPTIONS = (Object.keys(REFUND_METHOD_LABEL) as RefundMethod[]).map((value) => ({
  value,
  label: REFUND_METHOD_LABEL[value],
}));

const ROUTE_TEXT: Partial<Record<ReturnType<typeof getInitialStatus>, string>> = {
  WAITING_ACCOUNTANT: "ส่งให้ฝ่ายบัญชีตรวจสอบโดยตรง",
  WAITING_DEPT_HEAD: "ต้องให้หัวหน้าแผนกอนุมัติส่วนที่เกินก่อน",
  WAITING_EXECUTIVE: "ต้องให้ผู้บริหารอนุมัติส่วนที่เกินก่อน",
};

export function StepDetailsClearance({
  values,
  onChange,
  errors,
  data,
  user,
  today,
}: {
  values: RequestFormValues;
  onChange: (patch: Partial<RequestFormValues>) => void;
  errors: FormErrors;
  data: FormData;
  user: User;
  today: string;
}) {
  const advanceOptions = data.eligibleAdvances.map((r) => ({
    value: r.id,
    label: `${r.id} · ${getProjectById(r.projectId)?.name ?? r.projectId}`,
  }));
  const borrowed = data.advance?.totalAmount;
  const spent = parseAmount(values.amount);
  const refund = borrowed !== undefined && !Number.isNaN(spent) ? borrowed - spent : undefined;
  const extra = refund !== undefined && refund < 0 ? -refund : 0;
  const [slipError, setSlipError] = useState("");
  const [readingSlip, setReadingSlip] = useState(false);
  const needsSlip = refund !== undefined && refund > 0 && values.refundMethod === "TRANSFER";

  // สายอนุมัติตามยอดที่บริษัทต้องจ่ายเพิ่ม (กติกาเดียวกับ lib/workflow + lib/clearance)
  const route = ROUTE_TEXT[getInitialStatus(user.role, extra)];

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-5 max-md:grid-cols-1">
      <ReadOnlyField label="วันที่ยื่นคืนเงิน" value={formatThaiDate(today)} />

      <Field label="อ้างอิงใบคำขอเบิกเดิม" htmlFor="advanceRefId" required error={errors.advanceRefId}>
        <Select
          id="advanceRefId"
          value={values.advanceRefId}
          invalid={!!errors.advanceRefId}
          placeholder="เลือกใบคำขอเบิกที่ต้องการเคลียร์"
          options={advanceOptions}
          onChange={(e) => onChange({ advanceRefId: e.target.value })}
        />
      </Field>

      <ReadOnlyField label="ยอดเงินยืมเดิม (บาท)" emphasis value={borrowed !== undefined ? formatNumber(borrowed) : "–"} />

      <Field label="ยอดใช้จ่ายจริงตามใบเสร็จ (บาท)" htmlFor="amount" required error={errors.amount}>
        <Input
          id="amount"
          inputMode="decimal"
          placeholder="เช่น 22,500"
          value={values.amount}
          invalid={!!errors.amount}
          onChange={(e) => onChange({ amount: e.target.value })}
        />
      </Field>

      <ReadOnlyField
        label={extra > 0 ? "ยอดที่บริษัทต้องจ่ายเพิ่ม (บาท)" : "ยอดเงินที่ต้องคืนบริษัท (บาท)"}
        emphasis
        tone={extra > 0 ? "danger" : undefined}
        value={refund !== undefined ? formatNumber(Math.abs(refund)) : "–"}
        hint={
          refund === undefined
            ? "ระบบคำนวณให้อัตโนมัติ"
            : extra > 0
              ? `ใช้จ่ายจริงเกินยอดที่ยืม · ${route}`
              : refund === 0
                ? `ใช้พอดีกับยอดยืม ไม่ต้องคืนเงิน · ${route}`
                : `ระบบคำนวณให้อัตโนมัติ · ${route}`
        }
      />

      {/* เลือกวิธีคืนเงินเฉพาะตอนที่มีเงินต้องคืน */}
      {refund === undefined || refund > 0 ? (
        <Field label="วิธีการคืนเงิน" htmlFor="refundMethod" required error={errors.refundMethod}>
          <Select
            id="refundMethod"
            value={values.refundMethod}
            invalid={!!errors.refundMethod}
            options={REFUND_OPTIONS}
            onChange={(e) => onChange({ refundMethod: e.target.value as RefundMethod })}
          />
        </Field>
      ) : (
        <ReadOnlyField label="วิธีการคืนเงิน" value={extra > 0 ? "ไม่ต้องคืน (บริษัทโอนส่วนต่างให้)" : "ไม่ต้องคืน"} />
      )}

      {needsSlip && (
        <Field
          label="สลิปการโอนคืนเงิน"
          htmlFor="refund-slip"
          required
          error={slipError || errors.refundSlip}
          hint={`โอนคืน ${formatNumber(refund!)} บาท เข้าบัญชีบริษัท แล้วแนบสลิป · PDF, JPG, PNG ไม่เกิน ${MAX_FILE_MB} MB`}
          className="col-span-full"
        >
          <label
            htmlFor="refund-slip"
            className="flex h-12 cursor-pointer items-center gap-3 rounded-md border-[1.5px] border-dashed border-border-input bg-surface px-4 text-body transition hover:bg-primary-soft"
          >
            <Paperclip className="size-5 shrink-0 text-text-muted" aria-hidden />
            <span className={values.refundSlip ? "min-w-0 flex-1 truncate text-text" : "min-w-0 flex-1 truncate text-text-muted"}>
              {readingSlip ? "กำลังอ่านไฟล์…" : values.refundSlip ? values.refundSlip.name : "เลือกไฟล์สลิปโอนคืนเงิน"}
            </span>
            <span className="shrink-0 font-medium text-primary">{values.refundSlip ? "เปลี่ยนไฟล์" : "เลือกไฟล์"}</span>
          </label>
          <input
            id="refund-slip"
            type="file"
            accept={ACCEPT_ATTR}
            className="sr-only"
            onChange={async (e) => {
              const input = e.currentTarget;
              const file = input.files?.[0];
              input.value = "";
              if (!file) return;
              setReadingSlip(true);
              const result = await prepareAttachment(file);
              setReadingSlip(false);
              setSlipError(result.error ?? "");
              if (result.attachment) onChange({ refundSlip: result.attachment });
            }}
          />
          {values.refundSlip && (
            <div className="mt-2 flex items-center gap-2 text-caption text-text-muted">
              ตรวจสอบไฟล์: <AttachmentChip name={values.refundSlip.name} data={values.refundSlip.data} />
            </div>
          )}
        </Field>
      )}

      <ReadOnlyField label="ชื่อผู้ยื่นคืนเงิน" value={user.name} />
      <ReadOnlyField label="แผนก" value={user.department} />

      <Field label="หมายเหตุ / คำอธิบายการคืนเงิน" htmlFor="purpose" required error={errors.purpose} className="col-span-full">
        <Textarea
          id="purpose"
          rows={4}
          maxLength={1000}
          placeholder="เช่น คืนส่วนต่างเงินยืมทดรองจ่ายสำหรับโครงการ... ตามใบคำขอเบิกเลขที่... โดยใช้จ่ายจริง... บาท"
          value={values.purpose}
          invalid={!!errors.purpose}
          onChange={(e) => onChange({ purpose: e.target.value })}
        />
      </Field>
    </div>
  );
}
