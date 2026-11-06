# Style Guide — ให้ทุกหน้าหน้าตาเหมือนกัน (ตาม Figma Design System)

> สรุปสั้น: **ใช้ component จาก `@/components/ui` ก่อนเสมอ** · ถ้าต้องเขียน class เอง ใช้ชื่อสีจากตารางด้านล่าง
> **ห้ามใส่สี hex** (`#007F5F`, `bg-[#...]`) และห้ามใช้สี Tailwind ทั่วไป (`bg-green-600`, `text-gray-500`) ในหน้า

ค่าทั้งหมดอยู่ใน `src/app/globals.css` (`@theme`) — ตรงกับ Variables "Dune Tokens" ใน Figma
อยากเปลี่ยนสีทั้งระบบ → แก้ที่ไฟล์นั้นที่เดียว (ขอคนที่ 1)

## 1. สี

| ใช้ทำอะไร | class | ค่า |
|---|---|---|
| สีหลัก: ปุ่มหลัก เมนูที่เลือก ลิงก์ | `bg-primary` `text-primary` `border-primary` | #007F5F |
| พื้นหลังหน้า / กล่องข้อมูลอ่านอย่างเดียว / hover | `bg-primary-soft` | #EDF7F2 |
| พื้นการ์ด popup sidebar | `bg-surface` | #FFFFFF |
| ตัวหนังสือปกติ | `text-text` | #1F2926 |
| ตัวหนังสือรอง (คำอธิบาย หัวตาราง) | `text-text-muted` | #5E6B66 |
| ตัวหนังสือบนพื้นเข้ม | `text-text-inverse` | #FFFFFF |
| เส้นขอบการ์ด/เส้นแบ่ง | `border-border` | #CFE3DA |
| ขอบช่องกรอก | `border-border-input` | #BFD5CB |
| ผิดพลาด / ส่งกลับ / ยกเลิก | `text-danger` `bg-danger` `border-danger` | #D93838 |
| รออนุมัติ / เตือน | `bg-warning` | #F29400 |
| กล่องเตือนเกินงบ / "รอคุณพิจารณา" | `bg-warning-soft` + `text-warning-strong` + `border-warning` | #FFF4E0 / #A85600 |
| รอบัญชีทำจ่าย | `bg-info` | #0093B4 |
| ปุ่ม/ป้ายที่ใช้ไม่ได้ | `bg-disabled` | #D1D9D6 |

ต้องการสีจางลง ใช้ `/` เช่น `bg-danger/5`, `ring-primary/15`

## 2. ตัวอักษร (IBM Plex Sans Thai — โหลดให้แล้ว ไม่ต้องใส่ font เอง)

| ระดับ | class | ใช้กับ |
|---|---|---|
| Title 24 | `text-title font-bold` | ชื่อหน้า (Header ทำให้แล้ว), หัวข้อ popup |
| Section 22 | `text-section font-bold` | หัวข้อการ์ด (`<Card title>` ทำให้แล้ว) |
| Body 15 | `text-body` | เนื้อหาทั่วไป ตาราง ช่องกรอก (ค่าเริ่มต้นของ body อยู่แล้ว) |
| Caption 13 | `text-caption text-text-muted` | คำอธิบายใต้ช่อง วันที่ หัวตาราง |
| Badge 12 | `text-badge` | ป้ายเล็ก |

น้ำหนัก: `font-medium` (label) · `font-bold` (หัวข้อ ตัวเลขสำคัญ ปุ่ม) — ไม่ใช้ `font-light`/`font-black`

## 3. มุมโค้ง ระยะห่าง เงา

- มุมโค้ง: `rounded-sm` (8 — ปุ่มเล็ก ป้าย) · `rounded-md` (10 — ปุ่ม ช่องกรอก) · `rounded-lg` (16 — การ์ด popup) · `rounded-full` (แท็บ ป้ายสถานะ)
- ระยะ: ระหว่างการ์ด `space-y-6` / `gap-6` · ระหว่างช่องในฟอร์ม `gap-5` · ระหว่างปุ่ม `gap-3` · ในการ์ด `p-6`
- เงา: ใช้ `shadow-modal` กับ popup เท่านั้น (การ์ดใช้เส้นขอบ ไม่ใช้เงา)

## 4. ใช้ component ไหนกับอะไร

| ต้องการ | ใช้ |
|---|---|
| ปุ่ม | `<Button>` / ลิงก์ที่หน้าตาเป็นปุ่ม `<ButtonLink>` |
| ป้ายสถานะคำขอ | `<StatusBadge status={r.status} myTurn={isMyTurn(r, user)} />` |
| กล่องเนื้อหา | `<Card title actions>` · ข้อมูลอ่านอย่างเดียว `<InfoBox>` |
| ฟอร์ม | `<Field label error>` + `<Input>` / `<Textarea>` / `<Select options>` |
| popup ยืนยัน | `<ConfirmModal>` · popup ที่มีฟอร์ม `<Modal footer>` |
| แท็บ "รอพิจารณา / ประวัติ" | `<Tabs tabs value onChange>` |
| ตาราง | `<Table><THead><TR><TH>` … `<TBody><TR><TD>` + `<TableEmpty>` |
| ตารางคำขอสำเร็จรูป | `<RequestTable requests user>` จาก `@/components/requests/RequestTable` |
| ค้นหา + ตัวกรอง | `<FilterBar>` (กรองข้อมูลเองในหน้า) |
| ขั้นตอน 1–4 ของฟอร์ม | `<Stepper steps current>` |
| ตัวเลขสรุป | `<StatCard label value unit highlight>` |
| ไม่มีข้อมูล | `<EmptyState title description action>` |
| คำอธิบายหน้า + ปุ่มขวาบน | `<PageActions description>` จาก `@/components/layout/PageActions` |
| รวม class แบบมีเงื่อนไข | `cn("...", cond && "...")` จาก `@/lib/cn` |

ทุก component มีคำอธิบาย + ตัวอย่างอยู่หัวไฟล์ใน `src/components/ui/*.tsx`

## 5. กติกาปุ่ม (ตรงกับ Figma)

| variant | ใช้กับ |
|---|---|
| `primary` | การกระทำหลัก: ขั้นตอนถัดไป · ยืนยันและยื่นคำขอ · อนุมัติ · ยืนยันทำจ่าย · บันทึก — **1 ปุ่มต่อหน้า/popup อยู่ขวาสุด** |
| `secondary` | ย้อนกลับ · กลับ · ดูรายละเอียด · ตรวจสอบ · ล้างตัวกรอง |
| `danger` | ส่งกลับแก้ไข · ยกเลิกคำขอ (ปุ่มบนหน้า) |
| `dangerSolid` | ปุ่มยืนยันใน popup ที่ทำสิ่งย้อนไม่ได้ (ยืนยันยกเลิกคำขอ) |

- ขนาด `L` (48px) ปุ่มท้ายฟอร์ม/popup/หัวหน้า · `S` (32px) ปุ่มในแถวตาราง
- ลำดับ: ปุ่มรองซ้าย → ปุ่มหลักขวา
- ปุ่มที่บันทึกข้อมูลใส่ `loading={saving}` เสมอ (กันกดซ้ำ/ส่งข้อมูลซ้ำ)

## 6. คำและรูปแบบข้อมูล

- เงิน: `formatBaht(12000)` → "12,000 บาท" · ในตารางชิดขวา `align="right"`
- วันที่: `formatThaiDate(iso)` → "05/11/2569" · แบบยาว `formatThaiDateLong` → "5 พ.ย. 2569"
- เก็บวันที่ในข้อมูลเป็น ISO (`"2026-11-05"`) เสมอ แปลงเป็น พ.ศ. ตอนแสดงเท่านั้น
- ใช้คำ: "ส่งกลับแก้ไข" (ไม่ใช้ "ปฏิเสธ") · "ยกเลิกคำขอ" (ไม่ใช้ "ลบคำขอ") · "เสร็จสิ้นโครงการ" (ไม่ใช้ "ปิดโครงการ")
- ข้อความสถานะเอาจาก `STATUS_META` เท่านั้น ไม่พิมพ์เอง
- link ระหว่างหน้าใช้ `PATHS` จาก `@/config/routes` ไม่พิมพ์ path เอง

## 7. โครงหน้ามาตรฐาน

```tsx
"use client";
import { Plus } from "lucide-react";
import { ButtonLink, Card } from "@/components/ui";
import { PageActions } from "@/components/layout/PageActions";
import { PATHS } from "@/config/routes";
import { useCurrentUser } from "@/store/session";

export default function MyPage() {
  const user = useCurrentUser();
  if (!user) return null;            // AppFrame กันไว้แล้ว บรรทัดนี้ให้ TypeScript พอใจ

  return (
    <div className="space-y-6">
      <PageActions description="คำอธิบายสั้น ๆ ของหน้า">
        <ButtonLink href={PATHS.newRequest} icon={<Plus />}>สร้างคำขอเบิก</ButtonLink>
      </PageActions>
      <Card title="หัวข้อ">…</Card>
    </div>
  );
}
```

- ไม่ต้องใส่ Sidebar / Header / ชื่อหน้า — AppFrame ใส่ให้ (ชื่อหน้าตั้งใน `config/routes.ts`)
- ไม่ต้องเช็กว่า login หรือยัง / role เข้าได้ไหม — AppFrame เช็กจาก `ROUTES.roles` ให้
- หน้าที่มี `[id]`: `const { id } = useParams<{ id: string }>();`
- ไอคอนใช้ `lucide-react` เท่านั้น
