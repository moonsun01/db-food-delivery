import { cn } from "@/app/_lib/utils/cn";

type Variant = "primary" | "secondary" | "dark" | "danger";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-brand text-white active:bg-brand-hover",
  secondary: "border border-line bg-white text-ink active:bg-fill",
  dark: "bg-ink text-white active:opacity-90",
  danger: "bg-danger text-white active:opacity-90",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** lg: 48px (주요 버튼) / md: 44px (최소 터치 크기) */
  size?: "lg" | "md";
  block?: boolean;
}

export function Button({
  variant = "primary",
  size = "lg",
  block = false,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 font-semibold transition-colors",
        "disabled:border-transparent disabled:bg-fill disabled:text-ink-3",
        size === "lg" ? "h-12" : "h-11",
        block && "w-full",
        VARIANT_CLASS[variant],
        className,
      )}
      {...props}
    />
  );
}
