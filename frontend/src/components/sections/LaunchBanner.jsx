import { BOOK_WA_LINK } from "../../config";

export default function LaunchBanner() {
  return (
    <div className="bg-brand-gradient text-white text-center text-sm font-medium py-2.5 px-4">
      Trusted Care & Assistance, When You Need It Most. Verified Support Partners | Flexible Hourly Booking | Transparent Process | Safety-Focused Assistance{" "}
      <a href={BOOK_WA_LINK} target="_blank" rel="noreferrer" className="underline underline-offset-2">
        Book Assistance →
      </a>
    </div>
  );
}
