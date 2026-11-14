"use client";

import { useEffect } from "react";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  /** 확인 버튼 문구 — 동사로 끝낼 것 ("거절하기", "비우고 담기") */
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}

/** 되돌릴 수 없는 작업 확인용. 그 외 선택 UI는 바텀시트를 사용한다. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "닫기",
  tone = "primary",
  pending = false,
  onConfirm,
  onClose,
  children,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-[360px] rounded-lg bg-white p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-lg font-bold">
          {title}
        </h2>
        <div className="mt-2 text-ink-2">{description}</div>
        {children}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={tone} onClick={onConfirm} disabled={pending}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
