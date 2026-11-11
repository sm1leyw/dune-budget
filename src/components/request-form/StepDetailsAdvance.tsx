"use client";
/**
 * components/request-form/StepDetailsAdvance.tsx — ขั้นตอนที่ 2 ตาราง A: ข้อมูลคำขอเบิก · เจ้าของ: คนที่ 2
 * -----------------------------------------------------------------------------
 * Props:
 *   values, onChange(patch)   ค่าในฟอร์ม / แก้ค่าบางช่อง
 *   errors                    ข้อความผิดพลาด (จาก validateStep(2, ...))
 *   data                      ผลจาก useFormData() — ตัวเลือกโครงการ/หมวด พร้อมงบคงเหลือ
 *   user, today               ผู้ยื่น และวันที่ยื่น (แสดงอย่างเดียว)
 *
 * เตือนเกินงบ (Figma: "ขั้นตอนที่ 2 (ยอดเกินงบคงเหลือ)") แสดงทันทีที่พิมพ์ ไม่ต้องรอกดถัดไป
 * → ส่วนนี้คำนวณใน RequestForm แล้วส่งมาเป็น errors.amount
 */
import { Field, Input, Select, Textarea } from "@/components/ui";
import { formatThaiDate } from "@/lib/format";
import type { User } from "@/types";
import type { RequestFormValues } from "./formModel";
import type { FormErrors } from "./validation";
import type { FormData } from "./useFormData";
import { ReadOnlyField } from "./ReadOnlyField";
import { AlertCircle } from "lucide-react";

export function StepDetailsAdvance({
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
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-5 max-md:grid-cols-1">
      <ReadOnlyField label="วันที่ยื่นขอเบิก" value={formatThaiDate(today)} />

      <Field label="ชื่อโครงการ" htmlFor="projectId" required error={errors.projectId}>
        <Select
          id="projectId"
          value={values.projectId}
          invalid={!!errors.projectId}
          placeholder="เลือกโครงการ"
          options={data.projectOptions}
          // เปลี่ยนโครงการ → ล้างหมวดเดิม เพราะหมวดเป็นของแต่ละโครงการ
          onChange={(e) => onChange({ projectId: e.target.value, categoryId: "" })}
        />
      </Field>

      <Field
        label="หมวดค่าใช้จ่าย"
        htmlFor="categoryId"
        required
        error={errors.categoryId}
        hint={!values.projectId ? "เลือกโครงการก่อน" : undefined}
      >
        <Select
          id="categoryId"
          value={values.categoryId}
          invalid={!!errors.categoryId}
          disabled={!values.projectId}
          placeholder="เลือกหมวดค่าใช้จ่าย"
          options={data.categoryOptions}
          onChange={(e) => onChange({ categoryId: e.target.value })}
        />
      </Field>

      <Field label="จำนวนเงินขอเบิก (บาท)" htmlFor="amount" required>
        <Input
          id="amount"
          inputMode="decimal"
          placeholder="เช่น 22,500"
          value={values.amount}
          invalid={!!errors.amount}
          className={errors.amount ? "bg-danger/5 text-danger" : undefined}
          onChange={(e) => onChange({ amount: e.target.value })}
        />
        {errors.amount && (
          <p className="flex items-center gap-1.5 text-caption text-danger">
            <AlertCircle className="size-4 shrink-0" aria-hidden />
            {errors.amount}
          </p>
        )}
      </Field>

      <Field label="ช่วงระยะเวลาเริ่มดำเนินการ" htmlFor="startDate" required error={errors.startDate}>
        <Input
          id="startDate"
          type="date"
          value={values.startDate}
          invalid={!!errors.startDate}
          onChange={(e) => onChange({ startDate: e.target.value })}
        />
      </Field>

      <Field label="ช่วงระยะเวลาสิ้นสุด" htmlFor="endDate" required error={errors.endDate}>
        <Input
          id="endDate"
          type="date"
          min={values.startDate || undefined}
          value={values.endDate}
          invalid={!!errors.endDate}
          onChange={(e) => onChange({ endDate: e.target.value })}
        />
      </Field>

      <ReadOnlyField label="ชื่อผู้ขอเบิก" value={user.name} />
      <ReadOnlyField label="แผนก" value={user.department} />

      <Field label="รายละเอียดวัตถุประสงค์" htmlFor="purpose" required error={errors.purpose} className="col-span-full">
        <Textarea
          id="purpose"
          rows={4}
          maxLength={1000}
          placeholder="เช่น เพื่อจ่ายเป็นค่าเช่าสถานที่ ห้องประชุม พร้อมค่าอาหารกลางวัน ในการจัดโครงการ... ระหว่างวันที่... ณ..."
          value={values.purpose}
          invalid={!!errors.purpose}
          onChange={(e) => onChange({ purpose: e.target.value })}
        />
      </Field>
    </div>
  );
}
