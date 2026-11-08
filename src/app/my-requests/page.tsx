"use client";
/**
 * /my-requests — คำขอของฉัน (เจ้าของ: คนที่ 3) · ตาม Figma "พนักงาน → รออนุมัติ / ประวัติการอนุมัติ"
 * -----------------------------------------------------------------------------
 * - คำขอที่ requesterId === user.id เรียงใหม่สุดก่อน
 * - คำขอที่ยกเลิกแล้ว "หายไป" ไม่แสดงในทุกแท็บ
 * - แท็บ: รออนุมัติ · ส่งกลับแก้ไข · ทำจ่ายแล้ว · ประวัติ (ทั้งหมด)
 * - <FilterBar>: ค้นหาเลขที่/ชื่อโครงการ · สถานะ · โครงการ · ช่วงวันที่ยื่น · ล้างตัวกรอง
 * - ตาราง <MyRequestTable> คอลัมน์ตาม Figma (ปุ่ม "ตรวจสอบ" → /requests/[id])
 */
import { useMemo, useState } from "react";
import { Card, FilterBar, Tabs } from "@/components/ui";
import { IN_PROGRESS_STATUSES, STATUS_META } from "@/constants/status";
import { useProjects } from "@/store/projects";
import { useRequests } from "@/store/requests";
import { useCurrentUser } from "@/store/session";
import type { ReimburseRequest, RequestStatus } from "@/types";
import { MyRequestTable } from "./_components/MyRequestTable";

type TabKey = "inProgress" | "sentBack" | "completed" | "history";

const TAB_FILTER: Record<TabKey, (r: ReimburseRequest) => boolean> = {
  inProgress: (r) => IN_PROGRESS_STATUSES.includes(r.status),
  sentBack: (r) => r.status === "SENT_BACK",
  completed: (r) => r.status === "COMPLETED",
  history: () => true,
};

const TAB_LABEL: Record<TabKey, string> = {
  inProgress: "รออนุมัติ",
  sentBack: "ส่งกลับแก้ไข",
  completed: "ทำจ่ายแล้ว",
  history: "ประวัติ",
};

/** สถานะที่เลือกกรองได้ (ไม่มี "ยกเลิกแล้ว" เพราะคำขอที่ยกเลิกไม่แสดง) */
const STATUS_OPTIONS = (Object.keys(STATUS_META) as RequestStatus[])
  .filter((s) => s !== "CANCELLED")
  .map((s) => ({ value: s, label: STATUS_META[s].label }));

export default function MyRequestsPage() {
  const user = useCurrentUser();
  const requests = useRequests();
  const projects = useProjects();

  const [tab, setTab] = useState<TabKey>("inProgress");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [projectId, setProjectId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  /** คำขอของฉันที่ผ่านตัวกรอง (ยังไม่แยกแท็บ) — ใช้นับจำนวนบนแท็บด้วย */
  const filtered = useMemo(() => {
    if (!user) return [];
    const q = search.trim().toLowerCase();
    return requests
      .filter((r) => r.requesterId === user.id && r.status !== "CANCELLED")
      .filter((r) => !status || r.status === status)
      .filter((r) => !projectId || r.projectId === projectId)
      .filter((r) => {
        const day = r.createdAt.slice(0, 10);
        return (!dateFrom || day >= dateFrom) && (!dateTo || day <= dateTo);
      })
      .filter((r) => {
        if (!q) return true;
        const projectName = projects.find((p) => p.id === r.projectId)?.name ?? "";
        return [r.id, r.projectId, projectName, r.purpose].some((text) => text.toLowerCase().includes(q));
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [requests, projects, user, search, status, projectId, dateFrom, dateTo]);

  const rows = useMemo(() => filtered.filter(TAB_FILTER[tab]), [filtered, tab]);

  if (!user) return null;

  const hasFilter = !!(search || status || projectId || dateFrom || dateTo);
  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setProjectId("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="space-y-6">
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={(Object.keys(TAB_LABEL) as TabKey[]).map((key) => ({
          value: key,
          label: TAB_LABEL[key],
          count: filtered.filter(TAB_FILTER[key]).length,
        }))}
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ค้นหาเลขที่คำขอ หรือ ชื่อโครงการ"
        filters={[
          { key: "status", label: "สถานะ", value: status, onChange: setStatus, options: STATUS_OPTIONS },
          {
            key: "project",
            label: "โครงการ",
            value: projectId,
            onChange: setProjectId,
            options: projects.map((p) => ({ value: p.id, label: p.name })),
          },
        ]}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateChange={(from, to) => {
          setDateFrom(from);
          setDateTo(to);
        }}
        onClear={clearFilters}
      />

      <Card>
        <MyRequestTable
          requests={rows}
          emptyText={hasFilter ? "ไม่พบคำขอที่ตรงกับตัวกรอง" : `ยังไม่มีคำขอในแท็บ "${TAB_LABEL[tab]}"`}
        />
      </Card>
    </div>
  );
}
