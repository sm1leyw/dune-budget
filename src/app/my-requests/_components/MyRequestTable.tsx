"use client";
/**
 * app/my-requests/_components/MyRequestTable.tsx — ตารางคำขอของฉัน ตาม Figma (ใช้เฉพาะหน้านี้ · คนที่ 3)
 * คอลัมน์: เลขที่คำขอ · โครงการ (+หมวดหมู่) · วันที่ยื่น · จำนวนเงิน (ชิดขวา) · สถานะ · ปุ่ม "ตรวจสอบ"
 */
import { ButtonLink, StatusBadge, Table, TableEmpty, TBody, TD, TH, THead, TR } from "@/components/ui";
import { PATHS } from "@/config/routes";
import { RequestAmount } from "@/components/requests/RequestAmount";
import { formatThaiDate } from "@/lib/format";
import { getCategoryName, useProjects } from "@/store/projects";
import type { ReimburseRequest } from "@/types";

export function MyRequestTable({ requests, emptyText }: { requests: ReimburseRequest[]; emptyText: string }) {
  const projects = useProjects();

  return (
    <Table>
      <THead>
        <TR>
          <TH>เลขที่คำขอ</TH>
          <TH>โครงการ / หมวดหมู่</TH>
          <TH>วันที่ยื่น</TH>
          <TH align="right">จำนวนเงิน (บาท)</TH>
          <TH align="center">สถานะ</TH>
          <TH align="right">
            <span className="sr-only">การดำเนินการ</span>
          </TH>
        </TR>
      </THead>
      <TBody>
        {requests.length === 0 && <TableEmpty colSpan={6}>{emptyText}</TableEmpty>}
        {requests.map((r) => {
          const project = projects.find((p) => p.id === r.projectId);
          return (
            <TR key={r.id}>
              <TD className="whitespace-nowrap font-medium">{r.id}</TD>
              <TD className="max-w-[300px]">
                <p className="truncate">{project?.name ?? r.projectId}</p>
                <p className="truncate text-caption text-text-muted">{getCategoryName(project, r.categoryId)}</p>
              </TD>
              <TD className="whitespace-nowrap">{formatThaiDate(r.createdAt)}</TD>
              <TD align="right" className="whitespace-nowrap font-medium">
                <RequestAmount request={r} />
              </TD>
              <TD align="center">
                <StatusBadge status={r.status} />
              </TD>
              <TD align="right">
                <ButtonLink href={PATHS.requestDetail(r.id)} size="S">
                  ตรวจสอบ
                </ButtonLink>
              </TD>
            </TR>
          );
        })}
      </TBody>
    </Table>
  );
}
