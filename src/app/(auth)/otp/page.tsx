"use client";

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/components/templates/AuthLayout";
import { Button } from "@/components/atoms/Button";

const OTP_LENGTH = 6;

function OtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "your registered email";

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  function handleChange(index: number, value: string) {
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const code = digits.join("");

    if (code.length !== OTP_LENGTH) {
      setError("Enter the complete 6-digit code.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push("/reset-password");
  }

  return (
    <AuthLayout
      eyebrow="Verification"
      title="Enter verification code"
      subtitle={`We've sent a 6-digit verification code to ${email}.`}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex justify-between gap-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              value={digit}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              maxLength={1}
              inputMode="numeric"
              className="h-14 w-12 rounded-lg border border-border bg-surface-card text-center text-fs-4xl font-semibold text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          ))}
        </div>

        {error && <p className="text-fs-base text-danger">{error}</p>}

        <p className="text-center text-fs-base text-muted">
          Didn&apos;t receive the code?{" "}
          <button type="button" className="text-primary hover:underline">
            Resend OTP
          </button>
        </p>

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Verify Code
        </Button>

        <Link
          href="/forgot-password"
          className="text-center text-fs-base text-primary hover:underline"
        >
          ← Change email
        </Link>
      </form>
    </AuthLayout>
  );
}

export default function OtpPage() {
  return (
    <Suspense fallback={null}>
      <OtpForm />
    </Suspense>
  );
}
