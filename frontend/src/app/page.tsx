"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Header, Input, TextField } from "@sk-web-gui/react";
import { Eye, EyeOff } from "lucide-react";
import Field from "@/components/Field";
import { login } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import t from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const { auth, setAuth } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth) router.replace("/dashboard");
  }, [auth, router]);

  if (auth) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(username, password);
      setAuth({ token: res.accessToken, role: res.role, username });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background-content">
      <Header title={t.app.name} />

      <main className="flex grow items-center justify-center p-24">
        <div className="w-full max-w-[38rem]">
          {error && (
            <Alert type="error" size="sm" className="mb-16">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-16">
            <Field label={t.username} required>
              <TextField
                required
                autoFocus
                className="w-full"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Field>
            <Field label={t.password} required>
              <Input.InnerGroup className="w-full">
                <Input
                  required
                  type={showPassword ? "text" : "password"}
                  className="w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Input.RightAddin>
                  <button
                    type="button"
                    aria-label={
                      showPassword ? t.a11y.hidePassword : t.a11y.showPassword
                    }
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </Input.RightAddin>
              </Input.InnerGroup>
            </Field>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              loadingText={t.loggingIn}
              className="w-full"
            >
              {t.login}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
