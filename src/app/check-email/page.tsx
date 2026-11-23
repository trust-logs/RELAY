import Link from "next/link";

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const safeEmail = email && email.length <= 254 ? email : "your inbox";

  return (
    <main className="auth-shell auth-confirm-shell">
      <section className="auth-panel">
        <Link className="brand auth-brand" href="/"><span className="brand-mark">R</span><span>RELAY<span className="brand-period">.</span></span></Link>
        <div className="confirm-icon">✉</div>
        <div className="auth-kicker">ONE QUICK STEP</div>
        <h1>Check your<br /><span>inbox.</span></h1>
        <p className="auth-intro">We sent a confirmation link to <strong>{safeEmail}</strong>. Open it to activate your account and enter RELAY.</p>
        <div className="auth-info">
          <strong>Can't see the email?</strong>
          <p>Check your spam or promotions folder. If it doesn't arrive, you can return and try creating your account again later.</p>
        </div>
        <Link className="auth-submit auth-link-button" href="/login">Back to sign in <span>↗</span></Link>
      </section>
      <aside className="auth-aside"><div className="auth-aside-orbit orbit-a" /><div className="auth-aside-orbit orbit-b" /><div className="auth-aside-content"><span className="aside-spark">✳</span><p className="aside-quote">A little step.<br /><span>A lot in motion.</span></p><p className="aside-caption">Confirm your email and your RELAY account is ready to go.</p><div className="aside-footer"><span>RELAY / 003</span><span>MAKE IT HAPPEN</span></div></div></aside>
    </main>
  );
}
