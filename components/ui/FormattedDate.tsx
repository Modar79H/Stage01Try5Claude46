// components/ui/FormattedDate.tsx
"use client";

import { formatDate, formatDateTime } from "@/lib/utils";
import { useUserTimezone } from "@/hooks/useUserTimezone";

interface FormattedDateProps {
  date: Date | string;
  format?: "date" | "datetime";
  className?: string;
}

export function FormattedDate({
  date,
  format = "date",
  className,
}: FormattedDateProps) {
  const { timezone, isLoading } = useUserTimezone();

  if (isLoading) {
    return <span className={className}>Loading...</span>;
  }

  const formatted =
    format === "datetime"
      ? formatDateTime(date, timezone)
      : formatDate(date, timezone);

  return <span className={className}>{formatted}</span>;
}
