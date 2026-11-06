"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useData } from "../../context/DataContext";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, requests, approveRequest, rejectRequest } = useData();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("dune_user");
    if (!savedUser && !currentUser) {
      router.push("/login");
    }
  }, [currentUser, router]);

  const pendingRequests = requests.filter(
    (r) =>
      r.currentStep === "WAITING_DEPT_HEAD" ||
      r.currentStep === "WAITING_EXECUTIVE" ||
      r.currentStep === "WAITING_ACCOUNTANT"
  );
  const rejectedRequests = requests.filter((r) => r.currentStep === "REJECTED");
  const totalAmount = requests.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  const handleRejectSubmit = (id: string) => {
    if (!reason.trim()) return alert("กรุณาระบุเหตุผลการส่งกลับ");
    rejectRequest(id, reason);
    setRejectId(null);
    setReason("");
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] p-6 lg:p-8">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-gray-500">หน้าหลัก / แดชบอร์ด</p>
          <h1 className="text-2xl font-bold text-[#1F5441]">แดชบอร์ด</h1>
        </div>

        {/* User Profile Card ขวาบน */}
        <div className="flex items-center gap-3 bg-white px-3.5 py-1.5 rounded-full border border-gray-200 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-[#1F5441] text-white flex items-center justify-center font-bold text-xs">
            {currentUser?.name ? currentUser.name.charAt(0) : "ภ"}
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-gray-800 leading-tight">
              {currentUser?.name || "ภูวเนศวร์ อิ่มฤทธา"}
            </p>
            <p className="text-[10px] text-gray-500 leading-tight">
              {currentUser?.department || "ฝ่ายการเงินและบัญชี"}
            </p>
          </div>
          <span className="text-gray-400 text-xs font-bold ml-1">&gt;</span>
        </div>
      </div>

      {/* Main Banner Card */}
      <div className="bg-[#D8EFE3] border border-[#BCE1CE] rounded-2xl p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-[#285E49] font-medium mb-1">
            ตำแหน่ง: {currentUser?.position || "พนักงานบัญชี"}
          </p>
          <h2 className="text-2xl font-bold text-[#1F5441] mb-1">
            {currentUser?.name || "ภูวเนศวร์ อิ่มฤทธา"}
          </h2>
          <p className="text-xs text-gray-600">ติดตามคำขอเบิกและงบประมาณของโครงการ</p>
        </div>

        <Link
          href="/reimburse/create"
          className="inline-flex items-center justify-center gap-1.5 bg-[#1F5441] hover:bg-[#184334] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างคำขอเบิก</span>
        </Link>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-2">คำขอทั้งหมด</p>
          <h3 className="text-2xl font-bold text-gray-800">
            {requests.length} <span className="text-base font-normal text-gray-600">รายการ</span>
          </h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-2">แก้ไข</p>
          <h3 className="text-2xl font-bold text-gray-800">
            {rejectedRequests.length} <span className="text-base font-normal text-gray-600">รายการ</span>
          </h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-2">รออนุมัติ</p>
          <h3 className="text-2xl font-bold text-gray-800">
            {pendingRequests.length} <span className="text-base font-normal text-gray-600">รายการ</span>
          </h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-2">ยอดที่ขอเบิกทั้งหมด</p>
          <h3 className="text-2xl font-bold text-[#1F5441]">
            {totalAmount.toLocaleString()}
          </h3>
          <p className="text-[10px] text-gray-400 mt-0.5">รวมทุกโครงการ</p>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-gray-800 mb-4">คำขอล่าสุด</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-medium">
                <th className="pb-3 font-normal">โครงการ</th>
                <th className="pb-3 font-normal">หมวดหมู่</th>
                <th className="pb-3 font-normal">ชื่อผู้ขอเบิก</th>
                <th className="pb-3 font-normal">วันที่</th>
                <th className="pb-3 font-normal">จำนวนเงิน</th>
                <th className="pb-3 font-normal">สถานะ</th>
                <th className="pb-3 font-normal text-center">จัดการคำขอ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/60 transition">
                  <td className="py-3.5 pr-3">
                    <p className="font-semibold text-gray-800">{req.projectName}</p>
                    <p className="text-[11px] text-gray-400">{req.projectCode}</p>
                  </td>
                  <td className="py-3.5 pr-3">{req.category}</td>
                  <td className="py-3.5 pr-3 font-medium text-gray-700">{req.requesterName}</td>
                  <td className="py-3.5 pr-3">{req.createdAt}</td>
                  <td className="py-3.5 pr-3 font-semibold text-gray-800">
                    {(req.totalAmount || 0).toLocaleString()} ฿
                  </td>
                  <td className="py-3.5 pr-3">
                    {req.currentStep === "WAITING_DEPT_HEAD" && (
                      <span className="inline-block bg-[#F89C26] text-white px-3 py-1 rounded-full text-[11px] font-medium">
                        รอหัวหน้าแผนกอนุมัติ
                      </span>
                    )}
                    {req.currentStep === "WAITING_EXECUTIVE" && (
                      <span className="inline-block bg-[#F89C26] text-white px-3 py-1 rounded-full text-[11px] font-medium">
                        รอผู้บริหารอนุมัติ
                      </span>
                    )}
                    {req.currentStep === "WAITING_ACCOUNTANT" && (
                      <span className="inline-block bg-[#3B82F6] text-white px-3 py-1 rounded-full text-[11px] font-medium">
                        รอบัญชีทำจ่าย
                      </span>
                    )}
                    {req.currentStep === "COMPLETED" && (
                      <span className="inline-block bg-[#1F5441] text-white px-3 py-1 rounded-full text-[11px] font-medium">
                        จ่ายแล้ว
                      </span>
                    )}
                    {req.currentStep === "REJECTED" && (
                      <span className="inline-block bg-[#E5484D] text-white px-3 py-1 rounded-full text-[11px] font-medium">
                        แก้ไข
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 text-center">
                    {currentUser?.role === "DEPT_HEAD" && req.currentStep === "WAITING_DEPT_HEAD" && (
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => approveRequest(req.id)}
                          className="bg-[#1F5441] hover:bg-[#184334] text-white px-2.5 py-1 rounded-lg text-[11px] font-medium"
                        >
                          อนุมัติ
                        </button>
                        <button
                          onClick={() => setRejectId(req.id)}
                          className="bg-[#E5484D] hover:bg-red-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-medium"
                        >
                          ส่งกลับ
                        </button>
                      </div>
                    )}

                    {currentUser?.role === "EXECUTIVE" && req.currentStep === "WAITING_EXECUTIVE" && (
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => approveRequest(req.id)}
                          className="bg-[#1F5441] hover:bg-[#184334] text-white px-2.5 py-1 rounded-lg text-[11px] font-medium"
                        >
                          อนุมัติ
                        </button>
                        <button
                          onClick={() => setRejectId(req.id)}
                          className="bg-[#E5484D] hover:bg-red-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-medium"
                        >
                          ส่งกลับ
                        </button>
                      </div>
                    )}

                    {currentUser?.role === "ACCOUNTANT" && req.currentStep === "WAITING_ACCOUNTANT" && (
                      <button
                        onClick={() => approveRequest(req.id)}
                        className="bg-[#3B82F6] hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-[11px] font-medium"
                      >
                        ทำจ่ายเงิน
                      </button>
                    )}

                    {!(
                      (currentUser?.role === "DEPT_HEAD" && req.currentStep === "WAITING_DEPT_HEAD") ||
                      (currentUser?.role === "EXECUTIVE" && req.currentStep === "WAITING_EXECUTIVE") ||
                      (currentUser?.role === "ACCOUNTANT" && req.currentStep === "WAITING_ACCOUNTANT")
                    ) && (
                      <span className="inline-block bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-[11px]">
                        ตรวจสอบ
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal ระบุเหตุผลการส่งกลับแก้ไข */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-gray-100">
            <h4 className="text-sm font-bold text-gray-800 mb-2">ระบุหมายเหตุการส่งกลับแก้ไข</h4>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ระบุเหตุผลการส่งกลับแก้ไข..."
              className="w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:border-[#1F5441] focus:outline-none"
              rows={3}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setRejectId(null)}
                className="rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleRejectSubmit(rejectId)}
                className="rounded-lg bg-[#E5484D] hover:bg-red-700 px-3.5 py-1.5 text-xs text-white font-medium"
              >
                ยืนยันส่งกลับ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}