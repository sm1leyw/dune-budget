export type UserRole = "employee" | "dept_head" | "executive" | "accountant";

export interface User {
  username: string;
  fullname: string;
  department: string;
  role: UserRole;
  employeeId: string;
  email: string;
}

export interface ProjectCategory {
  id: string;
  name: string;
  allocated: number;
  used: number;
  reserved: number;
}

export interface ProjectDoc {
  name: string;
  type: string;
  dataUrl: string;
}

export interface Project {
  id: string;
  name: string;
  scope: "company" | "dept";
  departments: string[];
  startDate: string;
  endDate: string;
  totalBudget: number;
  usedBudget: number;
  reservedBudget: number;
  status: "active" | "cancelled";
  docs: ProjectDoc[];
  categories: ProjectCategory[];
}

export interface RequestItem {
  id: string;
  description: string;
  date: string;
  amount: number;
  fileName?: string;
  fileData?: string;
}

export interface TravelItem {
  id: string;
  date: string;
  fromTo: string;
  oil: number;
  taxi: number;
  bts: number;
  parking: number;
  otherText: string;
  otherAmt: number;
  total: number;
  fileName?: string;
  fileData?: string;
}

export interface ReimburseRequest {
  id: string;
  applicantUsername: string;
  applicantName: string;
  applicantDepartment: string;
  tableType: "table_a" | "table_b";
  advanceRefId?: string;
  projectId: string;
  projectName: string;
  categoryId: string;
  categoryName: string;
  startDate: string;
  endDate: string;
  notes: string;
  delayReason?: string;
  generalItems: RequestItem[];
  travelItems: TravelItem[];
  totalAmount: number;
  borrowedAmount?: number;
  status: "pending" | "approved" | "rejected";
  currentStepRole: UserRole;
  rejectReason?: string;
  createdAt: string;
}