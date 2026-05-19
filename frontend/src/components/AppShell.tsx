"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Chip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard,
  Dns,
  Business,
  Warning,
  Security,
  AccountTree,
  Description,
  Shield,
  Notifications,
  AdminPanelSettings,
  Logout,
  Person,
  SmartToy,
  Gavel,
} from "@mui/icons-material";
import { useAuth } from "@/lib/auth";
import t from "@/lib/i18n";

const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <Dashboard /> },
  { label: "System", href: "/systems", icon: <Dns /> },
  { label: "Leverantörer", href: "/suppliers", icon: <Business /> },
  { label: "Klassning (K/R/T)", href: "/classifications", icon: <Security /> },
  { label: "Riskanalys", href: "/risks", icon: <Warning /> },
  { label: "GDPR", href: "/gdpr", icon: <Gavel /> },
  { label: "AI-tillämpningar", href: "/ai", icon: <SmartToy /> },
  { label: "Processer", href: "/processes", icon: <AccountTree /> },
  { label: "Kontinuitet", href: "/continuity", icon: <Shield /> },
  { label: "Rapporter", href: "/reports", icon: <Description /> },
  { label: "Notifieringar", href: "/notifications", icon: <Notifications /> },
  {
    label: "Administration",
    href: "/admin",
    icon: <AdminPanelSettings />,
    roles: ["admin"],
  },
];

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  editor: "Redaktör",
  viewer: "Läsare",
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { auth, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (!auth) router.replace("/");
  }, [auth, router]);

  if (!auth) return null;

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(auth.role)
  );

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant='h6' noWrap sx={{ color: "primary.main" }}>
          Systemregister
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {visibleItems.map((item) => (
          <ListItemButton
            key={item.href}
            selected={pathname.startsWith(item.href)}
            onClick={() => {
              router.push(item.href);
              setMobileOpen(false);
            }}
            sx={{
              mx: 1,
              borderRadius: 2,
              mb: 0.5,
              "&.Mui-selected": {
                bgcolor: "secondary.main",
                color: "white",
                "& .MuiListItemIcon-root": { color: "white" },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position='fixed'
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          bgcolor: "white",
          color: "text.primary",
          borderRadius: 0,
        }}
      >
        <Toolbar>
          <IconButton
            edge='start'
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <Chip
            icon={<Person />}
            label={`${auth.username} (${ROLE_LABELS[auth.role] ?? auth.role})`}
            variant='outlined'
            sx={{ mr: 1 }}
          />
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: "primary.main",
                fontSize: 14,
              }}
            >
              {auth.username?.charAt(0) ?? "?"}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={!!anchorEl}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                logout();
                router.replace("/");
              }}
            >
              <ListItemIcon>
                <Logout fontSize='small' />
              </ListItemIcon>
              {t.logout}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component='nav'
        sx={{
          width: { sm: DRAWER_WIDTH },
          flexShrink: { sm: 0 },
        }}
      >
        <Drawer
          variant='temporary'
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant='permanent'
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              borderRadius: 0,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component='main'
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
