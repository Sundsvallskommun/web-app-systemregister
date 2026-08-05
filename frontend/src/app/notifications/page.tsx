"use client";

import { useState } from "react";
import { Alert, Button, Label } from "@sk-web-gui/react";
import { X } from "lucide-react";
import AppShell from "@/components/AppShell";
import t from "@/lib/i18n";

interface Notification {
  id: string;
  type: "warning" | "info" | "contract" | "security";
  title: string;
  description: string;
  date: string;
  read: boolean;
}

const SAMPLE: Notification[] = [
  {
    id: "1",
    type: "contract",
    title: "Avtal med TechSys AB går ut",
    description:
      "Avtalet för Raindance löper ut 2026-06-30. Initiera förnyelse.",
    date: "2026-03-28",
    read: false,
  },
  {
    id: "2",
    type: "security",
    title: "Saknad MFA för ByggR",
    description:
      "Riskanalys flaggar att ByggR saknar multifaktorautentisering.",
    date: "2026-03-27",
    read: false,
  },
  {
    id: "3",
    type: "warning",
    title: "Backup ej verifierad - Treserva",
    description: "Backup för SYS-003 har inte verifierats på över 30 dagar.",
    date: "2026-03-25",
    read: true,
  },
  {
    id: "4",
    type: "info",
    title: "Behörighetsgranskning slutförd",
    description: "Metakoppling: granskning avklarad.",
    date: "2026-03-20",
    read: true,
  },
];

const ALERT_TYPE: Record<
  Notification["type"],
  "neutral" | "info" | "success" | "warning" | "error"
> = {
  warning: "warning",
  info: "success",
  contract: "neutral",
  security: "error",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(SAMPLE);
  const unread = notifications.filter((n) => !n.read).length;

  const markAllRead = () =>
    setNotifications(notifications.map((n) => ({ ...n, read: true })));

  return (
    <AppShell>
      <div className="mb-24 flex xs:flex-col sm:flex-row xs:items-start sm:items-center justify-between">
        <h1 className="text-h2">{t.notifications.title}</h1>
        <Button variant="tertiary" size="sm" onClick={markAllRead}>
          {t.notifications.markAllRead}
        </Button>
      </div>

      {unread > 0 && (
        <div className="mb-16">
          <Label color="info" className="whitespace-nowrap">
            {t.notifications.unreadCount(unread)}
          </Label>
        </div>
      )}

      <p className="mb-24">{t.notifications.infoText}</p>

      <div className="flex flex-col gap-16">
        {notifications.map((n) => (
          <Alert
            key={n.id}
            type={ALERT_TYPE[n.type]}
            className={n.read ? "opacity-70" : undefined}
          >
            <Alert.Icon />
            <Alert.Content>
              <Alert.Content.Title>{n.title}</Alert.Content.Title>
              <Alert.Content.Description>
                {n.date} — {n.description}
              </Alert.Content.Description>
            </Alert.Content>
            <Alert.Button
              iconButton
              size="sm"
              aria-label={t.a11y.delete(n.title)}
              onClick={() =>
                setNotifications(notifications.filter((x) => x.id !== n.id))
              }
            >
              <X />
            </Alert.Button>
          </Alert>
        ))}
        {notifications.length === 0 && (
          <p className="text-dark-secondary">{t.noResults}</p>
        )}
      </div>
    </AppShell>
  );
}
