"use client";

import { useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PATHS } from "@/config/routes";
import { isMyTurn } from "@/lib/workflow";
import { formatBaht, formatThaiDate } from "@/lib/format";
import { useCurrentUser } from "@/store/session";
import { useRequest } from "@/store/requests";
import { useProjects } from "@/store/projects";
import { approveRequest, sendBackRequest } from "@/store/approvals";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

// ฟังก์ชันแปลงไฟล์เป็น Base64 String เพื่อเก็บลง LocalStorage
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export default function ApprovalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const currentUser = useCurrentUser();
  const request = useRequest(id);
  const projects = useProjects();

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);

  const [payMethod, setPayMethod] = useState<"CASH" | "CHECK" | "TRANSFER">("TRANSFER");
  const [payRef, setPayRef] = useState("");
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payFile, setPayFile] = useState<File | null>(null);
  const [payError, setPayError] = useState("");

  const project = useMemo(() => {
    return projects?.find((p) => p.id === request?.projectId);
  }, [projects, request?.projectId]);

  useMemo(() => {
    if (request && payAmount === 0) setPayAmount(request.totalAmount);
  }, [request, payAmount]);

  if (!currentUser || !request) return <div className="p-6">กำลังโหลดข้อมูล...</div>;

  const isTurn = isMyTurn(request, currentUser);
  const isAccountant = currentUser.role === "ACCOUNTANT";
  const isCompleted = request.status === "COMPLETED";

  const handleApprove = async () => {
    if (isAccountant) {
      if (payMethod === "TRANSFER" && !payRef.trim()) {
        setPayError("กรุณาระบุเลขอ้างอิงการโอนเงิน");
        setApproveModalOpen(false);
        return;
      }
      if (!payFile) {
        setPayError("กรุณาแนบไฟล์หลักฐานการทำจ่าย");
        setApproveModalOpen(false);
        return;
      }
    }

    setApproveLoading(true);
    setPayError("");
    try {
      let base64Data = "";
      if (isAccountant && payFile) {
        base64Data = await fileToBase64(payFile); // แปลงไฟล์จริงเป็น String
      }

      const paymentData = isAccountant ? {
        method: payMethod,
        refNumber: payRef,
        amount: payAmount,
        date: payDate,
        fileName: payFile?.name || "receipt.pdf",
        fileData: base64Data // เก็บข้อมูลไฟล์ลงไปด้วย (เฉพาะช่วงที่ยังไม่มี Backend)
      } : undefined;

      approveRequest(request.id, currentUser, paymentData);
      router.push(PATHS.approvals);
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setApproveLoading(false);
      setApproveModalOpen(false);
    }
  };

  const handleReject = async () => {
    if (!rejectNote.trim()) {
      setRejectError("กรุณาระบุหมายเหตุการส่งกลับแก้ไข");
      return;
    }
    setRejectLoading(true);
    setRejectError("");
    try {
      sendBackRequest(request.id, currentUser, rejectNote);
      setRejectModalOpen(false);
      router.push(PATHS.approvals);
    } catch (error) {
      console.error(error);
      setRejectError((error as Error).message);
    } finally {
      setRejectLoading(false);
    }
  };

  const timelineSteps = [
    { label: "ผู้ยื่นขอเบิก", by: request.requesterId, status: "completed" },
    { label: "ผู้อนุมัติ", by: request.history.find(h => h.action === "APPROVE")?.byUserId || "กำลังรอพิจารณา", status: isCompleted ? "completed" : "current" },
    { label: "รอบัญชีตรวจสอบและทำจ่าย", by: request.history.find(h => h.action === "PAY")?.byUserId || "-", status: isCompleted ? "completed" : "pending" }
  ];

  const getMethodLabel = (method: string) => {
    if (method === "CASH") return "เงินสด";
    if (method === "CHECK") return "เช็คเงินสด";
    if (method === "TRANSFER") return "โอนผ่านธนาคาร";
    return method;
  };

  return (
    <div className="p-6 bg-[#E8F5E9]/30 min-h-screen">
      <div className="flex gap-6 mb-6">

        {/* ส่วนข้อมูลหลัก */}
        <div className="flex-1 space-y-6">
          {/* ข้อมูลคำขอ */}
          <div className="bg-white rounded-xl border border-[#A5D6A7] p-6 shadow-sm">
            <div className="grid grid-cols-2 gap-y-6 gap-x-12 text-sm">
              <div className="flex gap-2">
                <span className="font-semibold text-gray-700">รหัสคืนเงิน :</span>
                <span className="text-gray-900">{request.id}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-gray-700">วันที่ยื่น :</span>
                <span className="text-gray-900">{formatThaiDate(request.createdAt)}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-gray-700">ผู้ยื่นเรื่อง :</span>
                <span className="text-gray-900">{request.requesterId}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-gray-700">แผนก :</span>
                <span className="text-gray-900">เทคโนโลยีสารสนเทศ (IT)</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-gray-700">ประเภทแบบฟอร์ม :</span>
                <span className="text-teal-600">
                  {request.type === "CLEARANCE" ? "ตาราง B (คืนเงิน/เคลียร์เงินยืม)" : "ตาราง A (ขอเบิก/ยืมเงินล่วงหน้า)"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-gray-700">ช่วงระยะเวลาดำเนินการ :</span>
                <span className="text-gray-900">
                  {request.startDate ? formatThaiDate(request.startDate) : "-"} ถึง {request.endDate ? formatThaiDate(request.endDate) : "-"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-gray-700">ชื่อโครงการ :</span>
                <span className="text-gray-900">{project?.name || request.projectId}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-gray-700">หมวดหมู่ :</span>
                <span className="text-gray-900">{request.categoryId}</span>
              </div>
            </div>

            <div className="mt-8">
              <div className="font-semibold text-gray-700 mb-3">รายละเอียด/วัตถุประสงค์ :</div>
              <div className="bg-[#E8F5E9]/50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                {request.purpose || "-"}
              </div>
            </div>
          </div>

          <div className="bg-[#0F7651] text-white rounded-xl p-6 flex justify-between items-center shadow-sm">
            <span className="text-lg font-medium">
              {request.type === "CLEARANCE" ? "ยอดเงินที่คืน" : "ยอดเงินขอเบิก"}
            </span>
            <span className="text-3xl font-bold">{formatBaht(request.totalAmount).replace(" บาท", "")} บาท</span>
          </div>

          {/* ตารางเอกสารแนบ (ฝั่งผู้ขอเบิก) */}
          <div className="bg-white rounded-xl border border-[#A5D6A7] p-6 shadow-sm">
            <h3 className="font-semibold text-gray-700 mb-4">ข้อมูลเอกสารแนบ</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="pb-3 font-normal text-left">รายการ</th>
                    <th className="pb-3 font-normal text-left">วันที่</th>
                    <th className="pb-3 font-normal text-right">จำนวนเงิน</th>
                    <th className="pb-3 font-normal text-center">เอกสารแนบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {request.items && request.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4 text-gray-800">{item.name}</td>
                      <td className="py-4 text-gray-600">{item.date ? formatThaiDate(item.date) : "-"}</td>
                      <td className="py-4 text-gray-800 text-right">{formatBaht(item.amount).replace(" บาท", "")}</td>
                      <td className="py-4 text-center">
                        {item.fileName ? (
                          <span className="inline-block bg-gray-100 text-gray-500 px-3 py-1 rounded text-xs truncate max-w-[150px]">
                            {item.fileName}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ฟอร์มกรอกข้อมูลทำจ่าย (บัญชี) */}
          {isTurn && isAccountant && (
            <div className="bg-white rounded-xl border border-[#A5D6A7] p-6 shadow-sm relative">
              <h3 className="font-semibold text-gray-700 mb-4">ข้อมูลการทำจ่าย</h3>
              {payError && <div className="text-red-500 text-sm mb-3">{payError}</div>}
              <div className="flex flex-wrap items-center gap-4">

                <select
                  className="border border-[#439659] rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#439659] bg-white min-w-[150px]"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                >
                  <option value="TRANSFER">โอนผ่านธนาคาร</option>
                  <option value="CASH">เงินสด</option>
                  <option value="CHECK">เช็คเงิน</option>
                </select>

                {payMethod === "TRANSFER" && (
                  <input
                    type="text"
                    placeholder="เลขอ้างอิงในสลิป"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="border border-[#439659] rounded px-3 py-2 text-sm text-gray-700 focus:outline-none w-[180px]"
                  />
                )}

                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="border border-[#439659] rounded px-3 py-2 text-sm text-gray-700 focus:outline-none w-[150px]"
                />

                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="border border-[#439659] rounded px-3 py-2 text-sm text-gray-700 focus:outline-none w-[150px]"
                />

                <div className="flex-1 min-w-[200px]">
                  <label className="flex items-center justify-between border border-[#439659] rounded px-3 py-1.5 text-sm cursor-pointer bg-white">
                    <span className="text-gray-500 truncate max-w-[150px]">
                      {payFile ? payFile.name : "แนบเอกสาร (PDF, PNG, JPG)"}
                    </span>
                    <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-xs">เลือกไฟล์</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setPayFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ตารางแสดงผลการทำจ่าย (แสดงเมื่ออนุมัติแล้ว) */}
          {isCompleted && request.paymentInfo && (
            <div className="bg-white rounded-xl border border-[#A5D6A7] p-6 shadow-sm">
              <h3 className="font-semibold text-gray-700 mb-4">ข้อมูลการทำจ่าย</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="pb-3 font-normal text-left">วิธีการจ่าย</th>
                      <th className="pb-3 font-normal text-left">วันที่</th>
                      <th className="pb-3 font-normal text-right">จำนวนเงิน</th>
                      <th className="pb-3 font-normal text-center">เอกสารแนบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-4 text-gray-800">
                        {getMethodLabel(request.paymentInfo.method)}
                        {request.paymentInfo.method === "TRANSFER" && request.paymentInfo.refNumber && (
                          <span className="text-gray-500 text-xs ml-2">(อ้างอิง: {request.paymentInfo.refNumber})</span>
                        )}
                      </td>
                      <td className="py-4 text-gray-600">
                        {formatThaiDate(request.paymentInfo.date)}
                      </td>
                      <td className="py-4 text-gray-800 text-right">
                        {formatBaht(request.paymentInfo.amount).replace(" บาท", "")}
                      </td>
                      <td className="py-4 text-center">

                        {/* ปุ่มเปิดไฟล์ที่แปลง Base64 กลับมาแสดงผลให้ */}
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 bg-[#B2EBF2] text-[#006064] px-3 py-1 rounded text-xs cursor-pointer hover:bg-cyan-200 transition border-none"
                          onClick={async () => {
                            if (request.paymentInfo?.fileData) {
                              try {
                                // ดึงไฟล์จาก Base64 String ที่เก็บไว้
                                const res = await fetch(request.paymentInfo.fileData);
                                const blob = await res.blob();
                                const fileUrl = URL.createObjectURL(blob);
                                window.open(fileUrl, "_blank");
                              } catch (error) {
                                alert("เกิดข้อผิดพลาดในการดึงไฟล์");
                              }
                            } else {
                              alert(`ไม่พบตัวไฟล์ ${request.paymentInfo?.fileName} ในระบบ`);
                            }
                          }}
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          ดูไฟล์: {request.paymentInfo.fileName}
                        </button>

                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ปุ่ม Action */}
          <div className="flex justify-end gap-3 pt-2">
            {!isTurn && (
              <button
                onClick={() => router.back()}
                className="px-6 py-2 bg-[#8C9C94] text-white hover:bg-[#7a8880] rounded-md font-medium text-sm transition-colors"
              >
                กลับไปหน้าหลัก
              </button>
            )}

            {isTurn && (
              <>
                <button
                  onClick={() => router.push(PATHS.approvals)}
                  className="px-6 py-2 bg-[#A5D6A7] text-[#1B5E20] hover:bg-[#81C784] rounded-md font-medium text-sm transition-colors"
                >
                  กลับไปหน้าหลัก
                </button>
                <button
                  onClick={() => setRejectModalOpen(true)}
                  className="px-6 py-2 bg-[#8D4A4B] text-white hover:bg-[#7a3f40] rounded-md font-medium text-sm transition-colors"
                >
                  ส่งกลับแก้ไข
                </button>
                <button
                  onClick={() => {
                    if (isAccountant) {
                      if (payMethod === "TRANSFER" && !payRef.trim()) {
                        setPayError("กรุณาระบุเลขอ้างอิงการโอนเงิน");
                        return;
                      }
                      if (!payFile) {
                        setPayError("กรุณาแนบไฟล์หลักฐานการทำจ่าย");
                        return;
                      }
                    }
                    setApproveModalOpen(true);
                  }}
                  className="px-6 py-2 bg-[#439659] text-white hover:bg-[#387e4a] rounded-md font-medium text-sm transition-colors"
                >
                  {isAccountant ? "ยืนยันทำจ่าย" : "อนุมัติ"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sidebar ลำดับขั้นการอนุมัติ */}
        <div className="w-[300px] shrink-0">
          <div className="bg-white rounded-xl border border-[#A5D6A7] p-6 shadow-sm sticky top-6">
            <h3 className="font-semibold text-gray-800 mb-6">ลำดับขั้นการอนุมัติ</h3>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gray-200">

              {timelineSteps.map((step, idx) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white z-10 shrink-0 ${step.status === "completed" ? "border-[#0F7651] bg-[#0F7651] text-white" :
                      step.status === "current" ? "border-orange-400 text-orange-500 font-bold" :
                        "border-gray-300 text-gray-300"
                    }`}>
                    {step.status === "completed" ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className={`text-sm font-semibold ${step.status === "pending" ? "text-gray-400" : "text-gray-800"}`}>
                      {step.label}
                    </h4>
                    <p className={`text-[11px] ${step.status === "pending" ? "text-gray-300" : step.status === "current" ? "text-blue-500" : "text-gray-500"}`}>
                      {step.status === "current" ? `กำลังรอพิจารณา` : `โดย : ${step.by}`}
                    </p>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </div>

      </div>

      {/* Modal ยืนยัน / อนุมัติ */}
      <ConfirmModal
        open={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        onConfirm={handleApprove}
        title={isAccountant ? "ยืนยันการทำจ่าย?" : "ยืนยันการอนุมัติคำขอนี้?"}
        description="เมื่อยืนยันแล้ว คำขอจะถูกส่งไปยังขั้นตอนถัดไป"
        confirmLabel={isAccountant ? "ยืนยันทำจ่าย" : "อนุมัติ"}
        cancelLabel="กลับ"
        loading={approveLoading}
      />

      <Modal
        open={rejectModalOpen}
        onClose={() => { setRejectModalOpen(false); setRejectError(""); }}
        title={<div className="bg-[#0F7651] -m-8 mb-6 p-6 rounded-t-lg"><h2 className="text-white text-xl font-medium">หมายเหตุการส่งกลับ</h2></div>}
        size="md"
        footer={
          <div className="flex justify-center gap-4 w-full">
            <Button variant="secondary" onClick={() => setRejectModalOpen(false)} disabled={rejectLoading} className="bg-gray-500 text-white hover:bg-gray-600 px-8 py-2 border-0">กลับ</Button>
            <Button variant="primary" onClick={handleReject} loading={rejectLoading} className="bg-[#3FA05B] text-white hover:bg-[#34864c] px-8 py-2">ยืนยัน</Button>
          </div>
        }
      >
        <div className="px-2 pb-4">
          <textarea
            className="w-full bg-gray-100 border border-gray-200 rounded p-4 text-sm text-gray-700 min-h-[150px] focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
            placeholder="พิมพ์สาเหตุการส่งกลับแก้ไข..."
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
          />
          {rejectError && <p className="text-red-500 text-sm mt-2">{rejectError}</p>}
        </div>
      </Modal>
    </div>
  );
}