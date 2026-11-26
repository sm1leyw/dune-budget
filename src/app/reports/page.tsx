"use client";
/**
 * /reports — รายงานงบประมาณองค์กร (เจ้าของ: คนที่ 3) · เข้าได้: บัญชี, ผู้บริหาร
 * ตาม Figma "Role: ฝ่ายบัญชี -> หน้ารายงานเเละวิเคราะห์" (node 620:1281)
 * -----------------------------------------------------------------------------
 * ตารางแจกแจงงบประมาณแยกตามแผนก: จำนวนโครงการ · งบจัดสรรรวม · ยอดใช้จริง · ยอดจองรอเบิก · งบคงเหลือสุทธิ
 * งบของแผนก = ผลรวมของโครงการที่มีแผนกนั้นใน project.departments (คำนวณด้วย lib/budget ของคนที่ 5)
 * ปุ่ม "ตรวจสอบ" → /reports/[dept]
 *
 * สไตล์ตาม Figma: หัวตารางพื้นเทา #EAEBEB มุมโค้ง ตัวอักษรเขียว 15px · แถวสูง ~102px ตัวอักษร 14px
 * งบคงเหลือสุทธิสีเขียว #10B981 (ติดลบ = สีแดง)
 */
import { useMemo } from "react";
import { ButtonLink, Card, Table, TableEmpty, TBody, TD, TH, THead, TR } from "@/components/ui";
import { PATHS } from "@/config/routes";
import { getProjectBudget } from "@/lib/budget";
import { cn } from "@/lib/cn";
import { useAdjustments, useProjects } from "@/store/projects";
import { useRequests } from "@/store/requests";
import { formatMoney, getDepartmentProjects, getReportDepartments, sumBudgets } from "./_components/report-utils";

/** หัวตาราง: พื้นเทา มุมโค้งที่ช่องแรก/ช่องสุดท้าย */
const HEAD = "border-b-0 bg-[#EAEBEB] px-[18px] py-[27px] text-body font-medium text-primary first:rounded-l-lg last:rounded-r-lg";
/** ช่องในแถว: สูงตาม Figma ตัวอักษร 14px */
const CELL = "px-[18px] py-8 text-[14px] text-text";

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
          <tr>
            <TH className={HEAD}>แผนก / ส่วนงาน</TH>
            <TH className={HEAD}>จำนวนโครงการ</TH>
            <TH align="right" className={HEAD}>งบประมาณจัดสรรรวม (Sum)</TH>
            <TH align="right" className={HEAD}>ยอดใช้จริง</TH>
            <TH align="right" className={HEAD}>ยอดจองรอเบิก</TH>
            <TH align="right" className={HEAD}>งบคงเหลือสุทธิ</TH>
            <TH align="right" className={HEAD}>
              <span className="sr-only">การดำเนินการ</span>
            </TH>
          </tr>
        </THead>
        <TBody>
          {rows.length === 0 && <TableEmpty colSpan={7}>ยังไม่มีข้อมูลแผนก</TableEmpty>}
          {rows.map(({ department, projectCount, budget }) => (
            <TR key={department} className="border-[#DCDCE0]">
              <TD className={cn(CELL, "font-bold")}>{department}</TD>
              <TD className={cn(CELL, "whitespace-nowrap")}>{projectCount} โครงการ</TD>
              <TD align="right" className={cn(CELL, "whitespace-nowrap font-bold")}>{formatMoney(budget.allocated)}</TD>
              <TD align="right" className={cn(CELL, "whitespace-nowrap")}>{formatMoney(budget.used)}</TD>
              <TD align="right" className={cn(CELL, "whitespace-nowrap font-bold")}>{formatMoney(budget.reserved)}</TD>
              <TD align="right" className={cn(CELL, "whitespace-nowrap font-bold", budget.remaining < 0 ? "text-danger" : "text-[#10B981]")}>
                {formatMoney(budget.remaining)}
              </TD>
              <TD align="right" className={CELL}>
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
