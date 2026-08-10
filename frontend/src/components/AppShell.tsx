"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button, Header, MenuVertical, UserMenu } from "@sk-web-gui/react";
import { LogOut, Menu as MenuIcon, X } from "lucide-react";
import { useAuth, type AuthState } from "@/lib/auth";
import t from "@/lib/i18n";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: t.nav.dashboard, href: "/dashboard" },
  { label: t.nav.systems, href: "/systems" },
  { label: t.nav.suppliers, href: "/suppliers" },
  { label: t.nav.classifications, href: "/classifications" },
  { label: t.nav.risks, href: "/risks" },
  { label: t.nav.gdpr, href: "/gdpr" },
  { label: t.nav.ai, href: "/ai" },
  { label: t.nav.processes, href: "/processes" },
  { label: t.nav.continuity, href: "/continuity" },
  { label: t.nav.reports, href: "/reports" },
  { label: t.nav.notifications, href: "/notifications" },
];

/**
 * Initialer till avataren. IdP:n skickar för- och efternamn var för sig; saknas
 * de faller vi tillbaka på det sammansatta namnet och sist på användarnamnet.
 */
function getInitials({ givenName, surname, name, username }: AuthState): string {
  if (givenName && surname) {
    return `${givenName.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }

  return (parts[0] ?? username).charAt(0).toUpperCase() || "?";
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { auth, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    // Vänta in /me innan vi skickar iväg någon till inloggningen
    if (!loading && !auth) router.replace("/");
  }, [auth, loading, router]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  if (!auth) return null;

  // logout() navigerar vidare till BFF:ens Single Logout
  const handleLogout = () => logout();

  const roleLabel = t.roles[auth.role] ?? auth.role;
  const displayName = auth.name || auth.username;

  const nav = (
    <MenuVertical.Provider>
      <MenuVertical.Sidebar>
        <MenuVertical.Nav>
          <MenuVertical>
            {NAV_ITEMS.map((item) => (
              <MenuVertical.Item
                key={item.href}
                menuIndex={item.href}
                current={pathname.startsWith(item.href)}
              >
                <Link href={item.href}>{item.label}</Link>
              </MenuVertical.Item>
            ))}
          </MenuVertical>
        </MenuVertical.Nav>
      </MenuVertical.Sidebar>
    </MenuVertical.Provider>
  );

  return (
    <div className="min-h-screen bg-background-content">
      <Header
        title={t.app.name}
        mobileMenu={
          <Button
            iconButton
            variant="tertiary"
            aria-label={t.a11y.openMenu}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <MenuIcon />
          </Button>
        }
        userMenu={
          <UserMenu
            initials={getInitials(auth)}
            menuTitle={displayName}
            menuSubTitle={roleLabel}
            menuGroups={[
              {
                label: roleLabel,
                elements: [
                  {
                    label: t.logout,
                    element: () => (
                      <Button
                        variant="link"
                        leftIcon={<LogOut />}
                        onClick={handleLogout}
                      >
                        {t.logout}
                      </Button>
                    ),
                  },
                ],
              },
            ]}
          />
        }
      />

      <div className="flex mx-auto max-w-content">
        <div className="hidden md:block w-[26rem] shrink-0 p-16">{nav}</div>

        {mobileNavOpen && (
          <div className="md:hidden">
            <div
              className="fixed inset-0 z-40 bg-primitives-overlay-darken-8"
              onClick={() => setMobileNavOpen(false)}
              aria-hidden
            />
            <div className="fixed right-0 top-0 bottom-0 z-50 w-4/5 max-w-[32rem] overflow-y-auto bg-background-content p-16 shadow-100">
              <div className="mb-16 flex justify-end">
                <Button
                  iconButton
                  variant="tertiary"
                  aria-label={t.a11y.closeMenu}
                  onClick={() => setMobileNavOpen(false)}
                >
                  <X />
                </Button>
              </div>
              {nav}
              <div className="mt-16 border-t border-divider pt-16">
                <p className="mb-8 text-small text-dark-secondary">
                  {displayName} · {roleLabel}
                </p>
                <Button
                  variant="tertiary"
                  leftIcon={<LogOut />}
                  onClick={handleLogout}
                >
                  {t.logout}
                </Button>
              </div>
            </div>
          </div>
        )}

        <main className="grow min-w-0 p-24">{children}</main>
      </div>
    </div>
  );
}
