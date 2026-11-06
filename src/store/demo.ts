/**
 * store/demo.ts — รีเซ็ตข้อมูลตัวอย่างทั้งหมด (เจ้าของ: คนที่ 1)
 * ตอนนี้ยังไม่มีหน้าไหนเรียกใช้ (เอาปุ่มรีเซ็ตออกจากโปรไฟล์แล้ว) — เก็บไว้ใช้ตอนทดสอบหรือก่อนนำเสนอ เพื่อล้างคำขอที่ลองสร้างไว้ใน localStorage
 */
import { requestsStore } from "@/store/requests";
import { adjustmentsStore, projectsStore } from "@/store/projects";

/** คืนข้อมูลคำขอ โครงการ และการปรับงบ เป็นค่าตัวอย่างตั้งต้น (ไม่ logout) */
export function resetDemoData(): void {
  requestsStore.reset();
  projectsStore.reset();
  adjustmentsStore.reset();
}
