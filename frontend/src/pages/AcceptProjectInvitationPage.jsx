import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { request } from "../api/client";
import {
  acceptProjectInvitation,
  getProjectInvitationDetails,
} from "../api/projects";

export function AcceptProjectInvitationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [invitation, setInvitation] = useState(null);
  const [invitationLoading, setInvitationLoading] = useState(true);
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadInvitation() {
      if (!token) {
        setError("This invitation link is missing its token.");
        setInvitationLoading(false);
        return;
      }

      try {
        const details = await getProjectInvitationDetails(token);
        if (!cancelled) setInvitation(details);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load invitation details.",
          );
        }
      } finally {
        if (!cancelled) setInvitationLoading(false);
      }
    }

    loadInvitation();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("This invitation link is missing its token.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        if (!invitation?.email) {
          throw new Error(
            "Invitation details are not available. Please reopen your invitation link.",
          );
        }

        await request("/accounts/signup/", {
          method: "POST",
          body: JSON.stringify({
            username,
            email: invitation.email,
            password,
          }),
        });
      }

      if (mode === "signup" || mode === "login") {
        await request("/accounts/login/", {
          method: "POST",
          body: JSON.stringify({ username, password }),
        });
      }

      await acceptProjectInvitation(token);
      setMessage("Invitation accepted! Redirecting to your projects…");
      setTimeout(() => navigate("/projects"), 1000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not accept the invitation.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">
          Accept Project Invitation
        </h1>
        {invitationLoading ? (
          <p className="mt-3 text-sm text-slate-600">
            Loading invitation details…
          </p>
        ) : invitation ? (
          <div className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              You've been invited to join{" "}
              <strong>{invitation.project_name}</strong>.
            </p>
            <p className="mt-1">
              Invited email: <strong>{invitation.email}</strong>
            </p>
            <p className="mt-1">
              Role: <strong>{invitation.role}</strong>
            </p>
          </div>
        ) : null}
        <p className="mt-2 text-sm text-slate-600">
          {mode === "signup"
            ? "Create an account using the email address that was invited."
            : "Sign in using the account associated with this invitation."}
        </p>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-lg border p-2 text-sm ${
              mode === "login" ? "bg-indigo-600 text-white" : "bg-white"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-lg border p-2 text-sm ${
              mode === "signup" ? "bg-indigo-600 text-white" : "bg-white"
            }`}
          >
            Create account
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          {mode === "signup" && (
            <label className="block text-sm">
              Email address
              <input
                type="email"
                required
                value={invitation?.email || email}
                onChange={(event) => setEmail(event.target.value)}
                readOnly={Boolean(invitation?.email)}
                className="mt-1 w-full rounded-lg border p-2.5"
              />
            </label>
          )}

          <label className="block text-sm">
            Username
            <input
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-1 w-full rounded-lg border p-2.5"
            />
          </label>

          <label className="block text-sm">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border p-2.5"
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-rose-600">
              {error}
            </p>
          )}

          {message && (
            <p role="status" className="text-sm text-emerald-700">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading
              ? "Please wait…"
              : mode === "signup"
                ? "Create account and accept"
                : "Sign in and accept"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          Need help? Return to the{" "}
          <Link to="/login" className="underline">
            login page
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
