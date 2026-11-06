/**
 * components/ui/Table.tsx — ตาราง · เจ้าของ: คนที่ 1
 * -----------------------------------------------------------------------------
 * ส่งออก: <Table> <THead> <TBody> <TR> <TH> <TD> <TableEmpty>
 * ใช้แทน <table> ธรรมดาเพื่อให้ระยะ สี เส้นแบ่ง เหมือนกันทุกหน้า
 *
 * TH/TD props เพิ่ม: align "left" | "right" | "center" (ตัวเลขเงินให้ align="right")
 * TableEmpty props: colSpan, children (ข้อความตอนไม่มีข้อมูล)
 *
 * @example
 * <Table>
 *   <THead><TR><TH>โครงการ</TH><TH align="right">จำนวนเงิน</TH></TR></THead>
 *   <TBody>
 *     {rows.length === 0 && <TableEmpty colSpan={2}>ยังไม่มีคำขอ</TableEmpty>}
 *     {rows.map(r => <TR key={r.id}><TD>{r.name}</TD><TD align="right">{formatBaht(r.amount)}</TD></TR>)}
 *   </TBody>
 * </Table>
 */
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Align = "left" | "right" | "center";
const ALIGN: Record<Align, string> = { left: "text-left", right: "text-right", center: "text-center" };

export function Table({ className, ...rest }: ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-body", className)} {...rest} />
    </div>
  );
}

export function THead(props: ComponentProps<"thead">) {
  return <thead {...props} />;
}

export function TBody(props: ComponentProps<"tbody">) {
  return <tbody {...props} />;
}

export function TR({ className, ...rest }: ComponentProps<"tr">) {
  return <tr className={cn("border-b border-border last:border-b-0", className)} {...rest} />;
}

export function TH({ align = "left", className, ...rest }: ComponentProps<"th"> & { align?: Align }) {
  return (
    <th
      className={cn("whitespace-nowrap border-b border-border px-4 pb-3 pt-1 text-caption font-medium text-text-muted", ALIGN[align], className)}
      {...rest}
    />
  );
}

export function TD({ align = "left", className, ...rest }: ComponentProps<"td"> & { align?: Align }) {
  return <td className={cn("px-4 py-4 align-middle text-text", ALIGN[align], className)} {...rest} />;
}

export function TableEmpty({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-text-muted">
        {children}
      </td>
    </tr>
  );
}
