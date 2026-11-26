"use client";
/**
 * /projects/adjustments — ประวัติการปรับงบ / เพิ่มโครงการ / เสร็จสิ้นโครงการ · เจ้าของ: คนที่ 5 · เข้าได้: บัญชี
 * -----------------------------------------------------------------------------
 * ตารางจาก useAdjustments(): วันที่ · โครงการ · ประเภท · หมวด · จำนวน (+/-) · เหตุผล · ผู้ทำ
 * <FilterBar>: ค้นหา (โครงการ/เหตุผล/ผู้ทำ) · กรองโครงการ · กรองประเภท · ช่วงวันที่
 * ประเภท (getEventKind): เพิ่มโครงการ · ปรับเพิ่ม/ลดงบ · เสร็จสิ้นโครงการ · เปิดโครงการอีกครั้ง
 */
import { useMemo, useState } from "react";
import { AttachmentChip, FilterBar } from "@/components/ui";
import { getProjectAttachments } from "@/lib/files";
import { getEventKind } from "@/lib/projectClosure";
import { formatNumber, formatThaiDate } from "@/lib/format";
import { getCategoryName, useAdjustments, useProjects } from "@/store/projects";
import { getUserById } from "@/store/session";

const KIND_OPTIONS = [
  { value: "CREATE", label: "เพิ่มโครงการ" },
  { value: "ADJUST", label: "ปรับงบ (+/-)" },
  { value: "COMPLETE", label: "เสร็จสิ้นโครงการ" },
  { value: "REOPEN", label: "เปิดโครงการอีกครั้ง" },
];

export default function ProjectsAdjustmentsPage() {
  const projects = useProjects();
  const adjustments = useAdjustments();

  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState("");
  const [kind, setKind] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // กรองตามตัวกรอง แล้วเรียงประวัติการเปลี่ยนงบล่าสุดก่อน
  const history = useMemo(() => {
    const q = search.trim().toLowerCase();
    return adjustments
      .filter((a) => !projectId || a.projectId === projectId)
      .filter((a) => !kind || getEventKind(a) === kind)
      .filter((a) => {
        const day = a.at.slice(0, 10);
        return (!dateFrom || day >= dateFrom) && (!dateTo || day <= dateTo);
      })
      .filter((a) => {
        if (!q) return true;
        const projectName = projects.find((p) => p.id === a.projectId)?.name ?? "";
        const editorName = getUserById(a.byUserId)?.name ?? "";
        return [a.projectId, projectName, a.reason, editorName].some((text) => text.toLowerCase().includes(q));
      })
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [adjustments, projects, search, projectId, kind, dateFrom, dateTo]);

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

        <div className="mb-5">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="ค้นหาโครงการ เหตุผล หรือผู้ดำเนินการ"
            filters={[
              {
                key: "project",
                label: "โครงการ",
                value: projectId,
                onChange: setProjectId,
                options: projects.map((p) => ({ value: p.id, label: p.name })),
              },
              { key: "kind", label: "ประเภท", value: kind, onChange: setKind, options: KIND_OPTIONS },
            ]}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateChange={(from, to) => {
              setDateFrom(from);
              setDateTo(to);
            }}
            onClear={() => {
              setSearch("");
              setProjectId("");
              setKind("");
              setDateFrom("");
              setDateTo("");
            }}
          />
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
                  <th className="px-2 py-3 font-normal">เหตุผล</th>
                  <th className="px-2 py-3 font-normal">ผู้ดำเนินการ</th>
                  <th className="px-2 py-3 text-center font-normal">เอกสารอนุมัติแนบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-gray-400">
                      {adjustments.length === 0 ? "ยังไม่มีประวัติการปรับงบประมาณหรือเพิ่มโครงการ" : "ไม่พบรายการที่ตรงกับตัวกรอง"}
                    </td>
                  </tr>
                ) : (
                  history.map((adjustment) => {
                    const project = projects.find((item) => item.id === adjustment.projectId);
                    const editor = getUserById(adjustment.byUserId);
                    const eventKind = getEventKind(adjustment);
                    const isProjectCreated = eventKind === "CREATE";
                    const isClosureEvent = eventKind === "COMPLETE" || eventKind === "REOPEN";
                    const isIncrease = adjustment.amount > 0;
                    // เพิ่มโครงการ → เอกสารจัดตั้งของโครงการ · ปรับงบ → เอกสารที่แนบตอนปรับ
                    const docs = isProjectCreated ? getProjectAttachments(project) : (adjustment.attachments ?? []);

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
                                : eventKind === "COMPLETE"
                                  ? "border-gray-400 bg-gray-100 text-gray-700"
                                  : eventKind === "REOPEN"
                                    ? "border-amber-300 bg-amber-50 text-amber-700"
                                    : isIncrease
                                      ? "border-[#39C99A] bg-[#E4F8F0] text-[#007F5F]"
                                      : "border-red-300 bg-red-50 text-red-500"
                            }`}
                          >
                            {isProjectCreated
                              ? "เพิ่มโครงการ"
                              : eventKind === "COMPLETE"
                                ? "เสร็จสิ้นโครงการ"
                                : eventKind === "REOPEN"
                                  ? "เปิดโครงการอีกครั้ง"
                                  : isIncrease
                                    ? "ปรับเพิ่มงบ (+)"
                                    : "ปรับลดงบ (-)"}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-gray-600">
                          {isProjectCreated || isClosureEvent ? "-" : getCategoryName(project, adjustment.categoryId)}
                        </td>
                        <td className="whitespace-nowrap px-2 py-3 text-right text-gray-700">
                          {isProjectCreated
                            ? formatNumber(project?.categories.reduce((sum, cat) => sum + cat.allocated, 0) ?? 0)
                            : isClosureEvent
                              ? "-"
                              : `${isIncrease ? "+" : "-"}${formatNumber(Math.abs(adjustment.amount))}`}
                        </td>
                        <td className="max-w-[220px] px-2 py-3 text-gray-600" title={adjustment.reason}>
                          <p className="line-clamp-2">{adjustment.reason || "-"}</p>
                        </td>
                        <td className="whitespace-nowrap px-2 py-3 text-gray-600">
                          {editor?.name ?? adjustment.byUserId}
                        </td>
                        <td className="px-2 py-3 text-center">
                          {docs.length === 0 ? (
                            <span className="text-gray-400">-</span>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              {docs.map((doc) => (
                                <AttachmentChip key={doc.name} name={doc.name} data={doc.data} className="max-w-[160px] px-2 py-0.5 text-[10px]" />
                              ))}
                            </div>
                          )}
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


