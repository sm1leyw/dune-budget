"use client";
/**
 * app/my-requests/_components/MyRequestTable.tsx — ตารางคำขอของฉัน ตาม Figma (ใช้เฉพาะหน้านี้ · คนที่ 3)
 * คอลัมน์: โครงการ (+รหัส) · หมวดหมู่ · ชื่อผู้ขอเบิก · วันที่ · จำนวนเงิน · สถานะ · ปุ่ม "ตรวจสอบ"
 */
import { ButtonLink, StatusBadge, Table, TableEmpty, TBody, TD, TH, THead, TR } from "@/components/ui";
import { PATHS } from "@/config/routes";
import { formatNumber, formatThaiDate } from "@/lib/format";
import { getCategoryName, useProjects } from "@/store/projects";
import { getUserById } from "@/store/session";
import type { ReimburseRequest } from "@/types";

export function MyRequestTable({ requests, emptyText }: { requests: ReimburseRequest[]; emptyText: string }) {
  const projects = useProjects();

  return (
    <Table>
      <THead>
        <TR>
          <TH>โครงการ</TH>
          <TH>หมวดหมู่</TH>
          <TH>ชื่อผู้ขอเบิก</TH>
          <TH>วันที่</TH>
          <TH>จำนวนเงิน</TH>
          <TH>สถานะ</TH>
          <TH align="right">
            <span className="sr-only">การดำเนินการ</span>
          </TH>
        </TR>
      </THead>
      <TBody>
        {requests.length === 0 && <TableEmpty colSpan={7}>{emptyText}</TableEmpty>}
        {requests.map((r) => {
          const project = projects.find((p) => p.id === r.projectId);
          return (
            <TR key={r.id}>
              <TD>
                <p>{project?.name ?? r.projectId}</p>
                <p className="text-badge text-text-muted">{r.projectId}</p>
              </TD>
              <TD>{getCategoryName(project, r.categoryId)}</TD>
              <TD>{getUserById(r.requesterId)?.name ?? r.requesterId}</TD>
              <TD className="whitespace-nowrap font-medium">{formatThaiDate(r.createdAt)}</TD>
              <TD className="whitespace-nowrap font-medium">{formatNumber(r.totalAmount)}</TD>
              <TD>
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
