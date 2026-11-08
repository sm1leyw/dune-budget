"use client";
/**
 * /reports/[dept] — รายละเอียดโครงการแผนก (เจ้าของ: คนที่ 3) · เข้าได้: บัญชี, ผู้บริหาร
 * ตาม Figma "ฝ่ายบัญชี → หน้ารายงานเเละวิเคราะห์ → รายละเอียดโครงการเเผนก"
 * -----------------------------------------------------------------------------
 * - [dept] = ชื่อแผนกแบบ encodeURIComponent (สร้างลิงก์ด้วย PATHS.reportDepartment(ชื่อแผนก))
 * - ตารางโครงการของแผนก: ผู้รับผิดชอบ · งบรวม · จ่ายจริง · ยอดจองรอจ่าย · คงเหลือ · สถานะโครงการ
 * - ปุ่ม "รายละเอียด" → /projects/[id] (หน้าของคนที่ 5)
 */
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ButtonLink, Card, EmptyState, Table, TableEmpty, TBody, TD, TH, THead, TR } from "@/components/ui";
import { PATHS } from "@/config/routes";
import { ROLE_LABEL } from "@/constants/roles";
import { getProjectBudget } from "@/lib/budget";
import { formatNumber } from "@/lib/format";
import { useAdjustments, useProjects } from "@/store/projects";
import { useRequests } from "@/store/requests";
import { getUserById } from "@/store/session";
import { getDepartmentProjects, getReportDepartments } from "../_components/report-utils";

function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

const baht = (n: number) => `${formatNumber(n)} ฿`;

export default function DepartmentReportPage() {
  const { dept } = useParams<{ dept: string }>();
  const department = decodeParam(dept);
  const projects = useProjects();
  const requests = useRequests();
  const adjustments = useAdjustments();

  const rows = useMemo(
    () => getDepartmentProjects(projects, department).map((p) => ({ project: p, budget: getProjectBudget(p, requests, adjustments) })),
    [projects, requests, adjustments, department],
  );

  const backButton = (
    <ButtonLink href={PATHS.reports} variant="secondary" icon={<ArrowLeft />}>
      กลับรายงาน
    </ButtonLink>
  );

  if (!getReportDepartments(projects).includes(department)) {
    return (
      <Card>
        <EmptyState title="ไม่พบแผนกนี้" description={`ไม่มีข้อมูลของแผนก "${department}"`} action={backButton} />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>{backButton}</div>

      <h2 className="text-section font-bold text-primary">
        งบประมาณของ{/^(ฝ่าย|ส่วน|แผนก)/.test(department) ? "" : "แผนก"}
        {department}
      </h2>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>โครงการ</TH>
              <TH>ผู้รับผิดชอบ</TH>
              <TH>งบรวม</TH>
              <TH>จ่ายจริง</TH>
              <TH>ยอดจองรอจ่าย</TH>
              <TH>คงเหลือ</TH>
              <TH>สถานะโครงการ</TH>
              <TH align="right">
                <span className="sr-only">การดำเนินการ</span>
              </TH>
            </TR>
          </THead>
          <TBody>
            {rows.length === 0 && <TableEmpty colSpan={8}>แผนกนี้ยังไม่มีโครงการ</TableEmpty>}
            {rows.map(({ project, budget }) => {
              const owner = getUserById(project.ownerId);
              return (
                <TR key={project.id}>
                  <TD>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-caption text-text-muted">{project.id}</p>
                  </TD>
                  <TD>
                    <p className="font-medium">{owner?.name ?? project.ownerId}</p>
                    {owner && (
                      <p className="text-badge text-text-muted">
                        • {ROLE_LABEL[owner.role]} {owner.department}
                      </p>
                    )}
                  </TD>
                  <TD className="whitespace-nowrap">{baht(budget.allocated)}</TD>
                  <TD className="whitespace-nowrap">{baht(budget.used)}</TD>
                  <TD className="whitespace-nowrap">{baht(budget.reserved)}</TD>
                  <TD className={budget.remaining < 0 ? "whitespace-nowrap text-danger" : "whitespace-nowrap"}>{baht(budget.remaining)}</TD>
                  <TD className="whitespace-nowrap text-text-muted">{project.status === "COMPLETED" ? "เสร็จสิ้นแล้ว" : "กำลังดำเนินการ"}</TD>
                  <TD align="right">
                    <ButtonLink href={PATHS.projectDetail(project.id)} variant="secondary" size="S">
                      รายละเอียด
                    </ButtonLink>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
