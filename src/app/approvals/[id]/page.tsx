"use client";
/**
 * /approvals/[id] — ตรวจสอบคำขอ (ฝั่งผู้อนุมัติ/บัญชี) · เจ้าของ: คนที่ 4 · เข้าได้: หัวหน้าแผนก, ผู้บริหาร, บัญชี
 * -----------------------------------------------------------------------------
 * - แสดงคำขอด้วย <RequestDetail> (ข้อมูล · ลำดับขั้นการอนุมัติ · ยอดเงิน · เอกสารแนบ · ข้อมูลทำจ่าย)
 * - การ์ด "งบประมาณหมวดนี้" แสดงงบจัดสรร/ใช้แล้ว/จองไว้/คงเหลือ และเตือนเมื่อหมวดติดลบ (เกินงบ)
 * - ถ้า isMyTurn:
 *     หัวหน้า/ผู้บริหาร → ปุ่ม "ส่งกลับแก้ไข" (danger) · "อนุมัติ" (primary)
 *     บัญชี            → ฟอร์มข้อมูลการทำจ่าย (วิธีจ่าย · เลขอ้างอิง · ยอด · วันที่ · ไฟล์หลักฐาน) + "ยืนยันทำจ่าย"
 *   ส่งกลับแก้ไข → <Modal> + <Textarea> หมายเหตุ (บังคับ) → sendBackRequest(id, user, note)
 *   อนุมัติ/ทำจ่าย → <ConfirmModal> → approveRequest(id, user, paymentInfo?)
 * - ไม่ใช่ตาของผู้ใช้ → แสดงอย่างเดียว มีแค่ปุ่มกลับ
 */
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Paperclip } from "lucide-react";
import {
  Button,
  ButtonLink,
  Card,
  ConfirmModal,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  StatusBadge,
  Textarea,
  AttachmentChip,
} from "@/components/ui";
import { PAYMENT_METHOD_LABEL, RequestDetail } from "@/components/requests/RequestDetail";
import { PATHS } from "@/config/routes";
import { getCategoryBudget } from "@/lib/budget";
import { cn } from "@/lib/cn";
import { formatBaht, formatNumber } from "@/lib/format";
import { isMyTurn } from "@/lib/workflow";
import { approveRequest, sendBackRequest } from "@/store/approvals";
import { getCategoryName, useAdjustments, useProjects } from "@/store/projects";
import { useRequest, useRequests } from "@/store/requests";
import { useCurrentUser } from "@/store/session";
import { ACCEPT_ATTR, MAX_FILE_MB, prepareAttachment } from "@/lib/files";
import type { Attachment, PaymentInfo, ReimburseRequest, User } from "@/types";

const PAYMENT_METHOD_OPTIONS = (Object.keys(PAYMENT_METHOD_LABEL) as PaymentInfo["method"][]).map((value) => ({
  value,
  label: PAYMENT_METHOD_LABEL[value],
}));

function todayLocalISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ApprovalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useCurrentUser();
  const request = useRequest(id);

  if (!user) return null;

  if (!request) {
    return (
      <Card>
        <EmptyState
          title="ไม่พบคำขอนี้"
          description={`ไม่พบคำขอเลขที่ ${id} หรือคำขอถูกยกเลิกไปแล้ว`}
          action={
            <ButtonLink href={PATHS.approvals} variant="secondary" icon={<ArrowLeft />}>
              กลับรายการรออนุมัติ
            </ButtonLink>
          }
        />
      </Card>
    );
  }

  // key: เปลี่ยนคำขอ/สถานะแล้วล้างค่าที่กรอกค้างไว้ในฟอร์ม
  return <ApprovalDetail key={`${request.id}-${request.updatedAt}`} request={request} user={user} />;
}

function ApprovalDetail({ request, user }: { request: ReimburseRequest; user: User }) {
  const router = useRouter();
  const myTurn = isMyTurn(request, user);
  const isAccountant = user.role === "ACCOUNTANT";

  // ส่งกลับแก้ไข
  const [sendBackOpen, setSendBackOpen] = useState(false);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [sendingBack, setSendingBack] = useState(false);

  // อนุมัติ / ทำจ่าย
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [actionError, setActionError] = useState("");

  // ฟอร์มทำจ่าย (บัญชี)
  const [method, setMethod] = useState<PaymentInfo["method"]>("TRANSFER");
  const [refNumber, setRefNumber] = useState("");
  const [amount, setAmount] = useState(String(request.totalAmount));
  const [payDate, setPayDate] = useState(todayLocalISO);
  const [payFile, setPayFile] = useState<Attachment | null>(null);
  const [readingFile, setReadingFile] = useState(false);
  const [payErrors, setPayErrors] = useState<{ amount?: string; date?: string; file?: string }>({});

  function validatePayment(): boolean {
    const errors: typeof payErrors = {};
    const value = Number(amount);
    if (!amount.trim() || !Number.isFinite(value) || value <= 0) errors.amount = "กรุณาระบุยอดที่จ่ายมากกว่า 0";
    else if (value > request.totalAmount) errors.amount = `ยอดที่จ่ายต้องไม่เกินยอดขอเบิก (${formatBaht(request.totalAmount)})`;
    if (!payDate) errors.date = "กรุณาเลือกวันที่จ่าย";
    if (!payFile) errors.file = payErrors.file ?? "กรุณาแนบไฟล์หลักฐานการทำจ่าย";
    setPayErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function openConfirm() {
    setActionError("");
    if (isAccountant && !validatePayment()) return;
    setConfirmOpen(true);
  }

  async function handleApprove() {
    setApproving(true);
    setActionError("");
    try {
      let paymentInfo: PaymentInfo | undefined;
      if (isAccountant && payFile) {
        paymentInfo = {
          method,
          refNumber: refNumber.trim() || undefined,
          amount: Number(amount),
          date: payDate,
          fileName: payFile.name,
          fileData: payFile.data,
        };
      }
      approveRequest(request.id, user, paymentInfo);
      setConfirmOpen(false);
      router.push(PATHS.approvals);
    } catch (e) {
      setConfirmOpen(false);
      setActionError((e as Error).message);
      setApproving(false);
    }
  }

  function handleSendBack() {
    if (!note.trim()) {
      setNoteError("กรุณาระบุหมายเหตุการส่งกลับแก้ไข");
      return;
    }
    setSendingBack(true);
    try {
      sendBackRequest(request.id, user, note);
      setSendBackOpen(false);
      router.push(PATHS.approvals);
    } catch (e) {
      setNoteError((e as Error).message);
      setSendingBack(false);
    }
  }

  const approveLabel = isAccountant ? "ยืนยันทำจ่าย" : "อนุมัติ";

  return (
    <>
      {actionError && (
        <p role="alert" className="mb-4 rounded-md border-[1.5px] border-danger bg-danger/5 p-3 text-danger">
          {actionError}
        </p>
      )}

      <RequestDetail
        request={request}
        actions={
          myTurn ? (
            <>
              <Button variant="danger" onClick={() => setSendBackOpen(true)}>
                ส่งกลับแก้ไข
              </Button>
              <ButtonLink href={PATHS.approvals} variant="secondary">
                กลับ
              </ButtonLink>
              <Button onClick={openConfirm}>{approveLabel}</Button>
            </>
          ) : (
            <ButtonLink href={PATHS.approvals} variant="secondary" icon={<ArrowLeft />}>
              กลับรายการ
            </ButtonLink>
          )
        }
      >
        <CategoryBudgetCard request={request} />

        {!myTurn && (
          <p className="flex flex-wrap items-center gap-2 text-caption text-text-muted">
            สถานะปัจจุบัน <StatusBadge status={request.status} /> · คำขอนี้ไม่ได้อยู่ในขั้นที่คุณต้องพิจารณา จึงดูได้อย่างเดียว
          </p>
        )}

        {myTurn && isAccountant && (
          <Card title="ข้อมูลการทำจ่าย" description="บันทึกหลักฐานการโอน/จ่ายเงินจริง (การโอนเงินทำนอกระบบ)">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="วิธีการจ่าย" htmlFor="pay-method" required>
                <Select
                  id="pay-method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentInfo["method"])}
                  options={PAYMENT_METHOD_OPTIONS}
                />
              </Field>
              <Field label="เลขที่อ้างอิง" htmlFor="pay-ref" hint="เช่น เลขที่รายการโอน หรือเลขที่เช็ค (ไม่บังคับ)">
                <Input id="pay-ref" value={refNumber} onChange={(e) => setRefNumber(e.target.value)} placeholder="เช่น TRX-20261120-001" />
              </Field>
              <Field label="ยอดที่จ่าย (บาท)" htmlFor="pay-amount" required error={payErrors.amount}>
                <Input
                  id="pay-amount"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  invalid={!!payErrors.amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>
              <Field label="วันที่จ่าย" htmlFor="pay-date" required error={payErrors.date}>
                <Input id="pay-date" type="date" value={payDate} invalid={!!payErrors.date} onChange={(e) => setPayDate(e.target.value)} />
              </Field>
              <Field
                label="ไฟล์หลักฐานการทำจ่าย"
                htmlFor="pay-file"
                required
                className="md:col-span-2"
                error={payErrors.file}
                hint={`PDF, PNG หรือ JPG ไม่เกิน ${MAX_FILE_MB} MB`}
              >
                <label
                  htmlFor="pay-file"
                  className={cn(
                    "flex h-12 cursor-pointer items-center gap-3 rounded-md border-[1.5px] border-dashed bg-surface px-4 text-body transition hover:bg-primary-soft",
                    payErrors.file ? "border-danger" : "border-border-input",
                  )}
                >
                  <Paperclip className="size-5 shrink-0 text-text-muted" aria-hidden />
                  <span className={cn("min-w-0 flex-1 truncate", payFile ? "text-text" : "text-text-muted")}>
                    {readingFile ? "กำลังอ่านไฟล์…" : payFile ? payFile.name : "เลือกไฟล์สลิปหรือหลักฐานการจ่าย"}
                  </span>
                  <span className="shrink-0 font-medium text-primary">{payFile ? "เปลี่ยนไฟล์" : "เลือกไฟล์"}</span>
                </label>
                <input
                  id="pay-file"
                  type="file"
                  accept={ACCEPT_ATTR}
                  className="sr-only"
                  onChange={async (e) => {
                    const input = e.currentTarget;
                    const file = input.files?.[0];
                    input.value = ""; // เลือกไฟล์เดิมซ้ำได้
                    if (!file) return;
                    setReadingFile(true);
                    const result = await prepareAttachment(file);
                    setReadingFile(false);
                    setPayFile(result.attachment ?? null);
                    setPayErrors((prev) => ({ ...prev, file: result.error }));
                  }}
                />
                {payFile && (
                  <div className="mt-2 flex items-center gap-2 text-caption text-text-muted">
                    ตรวจสอบไฟล์ก่อนยืนยัน: <AttachmentChip name={payFile.name} data={payFile.data} />
                  </div>
                )}
              </Field>
            </div>
          </Card>
        )}
      </RequestDetail>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleApprove}
        loading={approving}
        title={isAccountant ? "ยืนยันการทำจ่ายคำขอนี้?" : "ยืนยันการอนุมัติคำขอนี้?"}
        description={
          isAccountant
            ? `คำขอ ${request.id} จะเปลี่ยนเป็น "จ่ายแล้ว" ยอด ${formatBaht(Number(amount) || 0)} และตัดเป็นยอดใช้จริงของหมวด`
            : `คำขอ ${request.id} (${formatBaht(request.totalAmount)}) จะถูกส่งต่อไปยังฝ่ายบัญชีเพื่อทำจ่าย`
        }
        confirmLabel={approveLabel}
        cancelLabel="กลับ"
      />

      <Modal
        open={sendBackOpen}
        onClose={() => {
          setSendBackOpen(false);
          setNoteError("");
        }}
        title="หมายเหตุการส่งกลับแก้ไข"
        description="ผู้ขอจะเห็นหมายเหตุนี้บนหน้าคำขอ แล้วแก้ไขยื่นใหม่หรือยกเลิกคำขอได้"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSendBackOpen(false)} disabled={sendingBack}>
              กลับ
            </Button>
            <Button variant="dangerSolid" onClick={handleSendBack} loading={sendingBack}>
              ยืนยันส่งกลับแก้ไข
            </Button>
          </>
        }
      >
        <Field label="เหตุผลที่ส่งกลับ" htmlFor="send-back-note" required error={noteError}>
          <Textarea
            id="send-back-note"
            value={note}
            invalid={!!noteError}
            placeholder="เช่น ใบเสร็จรายการที่ 2 ไม่ชัด กรุณาแนบใหม่"
            onChange={(e) => {
              setNote(e.target.value);
              setNoteError("");
            }}
          />
        </Field>
      </Modal>
    </>
  );
}

/** งบของหมวดที่คำขอนี้เบิก — ผู้อนุมัติใช้ประกอบการตัดสินใจ */
function CategoryBudgetCard({ request }: { request: ReimburseRequest }) {
  const projects = useProjects();
  const requests = useRequests();
  const adjustments = useAdjustments();
  const project = projects.find((p) => p.id === request.projectId);

  const budget = useMemo(
    () => (project ? getCategoryBudget(project, request.categoryId, requests, adjustments) : undefined),
    [project, request.categoryId, requests, adjustments],
  );
  if (!project || !budget) return null;

  const overBy = budget.remaining < 0 ? -budget.remaining : 0;
  const items = [
    { label: "งบจัดสรรของหมวด", value: budget.allocated },
    { label: "ใช้จริงแล้ว", value: budget.used },
    { label: "จองไว้ (รวมคำขอนี้)", value: budget.reserved },
    { label: "คงเหลือ", value: budget.remaining, tone: overBy > 0 ? "danger" : "primary" },
  ];

  return (
    <Card title="งบประมาณของหมวดนี้" description={`${project.name} · ${getCategoryName(project, request.categoryId)}`}>
      <dl className="grid gap-4 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-md bg-primary-soft px-4 py-3">
            <dt className="text-caption text-text-muted">{item.label}</dt>
            <dd
              className={cn(
                "mt-1 text-section font-bold",
                item.tone === "danger" ? "text-danger" : item.tone === "primary" ? "text-primary" : "text-text",
              )}
            >
              {formatNumber(item.value)} <span className="text-caption font-medium text-text-muted">บาท</span>
            </dd>
          </div>
        ))}
      </dl>
      {overBy > 0 && (
        <p role="alert" className="mt-4 flex items-start gap-2 rounded-md border-[1.5px] border-warning bg-warning-soft px-4 py-3 text-caption text-warning-strong">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          หมวดนี้เกินงบ {formatBaht(overBy)} — ควรส่งกลับแก้ไข หรือให้ฝ่ายบัญชีปรับปรุงงบก่อนอนุมัติ
        </p>
      )}
    </Card>
  );
}
