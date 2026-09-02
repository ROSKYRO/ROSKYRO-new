import { BOOK_WA_LINK } from "../../config";

export default function LaunchBanner() {
  return (
    <div className="bg-brand-gradient text-white text-center text-sm font-medium py-2.5 px-4">
      🎉 We are LIVE in INDIA! 🎁 First 50 families get their first hour FREE — book even 1 hour.{" "}
      <a href={BOOK_WA_LINK} target="_blank" rel="noreferrer" className="underline underline-offset-2">
        Claim yours →
      </a>
    </div>
  );
}
