import { useState } from "react";
import api from "../api/client";

const BENEFITS = [
  ["💸", "Weekly payout", "Money in your UPI every week"],
  ["🛡️", "Fixed base + hourly", "Steady base pay, plus earnings on every job"],
  ["🚑", "Accident insurance", "Covered from day one"],
  ["❤️‍🩹", "Health insurance", "For you, after you qualify"],
  ["🌴", "Paid leave", "12 paid leaves a year"],
  ["📈", "Promotion ladder", "Trainee → Senior Partner → Team Lead"],
];

export default function BecomePartner() {
  const [form, setForm] = useState({ full_name: "", phone: "", email: "" });
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/agents/apply", form);
      setStatus("submitted");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not submit your application. Please try again.");
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-16 grid md:grid-cols-2 gap-12">
      <div>
        <h1 className="font-display text-3xl text-ink mb-4">Become a Partner. Earn with dignity.</h1>
        <p className="text-ink/60 mb-8">
          Real benefits, fair pay, and the respect of professional work — not ordinary gig work.
        </p>
        <div className="grid grid-cols-2 gap-4">
          {BENEFITS.map(([icon, title, desc]) => (
            <div key={title} className="border border-ink/10 rounded-card p-4">
              <div className="text-xl mb-2">{icon}</div>
              <div className="text-sm font-semibold text-ink">{title}</div>
              <div className="text-xs text-ink/50 mt-1">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        {status === "submitted" ? (
          <div className="bg-violet text-parchment rounded-card p-8 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="font-display text-xl mb-2">Application received</p>
            <p className="text-parchment/70 text-sm">
              Our team will review it and reach out about the next steps: interview, background verification, and training.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="border border-ink/10 rounded-card p-6 space-y-4">
            <h2 className="font-semibold text-ink text-lg">Apply now</h2>
            <div>
              <label className="text-sm font-medium text-ink/70">Full name</label>
              <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink/70">Phone number</label>
              <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet" />
            </div>
            <div>
              <label className="text-sm font-medium text-ink/70">Email (optional)</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-ink/15 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet" />
            </div>
            {error && <p className="text-sm text-clay">{error}</p>}
            <button className="w-full py-3 rounded-full bg-violet text-parchment font-semibold hover:bg-magenta transition-colors">
              Submit application
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
