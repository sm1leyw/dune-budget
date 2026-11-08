"use client";
/**
 * components/requests/RequestDetail.tsx — รายละเอียดคำขอ 1 รายการ · เจ้าของ: คนที่ 3 (ทุก role ใช้ร่วม)
 * -----------------------------------------------------------------------------
 * ตาม Figma "ตรวจสอบคำขอ":
 *   แถวบน   ข้อมูลคำขอ (ซ้าย) + ลำดับขั้นการอนุมัติ (ขวา)
 *   ต่อมา    หมายเหตุการส่งกลับแก้ไข (ถ้ามี) → ยอดเงินขอเบิก → ข้อมูลเอกสารแนบ → ข้อมูลการทำจ่าย (ถ้ามี)
 *   ล่างขวา  ปุ่มที่หน้าเรียกใช้ส่งมา
 *
 * Props:
 *   request    คำขอ 1 รายการ (จาก useRequest(id))
 *   actions    ปุ่มด้านล่างขวา เรียง: ปุ่มอันตราย → ปุ่มรอง → ปุ่มหลัก
 *   children   เนื้อหาเพิ่มก่อนแถวปุ่ม เช่น ฟอร์มทำจ่ายของบัญชี (คนที่ 4)
 *
 * @example
 * // หน้า /requests/[id] (คนที่ 3)
 * <RequestDetail request={request} actions={<ButtonLink href={PATHS.dashboard} variant="secondary">กลับไปหน้าหลัก</ButtonLink>} />
 * // หน้า /approvals/[id] (คนที่ 4)
 * <RequestDetail request={request} actions={<><Button variant="danger">ส่งกลับแก้ไข</Button><Button>อนุมัติ</Button></>}>
 *   <Card title="ข้อมูลการทำจ่าย">…</Card>
 * </RequestDetail>
 */
import type { ReactNode } from "react";
import { FileText } from "lucide-react";
import { Card, InfoBox, Table, TableEmpty, TBody, TD, TH, THead, TR } from "@/components/ui";
import { ROLE_LABEL } from "@/constants/roles";
import { formatBaht, formatNumber, formatThaiDate } from "@/lib/format";
import { getCategoryName, useProjects } from "@/store/projects";
import { getUserById } from "@/store/session";
import type { PaymentInfo, ReimburseRequest, RequestType } from "@/types";
import { ApprovalTimeline } from "./ApprovalTimeline";

export const REQUEST_TYPE_LABEL: Record<RequestType, string> = {
  ADVANCE: "คำขอเบิก",
  CLEARANCE: "คำขอคืนเงิน",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentInfo["method"], string> = {
  CASH: "เงินสด",
  CHECK: "เช็ค",
  TRANSFER: "โอนผ่านธนาคาร",
};

/** "ป้าย : ค่า" แบบใน Figma (ป้ายสีจาง ค่าตัวหนา) */
function InfoRow({ label, children, bold = true }: { label: string; children: ReactNode; bold?: boolean }) {
  return (
    <p className="min-w-0 break-words text-text">
      <span className="text-text-muted">{label} : </span>
      <span className={bold ? "font-bold" : undefined}>{children}</span>
    </p>
  );
}

function FileChip({ name }: { name?: string }) {
  if (!name) return <span className="text-caption text-text-muted">ไม่มีไฟล์แนบ</span>;
  return (
    <span className="inline-flex max-w-[200px] items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-badge text-primary">
      <FileText className="size-3.5 shrink-0" aria-hidden />
      <span className="truncate">{name}</span>
    </span>
  );
}

export function RequestDetail({
  request,
  actions,
  children,
}: {
  request: ReimburseRequest;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const projects = useProjects();
  const project = projects.find((p) => p.id === request.projectId);
  const requester = getUserById(request.requesterId);
  const lastSendBack = [...request.history].reverse().find((e) => e.action === "SEND_BACK");
  const sendBackBy = lastSendBack ? getUserById(lastSendBack.byUserId) : undefined;
  const payment = request.paymentInfo;

  return (
    <div className="space-y-6">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card>
          <div className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
            <InfoRow label="รหัสคำขอ">{request.id}</InfoRow>
            <InfoRow label="วันที่ยื่น">{formatThaiDate(request.createdAt)}</InfoRow>
            <InfoRow label="ผู้ยื่นขอเบิก">{requester?.name ?? request.requesterId}</InfoRow>
            <InfoRow label="แผนก">{requester?.department ?? "-"}</InfoRow>
            <InfoRow label="ประเภทแบบฟอร์ม">{REQUEST_TYPE_LABEL[request.type]}</InfoRow>
            <InfoRow label="ช่วงระยะเวลาดำเนินการ" bold={false}>
              {request.startDate} ถึง {request.endDate}
            </InfoRow>
            <InfoRow label="ชื่อโครงการ">{project?.name ?? request.projectId}</InfoRow>
            <InfoRow label="หมวดหมู่">{getCategoryName(project, request.categoryId)}</InfoRow>
            {request.advanceRefId && <InfoRow label="อ้างอิงคำขอเบิก">{request.advanceRefId}</InfoRow>}
          </div>
          <p className="mb-3 mt-6 font-bold text-text">รายละเอียด/วัตถุประสงค์ :</p>
          <InfoBox className="min-h-[88px] whitespace-pre-wrap text-caption">{request.purpose || "-"}</InfoBox>
        </Card>

        <ApprovalTimeline request={request} />
      </div>

      {request.status === "SENT_BACK" && (
        <div role="alert" className="rounded-md border-[1.5px] border-danger/30 bg-danger/5 px-5 py-4">
          <p className="text-caption font-bold text-danger">
            หมายเหตุการส่งกลับแก้ไข
            {sendBackBy && ` · โดย ${sendBackBy.name} (${ROLE_LABEL[sendBackBy.role]})`}
            {lastSendBack && ` · ${formatThaiDate(lastSendBack.at)}`}
          </p>
          <p className="mt-1 text-caption text-text">{request.sentBackNote ?? lastSendBack?.note ?? "-"}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-primary px-8 py-7 text-text-inverse">
        <span className="text-section font-bold">{request.type === "CLEARANCE" ? "ยอดเงินขอคืน" : "ยอดเงินขอเบิก"}</span>
        <span className="text-[28px] font-bold leading-tight">{formatBaht(request.totalAmount)}</span>
      </div>

      <Card>
        <p className="mb-2 text-caption font-bold text-text">ข้อมูลเอกสารแนบ</p>
        <Table>
          <THead>
            <TR>
              <TH>รายการ</TH>
              <TH>วันที่</TH>
              <TH>จำนวนเงิน</TH>
              <TH>เอกสารแนบ</TH>
            </TR>
          </THead>
          <TBody>
            {request.items.length === 0 && <TableEmpty colSpan={4}>ไม่มีรายการ</TableEmpty>}
            {request.items.map((item) => (
              <TR key={item.id}>
                <TD>{item.name}</TD>
                <TD className="whitespace-nowrap">{formatThaiDate(item.date)}</TD>
                <TD className="whitespace-nowrap">{formatNumber(item.amount)}</TD>
                <TD>
                  <FileChip name={item.fileName} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      {payment && (
        <Card>
          <p className="mb-2 text-caption font-bold text-text">ข้อมูลการทำจ่าย</p>
          <Table>
            <THead>
              <TR>
                <TH>วิธีการจ่าย</TH>
                <TH>วันที่</TH>
                <TH>จำนวนเงิน</TH>
                <TH>เอกสารแนบ</TH>
              </TR>
            </THead>
            <TBody>
              <TR>
                <TD>
                  {PAYMENT_METHOD_LABEL[payment.method]}
                  {payment.refNumber && <p className="text-badge text-text-muted">เลขอ้างอิง {payment.refNumber}</p>}
                </TD>
                <TD className="whitespace-nowrap">{formatThaiDate(payment.date)}</TD>
                <TD className="whitespace-nowrap">{formatNumber(payment.amount)}</TD>
                <TD>
                  <FileChip name={payment.fileName} />
                </TD>
              </TR>
            </TBody>
          </Table>
        </Card>
      )}

      {children}

      {actions && <div className="flex flex-wrap justify-end gap-4">{actions}</div>}
    </div>
  );
}
