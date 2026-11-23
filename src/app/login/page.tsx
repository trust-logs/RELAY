import Link from "next/link";
import { signIn } from "@/app/actions/auth";

const messages: Record<string, string> = {
  invalid: "Enter your email address and password.",
  credentials: "Those details didn't match an account. Check them and try again.",
  rate: "Too many attempts. Please wait a little and try again.",
  confirmation: "We couldn't confirm that email link. Request a new confirmation email or sign in if your email is already verified.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <Link className="brand auth-brand" href="/"><span className="brand-mark">R</span><span>RELAY<span className="brand-period">.</span></span></Link>
        <div className="auth-kicker"><span className="live-dot" /> GOOD TO HAVE YOU BACK</div>
        <h1>Pick up where<br /><span>you left off.</span></h1>
        <p className="auth-intro">Sign in to see your requests, projects, people, and everything moving forward.</p>

        {error && <p className="auth-alert" role="alert">{messages[error] ?? "Something went wrong. Please try again."}</p>}

        <form className="auth-form" action={signIn}>
          <label htmlFor="loginEmail">Email address</label>
          <input id="loginEmail" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
          <label htmlFor="loginPassword">Password</label>
          <input id="loginPassword" name="password" type="password" autoComplete="current-password" placeholder="Your password" required />
          <button className="auth-submit" type="submit">Sign in to RELAY <span>↗</span></button>
        </form>

        <p className="auth-switch">New to RELAY? <Link href="/signup">Create an account</Link></p>
        <p className="auth-legal">Your account is protected by Supabase authentication and secure session cookies.</p>
      </section>
      <aside className="auth-aside">
        <div className="auth-aside-orbit orbit-a" /><div className="auth-aside-orbit orbit-b" />
        <div className="auth-aside-content">
          <span className="aside-spark">✳</span>
          <p className="aside-quote">Less chasing.<br /><span>More doing.</span></p>
          <p className="aside-caption">Your work doesn't have to live in ten different places. Bring it all back to RELAY.</p>
          <div className="aside-footer"><span>RELAY / 002</span><span>MAKE IT HAPPEN</span></div>
        </div>
      </aside>
    </main>
  );
}
