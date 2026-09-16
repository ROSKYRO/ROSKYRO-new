import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Camera, CheckCircle2, MapPin, Clock, Copy, ShieldCheck, AlertTriangle } from "lucide-react";
import api from "../api/client";

/** Resizes/compresses a captured photo client-side before it ever leaves the
 * phone — keeps uploads fast on a weak mobile connection and comfortably
 * under the backend's size cap. Returns a base64 data URL (JPEG). */
function compressImage(file, maxDimension = 1280, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that photo."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read that photo."));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          const scale = maxDimension / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ lat: null, lng: null });
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: null, lng: null }), // denied or unavailable — proceed without it
      { timeout: 8000, enableHighAccuracy: true }
    );
  });
}

const STAGE_COPY = {
  requested: { title: "Not Yet Assigned", body: "This visit hasn't been matched to a Companion yet." },
  assigned: { title: "Confirm Arrival", body: "Take a photo when you reach the address below to confirm your arrival." },
  en_route: { title: "Confirm Arrival", body: "Take a photo when you reach the address below to confirm your arrival." },
  awaiting_start_pin: { title: "Waiting on Start PIN", body: "Ask the customer for their Start PIN — they'll enter it in their own app to begin the service clock." },
  in_progress: { title: "Confirm Completion", body: "Once the visit is genuinely finished, take a photo to confirm completion and reveal the End PIN." },
  awaiting_end_pin: { title: "Wrapping Up", body: "Waiting for the customer to enter the End PIN you gave them." },
  completed: { title: "Visit Completed", body: "This visit is closed out. Thank you!" },
  cancelled: { title: "Booking Cancelled", body: "This visit was cancelled." },
};

export default function OfficerCapture() {
  const { token } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [endPin, setEndPin] = useState(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  async function load() {
    try {
      const { data } = await api.get(`/officer/${token}`);
      setBooking(data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "This link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

  async function handleCapture(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file again if retaking
    if (!file || !booking) return;

    setSubmitting(true);
    setError("");
    try {
      const [photoDataUrl, { lat, lng }] = await Promise.all([compressImage(file), getLocation()]);
      const step = ["assigned", "en_route"].includes(booking.status) ? "arrival" : "completion";
      const { data } = await api.post(`/officer/${token}/${step}`, { photo_base64: photoDataUrl, lat, lng });
      if (step === "completion") setEndPin(data.end_pin);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not submit that photo. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const copyPin = () => {
    navigator.clipboard?.writeText(endPin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-violet border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-ink/60 text-sm font-medium">Loading visit details...</p>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-clay mx-auto" />
        <p className="text-ink font-semibold">{error}</p>
        <p className="text-ink/50 text-xs">Please check the link or contact ROSKYRO dispatch.</p>
      </div>
    );
  }

  const stage = STAGE_COPY[booking.status] || {};
  const canCapture = ["assigned", "en_route", "in_progress"].includes(booking.status);

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-5">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-violet bg-violet/10 px-2.5 py-1 rounded-full">
          <ShieldCheck className="w-3 h-3" />
          Relationship Officer Check-In
        </div>
        <h1 className="font-display text-xl font-bold text-ink">{booking.booking_code}</h1>
      </div>

      <div className="bg-white rounded-2xl border border-ink/10 p-4 space-y-2 text-sm">
        <div className="font-semibold text-ink">{booking.service_name} — {booking.customer_name}</div>
        <div className="flex items-start gap-2 text-ink/60 text-xs">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{booking.address}</span>
        </div>
        <div className="flex items-center gap-2 text-ink/60 text-xs">
          <Clock className="w-3.5 h-3.5" />
          <span>{new Date(booking.scheduled_start).toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-slate-50 border border-ink/10 rounded-2xl p-5 text-center space-y-3">
        <h2 className="font-display text-lg font-bold text-ink">{stage.title}</h2>
        <p className="text-xs text-ink/60 leading-relaxed">{stage.body}</p>

        {canCapture && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleCapture}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting}
              className="w-full px-5 py-3.5 rounded-full bg-brand-gradient text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-violet/20 hover:opacity-95 disabled:opacity-60"
            >
              <Camera className="w-4.5 h-4.5" />
              <span>{submitting ? "Submitting..." : "Take Photo & Confirm"}</span>
            </button>
            <p className="text-[10px] text-ink/40">
              Timestamp and location (if allowed) are captured automatically with your photo.
            </p>
          </>
        )}

        {!canCapture && ["awaiting_start_pin", "awaiting_end_pin"].includes(booking.status) && (
          <button
            onClick={load}
            className="text-xs font-semibold text-violet hover:underline"
          >
            Refresh Status
          </button>
        )}
      </div>

      {error && booking && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium text-center">
          {error}
        </div>
      )}

      {endPin && (
        <div className="bg-ink text-white rounded-2xl p-5 text-center space-y-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="text-xs text-white/70">Completion photo saved. Tell the customer this End PIN now:</p>
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-3xl font-bold tracking-widest">{endPin}</span>
            <button onClick={copyPin} className="text-white/60 hover:text-white p-1" title="Copy PIN">
              <Copy className="w-5 h-5" />
            </button>
          </div>
          {copied && <span className="text-[10px] text-emerald-400">Copied!</span>}
          <p className="text-[10px] text-white/40">
            The customer enters this in their own app to close billing — you don't need to do anything else here.
          </p>
        </div>
      )}
    </div>
  );
}
