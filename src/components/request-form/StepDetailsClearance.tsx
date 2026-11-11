"use client";
/**
 * components/request-form/StepDetailsClearance.tsx — ขั้นตอนที่ 2 ตาราง B: ข้อมูลการคืนเงิน · เจ้าของ: คนที่ 2
 * -----------------------------------------------------------------------------
 * Props เหมือน StepDetailsAdvance
 *
 * ผู้ใช้เลือกใบยืมเดิม → ระบบแสดงยอดยืมเดิม · ผู้ใช้กรอกยอดใช้จริง → ระบบคำนวณยอดที่ต้องคืน
 *   ยอดที่ต้องคืน = ยอดยืมเดิม − ยอดใช้จริง  (ติดลบ = บริษัทต้องจ่ายเพิ่มให้ผู้ยื่น)
 * โครงการ/หมวด/ช่วงวันที่ ไม่ต้องกรอก — ใช้ของใบยืมเดิม (ดู toRequestInput ใน formModel.ts)
 */
import { Field, Input, Select, Textarea } from "@/components/ui";
import { REFUND_METHOD_LABEL } from "@/constants/request";
import { formatNumber, formatThaiDate } from "@/lib/format";
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
        label={refund !== undefined && refund < 0 ? "ยอดที่บริษัทต้องจ่ายเพิ่ม (บาท)" : "ยอดเงินที่ต้องคืนบริษัท (บาท)"}
        emphasis
        tone={refund !== undefined && refund < 0 ? "danger" : undefined}
        value={refund !== undefined ? formatNumber(Math.abs(refund)) : "–"}
        hint={refund !== undefined && refund < 0 ? "ใช้จ่ายจริงเกินยอดที่ยืมไป ฝ่ายบัญชีจะตรวจสอบก่อนจ่ายเพิ่ม" : "ระบบคำนวณให้อัตโนมัติ"}
      />

      <Field label="วิธีการคืนเงิน" htmlFor="refundMethod" required error={errors.refundMethod}>
        <Select
          id="refundMethod"
          value={values.refundMethod}
          invalid={!!errors.refundMethod}
          options={REFUND_OPTIONS}
          onChange={(e) => onChange({ refundMethod: e.target.value as RefundMethod })}
        />
      </Field>

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
