/**
 * config/routes.ts — รายการหน้าทั้งหมดของระบบ (เจ้าของ: คนที่ 1)
 * -----------------------------------------------------------------------------
 * ไฟล์นี้คือ "สัญญา" ว่าหน้าไหนอยู่ path ไหน ใครเป็นเจ้าของ role ไหนเข้าได้
 * ถูกใช้โดย:
 *   - Header           → แสดงชื่อหน้า + breadcrumb
 *   - AppFrame         → กันไม่ให้ role ที่ไม่มีสิทธิ์เข้าหน้า
 *   - PagePlaceholder  → แสดงว่าใครต้องทำหน้านี้ และต้องทำอะไร
 *   - navigation.ts    → เมนูด้านซ้ายใช้ path จากที่นี่
 *
 * ส่งออก:
 *   ROUTES                 RouteMeta[] ทุกหน้า
 *   PATHS                  path ที่ใช้บ่อย เช่น PATHS.requestDetail("REQ-2026-0001")
 *   matchRoute(pathname)   → RouteMeta | undefined  (รองรับ path ที่มี [id])
 *   canAccess(route, role) → boolean
 *
 * จะเพิ่มหน้าใหม่: เพิ่มใน ROUTES ก่อน แล้วค่อยสร้างไฟล์ใน src/app (แจ้งคนที่ 1 ใน PR)
 */
import type { UserRole } from "@/types";

export type Owner = "คนที่ 1" | "คนที่ 2" | "คนที่ 3" | "คนที่ 4" | "คนที่ 5";

export interface RouteMeta {
  /** path แบบ Next.js เช่น "/requests/[id]" */
  path: string;
  /** ชื่อหน้า แสดงบน Header */
  title: string;
  /** path ของหน้าแม่ สำหรับ breadcrumb (ไม่มี = เป็นหน้าระดับบนสุด) */
  parent?: string;
  /** role ที่เข้าได้ (ไม่ใส่ = ทุก role ที่ login แล้ว) */
  roles?: UserRole[];
  owner: Owner;
  /** สิ่งที่ต้องทำในหน้านี้ (แสดงในหน้า placeholder ให้เจ้าของดู) */
  todo: string[];
  /** ฟังก์ชัน/ไฟล์ที่ควรใช้ในหน้านี้ */
  uses?: string[];
}

const APPROVERS: UserRole[] = ["DEPT_HEAD", "EXECUTIVE", "ACCOUNTANT"];

export const PATHS = {
  login: "/login",
  dashboard: "/dashboard",
  profile: "/profile",
  newRequest: "/requests/new",
  requestDetail: (id: string) => `/requests/${id}`,
  editRequest: (id: string) => `/requests/${id}/edit`,
  myRequests: "/my-requests",
  approvals: "/approvals",
  approvalDetail: (id: string) => `/approvals/${id}`,
  projects: "/projects",
  newProject: "/projects/new",
  projectDetail: (id: string) => `/projects/${id}`,
  adjustProject: (id: string) => `/projects/${id}/adjust`,
  adjustments: "/projects/adjustments",
  reports: "/reports",
} as const;

export const ROUTES: RouteMeta[] = [
  // ---------------------------------------------------------------- คนที่ 1
  { path: "/dashboard", title: "หน้าหลัก", owner: "คนที่ 1", todo: ["เสร็จแล้ว"] },
  { path: "/profile", title: "โปรไฟล์", owner: "คนที่ 1", todo: ["เสร็จแล้ว"] },

  // ---------------------------------------------------------------- คนที่ 2 ฟอร์มยื่นคำขอ
  {
    path: "/requests/new",
    title: "ยื่นขอเบิกเงิน",
    owner: "คนที่ 2",
    todo: [
      "ฟอร์ม 4 ขั้นด้วย <Stepper>: 1 เลือกประเภท (เบิกล่วงหน้า/เคลียร์ค่าใช้จ่าย) · 2 ข้อมูลคำขอ · 3 แนบหลักฐาน · 4 ตรวจสอบและยืนยัน",
      "ขั้น 2: เลือกโครงการ → หมวดงบ (useProjects) · วัตถุประสงค์ · วันที่เริ่ม–สิ้นสุด · รายการค่าใช้จ่ายหลายแถว",
      "แสดงงบคงเหลือของหมวด และกล่องเตือนสีส้มเมื่อยอดขอเกินงบ (getCategoryBudget, getOverBudgetAmount)",
      "ขั้น 3: แนบไฟล์ (เก็บแค่ชื่อไฟล์ใน fileName ช่วงยังไม่มี backend)",
      "กดยืนยัน → createRequest(input, user) แล้วไปหน้า /requests/[id] · ปุ่มยืนยันใส่ loading กันกดซ้ำ",
    ],
    uses: ["store/requests: createRequest", "store/projects: useProjects", "lib/budget", "ui: Stepper, Field, Input, Select, Button"],
  },
  {
    path: "/requests/[id]/edit",
    title: "แก้ไขคำขอ",
    parent: "/my-requests",
    owner: "คนที่ 2",
    todo: [
      "ใช้ฟอร์มเดียวกับ /requests/new โดยเติมค่าจากคำขอเดิม (useRequest(id))",
      "เข้าได้เฉพาะเมื่อ canEdit(request, user) เป็น true (เจ้าของคำขอ + สถานะส่งกลับแก้ไข) ไม่งั้นแสดงข้อความแล้วมีปุ่มกลับ",
      "แสดงหมายเหตุที่ถูกส่งกลับ (request.sentBackNote) ด้านบนเป็นกล่องสีแดงอ่อน",
      "กดยืนยัน → resubmitRequest(id, input, user)",
    ],
    uses: ["store/requests: useRequest, resubmitRequest", "lib/workflow: canEdit"],
  },

  // ---------------------------------------------------------------- คนที่ 3 คำขอของฉัน + รายงาน
  {
    path: "/my-requests",
    title: "คำขอของฉัน",
    owner: "คนที่ 3",
    todo: [
      "ตารางคำขอที่ requesterId === user.id เรียงใหม่สุดก่อน",
      "<FilterBar> ค้นหาเลขที่/ชื่อโครงการ · กรองสถานะ · กรองโครงการ · ช่วงวันที่",
      "คอลัมน์: เลขที่ · วันที่ยื่น · โครงการ · จำนวนเงิน (ชิดขวา) · สถานะ (<StatusBadge>) · ปุ่ม 'ดูรายละเอียด'",
    ],
    uses: ["store/requests: useRequests", "store/projects: getProjectById", "ui: FilterBar, Table, StatusBadge"],
  },
  {
    path: "/requests/[id]",
    title: "รายละเอียดคำขอ",
    parent: "/my-requests",
    owner: "คนที่ 3",
    todo: [
      "แสดงข้อมูลคำขอ รายการค่าใช้จ่าย ไฟล์แนบ และไทม์ไลน์จาก request.history",
      "ถ้าสถานะส่งกลับแก้ไข: แสดงหมายเหตุ + ปุ่ม 'แก้ไขคำขอ' (ไป /requests/[id]/edit) + ปุ่ม 'ยกเลิกคำขอ' (danger)",
      "ยกเลิกคำขอ → <ConfirmModal tone='danger'> → cancelRequest(id, user)",
      "ถ้าไม่พบคำขอหรือไม่ใช่เจ้าของ → <EmptyState> พร้อมปุ่มกลับ",
    ],
    uses: ["store/requests: useRequest, cancelRequest", "lib/workflow: canEdit, canCancel", "ui: ConfirmModal, StatusBadge"],
  },
  {
    path: "/reports",
    title: "รายงานงบประมาณองค์กร",
    roles: ["ACCOUNTANT", "EXECUTIVE"],
    owner: "คนที่ 3",
    todo: [
      "สรุปงบรวมทุกโครงการ: งบที่ได้รับ · ใช้ไปแล้ว · กันไว้ (รออนุมัติ) · คงเหลือ",
      "ตารางแยกโครงการ/หมวด พร้อมแถบสัดส่วนการใช้งบ",
      "กรองตามโครงการและช่วงวันที่",
    ],
    uses: ["lib/budget: getProjectBudget, getCategoryBudget", "store/projects, store/requests"],
  },

  // ---------------------------------------------------------------- คนที่ 4 การอนุมัติ
  {
    path: "/approvals",
    title: "รออนุมัติ / ประวัติการอนุมัติ",
    roles: APPROVERS,
    owner: "คนที่ 4",
    todo: [
      "<Tabs>: 'รอคุณพิจารณา (n)' = คำขอที่ isMyTurn(req, user) · 'ประวัติการพิจารณา' = คำขอที่ history มี byUserId === user.id",
      "บัญชีใช้ชื่อแท็บ 'รอทำจ่าย' / 'ประวัติการทำจ่าย'",
      "<FilterBar> ค้นหา · กรองโครงการ · ช่วงวันที่",
      "แถวตาราง: ปุ่ม 'ตรวจสอบ' → /approvals/[id]",
    ],
    uses: ["lib/workflow: isMyTurn", "store/requests: useRequests", "ui: Tabs, FilterBar, Table, StatusBadge"],
  },
  {
    path: "/approvals/[id]",
    title: "ตรวจสอบคำขอ",
    parent: "/approvals",
    roles: APPROVERS,
    owner: "คนที่ 4",
    todo: [
      "แสดงข้อมูลคำขอ + งบคงเหลือของหมวด (เตือนถ้าเกินงบ)",
      "ถ้า isMyTurn: ปุ่ม 'ส่งกลับแก้ไข' (danger) ซ้าย · 'อนุมัติ' หรือ 'ยืนยันทำจ่าย' (primary) ขวา",
      "ส่งกลับแก้ไข → <Modal> มี <Textarea> หมายเหตุ (บังคับกรอก) → sendBackRequest(id, user, note)",
      "อนุมัติ/ทำจ่าย → <ConfirmModal> → approveRequest(id, user)",
      "ถ้าไม่ใช่ตาของผู้ใช้: แสดงอย่างเดียว ไม่มีปุ่ม",
    ],
    uses: ["store/approvals: approveRequest, sendBackRequest", "lib/workflow: isMyTurn", "ui: Modal, ConfirmModal, Textarea"],
  },

  // ---------------------------------------------------------------- คนที่ 5 โครงการ/งบ
  {
    path: "/projects",
    title: "โครงการและงบประมาณ",
    owner: "คนที่ 5",
    todo: [
      "การ์ด/ตารางโครงการ: ชื่อ · ระยะเวลา · งบรวม · คงเหลือ · สถานะ (ดำเนินการอยู่/เสร็จสิ้นแล้ว)",
      "ค้นหา + กรองสถานะ",
      "บัญชีเห็นปุ่ม 'เพิ่มโครงการ' (primary) มุมขวาบน",
    ],
    uses: ["store/projects: useProjects", "lib/budget: getProjectBudget"],
  },
  {
    path: "/projects/new",
    title: "เพิ่มโครงการ",
    parent: "/projects",
    roles: ["ACCOUNTANT"],
    owner: "คนที่ 5",
    todo: ["ฟอร์มชื่อ วัตถุประสงค์ แผนก ระยะเวลา และหมวดงบหลายแถว", "บันทึก → createProject() (เพิ่มใน store/projects.ts)"],
    uses: ["store/projects (เพิ่ม createProject)", "ui: Field, Input, Button"],
  },
  {
    path: "/projects/[id]",
    title: "รายละเอียดโครงการ",
    parent: "/projects",
    owner: "คนที่ 5",
    todo: [
      "งบแยกหมวด (getCategoryBudget) + รายการคำขอของโครงการ",
      "บัญชีเห็นปุ่ม 'ปรับปรุงงบประมาณ' และ 'เสร็จสิ้นโครงการ' (ConfirmModal → completeProject)",
    ],
    uses: ["store/projects: getProjectById", "lib/budget: getCategoryBudget"],
  },
  {
    path: "/projects/[id]/adjust",
    title: "ปรับปรุงงบประมาณโครงการ",
    parent: "/projects",
    roles: ["ACCOUNTANT"],
    owner: "คนที่ 5",
    todo: ["เลือกหมวด · จำนวนเงินเพิ่ม/ลด · เหตุผล (บังคับ)", "บันทึก → adjustBudget() (เพิ่มใน store/projects.ts)"],
    uses: ["store/projects (เพิ่ม adjustBudget)"],
  },
  {
    path: "/projects/adjustments",
    title: "ประวัติการปรับงบ / เพิ่มโครงการ",
    roles: ["ACCOUNTANT"],
    owner: "คนที่ 5",
    todo: ["ตารางจาก useAdjustments(): วันที่ · โครงการ · หมวด · จำนวน (+/-) · เหตุผล · ผู้ทำ", "ค้นหา + กรองโครงการ + ช่วงวันที่"],
    uses: ["store/projects: useAdjustments", "store/session: getUserById"],
  },
];

/** แปลง "/requests/[id]/edit" → RegExp ที่จับ "/requests/REQ-1/edit" */
function toRegExp(path: string): RegExp {
  return new RegExp(`^${path.replace(/\[[^\]]+\]/g, "[^/]+")}/?$`);
}

/**
 * หา meta ของหน้าจาก pathname จริง
 * รับเข้า: "/requests/REQ-2026-0001" · ส่งออก: RouteMeta ของ "/requests/[id]" หรือ undefined
 * (path ที่ไม่มี [id] จะถูกเลือกก่อน เช่น /projects/new ไม่ชนกับ /projects/[id])
 */
export function matchRoute(pathname: string): RouteMeta | undefined {
  const exact = ROUTES.find((r) => r.path === pathname);
  if (exact) return exact;
  return ROUTES.find((r) => !r.path.includes("[") ? false : toRegExp(r.path).test(pathname));
}

/** role นี้เข้าหน้านี้ได้ไหม */
export function canAccess(route: RouteMeta | undefined, role: UserRole): boolean {
  return !route?.roles || route.roles.includes(role);
}
