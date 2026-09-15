# LootForward — Gamers Helping Gamers

Complete modular, four-page client-side gaming charity donation platform using:

- Semantic HTML5
- Bootstrap 5 CDN
- Three.js CDN
- Firebase Web SDK v10+ modular imports
- Responsive premium dark gaming UI
- Client-side routing without browser reloads
- Interactive Three.js particle background
- Donation category switching
- Recipient selection
- Client-side verification validation
- Dynamic confirmation receipt and audit ticket

## Project Structure

```text
lootforward/
├── index.html
├── styles.css
└── app.js
```

---

## 1. `index.html`

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="LootForward — Gamers Helping Gamers. Verified gaming equipment and monetary donations for communities in need.">
  <title>LootForward — Gamers Helping Gamers</title>

  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Orbitron:wght@500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
</head>

<body>
  <canvas id="matrix-canvas" aria-hidden="true"></canvas>

  <nav class="navbar navbar-expand-lg navbar-dark sticky-top loot-navbar">
    <div class="container py-2">
      <a class="navbar-brand brand-mark" href="#about" data-route="about" aria-label="LootForward home">
        <span class="brand-icon">LF</span>
        <span>Loot<span>Forward</span></span>
      </a>

      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav"
              aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="mainNav">
        <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-2">
          <li class="nav-item">
            <a class="nav-link active" href="#about" data-route="about">About</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#donate" data-route="donate">The Drop</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#recipients" data-route="recipients">Who to Donate</a>
          </li>
          <li class="nav-item ms-lg-2">
            <a class="btn btn-neon btn-sm px-4" href="#recipients" data-route="recipients">Start a Drop</a>
          </li>
        </ul>
      </div>
    </div>
  </nav>

  <main id="app-shell">

    <!-- PAGE 1 -->
    <section id="page-about" class="page-view active-page" data-page="about">
      <div class="container py-5">
        <div class="hero-panel glass-panel">
          <div class="row align-items-center g-5">
            <div class="col-lg-7">
              <span class="eyebrow">GAMERS HELPING GAMERS</span>
              <h1 class="display-3 fw-bold hero-title">
                Your old gear can become someone's
                <span class="gradient-text">next great game.</span>
              </h1>
              <p class="hero-copy">
                LootForward connects gamers with verified community programs that need consoles,
                gaming gadgets, and direct financial support. Every donation enters an audit-first
                workflow designed to reduce fraud and keep the giving loop trustworthy.
              </p>
              <div class="d-flex flex-wrap gap-3">
                <a class="btn btn-neon btn-lg" href="#recipients" data-route="recipients">Find a Recipient</a>
                <a class="btn btn-outline-neon btn-lg" href="#donate" data-route="donate">Donate Gear</a>
              </div>
            </div>

            <div class="col-lg-5">
              <div class="hero-terminal">
                <div class="terminal-header">
                  <span></span><span></span><span></span>
                  <small>LOOTFORWARD / AUDIT_NODE</small>
                </div>
                <div class="terminal-body">
                  <p><span class="terminal-green">STATUS</span> VERIFIED NETWORK</p>
                  <p><span class="terminal-cyan">HARDWARE</span> fingerprint queued</p>
                  <p><span class="terminal-purple">FUNDING</span> source cross-check</p>
                  <p><span class="terminal-green">RECIPIENT</span> destination validated</p>
                  <div class="terminal-progress"><span></span></div>
                  <p class="mb-0 terminal-muted">awaiting next contribution...</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row g-4 mt-4">
          <div class="col-md-4">
            <article class="stat-card glass-panel h-100">
              <span class="stat-label">TOTAL HARDWARE SAVED</span>
              <strong class="stat-value" id="hardware-stat">2,481</strong>
              <span class="stat-note">devices redirected from storage to communities</span>
            </article>
          </div>
          <div class="col-md-4">
            <article class="stat-card glass-panel h-100">
              <span class="stat-label">MONETARY AUDITS COMPLETED</span>
              <strong class="stat-value" id="audit-stat">8,942</strong>
              <span class="stat-note">funding records reviewed by the network</span>
            </article>
          </div>
          <div class="col-md-4">
            <article class="stat-card glass-panel h-100">
              <span class="stat-label">COMMUNITIES SUPPORTED</span>
              <strong class="stat-value" id="community-stat">126</strong>
              <span class="stat-note">verified programs receiving gaming resources</span>
            </article>
          </div>
        </div>

        <div class="section-heading mt-5">
          <span class="eyebrow">ANTI-FRAUD WORKFLOW</span>
          <h2>From your inventory to a verified community.</h2>
          <p>The workflow is intentionally transparent: collect evidence, validate the source, match the need, then release the contribution.</p>
        </div>

        <div class="row g-4 workflow-row">
          <div class="col-md-6 col-lg-3">
            <article class="workflow-card glass-panel h-100">
              <div class="step-number">01</div>
              <h3>Declare</h3>
              <p>Provide the exact hardware or monetary contribution details before anything enters the queue.</p>
            </article>
          </div>
          <div class="col-md-6 col-lg-3">
            <article class="workflow-card glass-panel h-100">
              <div class="step-number">02</div>
              <h3>Evidence</h3>
              <p>Attach a proof snapshot or funding statement so the audit layer has supporting evidence.</p>
            </article>
          </div>
          <div class="col-md-6 col-lg-3">
            <article class="workflow-card glass-panel h-100">
              <div class="step-number">03</div>
              <h3>Match</h3>
              <p>Your contribution is connected to a selected verified recipient and its published needs.</p>
            </article>
          </div>
          <div class="col-md-6 col-lg-3">
            <article class="workflow-card glass-panel h-100">
              <div class="step-number">04</div>
              <h3>Audit</h3>
              <p>A temporary ticket identifies the pending audit while the contribution waits for review.</p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <!-- PAGE 2 -->
    <section id="page-donate" class="page-view" data-page="donate">
      <div class="container py-5">
        <div class="section-heading">
          <span class="eyebrow">THE DROP</span>
          <h2>Submit a contribution for verification.</h2>
          <p id="recipient-context" class="context-note">Choose a verified recipient first, or select one below.</p>
        </div>

        <div class="drop-shell glass-panel">
          <div class="category-switcher" role="tablist" aria-label="Donation type">
            <button type="button" class="category-btn active" data-donation-type="console">Console</button>
            <button type="button" class="category-btn" data-donation-type="gadget">Gadget</button>
            <button type="button" class="category-btn" data-donation-type="money">Money</button>
          </div>

          <form id="donation-form" novalidate>
            <input type="hidden" id="donation-type" name="donationType" value="console">

            <div id="physical-fields" class="form-panel active-form-panel">
              <div class="row g-4">
                <div class="col-md-6">
                  <label class="form-label" for="item-name">Item Name / Brand</label>
                  <input class="form-control" id="item-name" name="itemName" type="text"
                         placeholder="e.g. Sony PlayStation 5" required>
                </div>

                <div class="col-md-6">
                  <label class="form-label" for="model-number">Model Number</label>
                  <input class="form-control" id="model-number" name="modelNumber" type="text"
                         placeholder="e.g. CFI-1200A" required>
                </div>

                <div class="col-md-6">
                  <label class="form-label" for="condition">Condition</label>
                  <select class="form-select" id="condition" name="condition" required>
                    <option value="">Choose condition</option>
                    <option value="New / Sealed">New / Sealed</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Used">Used</option>
                    <option value="Needs Repair">Needs Repair</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label" for="faults">Hardware Faults / Damages</label>
                  <input class="form-control" id="faults" name="faults" type="text"
                         placeholder="e.g. HDMI port slightly loose">
                </div>

                <div class="col-12">
                  <label class="form-label" for="proof-snapshot">Proof Snapshot</label>
                  <input class="form-control" id="proof-snapshot" name="proofSnapshot"
                         type="file" accept="image/*" required>
                  <div class="form-text">Attach a clear photo showing the device and relevant identifying details.</div>
                </div>
              </div>
            </div>

            <div id="money-fields" class="form-panel">
              <div class="row g-4">
                <div class="col-12">
                  <label class="form-label">Quick Amount</label>
                  <div class="quick-tiers">
                    <button type="button" class="tier-btn" data-amount="10">$10</button>
                    <button type="button" class="tier-btn" data-amount="25">$25</button>
                    <button type="button" class="tier-btn" data-amount="50">$50</button>
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label" for="amount">Custom Amount (USD)</label>
                  <div class="input-group">
                    <span class="input-group-text">$</span>
                    <input class="form-control" id="amount" name="amount" type="number"
                           min="1" step="0.01" placeholder="25.00" required>
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label" for="statement-upload">Credit / Bank Statement Upload</label>
                  <input class="form-control" id="statement-upload" name="statementUpload"
                         type="file" accept=".pdf,image/*" required>
                  <div class="form-text">Upload only the supporting document required for funding verification.</div>
                </div>
              </div>
            </div>

            <div class="recipient-lock glass-panel">
              <div>
                <span class="stat-label">LOCKED RECIPIENT</span>
                <strong id="locked-recipient">No recipient selected</strong>
              </div>
              <button type="button" class="btn btn-outline-neon btn-sm" data-route="recipients">
                Change
              </button>
            </div>

            <div id="form-alert" class="form-alert d-none" role="alert"></div>

            <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-4">
              <small class="privacy-note">Client-side demo validation. Connect the form to your secured backend before accepting real donations.</small>
              <button type="submit" class="btn btn-neon btn-lg px-5">Submit for Audit</button>
            </div>
          </form>
        </div>
      </div>
    </section>

    <!-- PAGE 3 -->
    <section id="page-recipients" class="page-view" data-page="recipients">
      <div class="container py-5">
        <div class="section-heading">
          <span class="eyebrow">VERIFIED DESTINATIONS</span>
          <h2>Choose who receives your contribution.</h2>
          <p>These demo organizations represent the approved charity data map used by the recipient matching interface.</p>
        </div>

        <div id="recipient-grid" class="row g-4"></div>
      </div>
    </section>

    <!-- PAGE 4 -->
    <section id="page-confirmation" class="page-view" data-page="confirmation">
      <div class="container py-5">
        <div class="confirmation-shell glass-panel">
          <div class="confirmation-icon">✓</div>
          <span class="eyebrow">DROP RECEIVED</span>
          <h2>Contribution queued for verification.</h2>
          <p class="confirmation-copy">
            Your contribution has been captured locally and assigned a temporary audit ticket.
            The ticket is not proof of payment or final charity acceptance.
          </p>

          <div class="receipt-block">
            <div class="receipt-header">
              <span>LOOTFORWARD</span>
              <span>SECURE RECEIPT</span>
            </div>
            <div class="receipt-divider"></div>

            <div class="receipt-row">
              <span>ITEM / AMOUNT</span>
              <strong id="receipt-item">—</strong>
            </div>
            <div class="receipt-row">
              <span>VERIFICATION TYPE</span>
              <strong id="receipt-type">—</strong>
            </div>
            <div class="receipt-row">
              <span>RECIPIENT</span>
              <strong id="receipt-recipient">—</strong>
            </div>
            <div class="receipt-row">
              <span>PROOF FILE</span>
              <strong id="receipt-proof">—</strong>
            </div>

            <div class="receipt-divider"></div>

            <div class="ticket-label">TEMPORARY VERIFICATION TICKET</div>
            <div id="receipt-ticket" class="ticket-code">PENDING_AUDIT_--------</div>

            <div class="receipt-hash">
              SHA-STYLE CHECK: <span id="receipt-hash">WAITING_FOR_AUDIT</span>
            </div>
          </div>

          <div class="d-flex justify-content-center gap-3 flex-wrap mt-4">
            <button type="button" class="btn btn-neon btn-lg" data-route="about">Track Verification Queue</button>
            <button type="button" class="btn btn-outline-neon btn-lg" data-route="recipients">New Drop</button>
          </div>
        </div>
      </div>
    </section>

  </main>

  <footer class="loot-footer">
    <div class="container d-flex flex-wrap justify-content-between gap-3">
      <span>© 2026 LootForward — Gamers Helping Gamers</span>
      <span>Verified-first donation prototype</span>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script type="module" src="app.js"></script>
</body>
</html>
```

---

## 2. `styles.css`

```css
:root {
  --void: #0f0c1b;
  --surface: #17132a;
  --cyan: #00f2fe;
  --purple: #9b51e0;
  --white: #f5f7ff;
  --muted: #a8a5bd;
  --border: rgba(255, 255, 255, 0.11);
  --glass: rgba(15, 12, 27, 0.75);
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  min-height: 100vh;
  margin: 0;
  color: var(--white);
  background: var(--void);
  font-family: "Inter", sans-serif;
  overflow-x: hidden;
}

a {
  color: inherit;
}

#matrix-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
}

.loot-navbar {
  background: rgba(15, 12, 27, 0.78);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--border);
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: "Orbitron", sans-serif;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.brand-mark > span:last-child > span {
  color: var(--cyan);
}

.brand-icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid rgba(0, 242, 254, 0.45);
  border-radius: 11px;
  color: var(--cyan);
  font-size: 0.7rem;
  box-shadow: 0 0 25px rgba(0, 242, 254, 0.12);
}

.nav-link {
  color: rgba(245, 247, 255, 0.72) !important;
  font-weight: 600;
}

.nav-link:hover,
.nav-link.active {
  color: var(--cyan) !important;
}

.page-view {
  display: none;
  min-height: calc(100vh - 82px);
  animation: pageIn 0.35s ease both;
}

.page-view.active-page {
  display: block;
}

@keyframes pageIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.glass-panel,
.stat-card,
.workflow-card {
  background-color: rgba(15, 12, 27, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--border);
}

.glass-panel {
  border-radius: 24px;
}

.hero-panel {
  position: relative;
  padding: clamp(28px, 6vw, 72px);
  overflow: hidden;
}

.hero-panel::before {
  position: absolute;
  content: "";
  width: 280px;
  height: 280px;
  right: -100px;
  top: -100px;
  border-radius: 50%;
  background: rgba(0, 242, 254, 0.08);
  filter: blur(10px);
}

.eyebrow {
  display: inline-block;
  margin-bottom: 14px;
  color: var(--cyan);
  font-family: "Orbitron", sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.hero-title {
  max-width: 850px;
  font-family: "Orbitron", sans-serif;
  line-height: 1.05;
}

.gradient-text {
  background: linear-gradient(90deg, var(--cyan), var(--purple));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-copy,
.section-heading p,
.confirmation-copy {
  color: var(--muted);
  line-height: 1.8;
}

.hero-copy {
  max-width: 760px;
  margin: 24px 0 30px;
  font-size: 1.05rem;
}

.btn-neon {
  border: 1px solid var(--cyan);
  color: #061016;
  background: var(--cyan);
  font-weight: 800;
  box-shadow: 0 0 25px rgba(0, 242, 254, 0.17);
}

.btn-neon:hover {
  border-color: #fff;
  color: #061016;
  background: #fff;
  box-shadow: 0 0 32px rgba(0, 242, 254, 0.3);
}

.btn-outline-neon {
  border: 1px solid rgba(0, 242, 254, 0.65);
  color: var(--cyan);
  font-weight: 700;
}

.btn-outline-neon:hover {
  color: #061016;
  background: var(--cyan);
}

.hero-terminal {
  position: relative;
  border: 1px solid rgba(155, 81, 224, 0.45);
  border-radius: 18px;
  overflow: hidden;
  background: rgba(8, 7, 16, 0.86);
  box-shadow: 0 0 50px rgba(155, 81, 224, 0.08);
}

.terminal-header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 12px 15px;
  border-bottom: 1px solid var(--border);
}

.terminal-header > span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
}

.terminal-header small {
  margin-left: auto;
  color: var(--muted);
  font-family: "Orbitron", sans-serif;
  font-size: 0.52rem;
}

.terminal-body {
  padding: 24px;
  color: #dce7ff;
  font-family: monospace;
  font-size: 0.84rem;
  line-height: 2;
}

.terminal-green {
  color: #6effb2;
}

.terminal-cyan {
  color: var(--cyan);
}

.terminal-purple {
  color: #c792ff;
}

.terminal-muted {
  color: #66627c;
}

.terminal-progress {
  height: 4px;
  margin: 16px 0;
  overflow: hidden;
  border-radius: 10px;
  background: #252138;
}

.terminal-progress span {
  display: block;
  width: 70%;
  height: 100%;
  background: linear-gradient(90deg, var(--cyan), var(--purple));
  animation: progress 2.2s ease-in-out infinite alternate;
}

@keyframes progress {
  from {
    width: 35%;
  }

  to {
    width: 90%;
  }
}

.stat-card,
.workflow-card {
  padding: 28px;
  border-radius: 18px;
}

.stat-label {
  display: block;
  color: #858198;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.stat-value {
  display: block;
  margin: 8px 0;
  font-family: "Orbitron", sans-serif;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  background: linear-gradient(90deg, var(--cyan), #fff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.stat-note {
  color: var(--muted);
  font-size: 0.85rem;
  line-height: 1.6;
}

.section-heading {
  max-width: 800px;
  margin-bottom: 28px;
}

.section-heading h2 {
  margin-bottom: 12px;
  font-family: "Orbitron", sans-serif;
  font-weight: 700;
}

.workflow-row {
  margin-bottom: 30px;
}

.workflow-card {
  transition: transform 0.25s ease, border-color 0.25s ease;
}

.workflow-card:hover {
  transform: translateY(-5px);
  border-color: rgba(0, 242, 254, 0.4);
}

.step-number {
  margin-bottom: 22px;
  color: var(--purple);
  font-family: "Orbitron", sans-serif;
  font-size: 0.8rem;
  font-weight: 800;
}

.workflow-card h3 {
  font-family: "Orbitron", sans-serif;
  font-size: 1.05rem;
}

.workflow-card p {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
  font-size: 0.9rem;
}

.drop-shell {
  max-width: 1000px;
  margin: auto;
  padding: clamp(22px, 4vw, 45px);
}

.category-switcher {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 30px;
  padding: 6px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.2);
}

.category-btn,
.tier-btn {
  padding: 12px 16px;
  border: 1px solid transparent;
  border-radius: 10px;
  color: var(--muted);
  background: transparent;
  font-weight: 800;
  transition: 0.2s ease;
}

.category-btn:hover,
.category-btn.active,
.tier-btn:hover,
.tier-btn.active {
  border-color: rgba(0, 242, 254, 0.35);
  color: var(--cyan);
  background: rgba(0, 242, 254, 0.07);
}

.form-panel {
  display: none;
}

.form-panel.active-form-panel {
  display: block;
  animation: pageIn 0.2s ease both;
}

.form-label {
  color: #d8d4e7;
  font-size: 0.85rem;
  font-weight: 700;
}

.form-control,
.form-select,
.input-group-text {
  min-height: 48px;
  border: 1px solid var(--border);
  color: var(--white);
  background-color: rgba(8, 7, 16, 0.65);
}

.form-control::placeholder {
  color: #656078;
}

.form-control:focus,
.form-select:focus {
  border-color: var(--cyan);
  color: var(--white);
  background-color: rgba(8, 7, 16, 0.8);
  box-shadow: 0 0 0 0.2rem rgba(0, 242, 254, 0.1);
}

.form-select option {
  color: #111;
}

.input-group-text {
  color: var(--cyan);
  font-weight: 800;
}

.form-text,
.privacy-note {
  color: #77738b;
}

.quick-tiers {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-tiers .tier-btn {
  min-width: 90px;
  border-color: var(--border);
}

.recipient-lock {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 30px;
  padding: 18px;
  border-radius: 14px;
}

.recipient-lock strong {
  display: block;
  margin-top: 5px;
  font-size: 0.92rem;
}

.context-note {
  padding: 10px 14px;
  border-left: 2px solid var(--cyan);
  background: rgba(0, 242, 254, 0.04);
}

.form-alert {
  margin-top: 22px;
  padding: 14px 16px;
  border: 1px solid rgba(255, 95, 95, 0.35);
  border-radius: 12px;
  color: #ffb4b4;
  background: rgba(255, 95, 95, 0.08);
}

.form-control.is-invalid,
.form-select.is-invalid {
  border-color: #ff6868;
}

.recipient-card {
  height: 100%;
  padding: 28px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background-color: rgba(15, 12, 27, 0.75);
  backdrop-filter: blur(8px);
  transition: transform 0.25s ease, border-color 0.25s ease;
}

.recipient-card:hover {
  transform: translateY(-6px);
  border-color: rgba(155, 81, 224, 0.55);
}

.recipient-badge {
  display: inline-block;
  margin-bottom: 18px;
  padding: 5px 9px;
  border: 1px solid rgba(0, 242, 254, 0.25);
  border-radius: 99px;
  color: var(--cyan);
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.recipient-card h3 {
  font-family: "Orbitron", sans-serif;
  font-size: 1.1rem;
  line-height: 1.4;
}

.recipient-card p {
  color: var(--muted);
  line-height: 1.7;
  font-size: 0.9rem;
}

.needs-list {
  min-height: 92px;
  margin: 20px 0;
  padding-left: 18px;
  color: #c6c2d5;
  font-size: 0.88rem;
  line-height: 1.8;
}

.confirmation-shell {
  max-width: 800px;
  margin: 30px auto;
  padding: clamp(25px, 5vw, 55px);
  text-align: center;
}

.confirmation-icon {
  display: grid;
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  place-items: center;
  border: 1px solid rgba(0, 242, 254, 0.45);
  border-radius: 50%;
  color: var(--cyan);
  font-size: 1.7rem;
  box-shadow: 0 0 30px rgba(0, 242, 254, 0.12);
}

.confirmation-shell h2 {
  font-family: "Orbitron", sans-serif;
}

.receipt-block {
  margin-top: 30px;
  padding: 24px;
  border: 1px dashed rgba(0, 242, 254, 0.4);
  border-radius: 16px;
  text-align: left;
  background:
    linear-gradient(rgba(0, 242, 254, 0.025) 1px, transparent 1px),
    rgba(5, 5, 12, 0.75);
  background-size: 100% 8px;
}

.receipt-header,
.receipt-row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.receipt-header {
  color: var(--cyan);
  font-family: "Orbitron", sans-serif;
  font-size: 0.68rem;
  letter-spacing: 0.12em;
}

.receipt-row {
  padding: 14px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.receipt-row span {
  color: #77738b;
  font-size: 0.68rem;
  font-weight: 800;
}

.receipt-row strong {
  max-width: 62%;
  color: #e9e7f2;
  text-align: right;
  font-size: 0.82rem;
  word-break: break-word;
}

.receipt-divider {
  height: 1px;
  margin: 18px 0;
  background: repeating-linear-gradient(
    90deg,
    rgba(0, 242, 254, 0.4) 0 6px,
    transparent 6px 11px
  );
}

.ticket-label {
  color: #77738b;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.ticket-code {
  margin: 8px 0;
  color: var(--cyan);
  font-family: "Orbitron", monospace;
  font-size: clamp(0.8rem, 2vw, 1.1rem);
  letter-spacing: 0.08em;
  overflow-wrap: anywhere;
}

.receipt-hash {
  color: #676379;
  font-family: monospace;
  font-size: 0.65rem;
}

.receipt-hash span {
  color: #a98cce;
}

.loot-footer {
  padding: 25px 0;
  border-top: 1px solid var(--border);
  color: #6f6b81;
  background: rgba(15, 12, 27, 0.7);
  font-size: 0.75rem;
}

@media (max-width: 575px) {
  .category-switcher {
    grid-template-columns: 1fr;
  }

  .recipient-lock,
  .receipt-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .receipt-row strong {
    max-width: 100%;
    text-align: left;
  }

  .hero-title {
    font-size: 2.3rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

---

## 3. `app.js`

```javascript
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js";

/*
 * Firebase configuration.
 *
 * Replace these values with the configuration generated by your Firebase
 * project before using a production backend.
 */
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_PROJECT.firebaseapp.com",
  projectId: "YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_FIREBASE_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID"
};

const firebaseConfigured = !Object.values(firebaseConfig).some(
  (value) => typeof value === "string" && value.startsWith("YOUR_")
);

let firebaseApp = null;
let firestore = null;

if (firebaseConfigured) {
  firebaseApp = initializeApp(firebaseConfig);
  firestore = getFirestore(firebaseApp);
}

const recipients = [
  {
    id: "st-jude-gaming-hub",
    name: "St. Jude Children's Hospital Gaming Hub",
    mission: "Create accessible gaming spaces that support hospital-based recreation, connection, and positive downtime.",
    needs: ["Current-generation consoles", "Comfortable controllers", "Headsets", "Gaming monitors"],
    region: "Verified Community Program"
  },
  {
    id: "low-income-esport-lab",
    name: "Low-Income Community Esport Center Lab",
    mission: "Build an affordable esports and digital skills lab for young people who lack reliable access to gaming hardware.",
    needs: ["Gaming PCs", "Mechanical keyboards", "Mice", "Entry-level GPUs"],
    region: "Verified Community Program"
  },
  {
    id: "youth-recreation-network",
    name: "Youth Recreation Network Game Room",
    mission: "Equip community recreation centers with shared gaming stations for supervised social play and digital learning.",
    needs: ["PlayStation / Xbox consoles", "TV displays", "Controllers", "Charging docks"],
    region: "Verified Community Program"
  }
];

const state = {
  currentPage: "about",
  donationType: "console",
  selectedRecipient: null,
  latestSubmission: null
};

const pageIds = ["about", "donate", "recipients", "confirmation"];

const elements = {
  pages: document.querySelectorAll(".page-view"),
  navLinks: document.querySelectorAll("[data-route]"),
  categoryButtons: document.querySelectorAll("[data-donation-type]"),
  tierButtons: document.querySelectorAll("[data-amount]"),
  donationForm: document.querySelector("#donation-form"),
  donationType: document.querySelector("#donation-type"),
  physicalFields: document.querySelector("#physical-fields"),
  moneyFields: document.querySelector("#money-fields"),
  itemName: document.querySelector("#item-name"),
  modelNumber: document.querySelector("#model-number"),
  condition: document.querySelector("#condition"),
  faults: document.querySelector("#faults"),
  proofSnapshot: document.querySelector("#proof-snapshot"),
  amount: document.querySelector("#amount"),
  statementUpload: document.querySelector("#statement-upload"),
  lockedRecipient: document.querySelector("#locked-recipient"),
  recipientContext: document.querySelector("#recipient-context"),
  formAlert: document.querySelector("#form-alert"),
  recipientGrid: document.querySelector("#recipient-grid"),
  receiptItem: document.querySelector("#receipt-item"),
  receiptType: document.querySelector("#receipt-type"),
  receiptRecipient: document.querySelector("#receipt-recipient"),
  receiptProof: document.querySelector("#receipt-proof"),
  receiptTicket: document.querySelector("#receipt-ticket"),
  receiptHash: document.querySelector("#receipt-hash"),
  navbarCollapse: document.querySelector("#mainNav")
};

function navigate(page, updateHash = true) {
  if (!pageIds.includes(page)) {
    page = "about";
  }

  state.currentPage = page;

  elements.pages.forEach((view) => {
    view.classList.toggle("active-page", view.dataset.page === page);
  });

  elements.navLinks.forEach((link) => {
    link.classList.toggle(
      "active",
      link.dataset.route === page ||
      (page === "confirmation" && link.dataset.route === "about")
    );
  });

  if (updateHash && window.location.hash !== `#${page}`) {
    history.pushState({ page }, "", `#${page}`);
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  closeMobileNavigation();
  updateDonationContext();
}

function resolveInitialPage() {
  const hash = window.location.hash.replace("#", "").trim();

  if (pageIds.includes(hash)) {
    return hash;
  }

  return "about";
}

function closeMobileNavigation() {
  if (!elements.navbarCollapse || !window.bootstrap) {
    return;
  }

  if (elements.navbarCollapse.classList.contains("show")) {
    const collapse = window.bootstrap.Collapse.getOrCreateInstance(
      elements.navbarCollapse
    );

    collapse.hide();
  }
}

function updateDonationContext() {
  if (state.selectedRecipient) {
    elements.lockedRecipient.textContent = state.selectedRecipient.name;
    elements.recipientContext.textContent =
      `Recipient locked: ${state.selectedRecipient.name}. You can change this target at any time before submission.`;
  } else {
    elements.lockedRecipient.textContent = "No recipient selected";
    elements.recipientContext.textContent =
      "Choose a verified recipient first, or select one below.";
  }
}

function selectRecipient(recipientId) {
  const recipient = recipients.find((entry) => entry.id === recipientId);

  if (!recipient) {
    return;
  }

  state.selectedRecipient = recipient;
  updateDonationContext();
  navigate("donate");
}

function renderRecipients() {
  elements.recipientGrid.innerHTML = recipients.map((recipient) => `
    <div class="col-md-6 col-xl-4">
      <article class="recipient-card">
        <span class="recipient-badge">${escapeHtml(recipient.region)}</span>
        <h3>${escapeHtml(recipient.name)}</h3>
        <p>${escapeHtml(recipient.mission)}</p>

        <strong class="stat-label">CURRENT NEEDS</strong>
        <ul class="needs-list">
          ${recipient.needs.map((need) => `<li>${escapeHtml(need)}</li>`).join("")}
        </ul>

        <button
          type="button"
          class="btn btn-neon w-100"
          data-select-recipient="${escapeHtml(recipient.id)}">
          Select Recipient
        </button>
      </article>
    </div>
  `).join("");
}

function setDonationType(type) {
  if (!["console", "gadget", "money"].includes(type)) {
    return;
  }

  state.donationType = type;
  elements.donationType.value = type;

  elements.categoryButtons.forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.donationType === type
    );
  });

  const physicalMode = type === "console" || type === "gadget";

  elements.physicalFields.classList.toggle("active-form-panel", physicalMode);
  elements.moneyFields.classList.toggle("active-form-panel", !physicalMode);

  setRequired(elements.itemName, physicalMode);
  setRequired(elements.modelNumber, physicalMode);
  setRequired(elements.condition, physicalMode);
  setRequired(elements.proofSnapshot, physicalMode);

  setRequired(elements.amount, !physicalMode);
  setRequired(elements.statementUpload, !physicalMode);

  clearFormAlert();
}

function setRequired(element, required) {
  element.required = required;
  element.setAttribute("aria-required", String(required));
}

function clearValidation() {
  elements.donationForm
    .querySelectorAll(".is-invalid")
    .forEach((element) => element.classList.remove("is-invalid"));
}

function validateForm() {
  clearValidation();
  clearFormAlert();

  if (!state.selectedRecipient) {
    showFormAlert("Please select a verified recipient before submitting your donation.");
    return false;
  }

  const physicalMode =
    state.donationType === "console" ||
    state.donationType === "gadget";

  const requiredElements = physicalMode
    ? [
        elements.itemName,
        elements.modelNumber,
        elements.condition,
        elements.proofSnapshot
      ]
    : [
        elements.amount,
        elements.statementUpload
      ];

  let valid = true;

  requiredElements.forEach((element) => {
    const empty =
      element.type === "file"
        ? element.files.length === 0
        : !String(element.value).trim();

    if (empty) {
      element.classList.add("is-invalid");
      valid = false;
    }
  });

  if (!valid) {
    showFormAlert("Please complete every required verification field.");
    return false;
  }

  if (!physicalMode && Number(elements.amount.value) < 1) {
    elements.amount.classList.add("is-invalid");
    showFormAlert("The monetary contribution must be at least $1.");
    return false;
  }

  return true;
}

function showFormAlert(message) {
  elements.formAlert.textContent = message;
  elements.formAlert.classList.remove("d-none");
}

function clearFormAlert() {
  elements.formAlert.textContent = "";
  elements.formAlert.classList.add("d-none");
}

function getFileName(fileInput) {
  return fileInput.files.length > 0
    ? fileInput.files[0].name
    : "Not supplied";
}

function buildSubmission() {
  const physicalMode =
    state.donationType === "console" ||
    state.donationType === "gadget";

  const ticket = `PENDING_AUDIT_${randomId(8)}`;

  const submission = {
    donationType: state.donationType,
    recipientId: state.selectedRecipient.id,
    recipientName: state.selectedRecipient.name,
    itemName: physicalMode
      ? elements.itemName.value.trim()
      : `$${Number(elements.amount.value).toFixed(2)}`,
    modelNumber: physicalMode
      ? elements.modelNumber.value.trim()
      : null,
    condition: physicalMode
      ? elements.condition.value
      : null,
    faults: physicalMode
      ? elements.faults.value.trim()
      : null,
    proofFile: physicalMode
      ? getFileName(elements.proofSnapshot)
      : getFileName(elements.statementUpload),
    ticket,
    createdAt: new Date().toISOString(),
    auditStatus: "PENDING_AUDIT"
  };

  return submission;
}

function randomId(length) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);

  return Array.from(
    values,
    (value) => alphabet[value % alphabet.length]
  ).join("");
}

function createReceiptHash(submission) {
  const input = [
    submission.ticket,
    submission.recipientName,
    submission.itemName,
    submission.proofFile
  ].join("|");

  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

function renderConfirmation(submission) {
  const typeLabel =
    submission.donationType === "money"
      ? "MONETARY FUNDING"
      : submission.donationType === "console"
        ? "CONSOLE HARDWARE"
        : "GAMING GADGET";

  elements.receiptItem.textContent = submission.itemName;
  elements.receiptType.textContent = typeLabel;
  elements.receiptRecipient.textContent = submission.recipientName;
  elements.receiptProof.textContent = submission.proofFile;
  elements.receiptTicket.textContent = submission.ticket;
  elements.receiptHash.textContent = `LF-${createReceiptHash(submission)}`;
}

async function persistSubmission(submission) {
  if (!firestore) {
    return {
      persisted: false,
      reason: "Firebase configuration has not been added."
    };
  }

  try {
    await addDoc(collection(firestore, "donationSubmissions"), {
      ...submission,
      createdAt: serverTimestamp()
    });

    return {
      persisted: true
    };
  } catch (error) {
    console.error("Firebase submission error:", error);

    return {
      persisted: false,
      reason: "Local submission completed, but cloud persistence failed."
    };
  }
}

async function handleDonationSubmit(event) {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  const submission = buildSubmission();

  state.latestSubmission = submission;
  renderConfirmation(submission);
  navigate("confirmation");

  const persistenceResult = await persistSubmission(submission);

  if (!persistenceResult.persisted && firebaseConfigured) {
    console.warn(persistenceResult.reason);
  }
}

function resetDonationForm() {
  elements.donationForm.reset();
  clearValidation();
  clearFormAlert();

  state.donationType = "console";
  setDonationType("console");
}

function handleRouteClick(event) {
  const routeElement = event.target.closest("[data-route]");

  if (!routeElement) {
    return;
  }

  event.preventDefault();
  navigate(routeElement.dataset.route);
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const recipientButton = event.target.closest("[data-select-recipient]");

    if (recipientButton) {
      selectRecipient(recipientButton.dataset.selectRecipient);
      return;
    }

    const routeElement = event.target.closest("[data-route]");

    if (routeElement) {
      handleRouteClick(event);
    }
  });

  elements.categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setDonationType(button.dataset.donationType);
    });
  });

  elements.tierButtons.forEach((button) => {
    button.addEventListener("click", () => {
      elements.amount.value = button.dataset.amount;

      elements.tierButtons.forEach((tier) => {
        tier.classList.toggle("active", tier === button);
      });

      elements.amount.classList.remove("is-invalid");
    });
  });

  elements.donationForm.addEventListener("submit", handleDonationSubmit);

  window.addEventListener("popstate", () => {
    navigate(resolveInitialPage(), false);
  });

  window.addEventListener("hashchange", () => {
    navigate(resolveInitialPage(), false);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/*
 * Three.js interactive particle field.
 */
function initParticleMatrix() {
  const canvas = document.querySelector("#matrix-canvas");

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  camera.position.z = 22;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x0f0c1b, 0);

  const particleCount = window.innerWidth < 768 ? 650 : 1100;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const cyan = new THREE.Color(0x00f2fe);
  const purple = new THREE.Color(0x9b51e0);

  for (let index = 0; index < particleCount; index += 1) {
    const offset = index * 3;

    positions[offset] = (Math.random() - 0.5) * 55;
    positions[offset + 1] = (Math.random() - 0.5) * 38;
    positions[offset + 2] = (Math.random() - 0.5) * 35;

    const color = Math.random() > 0.5 ? cyan : purple;

    colors[offset] = color.r;
    colors[offset + 1] = color.g;
    colors[offset + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );

  geometry.setAttribute(
    "color",
    new THREE.BufferAttribute(colors, 3)
  );

  const material = new THREE.PointsMaterial({
    size: 0.075,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  const mouse = {
    x: 0,
    y: 0
  };

  const target = {
    x: 0,
    y: 0
  };

  window.addEventListener("mousemove", (event) => {
    target.x = (event.clientX / window.innerWidth - 0.5) * 2;
    target.y = (event.clientY / window.innerHeight - 0.5) * 2;
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  const clock = new THREE.Clock();

  function animate() {
    const elapsed = clock.getElapsedTime();

    mouse.x += (target.x - mouse.x) * 0.025;
    mouse.y += (target.y - mouse.y) * 0.025;

    particles.rotation.y = elapsed * 0.018 + mouse.x * 0.08;
    particles.rotation.x = Math.sin(elapsed * 0.1) * 0.03 + mouse.y * 0.04;

    particles.position.x = mouse.x * 1.3;
    particles.position.y = -mouse.y * 1.0;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}

function initialize() {
  renderRecipients();
  setDonationType("console");
  bindEvents();
  updateDonationContext();
  navigate(resolveInitialPage(), false);
  initParticleMatrix();

  window.lootForward = {
    state,
    recipients,
    navigate,
    resetDonationForm
  };
}

initialize();
```

---

## Firebase Setup

The application includes Firebase Web SDK v10+ modular imports, but the Firebase configuration intentionally uses safe configuration placeholders.

Create a Firebase project and replace:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_PROJECT.firebaseapp.com",
  projectId: "YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_FIREBASE_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID"
};
```

The application currently stores donation metadata in the Firestore collection:

```text
donationSubmissions
```

The uploaded file itself is **not** uploaded to Firebase by this front-end implementation. The browser only captures the selected filename. For a real charity platform, connect the file input to Firebase Storage or a secured backend and enforce server-side validation.

---

## Local Deployment

Save the three files in the same folder:

```text
lootforward/
├── index.html
├── styles.css
└── app.js
```

Do not open `index.html` directly with `file://` when testing ES modules. Use a local HTTP server.

### VS Code Live Server

Install the **Live Server** extension and open `index.html` using:

```text
Open with Live Server
```

### Python HTTP Server

From the project directory:

```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

---

## Implemented Interaction Flow

```text
ABOUT
  │
  ├── Find a Recipient ────────────────┐
  │                                    ▼
  │                              RECIPIENTS
  │                                    │
  │                              Select Recipient
  │                                    │
  └── Donate Gear ───────────────► THE DROP
                                       │
                              Console/Gadget/Money
                                       │
                               Client Validation
                                       │
                               Submit for Audit
                                       ▼
                                  CONFIRMATION
                                       │
                              Track Verification
                                       │
                                       ▼
                                     ABOUT
```

### Console / Gadget

Required:

- Item Name / Brand
- Model Number
- Condition
- Proof Snapshot

Optional:

- Hardware Faults / Damages

### Money

Required:

- Custom Amount
- Credit / Bank Statement Upload

Quick tiers:

- `$10`
- `$25`
- `$50`

### Confirmation

The receipt dynamically displays:

- Contribution item or amount
- Verification type
- Recipient organization
- Proof filename
- `PENDING_AUDIT_[RANDOM_ID]`
- Cryptographic-looking local receipt hash

---

## Production Security Notes

This implementation provides the requested front-end architecture, but a real donation platform must not rely on browser validation or local state as its security boundary.

Before production deployment:

1. Validate every donation again on the server.
2. Authenticate donors and administrators.
3. Apply Firebase Security Rules using least privilege.
4. Restrict Firestore writes to authenticated users.
5. Validate uploaded files by MIME type, extension, size, and content.
6. Store uploads in Firebase Storage or a secure backend rather than trusting client filenames.
7. Scan uploaded images and financial documents for malicious content.
8. Never store unnecessary financial-account information.
9. Do not accept raw card numbers or banking credentials in the application.
10. Add server-side rate limiting and abuse protection.
11. Add an administrator-only audit queue.
12. Keep recipient approval data server-controlled.
13. Log audit events without exposing sensitive donor information.
14. Use HTTPS in production.
15. Add authentication, authorization, and fraud monitoring before accepting real funds.
16. Use a PCI-compliant payment processor for actual card donations instead of collecting card information directly.

The `PENDING_AUDIT_*` ticket generated by this demo is a temporary client/server submission identifier, not a blockchain transaction, payment confirmation, or legally binding charity receipt.
