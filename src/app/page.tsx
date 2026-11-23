const environments = [
  {
    number: "01",
    name: "RELAY LIFE",
    description: "Everyday errands, home help, appointments, and the little things that keep life moving.",
    tag: "For everyday life",
  },
  {
    number: "02",
    name: "RELAY WORK",
    description: "Coordinate field operations, business tasks, projects, suppliers, and teams.",
    tag: "For work that matters",
  },
  {
    number: "03",
    name: "RELAY NETWORK",
    description: "A trusted network of capable people and businesses ready to get things done.",
    tag: "For people who deliver",
  },
];

const steps = [
  ["Tell RELAY", "Describe what needs to happen in plain language."],
  ["Build the plan", "RELAY helps organise the work, people, and next steps."],
  ["Make it happen", "Coordinate progress, approvals, and proof of completion."],
];

export default function HomePage() {
  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="/" aria-label="RELAY home">
          <span className="brand-mark">R</span>
          <span>RELAY<span className="brand-period">.</span></span>
        </a>
        <div className="nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#environments">Explore RELAY</a>
          <a href="#trust">Trust & safety</a>
        </div>
        <div className="nav-auth"><a className="nav-login" href="/login">Sign in</a><a className="nav-cta" href="/signup">Join RELAY <span>↗</span></a></div>
      </nav>

      <section className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow"><span className="live-dot" /> THE WORLD, IN MOTION</div>
          <h1>Big plans.<br /><span>Small tasks.</span><br />All moving.</h1>
          <p className="hero-lede">
            Life doesn't wait. RELAY brings people, services, and smart coordination together to get real things done.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="/signup">Get started with RELAY <span>↗</span></a>
            <a className="button button-quiet" href="#environments">Explore the platform</a>
          </div>
          <div className="hero-proof">
            <span className="proof-icon">✳</span>
            <span>One request. A clearer way forward.</span>
          </div>
        </div>

        <div className="hero-art" aria-label="Illustration of a coordinated RELAY project">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit-core">
            <span className="core-spark">✳</span>
            <strong>RELAY</strong>
            <small>MAKE IT HAPPEN</small>
          </div>
          <div className="orbit-card card-top"><span className="mini-icon violet">↗</span><span><b>Plan created</b><small>Your next steps are ready</small></span><i>✓</i></div>
          <div className="orbit-card card-right"><span className="mini-icon lime">⌖</span><span><b>People connected</b><small>The right help, in motion</small></span></div>
          <div className="orbit-card card-bottom"><span className="mini-icon peach">✦</span><span><b>Progress tracked</b><small>Every step, in one place</small></span><i className="progress"><i /></i></div>
          <div className="floating-dot dot-a" /><div className="floating-dot dot-b" /><div className="floating-dot dot-c" />
        </div>
        <div className="hero-foot"><span>BUILT FOR REAL LIFE</span><span>PEOPLE · PROJECTS · PROGRESS</span><span>01 / 03</span></div>
      </section>

      <section className="ticker" aria-label="RELAY capabilities">
        <div className="ticker-track"><span>LESS CHASING</span><b>✳</b><span>MORE DOING</span><b>✳</b><span>BETTER COORDINATION</span><b>✳</b><span>REAL PROGRESS</span><b>✳</b><span>LESS CHASING</span><b>✳</b><span>MORE DOING</span></div>
      </section>

      <section className="section shell" id="how-it-works">
        <div className="section-heading">
          <div><div className="eyebrow">A BETTER WAY TO GET THERE</div><h2>From “I need this done”<br />to <span>“It's handled.”</span></h2></div>
          <p>Not another place to scroll endlessly. RELAY helps turn an outcome you want into an organised plan that people can actually deliver.</p>
        </div>
        <div className="steps-grid">
          {steps.map(([title, description], index) => (
            <article className="step-card" key={title}>
              <div className="step-top"><span>0{index + 1}</span><span className="step-symbol">{["↗", "✳", "✓"][index]}</span></div>
              <h3>{title}</h3><p>{description}</p>
              <div className="step-line"><span style={{ width: `${(index + 1) * 33.333}%` }} /></div>
            </article>
          ))}
        </div>
      </section>

      <section className="environments-section" id="environments">
        <div className="shell">
          <div className="section-heading">
            <div><div className="eyebrow">ONE NETWORK. MANY POSSIBILITIES.</div><h2>Whatever needs doing,<br /><span>there's a RELAY.</span></h2></div>
            <p>Different ways to work. One connected platform that keeps the details, people, and progress together.</p>
          </div>
          <div className="environment-grid">
            {environments.map((item, index) => (
              <article className={`environment-card environment-${index + 1}`} key={item.name}>
                <div className="environment-top"><span>{item.number} / PLATFORM</span><span className="environment-arrow">↗</span></div>
                <div className="environment-art"><span className="art-ring ring-one" /><span className="art-ring ring-two" /><span className="art-glyph">{["⌂", "▦", "✳"][index]}</span></div>
                <div className="environment-bottom"><span className="environment-tag">{item.tag}</span><h3>{item.name}</h3><p>{item.description}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="trust-section shell" id="trust">
        <div className="trust-panel">
          <div className="trust-copy">
            <div className="eyebrow">TRUST IS PART OF THE PRODUCT</div>
            <h2>Good work starts<br />with <span>good people.</span></h2>
            <p>RELAY Trust & Verification helps people understand who's behind a profile. Identity checks, professional credentials, and earned reliability are kept distinct and clear.</p>
            <a className="button button-dark" href="mailto:hello@relay.example">Discover RELAY Trust <span>↗</span></a>
          </div>
          <div className="trust-visual">
            <div className="trust-badge"><span className="badge-check">✓</span><span><b>Identity verified</b><small>Check completed</small></span><span className="badge-shield">✳</span></div>
            <div className="trust-badge trust-badge-offset"><span className="badge-check badge-lime">✓</span><span><b>Professional credentials</b><small>Reviewed where relevant</small></span><span className="badge-shield">✳</span></div>
            <div className="trust-note">Clear signals.<br />Earned trust.</div>
          </div>
        </div>
      </section>

      <footer className="footer shell">
        <a className="brand" href="/"><span className="brand-mark">R</span><span>RELAY<span className="brand-period">.</span></span></a>
        <span>Life doesn't wait. Get things done.</span>
        <span>© {new Date().getFullYear()} RELAY</span>
      </footer>
    </main>
  );
}
