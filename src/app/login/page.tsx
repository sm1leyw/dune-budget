"use client";
/**
 * /login — เข้าสู่ระบบ · เจ้าของ: คนที่ 1
 * -----------------------------------------------------------------------------
 * หน้าตาตาม Figma frame "LOGIN (ปรับปรุง)" (node 729:1377) — เป็นหน้าเดียวที่ขนาดปุ่ม/ช่องกรอก
 * ใหญ่กว่า component กลาง (สูง 58px) จึงเขียน class เองในไฟล์นี้ แต่ยังใช้สีจาก theme ทั้งหมด
 *
 * ใช้: login(email, password) จาก store/session → สำเร็จแล้วไป /dashboard
 * บัญชีทดสอบอยู่ใน README (รหัสผ่าน 123) — ตอนมี backend ให้เปลี่ยน login() เป็นเรียก API
 *
 * "จดจำฉัน" และ "ลืมรหัสผ่าน?" ยังเป็นหน้าตาอย่างเดียว (รอ backend)
 */
import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, LoaderCircle, Lock, Mail, UserRound } from "lucide-react";
import { PATHS } from "@/config/routes";
import { cn } from "@/lib/cn";
import { login } from "@/store/session";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }
    setSubmitting(true);
    if (login(email, password)) {
      router.replace(PATHS.dashboard);
    } else {
      setSubmitting(false);
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-135 from-login-from to-login-to p-4">
      {/* วงกลมตกแต่งพื้นหลัง (ตำแหน่งตาม Figma บนจอ 1920×1080) */}
      <Deco className="-left-[6.25vw] -top-[14.8vh] size-[620px] bg-primary/10" />
      <Deco className="right-[3.125vw] -top-[9.3vh] size-[360px] bg-primary/8" />
      <Deco className="bottom-[2vh] left-[8.3vw] size-[300px] bg-primary/10" />
      <Deco className="-bottom-[19vh] -right-[8.8vw] size-[640px] bg-primary/12" />

      <div className="relative w-full max-w-[642px] rounded-[28px] border border-border bg-surface px-16 py-14 shadow-login-card max-sm:px-6 max-sm:py-10">
        {/* แบรนด์ */}
        <div className="flex items-center gap-3.5">
          <span className="flex size-14 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <UserRound className="size-[30px]" strokeWidth={1.8} aria-hidden />
          </span>
          <span>
            <span className="block text-base font-semibold text-primary">Dune Budget Sandworm</span>
            <span className="block text-sm text-text-muted">ระบบยื่นขออนุมัติงบประมาณ</span>
          </span>
        </div>

        <h1 className="mt-7 text-[28px] font-semibold leading-tight text-text">เข้าสู่ระบบยื่นขออนุมัติตัวงบประมาณ</h1>
        <p className="mt-1 text-[17px] text-text-muted">กรุณาระบุอีเมลองค์กรเพื่อเข้าใช้งาน</p>

        <form onSubmit={handleSubmit} noValidate className="mt-[30px]">
          <LoginField label="อีเมล" htmlFor="email">
            <LoginInput
              id="email"
              type="email"
              autoComplete="username"
              placeholder="name.sur@spumail.net"
              icon={<Mail />}
              value={email}
              invalid={!!error}
              onChange={(v) => {
                setEmail(v);
                setError("");
              }}
            />
          </LoginField>

          <LoginField label="รหัสผ่าน" htmlFor="password" className="mt-[22px]">
            <LoginInput
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              icon={<Lock />}
              value={password}
              invalid={!!error}
              onChange={(v) => {
                setPassword(v);
                setError("");
              }}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  className="rounded-sm p-1 text-text-muted transition hover:text-primary"
                >
                  {showPassword ? <Eye className="size-6" strokeWidth={1.8} /> : <EyeOff className="size-6" strokeWidth={1.8} />}
                </button>
              }
            />
          </LoginField>

          {error && (
            <p role="alert" className="mt-3 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="mt-5 flex items-center justify-between gap-4">
            <label className="flex cursor-pointer items-center gap-2.5 text-base text-text">
              <input type="checkbox" className="peer sr-only" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span
                aria-hidden
                className={cn(
                  "flex size-[22px] items-center justify-center rounded-[6px] border-[1.5px] transition peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40",
                  remember ? "border-primary bg-primary text-text-inverse" : "border-border-input bg-surface",
                )}
              >
                {remember && <Check className="size-3.5" strokeWidth={3} />}
              </span>
              จดจำฉันในอุปกรณ์นี้
            </label>
            <button
              type="button"
              onClick={() => setShowForgot((s) => !s)}
              className="text-base font-semibold text-primary hover:underline"
            >
              ลืมรหัสผ่าน?
            </button>
          </div>
          {showForgot && (
            <p className="mt-3 rounded-md bg-primary-soft px-4 py-3 text-sm text-text">
              กรุณาติดต่อฝ่ายเทคโนโลยีสารสนเทศ (IT) เพื่อรีเซ็ตรหัสผ่าน
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-8 flex h-[58px] w-full items-center justify-center gap-2 rounded-[12px] bg-primary text-[19px] font-semibold text-text-inverse shadow-login-button transition hover:brightness-110 disabled:opacity-80"
          >
            {submitting && <LoaderCircle className="size-5 animate-spin" aria-hidden />}
            เข้าสู่ระบบ
          </button>
        </form>

        <hr className="mt-7 border-border" />
        <p className="mt-[18px] text-sm text-text-muted">หากเข้าสู่ระบบไม่ได้ กรุณาติดต่อฝ่ายเทคโนโลยีสารสนเทศ (IT)</p>
      </div>
    </main>
  );
}

/** วงกลมตกแต่งพื้นหลัง */
function Deco({ className }: { className: string }) {
  return <span aria-hidden className={cn("pointer-events-none absolute rounded-full", className)} />;
}

function LoginField({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-2 block text-base font-medium text-text">
        {label}
      </label>
      {children}
    </div>
  );
}

/** ช่องกรอกขนาด 58px ตาม Figma: ไอคอนซ้าย, ขอบเขียว + เงาจางเมื่อโฟกัส */
function LoginInput({
  icon,
  trailing,
  invalid,
  onChange,
  ...rest
}: {
  id: string;
  type: string;
  autoComplete: string;
  placeholder: string;
  icon: ReactNode;
  trailing?: ReactNode;
  value: string;
  invalid?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className={cn(
        "group flex h-[58px] items-center gap-3.5 rounded-[12px] border-[1.5px] bg-surface px-5 transition",
        "focus-within:border-2 focus-within:border-primary focus-within:shadow-focus",
        invalid ? "border-danger" : "border-border-input",
      )}
    >
      <span className="text-text-muted transition group-focus-within:text-primary [&_svg]:size-6 [&_svg]:stroke-[1.8]">{icon}</span>
      <input
        {...rest}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
        className="h-full min-w-0 flex-1 bg-transparent text-lg text-text outline-none placeholder:text-text-muted/60 focus-visible:outline-none"
      />
      {trailing}
    </div>
  );
}
