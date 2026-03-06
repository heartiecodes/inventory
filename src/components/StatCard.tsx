import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: "default" | "primary" | "warning" | "destructive" | "success";
  subtitle?: string;
}

const variantStyles = {
  default: "glass",
  primary: "glass border-primary/20",
  warning: "glass border-warning/20",
  destructive: "glass border-destructive/20",
  success: "glass border-primary/20",
};

const iconStyles = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  success: "bg-primary/10 text-primary",
};

export default function StatCard({ title, value, icon: Icon, variant = "default", subtitle }: StatCardProps) {
  return (
    <div className={`rounded-2xl border p-5 animate-fade-in ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-3xl font-bold font-mono tracking-tight text-card-foreground">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${iconStyles[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
