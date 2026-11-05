"use client";

import React, { useEffect, useMemo } from "react";
import { useData } from "../../context/DataContext";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { currentUser, requests } = useData();
  const router = useRouter();

  // ตรวจสอบการ Login หากไม่มี currentUser ให้กลับไปหน้าเข้าสู่ระบบ
  useEffect(() => {
    if (!currentUser) {
      router.replace("/login");
    }
  }, [currentUser, router]);

  // กรองเฉพาะคำขอของตนเองเท่านั้น (ทุก Role จะเห็นเฉพาะงานที่ตัวเองยื่น)
  const myRequests = useMemo(() => {
    if (!currentUser) return [];
    return requests.filter((req) => req.requesterId === currentUser.id);
  }, [requests, currentUser]);

  // คำนวณตัวเลขสำหรับ 4 การ์ดสรุป
  const totalCount = myRequests.length;
  const editCount = myRequests.filter((r) => r.status === "step_back").length;
  const pendingCount = myRequests.filter((r) => r.status === "pending").length;
  const totalAmount = myRequests.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  // คำนวณจำนวนโครงการที่ไม่ซ้ำกัน
  const uniqueProjectsCount = new Set(myRequests.map((r) => r.title)).size;

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  // ตัวช่วยแสดงสีและข้อความของสถานะตามรูปภาพ
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-500 text-white">
            • รออนุมัติ
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-600 text-white">
            • จ่ายแล้ว
          </span>
        );
      case "step_back":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-rose-500 text-white">
            • แก้ไข
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500 text-white">
            • อนุมัติ
          </span>
        );
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* การ์ดต้อนรับด้านบน */}
      <div className="bg-[#bbf0dc]/40 border border-[#9ae6c9] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-600 font-medium">
            ตำแหน่ง: {currentUser.department || "พนักงาน"}
          </span>
          <h1 className="text-2xl font-bold text-slate-800 mt-1">
            {currentUser.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ติดตามคำขอเบิกและงบประมาณของโครงการ
          </p>
        </div>

        <button
          onClick={() => router.push("/reimburse/create")}
          className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#00684a] hover:bg-[#00553c] text-white text-sm font-medium rounded-xl transition shadow-sm"
        >
          <span>+</span>
          <span>สร้างคำขอเบิก</span>
        </button>
      </div>

      {/* สรุป 4 กล่อง (Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* กล่องที่ 1: คำขอทั้งหมด */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">คำขอทั้งหมด</p>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-extrabold text-slate-800">{totalCount}</span>
            <span className="text-sm font-medium text-slate-700">รายการ</span>
          </div>
        </div>

        {/* กล่องที่ 2: แก้ไข */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">แก้ไข</p>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-extrabold text-slate-800">{editCount}</span>
            <span className="text-sm font-medium text-slate-700">รายการ</span>
          </div>
        </div>

        {/* กล่องที่ 3: รออนุมัติ */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">รออนุมัติ</p>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-extrabold text-slate-800">{pendingCount}</span>
            <span className="text-sm font-medium text-slate-700">รายการ</span>
          </div>
        </div>

        {/* กล่องที่ 4: ยอดที่ขอเบิกทั้งหมด */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">ยอดที่ขอเบิกทั้งหมด</p>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-[#007a55]">
              {totalAmount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {uniqueProjectsCount} โครงการ
            </div>
          </div>
        </div>
      </div>

      {/* รายการคำขอล่าสุด */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-800">คำขอล่าสุด</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 font-normal">
                <th className="pb-3 px-3">โครงการ</th>
                <th className="pb-3 px-3">หมวดหมู่</th>
                <th className="pb-3 px-3">ชื่อผู้ขอเบิก</th>
                <th className="pb-3 px-3">วันที่</th>
                <th className="pb-3 px-3">จำนวนเงิน</th>
                <th className="pb-3 px-3 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    ยังไม่มีรายการคำขอเบิกเงินของคุณ
                  </td>
                </tr>
              ) : (
                myRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* คอลัมน์โครงการ */}
                    <td className="py-4 px-3">
                      <div className="font-medium text-slate-800">{req.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {req.requestNumber}
                      </div>
                    </td>

                    {/* หมวดหมู่ */}
                    <td className="py-4 px-3 text-slate-500">
                      ค่าสถานที่/การเดินทาง
                    </td>

                    {/* ชื่อผู้ขอเบิก */}
                    <td className="py-4 px-3 text-slate-700">
                      {req.requesterName}
                    </td>

                    {/* วันที่ */}
                    <td className="py-4 px-3 text-slate-500">
                      {new Date(req.createdAt).toLocaleDateString("th-TH")}
                    </td>

                    {/* จำนวนเงิน */}
                    <td className="py-4 px-3 font-semibold text-slate-800">
                      {req.totalAmount.toLocaleString()}
                    </td>

                    {/* สถานะและการจัดการ */}
                    <td className="py-4 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {renderStatusBadge(req.status)}
                        
                        {req.status === "step_back" ? (
                          <>
                            <button
                              onClick={() => alert(`เหตุผลที่ตีกลับ: ${req.stepBackNote || "ไม่มีหมายเหตุ"}`)}
                              className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[11px] font-medium transition"
                            >
                              ดูหมายเหตุ
                            </button>
                            <button
                              onClick={() => router.push(`/reimburse/create?editId=${req.id}`)}
                              className="px-2 py-1 bg-[#00684a] hover:bg-[#00553c] text-white rounded text-[11px] font-medium transition"
                            >
                              แก้ไข
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => router.push(`/reimburse/create?viewId=${req.id}`)}
                            className="px-2 py-1 bg-[#00684a] hover:bg-[#00553c] text-white rounded text-[11px] font-medium transition"
                          >
                            ตรวจสอบ
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}