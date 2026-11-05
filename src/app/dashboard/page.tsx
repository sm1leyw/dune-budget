"use client";

import React from "react";
import { useData } from "../../context/DataContext";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const { currentUser, requests } = useData();

  const myRequests = requests.filter(
    (r) => r.applicantUsername === currentUser.username
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs text-slate-500">ตำแหน่ง: {currentUser.department}</span>
          <h1 className="text-2xl font-bold text-slate-800">{currentUser.fullname}</h1>
          <p className="text-sm text-slate-500">ติดตามคำขอเบิกและงบประมาณของโครงการ</p>
        </div>
        <Link
          href="/reimburse/create"
          className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างคำขอเบิก</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500">คำขอทั้งหมด</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{myRequests.length} รายการ</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500">แก้ไข</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {myRequests.filter((r) => r.status === "rejected").length} รายการ
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500">รออนุมัติ</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {myRequests.filter((r) => r.status === "pending").length} รายการ
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500">ยอดที่ขอเบิกทั้งหมด</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {myRequests.reduce((sum, r) => sum + r.totalAmount, 0).toLocaleString()} บาท
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-semibold text-slate-800">
          คำขอล่าสุด
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs border-b border-slate-200">
            <tr>
              <th className="p-3.5">โครงการ</th>
              <th className="p-3.5">หมวดหมู่</th>
              <th className="p-3.5">ชื่อผู้ขอเบิก</th>
              <th className="p-3.5">วันที่</th>
              <th className="p-3.5 text-right">จำนวนเงิน</th>
              <th className="p-3.5 text-center">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {myRequests.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400">
                  ยังไม่มีประวัติการยื่นคำขอ
                </td>
              </tr>
            ) : (
              myRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-medium text-slate-800">{req.projectName}</td>
                  <td className="p-3.5 text-slate-600">{req.categoryName}</td>
                  <td className="p-3.5 text-slate-600">{req.applicantName}</td>
                  <td className="p-3.5 text-slate-500">{req.createdAt}</td>
                  <td className="p-3.5 text-right font-semibold text-slate-800">
                    {req.totalAmount.toLocaleString()} ฿
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        req.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : req.status === "rejected"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {req.status === "approved"
                        ? "อนุมัติแล้ว"
                        : req.status === "rejected"
                        ? "ส่งกลับแก้ไข"
                        : "รออนุมัติ"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}