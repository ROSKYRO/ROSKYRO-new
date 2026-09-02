import { useEffect, useRef, useState } from "react";
import { BOOK_WA_LINK } from "../../config";

// Scripted transcript for the "watch a booking" playback — purely illustrative,
// does not call the real API. The "Try it live" button below hands off to the
// actual booking flow (WhatsApp today; the in-app flow at /services once you're
// signed in).
const SCRIPT = [
  { from: "user", text: "Hi" },
  { from: "bot", text: "Namaste! 👋 Welcome to ROSKYRO. Reply in English, Hindi or भोजपुरी — any language works. What do you need help with today?" },
  { from: "user", text: "Hospital Assist for my father, tomorrow morning" },
  { from: "bot", text: "Got it — Hospital Assist, ₹219/hr. What time tomorrow, and which hospital?" },
  { from: "user", text: "9 AM, PMCH" },
  { from: "bot", text: "Perfect. Share the address and a contact number for our Partner to reach on arrival." },
  { from: "user", text: "[shares address & number]" },
  { from: "bot", text: "✅ Booked! A verified Partner is assigned. You'll get their name, photo and a Start PIN before arrival. Pay only after the visit, via UPI." },
];

export default function DemoSection() {
  const [visible, setVisible] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const play = () => {
    setPlaying(true);
    setVisible(0);
    let i = 0;
    const step = () => {
      i += 1;
      setVisible(i);
      if (i < SCRIPT.length) {
        timerRef.current = setTimeout(step, 1100);
      } else {
        setPlaying(false);
      }
    };
    timerRef.current = setTimeout(step, 500);
  };

  const replay = () => {
    clearTimeout(timerRef.current);
    play();
  };

  return (
    <section id="demo" className="bg-mist py-20">
      <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="text-xs font-semibold tracking-wide text-magenta">See it in action</span>
          <h2 className="font-display text-3xl text-ink mt-3 mb-4">Watch a booking — or try it yourself.</h2>
          <p className="text-ink/60 mb-6 max-w-md">
            No app to download, no forms to fill. Just a chat — in your language. Press{" "}
            <strong>Play</strong> to watch a Hospital Assist booking, or tap <strong>Try it live</strong>{" "}
            to book one yourself on WhatsApp.
          </p>
          <ul className="space-y-2 text-sm text-ink/70 mb-8">
            <li>1. Say <strong>hi</strong> and pick your language</li>
            <li>2. Choose the service and tell us what you need</li>
            <li>3. Share date, time, address and who to contact</li>
            <li>4. Confirm — a verified Partner is assigned <img src="/brand/logo.png" alt="ROSKYRO" className="inline-block w-4 h-4 align-[-3px]" /></li>
          </ul>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={playing ? replay : play}
              className="px-6 py-3 rounded-full bg-ink text-parchment font-semibold hover:bg-violet transition-colors"
            >
              {visible === 0 ? "▶ Play" : playing ? "Playing…" : "↺ Replay"}
            </button>
            <a
              href={BOOK_WA_LINK}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-full bg-brand-gradient text-white font-semibold hover:opacity-90 transition-opacity"
            >
              🖐 Try it live
            </a>
          </div>
        </div>

        <div className="bg-ink rounded-card p-4 max-w-sm mx-auto w-full">
          <div className="flex items-center justify-between text-parchment/50 text-xs px-2 pb-2">
            <span>9:41</span>
            <span>📶 🔋</span>
          </div>
          <div className="bg-parchment rounded-xl overflow-hidden">
            <div className="bg-brand-gradient text-white px-4 py-3 flex items-center gap-2">
              <img src="/brand/logo.png" alt="ROSKYRO" className="w-6 h-6 object-contain" />
              <div>
                <div className="text-sm font-semibold">ROSKYRO</div>
                <div className="text-[11px] opacity-80">online</div>
              </div>
            </div>
            <div className="p-4 space-y-2 min-h-[280px] max-h-[320px] overflow-y-auto">
              {SCRIPT.slice(0, visible).map((m, idx) => (
                <div key={idx} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] text-sm rounded-2xl px-3 py-2 ${
                      m.from === "user" ? "bg-violet text-white rounded-br-sm" : "bg-white text-ink rounded-bl-sm border border-ink/10"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {visible === 0 && (
                <p className="text-ink/40 text-sm text-center pt-16">Press ▶ Play to watch the demo</p>
              )}
            </div>
            <div className="border-t border-ink/10 p-2 flex items-center gap-2">
              <div className="flex-1 bg-white/60 rounded-full px-3 py-1.5 text-xs text-ink/40">Message</div>
              <button className="w-8 h-8 rounded-full bg-brand-gradient text-white flex items-center justify-center">➤</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
