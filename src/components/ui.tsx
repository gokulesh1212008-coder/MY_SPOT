import React from "react";
import { cn } from "@/lib/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...rest }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-base" };
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/30 hover:shadow-md hover:shadow-brand-600/40",
    secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    outline: "border border-slate-300 text-slate-700 hover:border-brand-400 hover:text-brand-700 bg-white",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  };
  return (
    <button className={cn(base, sizes[size], variants[variant], className)} disabled={disabled || loading} {...rest}>
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}

export function Input({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30",
        className
      )}
      {...rest}
    />
  );
}

export function Select({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30",
        className
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30",
        className
      )}
      {...rest}
    />
  );
}

export function Label({ className, ...rest }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-slate-700", className)} {...rest} />;
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>{children}</div>;
}

export function Badge({ color = "slate", children, className }: { color?: "slate" | "green" | "amber" | "red" | "blue" | "violet"; children: React.ReactNode; className?: string }) {
  const colors = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-rose-100 text-rose-700",
    blue: "bg-sky-100 text-sky-700",
    violet: "bg-violet-100 text-violet-700",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", colors[color], className)}>{children}</span>;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-14 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-slate-100 text-2xl">🅿️</div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-slate-500">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, sub, icon }: { label: string; value: React.ReactNode; sub?: string; icon?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
        </div>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
    </Card>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: "green" | "amber" | "red" | "blue" | "slate" | "violet"; label: string }> = {
    CONFIRMED: { color: "blue", label: "Confirmed" },
    PAYMENT_PENDING: { color: "amber", label: "Payment pending" },
    ACTIVE: { color: "blue", label: "Active" },
    CHECKED_IN: { color: "green", label: "Checked in" },
    COMPLETED: { color: "green", label: "Completed" },
    CANCELLED: { color: "red", label: "Cancelled" },
    EXPIRED: { color: "slate", label: "Expired" },
    REFUNDED: { color: "violet", label: "Refunded" },
    REFUND_PENDING: { color: "amber", label: "Refund pending" },
    DISPUTED: { color: "red", label: "Disputed" },
    PENDING: { color: "amber", label: "Pending" },
    VERIFIED: { color: "green", label: "Verified" },
    REJECTED: { color: "red", label: "Rejected" },
    SUSPENDED: { color: "red", label: "Suspended" },
    INACTIVE: { color: "slate", label: "Inactive" },
    OPEN: { color: "red", label: "Open" },
    UNDER_REVIEW: { color: "amber", label: "Under review" },
    INVESTIGATING: { color: "blue", label: "Investigating" },
    RESOLVED: { color: "green", label: "Resolved" },
    CLOSED: { color: "slate", label: "Closed" },
    SUCCESS: { color: "green", label: "Success" },
    FAILED: { color: "red", label: "Failed" },
    PARTIALLY_REFUNDED: { color: "violet", label: "Partially refunded" },
  };
  const m = map[status] ?? { color: "slate" as const, label: status.replace(/_/g, " ") };
  return <Badge color={m.color}>{m.label}</Badge>;
}
