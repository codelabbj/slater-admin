import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"
import { type ComponentType } from "react"

export type RechargeStatus = "pending" | "approved" | "rejected" | "expired"

// Status Labels (French)
export const statusLabels: Record<RechargeStatus, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Rejeté",
  expired: "Expiré",
}

// Status Colors (Badge variants)
export const statusColors: Record<RechargeStatus, "default" | "destructive" | "secondary" | "outline"> = {
  approved: "default",
  rejected: "destructive",
  pending: "secondary",
  expired: "outline",
}

// Status Icons
export const statusIcons: Record<RechargeStatus, ComponentType<{ className?: string }>> = {
  approved: CheckCircle,
  rejected: XCircle,
  pending: Clock,
  expired: AlertTriangle,
}

// Copy to clipboard utility
export function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text).then(() => {
    // Could add toast notification here if needed
  }).catch((err) => {
    console.error("Failed to copy text: ", err)
  })
}

// Format amount with FCFA
export function formatAmount(amount: number): string {
  return `${amount.toLocaleString()} FCFA`
}

// Get status display info
export function getStatusInfo(status: RechargeStatus) {
  // Handle unknown status values
  if (!status || !statusLabels[status]) {
    return {
      label: "Inconnu",
      color: "outline" as const,
      Icon: AlertTriangle,
    }
  }

  return {
    label: statusLabels[status],
    color: statusColors[status],
    Icon: statusIcons[status],
  }
}
