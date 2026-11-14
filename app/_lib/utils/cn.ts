/** 조건부 className 합치기: cn("a", isOn && "b") */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
