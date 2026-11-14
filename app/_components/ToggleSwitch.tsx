import { cn } from "@/app/_lib/utils/cn";

export function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    // 터치 영역 44px 확보를 위해 바깥 버튼을 크게
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex h-11 items-center px-1 disabled:opacity-50"
    >
      <span
        className={cn(
          "relative h-7 w-12 rounded-full transition-colors",
          checked ? "bg-success" : "bg-ink-3",
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 size-5 rounded-full bg-white transition-transform",
            checked && "translate-x-5",
          )}
        />
      </span>
    </button>
  );
}
