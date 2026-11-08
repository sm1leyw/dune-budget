"use client";

import { useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PATHS } from "@/config/routes";
import { isMyTurn } from "@/lib/workflow";
import { formatBaht, formatThaiDate } from "@/lib/format";
// สมมติว่ามี hook/ฟังก์ชันเหล่านี้ตามที่ README ระบุ (ปรับ path ตามจริง)
import { useCurrentUser } from "@/store/session";
import { useRequest } from "@/store/requests";
import { useProjects } from "@/store/projects";
// สมมติว่า import actions จาก store/approvals ได้ตามที่ README ระบุ
import { approveRequest, sendBackRequest } from "@/store/approvals";
// นำเข้า Modal
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
  const [payAmount, setPayAmount] = useState<number>(0);

  // แก้วันที่เริ่มต้นให้เป็นวันที่ปัจจุบันตามเครื่องผู้ใช้งาน (Local Time) 
  const [payDate, setPayDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

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
    // Validate เฉพาะฝ่ายบัญชี
    if (isAccountant) {
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
        amount: payAmount,
        date: payDate,
        fileName: payFile?.name || "receipt.pdf",
        fileData: base64Data
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

  const getMethodLabel = (method: string) => {
    if (method === "CASH") return "เงินสด";
    if (method === "CHECK") return "เช็คเงินสด";
    if (method === "TRANSFER") return "โอนผ่านธนาคาร";
    return method;
  };

  return (
    <div className="p-6 bg-primary-soft min-h-screen">
      <div className="flex gap-6 mb-6">

        {/* ส่วนข้อมูลหลัก */}
        <div className="flex-1 space-y-6">
          {/* ข้อมูลคำขอ */}
          <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
            <div className="grid grid-cols-2 gap-y-6 gap-x-12 text-sm">
              <div className="flex gap-2">
                <span className="font-semibold text-text">รหัสคืนเงิน :</span>
                <span className="text-text">{request.id}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-text">วันที่ยื่น :</span>
                <span className="text-text">{formatThaiDate(request.createdAt)}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-text">ผู้ยื่นเรื่อง :</span>
                <span className="text-text">{request.requesterId}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-text">แผนก :</span>
                <span className="text-text">เทคโนโลยีสารสนเทศ (IT)</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-text">ประเภทแบบฟอร์ม :</span>
                <span className="text-primary font-medium">
                  {request.type === "CLEARANCE" ? "ตาราง B (คืนเงิน/เคลียร์เงินยืม)" : "ตาราง A (ขอเบิก/ยืมเงินล่วงหน้า)"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-text">ช่วงระยะเวลาดำเนินการ :</span>
                <span className="text-text">
                  {request.startDate ? formatThaiDate(request.startDate) : "-"} ถึง {request.endDate ? formatThaiDate(request.endDate) : "-"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-text">ชื่อโครงการ :</span>
                <span className="text-text">{project?.name || request.projectId}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-text">หมวดหมู่ :</span>
                <span className="text-text">{request.categoryId}</span>
              </div>
            </div>

            <div className="mt-8">
              <div className="font-semibold text-text mb-3">รายละเอียด/วัตถุประสงค์ :</div>
              <div className="bg-primary-soft p-4 rounded-md text-sm text-text whitespace-pre-wrap">
                {request.purpose || "-"}
              </div>
            </div>
          </div>

          <div className="bg-primary text-text-inverse rounded-xl p-6 flex justify-between items-center shadow-sm">
            <span className="text-lg font-medium">
              {request.type === "CLEARANCE" ? "ยอดเงินที่คืน" : "ยอดเงินขอเบิก"}
            </span>
            <span className="text-3xl font-bold">{formatBaht(request.totalAmount).replace(" บาท", "")} บาท</span>
          </div>

          {/* ตารางเอกสารแนบ (ฝั่งผู้ขอเบิก) */}
          <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
            <h3 className="font-semibold text-text mb-4">ข้อมูลเอกสารแนบ</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-text-muted border-b border-border">
                  <tr>
                    <th className="pb-3 font-normal text-left">รายการ</th>
                    <th className="pb-3 font-normal text-left">วันที่</th>
                    <th className="pb-3 font-normal text-right">จำนวนเงิน</th>
                    <th className="pb-3 font-normal text-center">เอกสารแนบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {request.items && request.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4 text-text">{item.name}</td>
                      <td className="py-4 text-text-muted">{item.date ? formatThaiDate(item.date) : "-"}</td>
                      <td className="py-4 text-text text-right">{formatBaht(item.amount).replace(" บาท", "")}</td>
                      <td className="py-4 text-center">
                        {item.fileName ? (
                          <span className="inline-block bg-gray-100 text-text-muted px-3 py-1 rounded text-xs truncate max-w-[150px]">
                            {item.fileName}
                          </span>
                        ) : (
                          <span className="text-xs text-disabled">-</span>
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
            <div className="bg-surface rounded-xl border border-border p-6 shadow-sm relative">
              <h3 className="font-semibold text-text mb-4">ข้อมูลการทำจ่าย</h3>
              {payError && <div className="text-danger text-sm mb-3">{payError}</div>}
              <div className="flex flex-wrap items-center gap-4">

                <select
                  className="border border-border-input rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary bg-surface min-w-[150px]"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                >
                  <option value="TRANSFER">โอนผ่านธนาคาร</option>
                  <option value="CASH">เงินสด</option>
                  <option value="CHECK">เช็คเงิน</option>
                </select>

                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="border border-border-input rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary w-[150px]"
                />

                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="border border-border-input rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary w-[150px]"
                />

                <div className="flex-1 min-w-[200px]">
                  <label className="flex items-center justify-between border border-border-input rounded-md px-3 py-1.5 text-sm cursor-pointer bg-surface">
                    <span className="text-text-muted truncate max-w-[150px]">
                      {payFile ? payFile.name : "แนบเอกสาร (PDF, PNG, JPG)"}
                    </span>
                    <span className="bg-gray-200 text-text-muted px-2 py-0.5 rounded text-xs">เลือกไฟล์</span>
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
            <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
              <h3 className="font-semibold text-text mb-4">ข้อมูลการทำจ่าย</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-text-muted border-b border-border">
                    <tr>
                      <th className="pb-3 font-normal text-left">วิธีการจ่าย</th>
                      <th className="pb-3 font-normal text-left">วันที่</th>
                      <th className="pb-3 font-normal text-right">จำนวนเงิน</th>
                      <th className="pb-3 font-normal text-center">เอกสารแนบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="py-4 text-text">
                        {getMethodLabel(request.paymentInfo.method)}
                      </td>
                      <td className="py-4 text-text-muted">
                        {formatThaiDate(request.paymentInfo.date)}
                      </td>
                      <td className="py-4 text-text text-right">
                        {formatBaht(request.paymentInfo.amount).replace(" บาท", "")}
                      </td>
                      <td className="py-4 text-center">

                        <button
                          type="button"
                          className="inline-flex items-center gap-1 bg-info/10 text-info px-3 py-1 rounded text-xs cursor-pointer hover:bg-info/20 transition border-none"
                          onClick={async () => {
                            if (request.paymentInfo?.fileData) {
                              try {
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
              <Button
                variant="secondary"
                onClick={() => router.back()}
              >
                กลับไปหน้าหลัก
              </Button>
            )}

            {isTurn && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => router.push(PATHS.approvals)}
                >
                  กลับไปหน้าหลัก
                </Button>
                <Button
                  variant="dangerSolid"
                  onClick={() => setRejectModalOpen(true)}
                >
                  ส่งกลับแก้ไข
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (isAccountant) {
                      if (!payFile) {
                        setPayError("กรุณาแนบไฟล์หลักฐานการทำจ่าย");
                        return;
                      }
                    }
                    setApproveModalOpen(true);
                  }}
                >
                  {isAccountant ? "ยืนยันทำจ่าย" : "อนุมัติ"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Sidebar ลำดับขั้นการอนุมัติ */}
        <div className="w-[300px] shrink-0">
          <div className="bg-surface rounded-lg border border-border p-6 shadow-sm sticky top-6">
            <h3 className="font-semibold text-text mb-6">ลำดับขั้นการอนุมัติ</h3>

            <div className="space-y-8 relative">
              {/* เส้นเชื่อม Timeline */}
              <div className="absolute left-[15px] top-4 bottom-4 w-1 bg-border/50 rounded-full" aria-hidden="true" />

              {/* ขั้นที่ 1: ผู้ยื่นขอเบิก (เสร็จเสมอ) */}
              <div className="relative flex items-start">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-text-inverse z-10 shrink-0 shadow-[0_0_0_4px_var(--color-surface)]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4 mt-1 flex-1">
                  <h4 className="text-sm font-semibold text-text">ผู้ยื่นขอเบิก</h4>
                  <p className="text-[12px] mt-0.5 text-primary">โดย : {request.requesterId}</p>
                </div>
              </div>

              {/* ขั้นที่ 2: ผู้อนุมัติ (หัวหน้า/ผู้บริหาร) */}
              <div className="relative flex items-start">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full z-10 shrink-0 shadow-[0_0_0_4px_var(--color-surface)]
                  ${request.status === "SENT_BACK" ? "bg-danger text-text-inverse" :
                    (request.status === "WAITING_ACCOUNTANT" || request.status === "COMPLETED") ? "bg-primary text-text-inverse" :
                      "bg-surface border-2 border-warning text-warning font-bold"
                  }
                `}>
                  {request.status === "SENT_BACK" ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (request.status === "WAITING_ACCOUNTANT" || request.status === "COMPLETED") ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    "2"
                  )}
                </div>
                <div className="ml-4 mt-1 flex-1">
                  <h4 className="text-sm font-semibold text-text">ผู้อนุมัติ</h4>
                  <p className={`text-[12px] mt-0.5 
                    ${request.status === "SENT_BACK" ? "text-danger" :
                      (request.status === "WAITING_ACCOUNTANT" || request.status === "COMPLETED") ? "text-primary" :
                        "text-[#3B82F6]"}`
                  }>
                    {request.status === "SENT_BACK" ? "ส่งกลับไปแก้ไข" :
                      (request.status === "WAITING_ACCOUNTANT" || request.status === "COMPLETED") ? "อนุมัติเรียบร้อยแล้ว" :
                        "กำลังรอพิจารณา"}
                  </p>
                </div>
              </div>

              {/* ขั้นที่ 3: รอบัญชีทำจ่าย */}
              <div className="relative flex items-start">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full z-10 shrink-0 shadow-[0_0_0_4px_var(--color-surface)]
                  ${request.status === "COMPLETED" ? "bg-primary text-text-inverse" :
                    request.status === "WAITING_ACCOUNTANT" ? "bg-surface border-2 border-warning text-warning font-bold" :
                      "bg-surface border-2 border-border text-border"
                  }
                `}>
                  {request.status === "COMPLETED" ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    "3"
                  )}
                </div>
                <div className="ml-4 mt-1 flex-1">
                  <h4 className={`text-sm font-semibold ${request.status === "COMPLETED" || request.status === "WAITING_ACCOUNTANT" ? "text-text" : "text-text-muted"}`}>
                    รอบัญชีตรวจสอบและทำจ่าย
                  </h4>
                  <p className={`text-[12px] mt-0.5 
                    ${request.status === "COMPLETED" ? "text-primary" :
                      request.status === "WAITING_ACCOUNTANT" ? "text-[#3B82F6]" :
                        "text-border"}`
                  }>
                    {request.status === "COMPLETED" ? "ทำจ่ายเรียบร้อยแล้ว" :
                      request.status === "WAITING_ACCOUNTANT" ? "กำลังรอพิจารณา" :
                        "-"}
                  </p>
                </div>
              </div>

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
        title={<div className="bg-danger -m-8 mb-6 p-6 rounded-t-lg"><h2 className="text-text-inverse text-xl font-medium">หมายเหตุการส่งกลับ</h2></div>}
        size="md"
        footer={
          <div className="flex justify-center gap-4 w-full">
            <Button variant="secondary" onClick={() => setRejectModalOpen(false)} disabled={rejectLoading} className="px-8 py-2">กลับ</Button>
            <Button variant="dangerSolid" onClick={handleReject} loading={rejectLoading} className="px-8 py-2">ยืนยัน</Button>
          </div>
        }
      >
        <div className="px-2 pb-4">
          <textarea
            className="w-full bg-surface border border-border-input rounded-md p-4 text-sm text-text min-h-[150px] focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            placeholder="พิมพ์สาเหตุการส่งกลับแก้ไข..."
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
          />
          {rejectError && <p className="text-danger text-sm mt-2">{rejectError}</p>}
        </div>
      </Modal>
    </div>
  );
}