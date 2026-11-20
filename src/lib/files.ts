/**
 * lib/files.ts — ไฟล์แนบ/หลักฐาน: ตรวจ อ่าน เก็บ และเปิดดู (ใช้ร่วมทุกหน้า)
 * -----------------------------------------------------------------------------
 * ช่วงยังไม่มี backend ไฟล์ถูกเก็บเป็น Base64 Data URL ใน localStorage (ผ่าน store)
 * localStorage จุได้ราว 5 MB ต่อเว็บ จึงจำกัดขนาดไฟล์ละ MAX_FILE_MB และตรวจพื้นที่ก่อนแนบ
 *
 * ส่งออก:
 *   MAX_FILE_MB, MAX_FILE_SIZE, ACCEPTED_FILE_TYPES, ACCEPT_ATTR
 *   validateFile(file)                 → ข้อความผิดพลาด | null  (ชนิด PDF/JPG/PNG และขนาด)
 *   readFileAsDataUrl(file)            → Promise<string>
 *   canStoreInBrowser(dataUrl, extra)  → true ถ้า localStorage ยังมีที่พอเก็บไฟล์นี้
 *   prepareAttachment(file, extra)     → Promise<{ attachment } | { error }>  รวม 3 ขั้นข้างบน
 *   resolveFileData(name, data)        → ที่อยู่ไฟล์สำหรับเปิด (รองรับไฟล์ตัวอย่างใน public/mock-files)
 *   getProjectAttachments(project)     → เอกสารจัดตั้งโครงการ (โครงการตัวอย่างใช้ไฟล์ตัวอย่างถ้าไม่มี)
 *   openAttachment(data)               → เปิดไฟล์ในแท็บใหม่ (เรียกตรงจาก onClick เพื่อไม่ให้โดนบล็อก popup)
 */
import { INITIAL_PROJECTS } from "@/data/mock/projects";
import { INITIAL_REQUESTS } from "@/data/mock/requests";
import type { Attachment, Project } from "@/types";

export const MAX_FILE_MB = 2;
export const MAX_FILE_SIZE = MAX_FILE_MB * 1024 * 1024;
export const ACCEPTED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];
export const ACCEPT_ATTR = ".pdf,.jpg,.jpeg,.png";

/** ตรวจไฟล์แนบ — ส่งออก: ข้อความผิดพลาด หรือ null ถ้าใช้ได้ */
export function validateFile(file: { name: string; type: string; size: number }): string | null {
  const okType = ACCEPTED_FILE_TYPES.includes(file.type) || /\.(pdf|jpe?g|png)$/i.test(file.name);
  if (!okType) return "รองรับเฉพาะไฟล์ PDF, JPG และ PNG";
  if (file.size > MAX_FILE_SIZE) return `ไฟล์มีขนาดเกิน ${MAX_FILE_MB} MB`;
  return null;
}

/** อ่านไฟล์เป็น Base64 Data URL */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

const PROBE_KEY = "__dune_storage_probe";

/**
 * localStorage ยังมีที่พอเก็บไฟล์นี้หรือไม่ — ลองเขียนข้อมูลขนาดเท่าไฟล์แล้วลบทิ้งทันที
 * extraChars = ขนาดไฟล์อื่นที่แนบไว้ในฟอร์มแต่ยังไม่ได้บันทึก (นับรวมด้วย)
 */
export function canStoreInBrowser(dataUrl: string, extraChars = 0): boolean {
  if (typeof window === "undefined") return true;
  try {
    window.localStorage.setItem(PROBE_KEY, "x".repeat(dataUrl.length + extraChars + 1024));
    return true;
  } catch {
    return false;
  } finally {
    try {
      window.localStorage.removeItem(PROBE_KEY);
    } catch {
      /* ignore */
    }
  }
}

/** ตรวจ + อ่าน + เช็กพื้นที่ ในครั้งเดียว — ใช้ตอนผู้ใช้เลือกไฟล์ */
export async function prepareAttachment(
  file: File,
  extraChars = 0,
): Promise<{ attachment: Attachment; error?: undefined } | { attachment?: undefined; error: string }> {
  const problem = validateFile(file);
  if (problem) return { error: problem };
  let data: string;
  try {
    data = await readFileAsDataUrl(file);
  } catch {
    return { error: "อ่านไฟล์ไม่สำเร็จ กรุณาลองใหม่" };
  }
  if (!canStoreInBrowser(data, extraChars)) {
    return { error: "พื้นที่เก็บไฟล์ในเบราว์เซอร์เต็ม กรุณาใช้ไฟล์ที่เล็กลง หรือรีเซ็ตข้อมูลตัวอย่าง" };
  }
  return { attachment: { name: file.name, data } };
}

/** ไฟล์ตัวอย่างของข้อมูลจำลอง (ชื่อไฟล์ → ที่อยู่ใน public/mock-files) */
const MOCK_FILES: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const r of INITIAL_REQUESTS) {
    for (const i of r.items) if (i.fileName && i.fileData) map.set(i.fileName, i.fileData);
    if (r.paymentInfo?.fileData) map.set(r.paymentInfo.fileName, r.paymentInfo.fileData);
  }
  for (const p of INITIAL_PROJECTS) for (const a of p.attachments ?? []) if (a.data) map.set(a.name, a.data);
  return map;
})();

/**
 * ที่อยู่ไฟล์สำหรับเปิดดู — ถ้าข้อมูลไม่มี fileData (เช่น ข้อมูลเก่าที่ค้างใน localStorage
 * ก่อนมีไฟล์ตัวอย่าง) แต่ชื่อตรงกับไฟล์ตัวอย่าง จะใช้ไฟล์ตัวอย่างแทน
 */
export function resolveFileData(name?: string, data?: string): string | undefined {
  if (data) return data;
  return name ? MOCK_FILES.get(name) : undefined;
}

/** เอกสารจัดตั้งโครงการ — ข้อมูลเก่าใน localStorage ของโครงการตัวอย่างอาจยังไม่มี attachments */
export function getProjectAttachments(project: Project | undefined): Attachment[] {
  if (!project) return [];
  return project.attachments ?? INITIAL_PROJECTS.find((p) => p.id === project.id)?.attachments ?? [];
}

/** แปลง Data URL เป็น blob URL (แบบ synchronous) — เปิดไฟล์ใหญ่ได้และไม่โดนบล็อก */
function dataUrlToObjectUrl(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  const header = dataUrl.slice(5, comma); // ตัด "data:"
  const mime = header.split(";")[0] || "application/octet-stream";
  const body = dataUrl.slice(comma + 1);
  const bytes = header.includes(";base64")
    ? Uint8Array.from(atob(body), (c) => c.charCodeAt(0))
    : new TextEncoder().encode(decodeURIComponent(body));
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

/**
 * เปิดไฟล์ในแท็บใหม่ — ต้องเรียกตรงใน onClick (ห้าม await ก่อน) ไม่อย่างนั้นเบราว์เซอร์จะบล็อก popup
 * ส่งออก: true ถ้าเปิดได้
 */
export function openAttachment(data?: string): boolean {
  if (!data) {
    window.alert("ไม่พบไฟล์แนบสำหรับรายการนี้");
    return false;
  }
  let url = data;
  try {
    if (data.startsWith("data:")) url = dataUrlToObjectUrl(data);
  } catch {
    window.alert("ไฟล์นี้เสียหาย เปิดดูไม่ได้");
    return false;
  }
  const win = window.open(url, "_blank");
  if (!win) {
    window.alert("เบราว์เซอร์บล็อกการเปิดแท็บใหม่ กรุณาอนุญาต popup สำหรับเว็บนี้แล้วลองอีกครั้ง");
    return false;
  }
  win.opener = null;
  if (url.startsWith("blob:")) setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}
