"use client";
/**
 * /profile — ข้อมูลผู้ใช้ · เจ้าของ: คนที่ 1
 */
import { Avatar, Card } from "@/components/ui";
import { ROLE_LABEL } from "@/constants/roles";
import { useCurrentUser } from "@/store/session";

export default function ProfilePage() {
  const user = useCurrentUser();
  if (!user) return null;

  const rows: [string, string][] = [
    ["รหัสพนักงาน", user.id],
    ["อีเมล", user.email],
    ["ตำแหน่ง", user.position],
    ["แผนก", user.department],
    ["สิทธิ์ในระบบ", ROLE_LABEL[user.role]],
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-6">
          <Avatar name={user.name} size="lg" />
          <div>
            <h2 className="text-title font-bold">{user.name}</h2>
            <p className="mt-1 text-body text-text-muted">
              {user.position} · {user.department}
            </p>
          </div>
        </div>
        <dl className="mt-8 grid grid-cols-2 gap-x-10 gap-y-5 border-t-[1.5px] border-border pt-6">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-caption text-text-muted">{label}</dt>
              <dd className="mt-1 text-body font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
