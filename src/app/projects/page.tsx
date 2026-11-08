/**
 * /projects — เจ้าของ: คนที่ 5
 * หน้าชั่วคราว: สิ่งที่ต้องทำเขียนไว้ใน config/routes.ts (แสดงบนหน้าจอด้วย)
 * เริ่มทำ: ใส่ "use client" บรรทัดแรก (ถ้าใช้ hook/useState) ลบ <PagePlaceholder /> แล้วเขียนหน้าจริงแทน
 */
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PATHS } from "@/config/routes";
import { getProjectBudget } from "@/lib/budget";
import { formatNumber, formatThaiDateLong } from "@/lib/format";
import { useAdjustments, useProjects } from "@/store/projects";
import { useRequests } from "@/store/requests";
import { useCurrentUser } from "@/store/session";

export default function ProjectsPage() {
  const user = useCurrentUser();
  const projects = useProjects();
  const requests = useRequests();
  const adjustments = useAdjustments();

  // คำนวณสรุปงบ 4 การ์ดบน
  const summary = useMemo(() => {
    return projects.reduce(
      (acc, project) => {
        const b = getProjectBudget(project, requests, adjustments);
        return {
          allocated: acc.allocated + b.allocated,
          used: acc.used + b.used,
          reserved: acc.reserved + b.reserved,
          remaining: acc.remaining + b.remaining,
        };
      },
      { allocated: 0, used: 0, reserved: 0, remaining: 0 },
    );
  }, [projects, requests, adjustments]);

  const isAccountant = user?.role === "ACCOUNTANT";

  return (
    <div className="min-h-full space-y-6">
      {/* 1. ส่วนหัว: ชื่อหน้า + ปุ่มเพิ่มโครงการ (#007F5F) */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-gray-900 leading-tight">รายการโครงการทั้งหมด</h1>
          <p className="mt-1 text-[13px] text-gray-500">สรุปภาพรวมงบประมาณ</p>
        </div>
        {isAccountant && (
          <Link
            href={PATHS.newProject}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#007F5F] px-4 text-[13px] font-medium text-white transition hover:bg-[#006a4f]"
          >
            <Plus className="size-4 stroke-[2.5]" />
            เพิ่มโครงการ
          </Link>
        )}
      </div>

      {/* 2. 4 Stat Cards สรุปงบ ตัวเลขสีเขียว #007F5F */}
      <div className="grid grid-cols-4 gap-4">
        {/* งบประมาณที่จัดสรรทั้งหมด */}
        <div className="rounded-xl bg-[#D7ECE4] px-5 py-6">
          <p className="text-[12px] font-medium text-gray-600">งบประมาณที่จัดสรรทั้งหมด</p>
          <p className="mt-3 text-[26px] font-bold tracking-tight text-[#007F5F]">
            {formatNumber(summary.allocated)}{" "}
            <span className="text-[20px] font-bold">บาท</span>
          </p>
        </div>

        {/* ยอดที่ใช้ไปแล้ว */}
        <div className="rounded-xl bg-[#D7ECE4] px-5 py-6">
          <p className="text-[12px] font-medium text-gray-600">ยอดที่ใช้ไปแล้ว</p>
          <p className="mt-3 text-[26px] font-bold tracking-tight text-[#007F5F]">
            {formatNumber(summary.used)}{" "}
            <span className="text-[20px] font-bold">บาท</span>
          </p>
        </div>

        {/* ยอดจองรอเบิก (รออนุมัติ) */}
        <div className="rounded-xl bg-[#D7ECE4] px-5 py-6">
          <p className="text-[12px] font-medium text-gray-600">ยอดจองรอเบิก (รออนุมัติ)</p>
          <p className="mt-3 text-[26px] font-bold tracking-tight text-[#007F5F]">
            {formatNumber(summary.reserved)}{" "}
            <span className="text-[20px] font-bold">บาท</span>
          </p>
        </div>

        {/* งบประมาณคงเหลือ */}
        <div className="rounded-xl bg-[#D7ECE4] px-5 py-6">
          <p className="text-[12px] font-medium text-gray-600">งบประมาณคงเหลือ</p>
          <p className="mt-3 text-[26px] font-bold tracking-tight text-[#007F5F]">
            {formatNumber(summary.remaining)}{" "}
            <span className="text-[20px] font-bold">บาท</span>
          </p>
        </div>
      </div>

      {/* 3. ตารางโครงการ */}
      <div className="rounded-2xl border border-gray-100 bg-white px-8 py-6 shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200/70 text-[12px] text-gray-600">
              <th className="pb-4 font-normal">รหัส / ชื่อโครงการ</th>
              <th className="pb-4 font-normal">แผนกที่รับผิดชอบ / ร่วมมือ (Co)</th>
              <th className="pb-4 font-normal">ช่วงเวลาดำเนินโครงการ</th>
              <th className="pb-4 text-center font-normal">ใช้ไปแล้ว</th>
              <th className="pb-4 text-center font-normal">ยอดจองรอจ่าย</th>
              <th className="pb-4 text-center font-normal">คงเหลือ</th>
              <th className="pb-4 text-center font-normal">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[13px] text-gray-400">
                  ไม่มีโครงการ
                </td>
              </tr>
            ) : (
              projects.map((project) => {
                const budget = getProjectBudget(project, requests, adjustments);

                return (
                  <tr key={project.id} className="hover:bg-gray-50/40">
                    {/* รหัส / ชื่อโครงการ */}
                    <td className="py-5 pr-4 align-middle">
                      <p className="text-[13px] font-bold text-gray-900">{project.name}</p>
                      <p className="mt-0.5 text-[11px] text-gray-400 tracking-wider">{project.id}</p>
                    </td>

                    {/* แผนกที่รับผิดชอบ / ร่วมมือ (Co) */}
                    <td className="py-5 pr-4 align-middle">
                      <div className="flex flex-wrap items-center gap-1.5 max-w-[240px]">
                        {project.departments.map((dept, index) => (
                          <DepartmentBadge key={dept} name={dept} index={index} />
                        ))}
                      </div>
                    </td>

                    {/* ช่วงเวลาดำเนินโครงการ */}
                    <td className="py-5 pr-4 whitespace-nowrap align-middle text-[12px] text-gray-600">
                      {formatThaiDateLong(project.startDate)} ถึง {formatThaiDateLong(project.endDate)}
                    </td>

                    {/* ใช้ไปแล้ว */}
                    <td className="py-5 px-3 whitespace-nowrap text-center align-middle text-[12px] text-gray-600">
                      {formatNumber(budget.used)} ฿
                    </td>

                    {/* ยอดจองรอจ่าย */}
                    <td className="py-5 px-3 whitespace-nowrap text-center align-middle text-[12px] text-gray-600">
                      {formatNumber(budget.reserved)} ฿
                    </td>

                    {/* คงเหลือ */}
                    <td className="py-5 px-3 whitespace-nowrap text-center align-middle text-[12px] text-gray-700">
                      {formatNumber(budget.remaining)} ฿
                    </td>

                    {/* จัดการ: รายละเอียด (#007F5F) / ปรับงบโครงการ (#007F5F) */}
                    <td className="py-5 pl-4 text-center align-middle whitespace-nowrap">
                      <div className="inline-flex flex-col gap-1.5 w-[96px]">
                        <Link
                          href={PATHS.projectDetail(project.id)}
                          className="flex h-7 items-center justify-center rounded border border-[#007F5F] bg-white text-[11px] font-medium text-[#007F5F] transition hover:bg-[#007F5F]/5"
                        >
                          รายละเอียด
                        </Link>
                        {isAccountant && (
                          <Link
                            href={PATHS.adjustProject(project.id)}
                            className="flex h-7 items-center justify-center rounded bg-[#007F5F] text-[11px] font-medium text-white transition hover:bg-[#006a4f]"
                          >
                            ปรับงบโครงการ
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** ป้ายแผนก แคปซูลมน */
function DepartmentBadge({ name, index }: { name: string; index: number }) {
  const STYLES = [
    "bg-[#BAE6FD] text-[#0284C7]", // ฟ้า
    "bg-[#A7F3D0] text-[#059669]", // เขียวมิ้นต์
    "bg-[#FEF08A] text-[#CA8A04]", // เหลือง
    "bg-[#FBCFE8] text-[#DB2777]", // ชมพู
  ];

  const styleClass = STYLES[index % STYLES.length];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium leading-none ${styleClass}`}
    >
      {name}
    </span>
  );
}
