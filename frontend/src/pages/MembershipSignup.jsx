import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";

const PLANS = [
  { id: "care", name: "ROSKYRO Care", price: "₹1,999/month", tagline: "Individual" },
  { id: "family", name: "ROSKYRO Family", price: "₹4,999/month", tagline: "Up to 4 members" },
  { id: "nri", name: "ROSKYRO NRI Care", price: "₹7,999/month", tagline: "Family abroad, parents in India" },
];

export default function MembershipSignup() {
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("plan");

  const [plan, setPlan] = useState(PLANS.some((p) => p.id === preselected) ? preselected : "care");
  const [mode, setMode] = useState("login"); // login | signup — only shown if not already logged in
  const [form, setForm] = useState({ full_name: "", phone: "", password: "" });
  const [agreedToInfo, setAgreedToInfo] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!user) {
        if (mode === "signup") {
          await signup(form);
        } else {
          await login(form.phone, form.password);
        }
      }
      await api.post("/membership/signup", { plan });
      navigate("/member");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not complete your membership signup. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-5 py-20">
      <span className="text-xs font-semibold tracking-wide text-magenta">Become a member</span>
      <h1 className="font-display text-3xl text-ink mt-2 mb-2">Join ROSKYRO Concierge</h1>
      <p className="text-ink/60 mb-4">
        Pick a plan, and a dedicated concierge starts coordinating your healthcare from day one.
      </p>
      <Link
        to="/membership/info"
        target="_blank"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet hover:text-magenta transition-colors mb-8"
      >
        📄 Read full membership information first — plans, billing, free Relationship Officer visits &amp; privacy
      </Link>

      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        {PLANS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlan(p.id)}
            className={
              "text-left rounded-lg border p-4 transition-colors " +
              (plan === p.id ? "border-violet bg-mist" : "border-ink/10 hover:border-violet/40")
            }
          >
            <div className="font-display text-base text-ink">{p.name}</div>
            <div className="text-xs text-ink/50 mb-2">{p.tagline}</div>
            <div className="font-display text-lg text-ink">{p.price}</div>
          </button>
        ))}
      </div>

      {user ? (
        <div className="bg-mist rounded-lg p-4 mb-6 text-sm text-ink/70">
          Signing up as <strong>{user.full_name}</strong>.
        </div>
      ) : (
        <div className="mb-6">
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={"px-4 py-2 rounded-full text-sm font-semibold " + (mode === "login" ? "bg-ink text-parchment" : "border border-ink/15 text-ink/60")}
            >
              I already have an account
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={"px-4 py-2 rounded-full text-sm font-semibold " + (mode === "signup" ? "bg-ink text-parchment" : "border border-ink/15 text-ink/60")}
            >
              New here
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!user && mode === "signup" && (
          <div>
            <label className="text-sm font-medium text-ink/70">Full name</label>
            <input required value={form.full_name} onChange={(e) => update("full_name", e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet" />
          </div>
        )}
        {!user && (
          <div>
            <label className="text-sm font-medium text-ink/70">Phone number</label>
            <input type="tel" required value={form.phone} onChange={(e) => update("phone", e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet"
              placeholder="98XXXXXXXX" />
          </div>
        )}
        {!user && (
          <div>
            <label className="text-sm font-medium text-ink/70">Password</label>
            <input type="password" required minLength={6} value={form.password} onChange={(e) => update("password", e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet" />
          </div>
        )}

        {error && <p className="text-sm text-clay">{error}</p>}

        <label className="flex items-start gap-2.5 text-sm text-ink/70">
          <input
            type="checkbox"
            required
            checked={agreedToInfo}
            onChange={(e) => setAgreedToInfo(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            I've read the{" "}
            <Link to="/membership/info" target="_blank" className="text-violet font-semibold">
              Membership Information page
            </Link>{" "}
            — including plan inclusions, free Relationship Officer-visit quota, billing/cancellation terms, and the privacy
            policy — and agree to it.
          </span>
        </label>

        <button disabled={loading || !agreedToInfo}
          className="w-full py-3 rounded-full bg-brand-gradient text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
          {loading ? "Setting up your membership..." : "Confirm membership"}
        </button>
      </form>

      <p className="text-xs text-ink/40 mt-6">
        Your first invoice is created as pending — a concierge will confirm payment via UPI on
        WhatsApp, same as any ROSKYRO booking. No card details needed here.
      </p>
      <p className="text-sm text-ink/60 mt-4">
        Prefer to talk first? <Link to="/membership/info" className="text-violet font-medium">See plan details</Link>{" "}
        or message us on WhatsApp.
      </p>
    </div>
  );
}
