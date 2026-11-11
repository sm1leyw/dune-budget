"use client";
/**
 * components/request-form/useFormData.ts — ดึงข้อมูลจาก store ที่ฟอร์มต้องใช้ · เจ้าของ: คนที่ 2
 * -----------------------------------------------------------------------------
 * แยกไว้ให้ step ต่าง ๆ ไม่ต้องเรียก store เอง (อ่านอย่างเดียว ไม่แก้ข้อมูล)
 *
 * useFormData(values, user, editingId?) ส่งออก:
 *   projectOptions     โครงการที่ "ดำเนินการอยู่" สำหรับ <Select> พร้อมงบคงเหลือในชื่อ
 *   categoryOptions    หมวดของโครงการที่เลือก พร้อมงบคงเหลือในชื่อ
 *   project            โครงการที่เลือก | undefined
 *   categoryRemaining  งบคงเหลือของหมวดที่เลือก | undefined
 *   eligibleAdvances   ใบยืม (ตาราง A) ของผู้ใช้ที่ "จ่ายแล้ว" และยังไม่มีใบคืนเงินที่ยังไม่ยกเลิก
 *   advance            ใบยืมที่เลือก (ตาราง B) | undefined
 *   validationContext  ส่งให้ validateStep() ได้เลย
 */
import { useMemo } from "react";
import { getCategoryBudget, getProjectBudget } from "@/lib/budget";
import { formatNumber } from "@/lib/format";
import { useAdjustments, useProjects } from "@/store/projects";
import { useRequests } from "@/store/requests";
import type { User } from "@/types";
import type { RequestFormValues } from "./formModel";
import type { ValidationContext } from "./validation";

export function useFormData(values: RequestFormValues, user: User, editingId?: string) {
  const projects = useProjects();
  const adjustments = useAdjustments();
  const requests = useRequests();

  return useMemo(() => {
    // ไม่นับคำขอที่กำลังแก้ไข (กันกรณีนับยอดของตัวเองซ้ำ)
    const others = requests.filter((r) => r.id !== editingId);
    const active = projects.filter((p) => p.status === "ACTIVE");

    const projectOptions = active.map((p) => ({
      value: p.id,
      label: `${p.name} (คงเหลือ ${formatNumber(getProjectBudget(p, others, adjustments).remaining)})`,
    }));

    const project = projects.find((p) => p.id === values.projectId);
    const categoryOptions = (project?.categories ?? []).map((c) => ({
      value: c.id,
      label: `${c.name} (คงเหลือ ${formatNumber(getCategoryBudget(project!, c.id, others, adjustments).remaining)})`,
    }));
    const categoryRemaining =
      project && values.categoryId ? getCategoryBudget(project, values.categoryId, others, adjustments).remaining : undefined;

    const clearedIds = new Set(
      others.filter((r) => r.type === "CLEARANCE" && r.status !== "CANCELLED" && r.advanceRefId).map((r) => r.advanceRefId),
    );
    const eligibleAdvances = requests
      .filter((r) => r.requesterId === user.id && r.type === "ADVANCE" && r.status === "COMPLETED" && !clearedIds.has(r.id))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const advance = eligibleAdvances.find((r) => r.id === values.advanceRefId);

    const validationContext: ValidationContext = {
      categoryRemaining,
      advance,
      hasEligibleAdvance: eligibleAdvances.length > 0,
    };

    return { projectOptions, categoryOptions, project, categoryRemaining, eligibleAdvances, advance, validationContext };
  }, [projects, adjustments, requests, editingId, user.id, values.projectId, values.categoryId, values.advanceRefId]);
}

export type FormData = ReturnType<typeof useFormData>;
