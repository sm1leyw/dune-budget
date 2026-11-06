/**
 * data/mock/projects.ts — โครงการตัวอย่าง (เจ้าของ: คนที่ 5 — คนที่ 1 ใส่ชุดแรกไว้ให้)
 */
import type { BudgetAdjustment, Project } from "@/types";

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "DUNE-001",
    name: "โครงการสัมมนาและพัฒนาบุคลากรประจำปี",
    purpose: "จัดสัมมนาพัฒนาทักษะและสร้างความสัมพันธ์ของบุคลากรประจำปี 2569",
    departments: ["ส่วนกลาง (ทุกแผนก)"],
    ownerId: "EMP-002",
    startDate: "2026-11-01",
    endDate: "2026-12-30",
    status: "ACTIVE",
    categories: [
      { id: "DUNE-001-C1", name: "ค่าสถานที่/การเดินทาง", allocated: 120_000 },
      { id: "DUNE-001-C2", name: "ค่าสถานที่และอาหารสัมมนา", allocated: 100_000 },
      { id: "DUNE-001-C3", name: "ค่าวัสดุ", allocated: 20_000 },
    ],
  },
  {
    id: "DUNE-002",
    name: "ปรับปรุงระบบไอที",
    purpose: "เปลี่ยนอุปกรณ์เครือข่ายและต่ออายุซอฟต์แวร์",
    departments: ["ฝ่ายเทคโนโลยีสารสนเทศ IT"],
    ownerId: "EMP-002",
    startDate: "2026-11-01",
    endDate: "2026-12-30",
    status: "ACTIVE",
    categories: [
      { id: "DUNE-002-C1", name: "ค่าอุปกรณ์เครือข่าย", allocated: 140_000 },
      { id: "DUNE-002-C2", name: "ค่าซอฟต์แวร์ License", allocated: 100_000 },
    ],
  },
];

export const INITIAL_ADJUSTMENTS: BudgetAdjustment[] = [];
