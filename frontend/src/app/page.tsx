"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Button, Header, Spinner } from "@sk-web-gui/react";
import { LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth";
import t from "@/lib/i18n";

/** Felkoder från BFF:ens SAML-callback (?failMessage=...) */
const FAIL_MESSAGES: Record<string, string> = {
  MISSING_PERMISSIONS: t.sso.missingPermissions,
  SAML_MISSING_ATTRIBUTES: t.sso.missingAttributes,
  SAML_MISSING_PROFILE: t.sso.missingAttributes,
  NO_USER: t.sso.failed,
  AUTH_FAILED: t.sso.failed,
  SAML_UNKNOWN_ERROR: t.sso.failed,
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth, loading, login } = useAuth();

  const failMessage = searchParams.get("failMessage");
  const error = failMessage
    ? (FAIL_MESSAGES[failMessage] ?? t.sso.failed)
    : null;

  useEffect(() => {
    if (auth) router.replace("/dashboard");
  }, [auth, router]);

  return (
    <div className="flex min-h-screen flex-col bg-background-content">
      <Header title={t.app.name} />

      <main className="flex grow items-center justify-center p-24">
        <div className="w-full max-w-[38rem] flex flex-col gap-16">
          {error && (
            <Alert type="error" size="sm">
              {error}
            </Alert>
          )}

          {loading || auth ? (
            <div className="flex justify-center">
              <Spinner aria-label={t.loading} />
            </div>
          ) : (
            <>
              <p className="text-dark-secondary">{t.sso.description}</p>
              <Button
                variant="primary"
                leftIcon={<LogIn />}
                className="w-full"
                onClick={() => login()}
              >
                {t.sso.login}
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
