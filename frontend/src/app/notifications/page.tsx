"use client";

import { useState } from "react";
import {
  Typography, Box, Paper, List, ListItem, ListItemIcon, ListItemText,
  Chip, IconButton, Alert, Divider, Button,
} from "@mui/material";
import { Notifications as NotifIcon, Warning, CalendarMonth, Security, CheckCircle, Delete } from "@mui/icons-material";
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
  { id: "1", type: "contract", title: "Avtal med TechSys AB går ut", description: "Avtalet för Raindance löper ut 2026-06-30. Initiera förnyelse.", date: "2026-03-28", read: false },
  { id: "2", type: "security", title: "Saknad MFA för ByggR", description: "Riskanalys flaggar att ByggR saknar multifaktorautentisering.", date: "2026-03-27", read: false },
  { id: "3", type: "warning", title: "Backup ej verifierad - Treserva", description: "Backup för SYS-003 har inte verifierats på över 30 dagar.", date: "2026-03-25", read: true },
  { id: "4", type: "info", title: "Behörighetsgranskning slutförd", description: "Metakoppling: granskning avklarad.", date: "2026-03-20", read: true },
];

const ICONS: Record<string, React.ReactNode> = {
  warning: <Warning color="warning" />,
  info: <CheckCircle color="info" />,
  contract: <CalendarMonth color="secondary" />,
  security: <Security color="error" />,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(SAMPLE);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <AppShell>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <NotifIcon color="primary" />
          <Typography variant="h4">{t.notifications.title}</Typography>
          {unread > 0 && <Chip label={t.notifications.newCount(unread)} color="error" size="small" />}
        </Box>
        <Button size="small" onClick={() => setNotifications(notifications.map((n) => ({ ...n, read: true })))}>
          {t.notifications.markAllRead}
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        {t.notifications.infoText}
      </Alert>

      <Paper>
        <List>
          {notifications.map((n, i) => (
            <Box key={n.id}>
              <ListItem
                sx={{ bgcolor: n.read ? "transparent" : "action.hover" }}
                secondaryAction={
                  <IconButton onClick={() => setNotifications(notifications.filter((x) => x.id !== n.id))}><Delete /></IconButton>
                }
              >
                <ListItemIcon>{ICONS[n.type]}</ListItemIcon>
                <ListItemText primary={n.title} secondary={`${n.date} — ${n.description}`} />
              </ListItem>
              {i < notifications.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </Paper>
    </AppShell>
  );
}
