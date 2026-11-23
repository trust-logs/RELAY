import Link from "next/link";
import { signUp } from "@/app/actions/auth";

const messages: Record<string, string> = {
  invalid: "Enter your name, a valid email address, and a password with at least 8 characters.",
  signup: "We couldn't create your account. The email may already be registered. Try signing in instead.",
  rate: "Too many attempts. Please wait a little and try again.",
  configuration: "Email confirmation is not configured yet. Please try again later.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <Link className="brand auth-brand" href="/"><span className="brand-mark">R</span><span>RELAY<span className="brand-period">.</span></span></Link>
        <div className="auth-kicker"><span className="live-dot" /> YOUR NEXT CHAPTER STARTS HERE</div>
        <h1>Create your<br /><span>RELAY account.</span></h1>
        <p className="auth-intro">One account for the things you need done, the people who get them done, and the progress in between.</p>

        {error && <p className="auth-alert" role="alert">{messages[error] ?? "Something went wrong. Please try again."}</p>}

        <form className="auth-form" action={signUp}>
          <label htmlFor="displayName">Your name</label>
          <input id="displayName" name="displayName" type="text" autoComplete="name" placeholder="How should we call you?" minLength={2} maxLength={80} required />
          <label htmlFor="signupEmail">Email address</label>
          <input id="signupEmail" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
          <label htmlFor="signupPassword">Create password</label>
          <input id="signupPassword" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} required />
          <p className="auth-hint">Use at least 8 characters. We'll email you a confirmation link.</p>
          <button className="auth-submit" type="submit">Create my account <span>↗</span></button>
        </form>

        <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
        <p className="auth-legal">By creating an account, you agree to use RELAY responsibly. Terms and privacy information will be presented before public launch.</p>
      </section>
      <aside className="auth-aside">
        <div className="auth-aside-orbit orbit-a" /><div className="auth-aside-orbit orbit-b" />
        <div className="auth-aside-content">
          <span className="aside-spark">✳</span>
          <p className="aside-quote">Make room for<br /><span>what matters.</span></p>
          <p className="aside-caption">Your people. Your projects. Your progress. All moving in one direction.</p>
          <div className="aside-footer"><span>RELAY / 001</span><span>MAKE IT HAPPEN</span></div>
        </div>
      </aside>
    </main>
  );
}
