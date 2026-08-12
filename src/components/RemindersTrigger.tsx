"use client";

import { useEffect } from "react";

export default function RemindersTrigger() {
  useEffect(() => {
    fetch("/api/notifications?action=reminders", { method: "POST", cache: "no-store" }).catch(() => {});
  }, []);
  return null;
}
