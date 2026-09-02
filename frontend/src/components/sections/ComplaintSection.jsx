import { useState } from "react";
import api from "../../api/client";
import { CALL_TEL_LINK, SUPPORT_PHONE_DISPLAY, SUPPORT_EMAIL } from "../../config";

const CATEGORIES = [
  { value: "safety", label: "🚨 Safety / Conduct of a Partner" },
  { value: "service_issue", label: "⏱️ Service issue (late, quality, etc.)" },
  { value: "feedback", label: "💬 General feedback / suggestion" },
  { value: "compliment", label: "💛 Positive feedback / compliment" },
];

export default function ComplaintSection() {
  const [form, setForm] = useState({ name: "", phone: "", booking_code: "", category: "", message: "" });
  const [status, setStatus] = useState("idle");

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.category || !form.message) return;
    setStatus("sending");
    try {
      await api.post("/complaints", form);
      setStatus("sent");
      setForm({ name: "", phone: "", booking_code: "", category: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="complaint" className="max-w-3xl mx-auto px-5 py-20">
      <span className="text-xs font-semibold tracking-wide text-magenta">We're listening</span>
      <h2 className="font-display text-3xl text-ink mt-3 mb-3">Raise a complaint or share feedback.</h2>
      <p className="text-ink/60 mb-6">Your safety and feedback are our top priority — every message reaches our leadership team.</p>

      <div className="bg-clay/10 border border-clay/30 rounded-card p-4 text-sm text-clay mb-8">
        🚨 Safety concern? Don't wait — call us now at{" "}
        <a href={CALL_TEL_LINK} className="font-semibold underline">{SUPPORT_PHONE_DISPLAY}</a>. It routes straight to our leadership.
      </div>

      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
        <input required placeholder="Your name *" value={form.name} onChange={update("name")}
          className="border border-ink/15 rounded-lg px-4 py-2.5 text-sm sm:col-span-1" />
        <input required placeholder="Phone number *" value={form.phone} onChange={update("phone")}
          className="border border-ink/15 rounded-lg px-4 py-2.5 text-sm sm:col-span-1" />
        <input placeholder="Booking ID (if any)" value={form.booking_code} onChange={update("booking_code")}
          className="border border-ink/15 rounded-lg px-4 py-2.5 text-sm sm:col-span-2" />
        <select required value={form.category} onChange={update("category")}
          className="border border-ink/15 rounded-lg px-4 py-2.5 text-sm sm:col-span-2">
          <option value="">This is about *</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <textarea required placeholder="Tell us what happened *" value={form.message} onChange={update("message")}
          rows={4} className="border border-ink/15 rounded-lg px-4 py-2.5 text-sm sm:col-span-2" />
        <button type="submit" disabled={status === "sending"}
          className="sm:col-span-2 px-6 py-3 rounded-full bg-ink text-parchment font-semibold hover:bg-violet transition-colors disabled:opacity-50">
          {status === "sending" ? "Sending…" : "Send"}
        </button>
      </form>
      {status === "sent" && <p className="text-sm text-violet mt-4">Received — our team will reach out shortly. <img src="/brand/logo.png" alt="ROSKYRO" className="inline-block w-4 h-4 align-[-3px]" /></p>}
      {status === "error" && <p className="text-sm text-clay mt-4">Couldn't send — try calling us instead, or email {SUPPORT_EMAIL}.</p>}
      <p className="text-xs text-ink/40 mt-4">You can also email {SUPPORT_EMAIL}. Thank you for helping us improve.</p>
    </section>
  );
}
