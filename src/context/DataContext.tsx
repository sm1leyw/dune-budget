"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, ReimburseRequest, UserRole, RequestStep } from "../types";

interface DataContextType {
  currentUser: User | null;
  login: (email: string) => boolean;
  logout: () => void;
  requests: ReimburseRequest[];
  createRequest: (
    data: Omit<ReimburseRequest, "id" | "requesterEmail" | "requesterName" | "requesterRole" | "requesterDepartment" | "createdAt" | "currentStep">
  ) => void;
  approveRequest: (requestId: string) => void;
  rejectRequest: (requestId: string, reason: string) => void;
}

// 1. บัญชีผู้ใช้ Mock ประจำระบบ
const MOCK_USERS: (User & { password?: string })[] = [
  {
    id: "EMP-001",
    name: "ภูวเนศวร์ อิ่มฤทธา",
    email: "phuvaness.imr@spumail.net",
    role: "ACCOUNTANT",
    department: "ฝ่ายการเงินและบัญชี",
    position: "พนักงานบัญชี",
  },
  {
    id: "EMP-002",
    name: "มนธวัฒน์ ชาญณรงค์",
    email: "montawat.cha@spumail.net",
    role: "DEPT_HEAD",
    department: "ฝ่ายเทคโนโลยีสารสนเทศ IT",
    position: "หัวหน้าแผนก IT",
  },
  {
    id: "EMP-003",
    name: "นันทิพัฒน์ เจนจัด",
    email: "nanthipat.jen@spumail.net",
    role: "ACCOUNTANT",
    department: "ฝ่ายการเงินและบัญชี",
    position: "เจ้าหน้าที่บัญชี",
  },
  {
    id: "EMP-004",
    name: "สุริยา สาสะเดาะห์",
    email: "suriya.saa@spumail.net",
    role: "EXECUTIVE",
    department: "ฝ่ายบริหาร",
    position: "ผู้บริหารระดับสูง",
  },
];

// 2. คำขอจำลองเริ่มต้น
const INITIAL_REQUESTS: ReimburseRequest[] = [
  {
    id: "REQ-2026-0001",
    projectCode: "DUNE-001",
    projectName: "โครงการสัมมนาและพัฒนาบุคลากรประจำปี",
    category: "ค่าสถานที่/การเดินทาง",
    requesterEmail: "phuvaness.imr@spumail.net",
    requesterName: "ภูวเนศวร์ อิ่มฤทธา",
    requesterRole: "ACCOUNTANT",
    requesterDepartment: "ฝ่ายเทคโนโลยีสารสนเทศ IT",
    totalAmount: 4500,
    purpose: "ค่าเดินทางออกปฏิบัติงานด่วน",
    createdAt: "02/11/2569",
    currentStep: "WAITING_ACCOUNTANT",
    items: [{ id: "item-1", name: "ค่าน้ำมันรถ", amount: 4500, date: "02/11/2569" }],
  },
  {
    id: "REQ-2026-0002",
    projectCode: "DUNE-001",
    projectName: "โครงการสัมมนาและพัฒนาบุคลากรประจำปี",
    category: "ค่าสถานที่และอาหารสัมมนา",
    requesterEmail: "phuvaness.imr@spumail.net",
    requesterName: "ภูวเนศวร์ อิ่มฤทธา",
    requesterRole: "ACCOUNTANT",
    requesterDepartment: "ฝ่ายเทคโนโลยีสารสนเทศ IT",
    totalAmount: 32000,
    purpose: "ค่าเช่าห้องประชุมและจัดเลี้ยงสัมมนา",
    createdAt: "02/11/2569",
    currentStep: "WAITING_EXECUTIVE",
    items: [{ id: "item-2", name: "ค่าห้องประชุม", amount: 32000, date: "02/11/2569" }],
  },
];

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<ReimburseRequest[]>(INITIAL_REQUESTS);

  useEffect(() => {
    const savedUser = localStorage.getItem("dune_user");
    const savedRequests = localStorage.getItem("dune_requests");
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    if (savedRequests) setRequests(JSON.parse(savedRequests));
  }, []);

  const login = (email: string): boolean => {
    const user = MOCK_USERS.find((u) => u.email.trim().toLowerCase() === email.trim().toLowerCase());
    if (user) {
      const { password, ...safeUser } = user;
      setCurrentUser(safeUser);
      localStorage.setItem("dune_user", JSON.stringify(safeUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("dune_user");
  };

  // ตรรกะคำนวณ Flow เริ่มต้นตอนยื่นขอเบิก
  const determineInitialStep = (role: UserRole, amount: number): RequestStep => {
    // ผู้บริหารยื่นขอเบิก -> ส่งตรงไปที่บัญชีทำจ่ายทันที
    if (role === "EXECUTIVE") {
      return "WAITING_ACCOUNTANT";
    }

    // หัวหน้าแผนกยื่นขอเบิก
    if (role === "DEPT_HEAD") {
      if (amount <= 30000) {
        return "WAITING_ACCOUNTANT"; // ไม่เกิน 30,000 ไปบัญชีเลย
      }
      return "WAITING_EXECUTIVE"; // เกิน 30,000 ไปผู้บริหาร
    }

    // พนักงานทั่วไป และ บัญชี (ยึด Flow มาตรฐาน)
    if (amount <= 5000) {
      return "WAITING_ACCOUNTANT"; // <= 5,000 ไปบัญชีตรวจสอบ/ทำจ่ายเลย
    } else if (amount <= 30000) {
      return "WAITING_DEPT_HEAD";   // > 5,000 ถึง <= 30,000 ไปหัวหน้าแผนก
    } else {
      return "WAITING_EXECUTIVE";   // > 30,000 ไปผู้บริหารตรง
    }
  };

  const createRequest = (
    data: Omit<ReimburseRequest, "id" | "requesterEmail" | "requesterName" | "requesterRole" | "requesterDepartment" | "createdAt" | "currentStep">
  ) => {
    if (!currentUser) return;

    const initialStep = determineInitialStep(currentUser.role, data.totalAmount);
    const newRequest: ReimburseRequest = {
      ...data,
      id: `REQ-2026-${String(requests.length + 1).padStart(4, "0")}`,
      requesterEmail: currentUser.email,
      requesterName: currentUser.name,
      requesterRole: currentUser.role,
      requesterDepartment: currentUser.department,
      createdAt: new Date().toLocaleDateString("th-TH"),
      currentStep: initialStep,
    };

    const updated = [newRequest, ...requests];
    setRequests(updated);
    localStorage.setItem("dune_requests", JSON.stringify(updated));
  };

  // ตรรกะการอนุมัติส่งต่อตามลำดับ Flow
  const approveRequest = (requestId: string) => {
    const updated = requests.map((req) => {
      if (req.id !== requestId) return req;

      // ป้องกันการอนุมัติคำขอของตัวเอง (กรณีบัญชี)
      if (currentUser?.email === req.requesterEmail && currentUser?.role === "ACCOUNTANT") {
        alert("ไม่สามารถอนุมัติหรือทำจ่ายคำขอของตนเองได้ ต้องให้บัญชีท่านอื่นดำเนินการ");
        return req;
      }

      let nextStep: RequestStep = req.currentStep;

      // หัวหน้าแผนกอนุมัติ -> ส่งต่อบัญชีทำจ่าย
      if (req.currentStep === "WAITING_DEPT_HEAD") {
        nextStep = "WAITING_ACCOUNTANT";
      }
      // ผู้บริหารอนุมัติ -> ส่งต่อบัญชีทำจ่าย
      else if (req.currentStep === "WAITING_EXECUTIVE") {
        nextStep = "WAITING_ACCOUNTANT";
      }
      // บัญชีทำจ่าย -> จบขั้นตอน (Completed)
      else if (req.currentStep === "WAITING_ACCOUNTANT") {
        nextStep = "COMPLETED";
      }

      return { ...req, currentStep: nextStep };
    });

    setRequests(updated);
    localStorage.setItem("dune_requests", JSON.stringify(updated));
  };

  // ส่งกลับแก้ไข -> วิ่งกลับไปหาผู้ขอเบิกทันที
  const rejectRequest = (requestId: string, reason: string) => {
    const updated = requests.map((req) => {
      if (req.id !== requestId) return req;
      return {
        ...req,
        currentStep: "REJECTED" as RequestStep,
        rejectReason: reason,
      };
    });

    setRequests(updated);
    localStorage.setItem("dune_requests", JSON.stringify(updated));
  };

  return (
    <DataContext.Provider
      value={{
        currentUser,
        login,
        logout,
        requests,
        createRequest,
        approveRequest,
        rejectRequest,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};