export const ApiKeyRequestForm = () => {
  const TO = "tech@brickken.com";

  const NETWORKS = [
    "Ethereum mainnet (1)",
    "Base mainnet (8453)",
    "BNB Smart Chain (56)",
    "Polygon mainnet (137)",
    "Sepolia testnet (11155111)",
    "Base Sepolia (84532)",
    "Polygon Amoy (80002)",
  ];

  // Order matters: focus jumps to the first invalid field in this order.
  const FIELD_ORDER = ["name", "email", "company", "accountEmail", "networks", "useCase"];

  const [values, setValues] = useState({
    name: "",
    email: "",
    company: "",
    accountEmail: "",
    environment: "Sandbox",
    plan: "Not sure",
    symbols: "",
    useCase: "",
  });
  const [networks, setNetworks] = useState([]);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const [showFallback, setShowFallback] = useState(false);
  const [copied, setCopied] = useState(false);

  const set = useCallback(
    (key) => (e) => {
      const v = e.target.value;
      setValues((prev) => ({ ...prev, [key]: v }));
    },
    []
  );

  const toggleNetwork = useCallback(
    (n) => () =>
      setNetworks((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : prev.concat(n))),
    []
  );

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());

  const validate = useCallback(() => {
    const next = {};
    if (!values.name.trim()) next.name = "Enter your full name.";
    if (!isEmail(values.email)) next.email = "Enter a valid email address.";
    if (!values.company.trim()) next.company = "Enter your company or project name.";
    if (!isEmail(values.accountEmail))
      next.accountEmail = "Enter the email registered on your Brickken account.";
    if (networks.length === 0) next.networks = "Select at least one network.";
    if (values.useCase.trim().length < 20)
      next.useCase = "Describe your use case in at least 20 characters.";
    setErrors(next);
    return next;
  }, [values, networks]);

  const body = useMemo(() => {
    return [
      "Brickken API key request",
      "",
      "Name:                   " + values.name,
      "Reply-to email:         " + values.email,
      "Company / project:      " + values.company,
      "Brickken account email: " + values.accountEmail,
      "Environment:            " + values.environment,
      "Plan of interest:       " + values.plan,
      "Networks:               " + (networks.join(", ") || "-"),
      "Token symbols to issue: " + (values.symbols.trim() || "-"),
    ]
      .concat([
        "",
        "Use case:",
        values.useCase.trim(),
        "",
        "Sent from https://docs.brickken.com/get-started/request-api-key",
      ])
      .join("\r\n");
  }, [values, networks]);

  const subject = useMemo(
    () => "API key request — " + (values.company.trim() || "Unnamed") + " — " + values.environment,
    [values.company, values.environment]
  );

  // encodeURIComponent turns "\r\n" into %0D%0A, which is what mail clients expect.
  const mailto = useMemo(
    () => "mailto:" + TO + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body),
    [subject, body]
  );

  const plaintext = useMemo(
    () => "To: " + TO + "\r\nSubject: " + subject + "\r\n\r\n" + body,
    [subject, body]
  );

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const next = validate();
      const firstBad = FIELD_ORDER.find((k) => next[k]);
      if (firstBad) {
        setStatus("Some fields need attention.");
        const el = document.getElementById("bkn-" + firstBad);
        if (el && el.focus) el.focus();
        return;
      }
      // Always reveal the copy block: a missing mailto handler is undetectable from JS.
      setShowFallback(true);
      if (mailto.length > 1800) {
        setStatus("Your message is too long for a prefilled email link. Copy the message below and send it manually.");
        return;
      }
      setStatus("Opening your email app with a prefilled draft. If nothing happens, copy the message below.");
      window.location.href = mailto;
    },
    [validate, mailto]
  );

  const onCopy = useCallback(() => {
    if (!navigator.clipboard) {
      setStatus("Copying is blocked in this browser. Select the text below and copy it manually.");
      return;
    }
    navigator.clipboard.writeText(plaintext).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => setStatus("Copying is blocked in this browser. Select the text below and copy it manually.")
    );
  }, [plaintext]);

  // Inline styles rather than Tailwind: Mintlify only rewrites class strings written
  // literally in JSX, so utilities passed through a variable (notably `w-full`) never
  // land. Colours are theme-neutral so the form reads correctly in light and dark.
  const S = {
    label: { display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" },
    input: {
      width: "100%",
      boxSizing: "border-box",
      borderRadius: "0.5rem",
      border: "1px solid rgba(128,128,128,0.35)",
      background: "transparent",
      color: "inherit",
      padding: "0.5rem 0.75rem",
      fontSize: "0.875rem",
      fontFamily: "inherit",
    },
    err: { marginTop: "0.25rem", fontSize: "0.75rem", color: "#dc2626" },
    hint: { marginTop: "0.25rem", fontSize: "0.75rem", opacity: 0.7 },
    field: { marginBottom: "1rem", minWidth: 0 },
    // clamp() caps this at two columns on any width and collapses to one below ~530px,
    // without needing a media query that inline styles cannot express.
    grid: { display: "grid", gap: "0 1rem", gridTemplateColumns: "repeat(auto-fit, minmax(clamp(240px, 45%, 100%), 1fr))" },
    netGrid: { display: "grid", gap: "0.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(clamp(200px, 45%, 100%), 1fr))" },
    check: { display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" },
    submit: {
      borderRadius: "0.5rem",
      background: "#2563eb",
      color: "#fff",
      border: "none",
      padding: "0.5rem 1rem",
      fontSize: "0.875rem",
      fontWeight: 500,
      cursor: "pointer",
    },
    copyBtn: {
      borderRadius: "0.375rem",
      border: "1px solid rgba(128,128,128,0.4)",
      background: "transparent",
      color: "inherit",
      padding: "0.25rem 0.75rem",
      fontSize: "0.75rem",
      cursor: "pointer",
    },
    fallback: {
      marginTop: "1rem",
      borderRadius: "0.5rem",
      border: "1px solid rgba(128,128,128,0.35)",
      padding: "1rem",
    },
    fallbackHead: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.75rem",
      marginBottom: "0.5rem",
    },
    pre: { overflowX: "auto", whiteSpace: "pre-wrap", fontSize: "0.75rem", margin: 0 },
    status: { marginTop: "0.75rem", fontSize: "0.875rem", opacity: 0.8 },
    intro: { fontSize: "0.875rem", opacity: 0.8, marginBottom: "1.25rem" },
  };

  return (
    <form onSubmit={onSubmit} noValidate style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }} className="not-prose">
      <p style={S.intro}>
        This form sends nothing to Brickken by itself. It opens a prefilled draft in your own email
        client, addressed to <code>{TO}</code>, which you send yourself.
      </p>

      <div style={S.grid}>
        <div style={S.field}>
          <label style={S.label} htmlFor="bkn-name">Full name *</label>
          <input
            id="bkn-name"
            style={S.input}
            value={values.name}
            onChange={set("name")}
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "bkn-name-error" : undefined}
          />
          {errors.name ? <p style={S.err} id="bkn-name-error" role="alert">{errors.name}</p> : null}
        </div>

        <div style={S.field}>
          <label style={S.label} htmlFor="bkn-email">Your email *</label>
          <input
            id="bkn-email"
            type="email"
            style={S.input}
            value={values.email}
            onChange={set("email")}
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "bkn-email-error" : undefined}
          />
          {errors.email ? <p style={S.err} id="bkn-email-error" role="alert">{errors.email}</p> : null}
        </div>

        <div style={S.field}>
          <label style={S.label} htmlFor="bkn-company">Company or project *</label>
          <input
            id="bkn-company"
            style={S.input}
            value={values.company}
            onChange={set("company")}
            autoComplete="organization"
            aria-invalid={!!errors.company}
            aria-describedby={errors.company ? "bkn-company-error" : undefined}
          />
          {errors.company ? <p style={S.err} id="bkn-company-error" role="alert">{errors.company}</p> : null}
        </div>

        <div style={S.field}>
          <label style={S.label} htmlFor="bkn-accountEmail">Brickken account email *</label>
          <input
            id="bkn-accountEmail"
            type="email"
            style={S.input}
            value={values.accountEmail}
            onChange={set("accountEmail")}
            aria-invalid={!!errors.accountEmail}
            aria-describedby={errors.accountEmail ? "bkn-accountEmail-error" : undefined}
          />
          <p style={S.hint}>The email registered on your Brickken dApp account. Keys are issued against it.</p>
          {errors.accountEmail ? (
            <p style={S.err} id="bkn-accountEmail-error" role="alert">{errors.accountEmail}</p>
          ) : null}
        </div>

        <div style={S.field}>
          <label style={S.label} htmlFor="bkn-environment">Environment *</label>
          <select id="bkn-environment" style={S.input} value={values.environment} onChange={set("environment")}>
            <option>Sandbox</option>
            <option>Production</option>
            <option>Both</option>
          </select>
          <p style={S.hint}>Keys are per-deployment — a sandbox key does not work in production.</p>
        </div>

        <div style={S.field}>
          <label style={S.label} htmlFor="bkn-plan">Plan of interest</label>
          <select id="bkn-plan" style={S.input} value={values.plan} onChange={set("plan")}>
            <option>Not sure</option>
            <option>Starter</option>
            <option>Professional</option>
            <option>Enterprise</option>
          </select>
        </div>
      </div>

      <div style={S.field}>
        <fieldset aria-describedby={errors.networks ? "bkn-networks-error" : undefined}>
          <legend style={S.label} id="bkn-networks" tabIndex={-1}>Target networks *</legend>
          <div style={S.netGrid}>
            {NETWORKS.map((n) => (
              <label key={n} style={S.check}>
                <input type="checkbox" checked={networks.includes(n)} onChange={toggleNetwork(n)} />
                <span>{n}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {errors.networks ? <p style={S.err} id="bkn-networks-error" role="alert">{errors.networks}</p> : null}
      </div>

      <div style={S.field}>
        <label style={S.label} htmlFor="bkn-symbols">Token symbol(s) you plan to issue</label>
        <input
          id="bkn-symbols"
          style={S.input}
          value={values.symbols}
          onChange={set("symbols")}
          placeholder="EXMPL, RWA1"
        />
        <p style={S.hint}>Optional. Your key is scoped to the symbols it tokenizes.</p>
      </div>

      <div style={S.field}>
        <label style={S.label} htmlFor="bkn-useCase">What are you building? *</label>
        <textarea
          id="bkn-useCase"
          rows={4}
          style={S.input}
          value={values.useCase}
          onChange={set("useCase")}
          placeholder="Which methods you expect to call, expected monthly volume, timeline."
          aria-invalid={!!errors.useCase}
          aria-describedby={errors.useCase ? "bkn-useCase-error" : undefined}
        />
        {errors.useCase ? <p style={S.err} id="bkn-useCase-error" role="alert">{errors.useCase}</p> : null}
      </div>

      <button
        type="submit"
        style={S.submit}
      >
        Open prefilled email to {TO}
      </button>

      <p aria-live="polite" style={S.status}>{status}</p>

      {showFallback ? (
        <div style={S.fallback}>
          <div style={S.fallbackHead}>
            <strong style={{ fontSize: "0.875rem" }}>Didn't your mail app open? Copy this instead.</strong>
            <button
              type="button"
              onClick={onCopy}
              style={S.copyBtn}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre style={S.pre}>{plaintext}</pre>
        </div>
      ) : null}
    </form>
  );
};
