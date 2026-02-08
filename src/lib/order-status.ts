export type OrderStatus =
  | "QUOTATION"
  | "PENDING"
  | "PRODUCING"
  | "PRODUCTION"
  | "READY"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"

const STATUS_LABELS: Record<OrderStatus, string> = {
  QUOTATION: "Orçamento",
  PENDING: "Pendente",
  PRODUCING: "Em Produção",
  PRODUCTION: "Em Produção",
  READY: "Pronto",
  DELIVERED: "Entregue",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
}

const STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  QUOTATION: "bg-muted/40 text-muted-foreground border-border/40",
  PENDING: "bg-warning/10 text-warning border-warning/20",
  PRODUCING: "bg-info/10 text-info border-info/20",
  PRODUCTION: "bg-info/10 text-info border-info/20",
  READY: "bg-success/10 text-success border-success/20",
  DELIVERED: "bg-primary/10 text-primary border-primary/20",
  COMPLETED: "bg-success/10 text-success border-success/20",
  CANCELLED: "bg-danger/10 text-danger border-danger/20",
}

const STATUS_DOT_CLASSES: Record<OrderStatus, string> = {
  QUOTATION: "bg-muted-foreground/60",
  PENDING: "bg-warning",
  PRODUCING: "bg-info",
  PRODUCTION: "bg-info",
  READY: "bg-success",
  DELIVERED: "bg-primary",
  COMPLETED: "bg-success",
  CANCELLED: "bg-danger",
}

const STATUS_CALENDAR_CLASSES: Record<OrderStatus, string> = {
  QUOTATION: "bg-muted/40 text-muted-foreground border-border/40 hover:bg-muted/60",
  PENDING: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20",
  PRODUCING: "bg-info/10 text-info border-info/20 hover:bg-info/20",
  PRODUCTION: "bg-info/10 text-info border-info/20 hover:bg-info/20",
  READY: "bg-success/10 text-success border-success/20 hover:bg-success/20",
  DELIVERED: "bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted/60",
  COMPLETED: "bg-success/10 text-success border-success/20 hover:bg-success/20",
  CANCELLED: "bg-danger/10 text-danger border-danger/20 hover:bg-danger/20",
}

export const getStatusLabel = (status: string) =>
  STATUS_LABELS[status as OrderStatus] ?? status

export const getStatusBadgeClasses = (status: string) =>
  STATUS_BADGE_CLASSES[status as OrderStatus] ??
  "bg-muted/40 text-muted-foreground border-border/40"

export const getStatusDotClasses = (status: string) =>
  STATUS_DOT_CLASSES[status as OrderStatus] ?? "bg-muted-foreground/60"

export const getStatusCalendarClasses = (status: string) =>
  STATUS_CALENDAR_CLASSES[status as OrderStatus] ??
  "bg-muted/40 text-muted-foreground border-border/40"
