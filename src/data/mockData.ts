import { User, Project, ReimburseRequest } from "../types";

export const MOCK_USERS: User[] = [
  {
    username: "emp_it",
    fullname: "ธนพล ศรีสวัสดิ์",
    department: "ฝ่ายเทคโนโลยีสารสนเทศ IT",
    role: "employee",
    employeeId: "68014739",
    email: "thanakorn.you@spumail.net",
  },
  {
    username: "head_it",
    fullname: "สมศักดิ์ หัวหน้าไอที",
    department: "ฝ่ายเทคโนโลยีสารสนเทศ IT",
    role: "dept_head",
    employeeId: "68010001",
    email: "somsak.it@spumail.net",
  },
  {
    username: "exec_somchai",
    fullname: "สมชาย ศรีเผือก",
    department: "ผู้บริหารฝ่าย IT",
    role: "executive",
    employeeId: "68000005",
    email: "somchai.exec@spumail.net",
  },
  {
    username: "acc_sommai",
    fullname: "สมหมาย ศรีสุข",
    department: "ฝ่ายการเงินและบัญชี",
    role: "accountant",
    employeeId: "68000008",
    email: "sommai.acc@spumail.net",
  },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "DUNE-001",
    name: "งานสัมมนาลูกค้าประจำปี",
    scope: "company",
    departments: ["ส่วนกลาง (ทุกแผนก)"],
    startDate: "2569-11-01",
    endDate: "2569-12-30",
    totalBudget: 440000,
    usedBudget: 45000,
    reservedBudget: 4500,
    status: "active",
    docs: [
      { name: "บันทึกข้อความอนุมัติโครงการ_โดเรมอน1.png", type: "image/svg+xml", dataUrl: "https://api.iconify.design/fluent-emoji:cat-face.svg" },
      { name: "แผนงานและงบประมาณ_โดเรมอน2.png", type: "image/svg+xml", dataUrl: "https://api.iconify.design/fluent-emoji:cat-face.svg" }
    ],
    categories: [
      { id: "cat-1", name: "ค่าสถานที่/การเดินทาง", allocated: 120000, used: 45000, reserved: 0 },
      { id: "cat-2", name: "ค่าอาหาร", allocated: 60000, used: 0, reserved: 4500 },
      { id: "cat-3", name: "ค่าวัสดุ", allocated: 20000, used: 0, reserved: 0 },
    ],
  },
  {
    id: "DUNE-002",
    name: "ปรับปรุงระบบไอที",
    scope: "dept",
    departments: ["ฝ่ายเทคโนโลยีสารสนเทศ IT"],
    startDate: "2569-11-01",
    endDate: "2569-12-30",
    totalBudget: 240000,
    usedBudget: 0,
    reservedBudget: 0,
    status: "active",
    docs: [],
    categories: [
      { id: "cat-2-1", name: "ค่าอุปกรณ์เครือข่าย", allocated: 140000, used: 0, reserved: 0 },
      { id: "cat-2-2", name: "ค่าซอฟต์แวร์ License", allocated: 100000, used: 0, reserved: 0 },
    ],
  },
];

export const INITIAL_REQUESTS: ReimburseRequest[] = [
  {
    id: "REQ-2026-0005",
    applicantUsername: "emp_it",
    applicantName: "ธนพล ศรีสวัสดิ์",
    applicantDepartment: "ฝ่ายเทคโนโลยีสารสนเทศ IT",
    tableType: "table_a",
    projectId: "DUNE-001",
    projectName: "โครงการสัมมนาและพัฒนาบุคลากรประจำปี",
    categoryId: "cat-1",
    categoryName: "ค่าสถานที่/การเดินทาง",
    startDate: "2569-11-02",
    endDate: "2569-11-26",
    notes: "เพื่อจ่ายเป็นค่าเช่าสถานที่ ห้องประชุม พร้อมค่าอาหารกลางวันและเครื่องดื่ม",
    totalAmount: 12000,
    status: "pending",
    currentStepRole: "dept_head",
    createdAt: "02/11/2569",
    generalItems: [
      { id: "g1", description: "เอกสารค่าสถานที่", date: "02/11/2569", amount: 10000, fileName: "receipt-location.pdf" }
    ],
    travelItems: [
      { id: "t1", date: "02/11/2569", fromTo: "เดินทางไปโรงแรม", oil: 2000, taxi: 0, bts: 0, parking: 0, otherText: "", otherAmt: 0, total: 2000, fileName: "slip-oil.pdf" }
    ]
  }
];