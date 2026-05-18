"use client";
import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface InviteInfo {
  email: string;
  name?: string;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError("No invite token found. Please use the link from your invitation email.");
      setLoadingInvite(false);
      return;
    }

    async function fetchInvite() {
      try {
        const res = await fetch(`/api/invite?token=${encodeURIComponent(token!)}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setTokenError(data.error ?? "Invalid or expired invite. Please request a new one.");
        } else {
          const data: InviteInfo = await res.json();
          setInvite(data);
          setEmail(data.email);
          if (data.name) setName(data.name);
        }
      } catch {
        setTokenError("Failed to validate invite. Please try again.");
      } finally {
        setLoadingInvite(false);
      }
    }

    fetchInvite();
  }, [token]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name: name.trim(), email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setFormError(data.error ?? "Registration failed. Please try again.");
        return;
      }

      // Sign in immediately after successful registration
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        // Registration succeeded but auto-login failed — redirect to login
        router.push("/login?registered=1");
      }
    } catch {
      setFormError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loadingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-blue-200/60">
          <svg className="animate-spin h-8 w-8 text-green-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm">Validating your invite…</span>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 pitch-bg">
        <div className="relative w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 select-none">🚫</div>
            <h1 className="text-2xl font-bold text-white">Invalid Invite</h1>
          </div>
          <div className="bg-[#0c1630] border border-blue-900/40 rounded-2xl shadow-2xl p-8 text-center">
            <div className="bg-red-950/60 border border-red-800 text-red-300 rounded-lg px-4 py-4 mb-6 text-sm">
              {tokenError}
            </div>
            <p className="text-blue-200/60 text-sm mb-4">
              Invites are required to join the prediction league. Please contact the league admin for access.
            </p>
            <Link href="/login" className="btn-secondary inline-block text-sm">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 pitch-bg">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-green-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 select-none">⚽🏆</div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Join WC26 Predictions
          </h1>
          <p className="mt-2 text-blue-200/60 text-sm">
            Complete your registration to join the league
          </p>
        </div>

        {/* Invite badge */}
        {invite && (
          <div className="flex items-center gap-2 bg-green-950/50 border border-green-800 rounded-lg px-4 py-2.5 mb-4 text-sm text-green-300">
            <span>✅</span>
            <span>
              Valid invite for <strong>{invite.email}</strong>
            </span>
          </div>
        )}

        {/* Card */}
        <div className="bg-[#0c1630] border border-blue-900/40 rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">
            Create your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="label-wc26">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="input-wc26"
              />
            </div>

            <div>
              <label htmlFor="email" className="label-wc26">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                disabled={!!invite}
                onChange={(e) => setEmail(e.target.value)}
                className={`input-wc26 ${invite ? "opacity-60 cursor-not-allowed" : ""}`}
              />
              {invite && (
                <p className="mt-1 text-xs text-blue-300/50">
                  Email is pre-filled from your invite and cannot be changed.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="label-wc26">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="input-wc26"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label-wc26">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className="input-wc26"
              />
            </div>

            {formError && (
              <div className="flex items-start gap-2.5 bg-red-950/60 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
                <span className="text-base mt-0.5 shrink-0">⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating account…
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-blue-300/50">
          Already have an account?{" "}
          <Link href="/login" className="text-green-400 hover:text-green-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-green-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
