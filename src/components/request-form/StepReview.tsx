"use client";
/**
 * components/request-form/StepReview.tsx — ขั้นตอนที่ 4: สรุปก่อนยืนยัน · เจ้าของ: คนที่ 2
 * -----------------------------------------------------------------------------
 * Props:
 *   values      ค่าในฟอร์ม
 *   data        ผลจาก useFormData() (ชื่อโครงการ/หมวด/ใบยืมเดิม)
 *   user, today ผู้ยื่น และวันที่ยื่น
 *   requestId   รหัสคำขอ (ใหม่ = รหัสที่จะได้, แก้ไข = รหัสเดิม)
 *
 * แสดงอย่างเดียว ไม่มีช่องกรอก — ถ้าข้อมูลผิดให้กด "ย้อนกลับ"
 */
import type { ReactNode } from "react";
import { Paperclip } from "lucide-react";
import { REFUND_METHOD_LABEL, REQUEST_TYPE_LABEL } from "@/constants/request";
import { formatBaht, formatThaiDate } from "@/lib/format";
import { getCategoryName, getProjectById } from "@/store/projects";
import type { User } from "@/types";
import { openFilePreview, parseAmount, sumItems, type RequestFormValues } from "./formModel";
import type { FormData } from "./useFormData";


function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-1.5 text-body">
      <dt className="shrink-0 text-text-muted">{label} :</dt>
      <dd className="font-bold text-text">{children}</dd>
    </div>
  );
}

export function StepReview({
  values,
  data,
  user,
  today,
  requestId,
}: {
  values: RequestFormValues;
  data: FormData;
  user: User;
  today: string;
  requestId: string;
}) {
  const isClearance = values.type === "CLEARANCE";
  const advance = data.advance;
  const projectId = isClearance ? advance?.projectId ?? "" : values.projectId;
  const categoryId = isClearance ? advance?.categoryId ?? "" : values.categoryId;
  const project = getProjectById(projectId);
  const total = sumItems(values.items);
  const spent = parseAmount(values.amount);
  const refund = advance ? advance.totalAmount - spent : 0;

  return (
    <div className="rounded-md bg-primary-soft p-8 max-md:p-5">
      <dl className="grid grid-cols-2 gap-x-10 gap-y-2.5 max-md:grid-cols-1">
        <Row label={isClearance ? "รหัสคำขอคืนเงิน" : "รหัสคำขอ"}>{requestId}</Row>
        <Row label={isClearance ? "วันที่ยื่นคืนเงิน" : "วันที่ยื่นขอเบิก"}>{formatThaiDate(today)}</Row>
        <Row label={isClearance ? "ผู้ยื่นคืนเงิน" : "ผู้ยื่นขอเบิก"}>{user.name}</Row>
        <Row label="แผนก">{user.department}</Row>
        <Row label="ประเภทแบบฟอร์ม">{REQUEST_TYPE_LABEL[values.type]}</Row>
        {isClearance ? (
          <Row label="อ้างอิงใบคำขอเบิกเดิม">{values.advanceRefId}</Row>
        ) : (
          <Row label="ช่วงระยะเวลาดำเนินการ">
            {formatThaiDate(values.startDate)} ถึง {formatThaiDate(values.endDate)}
          </Row>
        )}
        <Row label="ชื่อโครงการ">{project?.name ?? "-"}</Row>
        {isClearance ? (
          <Row label="วิธีการคืนเงิน">{values.refundMethod ? REFUND_METHOD_LABEL[values.refundMethod] : "-"}</Row>
        ) : (
          <Row label="หมวดหมู่">{getCategoryName(project, categoryId)}</Row>
        )}
      </dl>

      <h3 className="mt-6 text-body font-bold text-text">{isClearance ? "หมายเหตุ / คำอธิบายการคืนเงิน :" : "รายละเอียด/วัตถุประสงค์ :"}</h3>
      <p className="mt-2 whitespace-pre-line px-4 text-body text-text">{values.purpose}</p>

      <h3 className="mt-6 text-body font-bold text-primary">{isClearance ? "แนบใบเสร็จทั้งหมด" : "แนบเอกสารทั้งหมด"}</h3>
      <ul className="mt-3 space-y-2">
        {values.items.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-sm bg-surface px-4 py-2 text-body">
            <span className="min-w-0">
              {i.name} <span className="text-caption text-text-muted">· {formatThaiDate(i.date)}</span>
            </span>
            <span className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => openFilePreview(i.fileData)}
                title="คลิกเพื่อเปิดดูไฟล์"
                className="flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-caption text-primary transition hover:bg-primary-soft hover:underline"
              >
                <Paperclip className="size-3.5" aria-hidden />
                {i.fileName}
              </button>
              <span className="font-medium">{formatBaht(parseAmount(i.amount) || 0)}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-t border-border-input pt-4">
        {isClearance ? (
          <>
            <span className="text-lg text-text">
              {refund >= 0 ? "ยอดเงินที่ต้องคืนบริษัท" : "ยอดที่บริษัทต้องจ่ายเพิ่ม"}
              <span className="block text-caption text-text-muted">
                (ยืม {formatBaht(advance?.totalAmount ?? 0, { withUnit: false })} − ใช้จริง {formatBaht(spent || 0, { withUnit: false })})
              </span>
            </span>
            <span className={refund >= 0 ? "text-[32px] font-bold text-primary" : "text-[32px] font-bold text-danger"}>
              {formatBaht(Math.abs(refund))}
            </span>
          </>
        ) : (
          <>
            <span className="text-lg text-text">ยอดสุทธิของใบคำขอนี้</span>
            <span className="text-[32px] font-bold text-primary">{formatBaht(total)}</span>
          </>
        )}
      </div>
    </div>
  );
}
