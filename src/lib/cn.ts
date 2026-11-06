/**
 * lib/cn.ts — รวม class ของ Tailwind (เจ้าของ: คนที่ 1)
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * รวม className หลายชุดเข้าด้วยกัน และให้ class ที่มาทีหลังชนะเมื่อซ้ำกัน
 *
 * รับเข้า: string | undefined | false | object แบบ clsx กี่ตัวก็ได้
 * ส่งออก: string เดียว
 *
 * @example
 * cn("px-4 text-text", isActive && "text-primary", className)
 * // ถ้า className = "px-2" ผลลัพธ์จะเป็น "text-primary px-2"
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
