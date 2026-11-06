"use client";
/**
 * /approvals — เจ้าของ: คนที่ 4
 * หน้าชั่วคราว: สิ่งที่ต้องทำเขียนไว้ใน config/routes.ts (แสดงบนหน้าจอด้วย)
 * เริ่มทำ: ใส่ "use client" บรรทัดแรก (ถ้าใช้ hook/useState) ลบ <PagePlaceholder /> แล้วเขียนหน้าจริงแทน
 */
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRequests } from "@/store/requests";
import { isMyTurn } from "@/lib/workflow";
import { PATHS } from "@/config/routes";
// สมมติว่ามี hook เหล่านี้ตามที่ README ระบุ (ถ้า path ต่างไปให้ปรับแก้ตามจริง)
import { useCurrentUser } from "@/store/session";
import { useProjects } from "@/store/projects";
import { formatBaht, formatThaiDate } from "@/lib/format";
import type { RequestStatus } from "@/types";

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  const currentUser = useCurrentUser();
  const allRequests = useRequests();
  const projects = useProjects(); // เพื่อดึงชื่อโครงการ

  // กรองคำขอที่รอผู้ใช้คนนี้พิจารณา
  const pendingRequests = useMemo(() => {
    return allRequests.filter((req) => isMyTurn(req, currentUser));
  }, [allRequests, currentUser]);

  // กรองประวัติคำขอที่ผู้ใช้คนนี้เคยมีส่วนร่วม (อนุมัติ/ทำจ่ายไปแล้ว)
  const historyRequests = useMemo(() => {
    if (!currentUser) return [];
    return allRequests.filter((req) =>
      req.history.some((h) => h.byUserId === currentUser.id && h.action !== "SUBMIT")
    );
  }, [allRequests, currentUser]);

  const displayedRequests = activeTab === "pending" ? pendingRequests : historyRequests;

  // กำหนดชื่อ Tab ตาม Role (ตามที่ระบุใน routes.ts)
  const isAccountant = currentUser?.role === "ACCOUNTANT";
  const pendingTabLabel = isAccountant ? "รอทำจ่าย" : "รออนุมัติ";
  const historyTabLabel = isAccountant ? "ประวัติการทำจ่าย" : "ประวัติ";

  // Helper ฟังก์ชันหาชื่อโครงการ
  const getProjectName = (projectId: string) => {
    const proj = projects?.find((p) => p.id === projectId);
    return proj ? proj.name : projectId;
  };

  if (!currentUser) return null; // หรือแสดง Loading

  return (
    <div className="p-6 bg-[#E8F5E9]/30 min-h-screen">
      {/* Header Tabs (อิงจากภาพดีไซน์) */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all border ${activeTab === "pending"
              ? "bg-primary text-white border-primary"    
              : "bg-white text-gray-700 border-gray-300 hover:border-primary"
            }`}
        >
          {pendingTabLabel} ({pendingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all border ${activeTab === "history"
              ? "bg-primary text-white border-primary"
              : "bg-white text-gray-700 border-gray-300 hover:border-primary"
            }`}
        >
          {historyTabLabel} ({historyRequests.length})
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-[#A5D6A7] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-normal">โครงการ</th>
                <th className="px-6 py-4 font-normal">หมวดหมู่</th>
                <th className="px-6 py-4 font-normal">ชื่อผู้ขอเบิก</th>
                <th className="px-6 py-4 font-normal">วันที่</th>
                <th className="px-6 py-4 font-normal text-right">จำนวนเงิน</th>
                <th className="px-6 py-4 font-normal text-center">สถานะ</th>
                <th className="px-6 py-4 font-normal"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedRequests.length > 0 ? (
                displayedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{getProjectName(req.projectId)}</div>
                      <div className="text-xs text-gray-400 mt-0.5">รหัสคำขอ: {req.id}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{req.categoryId || "-"}</td>
                    {/* สมมติว่ามีระบบดึงชื่อพนักงาน ถ้าไม่มีชั่วคราวให้แสดงเป็น ID ไปก่อน */}
                    <td className="px-6 py-4 text-gray-600">{req.requesterId}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {req.createdAt ? formatThaiDate(req.createdAt) : "-"}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800 text-right">
                      {formatBaht(req.totalAmount || 0).replace(" บาท", "")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={PATHS.approvalDetail(req.id)}
                        className="inline-block bg-primary hover:bg-primary/90 text-white text-xs px-4 py-1.5 rounded"
                      >
                        ตรวจสอบ
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    ไม่มีรายการ{activeTab === "pending" ? "รออนุมัติ" : "ในประวัติ"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Component สำหรับแสดงป้ายสถานะ (อิงตามสีใน README)
function StatusBadge({ status }: { status: RequestStatus }) {
  let badgeClass = "";
  let label = "";

  switch (status) {
    case "WAITING_DEPT_HEAD":
      label = "รอหัวหน้าอนุมัติ";
      badgeClass = "bg-orange-500 text-white";
      break;
    case "WAITING_EXECUTIVE":
      label = "รอผู้บริหารอนุมัติ";
      badgeClass = "bg-orange-500 text-white";
      break;
    case "WAITING_ACCOUNTANT":
      label = "รอบัญชีทำจ่าย";
      badgeClass = "bg-blue-500 text-white";
      break;
    case "COMPLETED":
      label = "จ่ายแล้ว";
      badgeClass = "bg-green-600 text-white";
      break;
    case "SENT_BACK":
      label = "ส่งกลับแก้ไข";
      badgeClass = "bg-red-500 text-white";
      break;
    case "CANCELLED":
      label = "ยกเลิกแล้ว";
      badgeClass = "bg-gray-400 text-white";
      break;
    default:
      label = status;
      badgeClass = "bg-gray-200 text-gray-700";
  }

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-medium ${badgeClass}`}>
      • {label}
    </span>
  );
}