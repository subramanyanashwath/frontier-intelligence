import { privatePassphrase } from "@/lib/auth/private-session";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" && params.next.startsWith("/private") ? params.next : "/private";
  const configured = Boolean(privatePassphrase());
  const failed = params.error === "1";
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <p className="kicker">Separate route</p>
      <h1 className="mt-2 font-mono text-2xl text-amber">Private Career Alpha</h1>
      <p className="mt-3 text-[13px] leading-6 text-dim">
        This gate opens a different part of the application. It is not a display toggle on the observatory.
      </p>
      {configured ? (
        <form action="/api/auth/private" method="post" className="mt-6 space-y-3">
          <input type="hidden" name="next" value={next} />
          <label className="block">
            <span className="kicker">Passphrase</span>
            <input
              type="password"
              name="passphrase"
              required
              className="mt-2 w-full border border-line bg-panel px-3 py-2 font-mono"
              autoComplete="current-password"
            />
          </label>
          {failed ? <p className="text-[12px] text-rose">Passphrase refused.</p> : null}
          <button className="border border-amber/50 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-amber">Enter</button>
        </form>
      ) : (
        <p className="mt-6 border border-rose/40 px-3 py-3 text-[13px] text-rose">
          Private mode is locked. Set PRIVATE_MODE_PASSPHRASE before using this route in production.
        </p>
      )}
    </main>
  );
}
