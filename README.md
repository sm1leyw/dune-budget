# Dune Budget — ระบบขอเบิกงบประมาณโครงการ (frontend)

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4
ตอนนี้ทำเฉพาะ frontend: ข้อมูลเก็บใน `localStorage` ของเบราว์เซอร์ (ยังไม่มี backend / Gmail)

## เริ่มใช้งาน

```bash
npm install        # ครั้งแรก หรือหลัง pull แล้ว package.json เปลี่ยน
npm run dev        # เปิด http://localhost:3000
npm test           # unit test กติกาการอนุมัติ (src/**/*.test.ts)
npx tsc --noEmit   # ตรวจ type ก่อนเปิด PR
```

บัญชีทดสอบ (รหัสผ่าน `123`)

| Role | อีเมล |
|---|---|
| พนักงานทั่วไป | phuvaness.imr@spumail.net |
| หัวหน้าแผนก | montawat.cha@spumail.net |
| ผู้บริหาร | suriya.saa@spumail.net |
| ฝ่ายบัญชี | nanthipat.jen@spumail.net |

ลองแล้วข้อมูลเละ → เปิด DevTools → Application → Local Storage → ลบคีย์ที่ขึ้นต้นด้วย `dune_` แล้วรีเฟรช
(หรือเรียก `resetDemoData()` จาก `store/demo.ts` ถ้าทีมอยากทำปุ่มรีเซ็ตเอง)

## โครงสร้างโฟลเดอร์

```
src/
  app/                    หน้าต่าง ๆ (1 โฟลเดอร์ = 1 URL)
  components/
    ui/                   ปุ่ม การ์ด ฟอร์ม ตาราง popup ป้ายสถานะ  ← ใช้ร่วมกันทุกหน้า (คนที่ 1)
    layout/               AppFrame, Sidebar, Header, PageActions, PagePlaceholder (คนที่ 1)
    requests/             RequestTable ตารางคำขอที่ใช้ซ้ำ
  config/
    routes.ts             รายการหน้า + เจ้าของ + role ที่เข้าได้ + สิ่งที่ต้องทำ
    navigation.ts         เมนูด้านซ้ายแยก role
  constants/              ข้อความ role/สถานะ, เกณฑ์เงินอนุมัติ
  data/mock/              ข้อมูลตัวอย่าง (users, projects, requests)
  lib/                    ฟังก์ชันล้วน: format, workflow (กติกาอนุมัติ), budget, cn, createStore
  store/                  ข้อมูลกลาง + ฟังก์ชันแก้ข้อมูล (session, requests, approvals, projects, demo)
  types/                  type ที่ทุกคนใช้ร่วมกัน
docs/STYLE_GUIDE.md       วิธีใช้สี/ตัวอักษร/component ให้ตรง Figma  ← อ่านก่อนเริ่มทำหน้า
```

## ใครทำอะไร

เปิดหน้าที่ยังไม่ได้ทำในเบราว์เซอร์ จะเห็นรายการสิ่งที่ต้องทำ (มาจาก `config/routes.ts`)

| คน | หน้า (src/app/…) | ไฟล์ที่ดูแล |
|---|---|---|
| 1 | login, dashboard, profile | `components/ui`, `components/layout`, `config`, `constants`, `types`, `lib/format`, `lib/createStore`, `store/session`, `app/layout.tsx`, `globals.css` |
| 2 | `requests/new`, `requests/[id]/edit` | ฟอร์มยื่น/แก้ไขคำขอ (เรียก `createRequest`, `resubmitRequest`) |
| 3 | `my-requests`, `requests/[id]`, `reports` | `store/requests.ts`, `data/mock/requests.ts` |
| 4 | `approvals`, `approvals/[id]` | `store/approvals.ts`, `lib/workflow.ts` + test |
| 5 | `projects`, `projects/new`, `projects/[id]`, `projects/[id]/adjust`, `projects/adjustments` | `store/projects.ts`, `lib/budget.ts`, `data/mock/projects.ts` |

**กติกากันงานชนกัน**
- แก้ได้เฉพาะไฟล์ของตัวเอง ไฟล์ของคนอื่น → เปิด PR แล้วให้เจ้าของ review
- ต้องการ component ใหม่ / แก้หน้าตาปุ่ม → ขอคนที่ 1 อย่าสร้างซ้ำในโฟลเดอร์ตัวเอง
  (component ที่ใช้แค่หน้าเดียว สร้างไว้ข้างหน้าได้ เช่น `app/approvals/_components/…`)
- `types/*` แก้แล้วกระทบทุกคน → PR ต้องมีคนที่ 1 review
- ห้ามเปลี่ยนชื่อฟังก์ชันที่ export ออกไปแล้วโดยไม่แจ้งทีม

## ข้อมูลไหลยังไง

```
หน้า (app/…)  ──อ่าน──▶  hook ใน store (useRequests, useProjects, useCurrentUser)
     │                         ▲
     └──กดปุ่ม──▶ ฟังก์ชันใน store (createRequest, approveRequest, …)
                    │  ตรวจสิทธิ์ด้วย lib/workflow  ถ้าไม่ได้ → throw Error
                    └─ บันทึกลง localStorage → ทุกหน้าที่ใช้ hook อัปเดตเอง
```

ฟังก์ชันที่แก้ข้อมูล "โยน Error" ถ้าทำไม่ได้ → หน้าจอให้ `try/catch` แล้วแสดงข้อความ:

```tsx
try {
  approveRequest(id, user);
  router.push(PATHS.approvals);
} catch (e) {
  setError((e as Error).message);
}
```

## ฟังก์ชันหลักที่ใช้บ่อย (รับเข้า → ส่งออก)

| ฟังก์ชัน | ไฟล์ | รับเข้า | ส่งออก |
|---|---|---|---|
| `useCurrentUser()` | store/session | – | `User \| null` (ในหน้าที่ login แล้วไม่เป็น null) |
| `useRequests()` / `useRequest(id)` | store/requests | – / id | `ReimburseRequest[]` / `ReimburseRequest \| undefined` |
| `createRequest(input, user)` | store/requests | `RequestInput`, User | คำขอที่สร้าง |
| `resubmitRequest(id, input, user)` | store/requests | id, `RequestInput`, User | คำขอที่แก้แล้ว |
| `cancelRequest(id, user)` | store/requests | id, User | – |
| `approveRequest(id, user)` | store/approvals | id, User | – (หัวหน้า/ผู้บริหาร = อนุมัติ, บัญชี = ทำจ่าย) |
| `sendBackRequest(id, user, note)` | store/approvals | id, User, หมายเหตุ | – |
| `useProjects()` / `getProjectById(id)` | store/projects | – / id | `Project[]` / `Project \| undefined` |
| `isMyTurn(req, user)` | lib/workflow | คำขอ, User | true = ผู้ใช้ต้องพิจารณาคำขอนี้ |
| `canEdit` / `canCancel(req, user)` | lib/workflow | คำขอ, User | true = แก้ไข/ยกเลิกได้ (เจ้าของ + ถูกส่งกลับ) |
| `getInitialStatus(role, amount)` | lib/workflow | role ผู้ยื่น, ยอดเงิน | สถานะแรก |
| `getCategoryBudget(p, catId, reqs, adj)` | lib/budget | โครงการ, หมวด, คำขอ, การปรับงบ | `{ allocated, used, reserved, remaining }` |
| `getOverBudgetAmount(remaining, amount)` | lib/budget | งบคงเหลือ, ยอดขอ | ยอดที่เกิน (0 = ไม่เกิน) |
| `formatBaht(n)` / `formatThaiDate(iso)` | lib/format | ตัวเลข / ISO date | "12,000 บาท" / "05/11/2569" |
| `PATHS.requestDetail(id)` ฯลฯ | config/routes | id | path ของหน้า |

## กติกาการอนุมัติ (ตามโค้ดเดิมของทีม)

| ผู้ยื่น | ≤ 5,000 | 5,001 – 30,000 | > 30,000 |
|---|---|---|---|
| พนักงาน / บัญชี | บัญชีทำจ่าย | หัวหน้า → บัญชี | ผู้บริหาร → บัญชี |
| หัวหน้าแผนก | บัญชี | บัญชี | ผู้บริหาร → บัญชี |
| ผู้บริหาร | บัญชี | บัญชี | บัญชี |

ห้ามอนุมัติ/ทำจ่ายคำขอของตัวเอง · ส่งกลับแก้ไขได้ทุกขั้น · ยกเลิกคำขอได้เฉพาะตอนถูกส่งกลับ
เกณฑ์เงินแก้ที่ `constants/approval.ts` ที่เดียว

## สถานะคำขอ

| ค่าในโค้ด | ข้อความ | สี |
|---|---|---|
| `WAITING_DEPT_HEAD` | รอหัวหน้าอนุมัติ | ส้ม |
| `WAITING_EXECUTIVE` | รอผู้บริหารอนุมัติ | ส้ม |
| `WAITING_ACCOUNTANT` | รอบัญชีทำจ่าย | ฟ้า |
| `COMPLETED` | จ่ายแล้ว | เขียว |
| `SENT_BACK` | ส่งกลับแก้ไข | แดง |
| `CANCELLED` | ยกเลิกแล้ว | เทา |
| (ป้ายพิเศษ) | **รอคุณพิจารณา** | ส้มอ่อนขอบส้ม — แสดงเมื่อ `isMyTurn` |

## ย้ายจากโครงเดิม

| เดิม | ใหม่ |
|---|---|
| `context/DataContext.tsx` (`useData()`) | `store/session.ts`, `store/requests.ts`, `store/approvals.ts`, `store/projects.ts` |
| `data/mockData.ts` | `data/mock/*` |
| `components/shared/Sidebar.tsx` | `components/layout/Sidebar.tsx` (ใส่ให้อัตโนมัติทุกหน้า ไม่ต้อง import) |
| `RequestStep` / `REJECTED` | `RequestStatus` / `SENT_BACK` (ส่งกลับแก้ไข) |
| สี hex ในหน้า (`#0F382C`, `#1F5441`) | class จาก theme เช่น `bg-primary` — ดู docs/STYLE_GUIDE.md |
