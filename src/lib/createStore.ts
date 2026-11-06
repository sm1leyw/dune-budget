/**
 * lib/createStore.ts — ตัวเก็บข้อมูลกลางที่จำค่าไว้ใน localStorage (เจ้าของ: คนที่ 1)
 * -----------------------------------------------------------------------------
 * ใช้แทน DataContext เดิม: แต่ละเรื่องมี store ของตัวเอง (session, requests, projects)
 * ไม่ต้องห่อ Provider และไม่ต้องติดตั้ง library เพิ่ม
 *
 * วิธีใช้ (คนที่ทำ store ของตัวเอง):
 *   const fooStore = createPersistentStore("dune_foo", initialValue);
 *   fooStore.getState()              // อ่านค่า (นอก component)
 *   fooStore.setState(prev => next)  // เขียนค่า แล้วทุกหน้าที่ใช้อยู่จะอัปเดตเอง
 *   fooStore.useState()              // อ่านค่าใน component (re-render เมื่อค่าเปลี่ยน)
 *
 * ข้อควรระวัง: useState() คืนค่าทั้งก้อน ถ้าต้องกรอง/คำนวณ ให้ทำใน useMemo
 * ห้ามสร้าง array/object ใหม่ใน getState เอง (React จะ render วนไม่จบ)
 */
import { useSyncExternalStore } from "react";

export interface PersistentStore<T> {
  /** อ่านค่าปัจจุบัน (ใช้ได้ทั้งใน/นอก component) */
  getState: () => T;
  /** เขียนค่าใหม่ — รับค่าใหม่ หรือฟังก์ชันที่รับค่าเก่าแล้วคืนค่าใหม่ */
  setState: (next: T | ((prev: T) => T)) => void;
  /** คืนค่าเริ่มต้น (ข้อมูลตัวอย่าง) และล้าง localStorage ของ store นี้ */
  reset: () => void;
  /** hook อ่านค่าใน component */
  useState: () => T;
}

/**
 * สร้าง store ที่จำค่าใน localStorage
 *
 * รับเข้า:
 *   - key: ชื่อ key ใน localStorage เช่น "dune_requests" (ต้องไม่ซ้ำกับ store อื่น)
 *   - initial: ค่าเริ่มต้น (ข้อมูลตัวอย่าง) — ฝั่ง server จะใช้ค่านี้เสมอ
 * ส่งออก: PersistentStore<T>
 */
export function createPersistentStore<T>(key: string, initial: T): PersistentStore<T> {
  let state = initial;
  let loaded = false;
  const listeners = new Set<() => void>();

  function loadOnce() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) state = JSON.parse(raw) as T;
    } catch {
      // localStorage ใช้ไม่ได้ (เช่น private mode) → ใช้ค่าเริ่มต้นต่อไป
    }
  }

  function emit() {
    listeners.forEach((listener) => listener());
  }

  function getState() {
    loadOnce();
    return state;
  }

  function setState(next: T | ((prev: T) => T)) {
    loadOnce();
    state = typeof next === "function" ? (next as (prev: T) => T)(state) : next;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // เขียนไม่ได้ก็ไม่เป็นไร ค่าในหน่วยความจำยังอัปเดต
    }
    emit();
  }

  function reset() {
    state = initial;
    loaded = true;
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    emit();
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function useState() {
    return useSyncExternalStore(subscribe, getState, () => initial);
  }

  return { getState, setState, reset, useState };
}

const noopSubscribe = () => () => {};

/**
 * true เมื่อหน้าเว็บโหลดฝั่ง browser เสร็จแล้ว (อ่าน localStorage ได้แล้ว)
 * ใช้กันการ redirect หรือแสดงข้อมูลผิดในจังหวะแรกที่ยังเป็นค่าจาก server
 *
 * ส่งออก: boolean
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
