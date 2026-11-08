"use client";
/**
 * /reports — รายงานงบประมาณองค์กร (เจ้าของ: คนที่ 3) · เข้าได้: บัญชี, ผู้บริหาร
 * ตาม Figma "ฝ่ายบัญชี → หน้ารายงานเเละวิเคราะห์"
 * -----------------------------------------------------------------------------
 * ตารางแจกแจงงบประมาณแยกตามแผนก: จำนวนโครงการ · งบจัดสรรรวม · ยอดใช้จริง · ยอดจองรอเบิก · งบคงเหลือสุทธิ
 * งบของแผนก = ผลรวมของโครงการที่มีแผนกนั้นใน project.departments (คำนวณด้วย lib/budget ของคนที่ 5)
 * ปุ่ม "ตรวจสอบ" → /reports/[dept]
 */
import { useMemo } from "react";
import { ButtonLink, Card, Table, TableEmpty, TBody, TD, TH, THead, TR } from "@/components/ui";
import { PATHS } from "@/config/routes";
import { getProjectBudget } from "@/lib/budget";
import { cn } from "@/lib/cn";
import { useAdjustments, useProjects } from "@/store/projects";
import { useRequests } from "@/store/requests";
import { formatMoney, getDepartmentProjects, getReportDepartments, sumBudgets } from "./_components/report-utils";

export default function ReportsPage() {
  const projects = useProjects();
  const requests = useRequests();
  const adjustments = useAdjustments();

  const rows = useMemo(
    () =>
      getReportDepartments(projects).map((department) => {
        const list = getDepartmentProjects(projects, department);
        return {
          department,
          projectCount: list.length,
          budget: sumBudgets(list.map((p) => getProjectBudget(p, requests, adjustments))),
        };
      }),
    [projects, requests, adjustments],
  );

  return (
    <Card title="ตารางแจกแจงงบประมาณละเอียดแยกตามแผนก">
      <Table>
        <THead>
          <TR>
            <TH>แผนก / ส่วนงาน</TH>
            <TH>จำนวนโครงการ</TH>
            <TH align="right">งบประมาณจัดสรรรวม (Sum)</TH>
            <TH align="right">ยอดใช้จริง</TH>
            <TH align="right">ยอดจองรอเบิก</TH>
            <TH align="right">งบคงเหลือสุทธิ</TH>
            <TH align="right">
              <span className="sr-only">การดำเนินการ</span>
            </TH>
          </TR>
        </THead>
        <TBody>
          {rows.length === 0 && <TableEmpty colSpan={7}>ยังไม่มีข้อมูลแผนก</TableEmpty>}
          {rows.map(({ department, projectCount, budget }) => (
            <TR key={department}>
              <TD className="font-bold">{department}</TD>
              <TD className="whitespace-nowrap">{projectCount} โครงการ</TD>
              <TD align="right" className="whitespace-nowrap font-bold">{formatMoney(budget.allocated)}</TD>
              <TD align="right" className="whitespace-nowrap text-text-muted">{formatMoney(budget.used)}</TD>
              <TD align="right" className="whitespace-nowrap font-bold">{formatMoney(budget.reserved)}</TD>
              <TD align="right" className={cn("whitespace-nowrap font-bold", budget.remaining < 0 ? "text-danger" : "text-primary")}>
                {formatMoney(budget.remaining)}
              </TD>
              <TD align="right">
                <ButtonLink href={PATHS.reportDepartment(department)} size="S">
                  ตรวจสอบ
                </ButtonLink>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}
