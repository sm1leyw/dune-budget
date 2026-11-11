/**
 * /projects/adjustments — เจ้าของ: คนที่ 5
 * หน้าชั่วคราว: สิ่งที่ต้องทำเขียนไว้ใน config/routes.ts (แสดงบนหน้าจอด้วย)
 * เริ่มทำ: ใส่ "use client" บรรทัดแรก (ถ้าใช้ hook/useState) ลบ <PagePlaceholder /> แล้วเขียนหน้าจริงแทน
 */
"use client";

import { useMemo } from "react";
import { FileText } from "lucide-react";
import { formatNumber, formatThaiDate } from "@/lib/format";
import { getCategoryName, useAdjustments, useProjects } from "@/store/projects";
import { getUserById } from "@/store/session";

export default function ProjectsAdjustmentsPage() {
  const projects = useProjects();
  const adjustments = useAdjustments();

  // เรียงประวัติการเปลี่ยนงบล่าสุดก่อน
  const history = useMemo(() => {
    return [...adjustments].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [adjustments]);

  return (
    <div className="min-h-full pb-12">
      {/* พื้นที่เนื้อหาหลัก: ไม่แสดง breadcrumb หรือหัวข้อซ้ำกับเมนูด้านบน */}
      <section className="rounded-2xl bg-gradient-to-br from-[#E2F1EA] via-[#D9ECE5] to-[#D2E5DF] p-7 min-h-[580px]">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-bold text-[#007F5F]">ประวัติการปรับงบประมาณและการเพิ่มโครงการ</h1>
            <p className="mt-1 text-[12px] text-gray-500">
              ตรวจสอบรายการเพิ่มและลดงบประมาณของโครงการอย่างเป็นปัจจุบัน
            </p>
          </div>
          <span className="rounded-full bg-white/70 px-3 py-1 text-[11px] text-gray-500 shadow-sm">
            {history.length} รายการ
          </span>
        </div>

        {/* การ์ดตารางขาวตามภาพ */}
        <div className="rounded-xl bg-white px-4 py-3 shadow-sm min-h-[450px]">
          <div className="max-h-[420px] overflow-y-auto pr-2">
            <table className="w-full min-w-[860px] border-collapse text-left text-[11px]">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="px-1 py-3 font-normal">วันที่ / เวลา</th>
                  <th className="px-2 py-3 font-normal">รหัสอ้างอิง</th>
                  <th className="px-2 py-3 font-normal">ชื่อโครงการ</th>
                  <th className="px-2 py-3 font-normal">ประเภทรายการ</th>
                  <th className="px-2 py-3 font-normal">หมวดหมู่ที่ปรับ</th>
                  <th className="px-2 py-3 text-right font-normal">จำนวนเงิน</th>
                  <th className="px-2 py-3 font-normal">ผู้ดำเนินการ</th>
                  <th className="px-2 py-3 text-center font-normal">เอกสารอนุมัติแนบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-gray-400">
                      ยังไม่มีประวัติการปรับงบประมาณหรือเพิ่มโครงการ
                    </td>
                  </tr>
                ) : (
                  history.map((adjustment) => {
                    const project = projects.find((item) => item.id === adjustment.projectId);
                    const editor = getUserById(adjustment.byUserId);
                    const isProjectCreated = adjustment.id.startsWith("CREATE-");
                    const isIncrease = adjustment.amount > 0;

                    return (
                      <tr key={adjustment.id} className="hover:bg-[#F7FBF9]">
                        <td className="whitespace-nowrap px-1 py-3 text-gray-600">
                          {formatThaiDate(adjustment.at)} {new Date(adjustment.at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="whitespace-nowrap px-2 py-3 text-gray-600">{project?.id ?? adjustment.projectId}</td>
                        <td className="max-w-[170px] truncate px-2 py-3 text-gray-700">{project?.name ?? "-"}</td>
                        <td className="px-2 py-3">
                          <span
                            className={`inline-flex rounded-full border px-3 py-0.5 text-[10px] font-medium ${
                              isProjectCreated
                                ? "border-sky-300 bg-sky-50 text-sky-600"
                                : isIncrease
                                  ? "border-[#39C99A] bg-[#E4F8F0] text-[#007F5F]"
                                  : "border-red-300 bg-red-50 text-red-500"
                            }`}
                          >
                            {isProjectCreated ? "เพิ่มโครงการ" : isIncrease ? "ปรับเพิ่มงบ (+)" : "ปรับลดงบ (-)"}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-gray-600">
                          {isProjectCreated ? "-" : getCategoryName(project, adjustment.categoryId)}
                        </td>
                        <td className="whitespace-nowrap px-2 py-3 text-right text-gray-700">
                          {isProjectCreated ? formatNumber(project?.categories.reduce((sum, cat) => sum + cat.allocated, 0) ?? 0) : formatNumber(Math.abs(adjustment.amount))}
                        </td>
                        <td className="whitespace-nowrap px-2 py-3 text-gray-600">
                          {editor?.name ?? adjustment.byUserId}
                        </td>
                        <td className="px-2 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => alert(isProjectCreated ? "เอกสารจัดตั้งโครงการเป็นข้อมูลจำลองสำหรับรายการนี้" : "เอกสารอนุมัติเป็นข้อมูลจำลองสำหรับรายการนี้")}
                            className="inline-flex items-center gap-1 rounded border border-[#B7E5D6] bg-[#F1FBF7] px-2 py-0.5 text-[10px] text-[#007F5F] hover:bg-[#E2F5ED]"
                          >
                            <FileText className="size-3" /> {isProjectCreated ? "เอกสารโครงการ" : "เอกสารอนุมัติ"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}


