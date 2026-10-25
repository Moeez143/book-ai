import Link from "next/link";
import { getVoiceSessionHistory } from "@/lib/actions/session.actions";
import { formatDuration } from "@/lib/utils";

export default async function SessionHistory({ bookId }: { bookId: string }) {
  const history = await getVoiceSessionHistory(bookId);

  return (
    <section className="mx-auto mt-8 w-full max-w-4xl rounded-[14px] bg-white p-6 shadow-soft">
      <h2 className="font-serif text-2xl font-bold text-[#212a3b]">Session history</h2>
      {!history.allowed ? (
        <p className="mt-3 text-sm text-[#3d485e]">
          Session history is available on Standard and Pro.{" "}
          <Link href="/subscriptions" className="font-semibold text-[#663820] underline">
            View plans
          </Link>
        </p>
      ) : history.error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">{history.error}</p>
      ) : history.sessions.length === 0 ? (
        <p className="mt-3 text-sm text-[#3d485e]">No voice sessions for this book yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-[#eadfce]">
          {history.sessions.map((session) => (
            <li key={session.id} className="flex items-center justify-between gap-4 py-3 text-sm text-[#3d485e]">
              <time dateTime={session.startedAt}>
                {new Date(session.startedAt).toLocaleString("en-US", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" })} UTC
              </time>
              <span>{formatDuration(session.durationSeconds)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
