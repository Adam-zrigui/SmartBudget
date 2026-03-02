import { IC } from "@/lib/utils";
import { SVGIcon as SVG } from "./SVGIcon";

export interface ToastProps {
  toast: { msg: string; type: string } | null;
}

export default function Toast({ toast }: ToastProps) {
  if (!toast) return null;
  const bg = toast.type === "error" ? 'bg-error' : 'bg-success';
  const icon = toast.type === "error" ? IC.x : IC.ok;
  return (
    <div className={`fixed bottom-5 right-5 z-50 ${bg} text-white p-3 rounded-lg shadow-lg flex items-center gap-3`}>
      <SVG d={icon} size={16} color="currentColor" />
      <span className="font-medium">{toast.msg}</span>
    </div>
  );
}
