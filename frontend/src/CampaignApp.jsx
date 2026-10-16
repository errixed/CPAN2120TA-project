import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1")
  .replace(/\/$/, "");
const STRATEGIES = [
  "NEWSLETTER",
  "RETIREMENT_PLANNING",
  "INVESTMENT_EDUCATION",
  "WEBINAR",
  "CONSULTATION_OFFER",
  "OTHER"
];
const CHANNELS = ["EMAIL", "FACEBOOK"];
const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "CONSULTATION_REQUESTED",
  "CONVERTED"
];
const EMPTY_FORM = {
  title: "",
  description: "",
  strategy: "NEWSLETTER",
  channel: "EMAIL",
  interests: "",
  leadStatuses: [],
  templateId: "",
  scheduledAt: "",
  status: "DRAFT"
};

function humanize(value = "") {
  return value.toLowerCase().replaceAll("_", " ");
}

function localDate(value) {
  if (!value) return "";
  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

function campaignForm(campaign) {
  return {
    title: campaign.title ?? "",
    description: campaign.description ?? "",
    strategy: campaign.strategy,
    channel: campaign.channel,
    interests: campaign.audience?.interests?.join(", ") ?? "",
    leadStatuses: campaign.audience?.leadStatuses ?? [],
    templateId: campaign.templateId ?? "",
    scheduledAt: localDate(campaign.scheduledAt),
    status: campaign.status
  };
}

function allowedStatuses(status) {
  const transitions = {
    DRAFT: ["DRAFT", "SCHEDULED", "ACTIVE", "CANCELLED"],
    SCHEDULED: ["DRAFT", "SCHEDULED", "ACTIVE", "CANCELLED"],
    ACTIVE: ["ACTIVE", "COMPLETED", "CANCELLED"],
    COMPLETED: ["COMPLETED"],
    CANCELLED: ["CANCELLED"]
  };
  return transitions[status] ?? ["DRAFT"];
}

export default function CampaignApp() {
  const [advisorId, setAdvisorId] = useState(
    () => window.localStorage.getItem("finmarket-advisor-id") ?? ""
  );
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [activeTab, setActiveTab] = useState("campaigns");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [audience, setAudience] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const validAdvisorId = /^[a-f\d]{24}$/i.test(advisorId);
  const templateChoices = useMemo(
    () => templates.filter((template) => template.channel === form.channel),
    [templates, form.channel]
  );

  const request = useCallback(async (path, options = {}) => {
    const url = new URL(`${API_URL}/campaigns${path}`);
    url.searchParams.set("advisorId", advisorId);
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...options.headers
      }
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error?.message ?? "The request could not be completed.");
    }

    return result.data;
  }, [advisorId]);

  const loadModuleData = useCallback(async () => {
    if (!validAdvisorId) {
      setCampaigns([]);
      setTemplates([]);
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const [campaignData, templateData] = await Promise.all([
        request(""),
        request("/templates")
      ]);
      setCampaigns(campaignData);
      setTemplates(templateData);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, [request, validAdvisorId]);

  useEffect(() => {
    if (validAdvisorId) {
      window.localStorage.setItem("finmarket-advisor-id", advisorId);
      loadModuleData();
    } else {
      setCampaigns([]);
      setTemplates([]);
    }
  }, [advisorId, validAdvisorId, loadModuleData]);

  function changeAdvisorId(value) {
    setAdvisorId(value.trim());
    setEditing(null);
    setAudience(null);
  }

  function startNewCampaign() {
    setEditing("new");
    setForm(EMPTY_FORM);
    setAudience(null);
    setActiveTab("campaigns");
    setMessage("");
  }

  function startEditCampaign(campaign) {
    setEditing(campaign._id);
    setForm(campaignForm(campaign));
    setAudience(null);
    setActiveTab("campaigns");
    setMessage("");
  }

  async function saveCampaign(event) {
    event.preventDefault();
    if (!validAdvisorId) return;

    const payload = {
      title: form.title,
      description: form.description,
      strategy: form.strategy,
      channel: form.channel,
      audience: {
        interests: form.interests.split(",").map((interest) => interest.trim()).filter(Boolean),
        leadStatuses: form.leadStatuses
      },
      templateId: form.templateId || null,
      scheduledAt: form.scheduledAt
        ? new Date(form.scheduledAt).toISOString()
        : null,
      status: form.status
    };

    setSaving(true);
    setMessage("");
    try {
      if (editing === "new") {
        await request("", { method: "POST", body: JSON.stringify(payload) });
      } else {
        await request(`/${editing}`, { method: "PATCH", body: JSON.stringify(payload) });
      }
      setEditing(null);
      await loadModuleData();
      setMessage("Campaign saved.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function previewAudience(campaign) {
    setMessage("");
    try {
      setAudience(await request(`/${campaign._id}/audience`));
    } catch (error) {
      setMessage(error.message);
    }
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="FinMarket home">
          <span className="brand-mark">F</span>
          <span>finmarket<span className="brand-dot">.</span></span>
        </a>
        <div className="header-meta">
          <span className="environment-label">CAMPAIGN STUDIO</span>
          <div className="advisor-field">
            <label htmlFor="advisorId">Advisor profile ID</label>
            <input
              id="advisorId"
              value={advisorId}
              onChange={(event) => changeAdvisorId(event.target.value)}
              placeholder="24-character MongoDB ID"
              spellCheck="false"
            />
          </div>
        </div>
      </header>

      <section className="page-heading">
        <div>
          <p className="eyebrow">MARKETING WORKSPACE</p>
          <h1>Campaigns</h1>
          <p className="subtitle">Shape thoughtful outreach for the people you serve.</p>
        </div>
        <button
          className="button button-primary"
          onClick={startNewCampaign}
          disabled={!validAdvisorId}
        >
          <span aria-hidden="true">＋</span> New campaign
        </button>
      </section>

      {!validAdvisorId && (
        <div className="notice notice-neutral">
          Enter a valid advisor profile ID to load campaigns and reusable templates.
        </div>
      )}
      {message && (
        <div className={`notice ${message.endsWith("saved.") ? "notice-success" : "notice-error"}`}
          role="status">
          {message}
        </div>
      )}

      <nav className="tabs" aria-label="Campaign sections">
        <button
          className={activeTab === "campaigns" ? "tab active" : "tab"}
          onClick={() => { setActiveTab("campaigns"); setEditing(null); }}
        >
          Campaigns <span className="tab-count">{campaigns.length}</span>
        </button>
        <button
          className={activeTab === "templates" ? "tab active" : "tab"}
          onClick={() => { setActiveTab("templates"); setEditing(null); }}
        >
          Templates <span className="tab-count">{templates.length}</span>
        </button>
      </nav>

      {activeTab === "campaigns" && (
        <section className="workspace">
          <div className="campaign-list">
            <div className="section-head">
              <div>
                <h2>All campaigns</h2>
                <p>Draft, schedule, and review your outreach.</p>
              </div>
              <button className="button button-quiet" onClick={loadModuleData} disabled={!validAdvisorId || loading}>
                Refresh
              </button>
            </div>
            {loading ? (
              <div className="empty-state">Loading campaigns…</div>
            ) : campaigns.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✳</div>
                <h3>No campaigns yet</h3>
                <p>Create a campaign to get started. Your saved work will appear here.</p>
                <button className="button button-secondary" onClick={startNewCampaign} disabled={!validAdvisorId}>
                  Create your first campaign
                </button>
              </div>
            ) : (
              <div className="campaign-cards">
                {campaigns.map((campaign) => (
                  <article className="campaign-card" key={campaign._id}>
                    <div className="campaign-card-main">
                      <div className={`status-dot status-${campaign.status.toLowerCase()}`} />
                      <div className="campaign-card-title">
                        <h3>{campaign.title}</h3>
                        <p>{humanize(campaign.strategy)} <span>·</span> {humanize(campaign.channel)}</p>
                      </div>
                      <span className={`status-pill status-${campaign.status.toLowerCase()}`}>
                        {humanize(campaign.status)}
                      </span>
                    </div>
                    {campaign.description && <p className="campaign-description">{campaign.description}</p>}
                    <div className="card-footer">
                      <span>
                        {campaign.scheduledAt
                          ? `Scheduled ${new Date(campaign.scheduledAt).toLocaleString()}`
                          : `Updated ${new Date(campaign.updatedAt).toLocaleDateString()}`}
                      </span>
                      <div className="card-actions">
                        <button className="text-button" onClick={() => previewAudience(campaign)}>Audience</button>
                        <button className="text-button" onClick={() => startEditCampaign(campaign)}>Edit</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {audience && (
              <section className="audience-panel" aria-live="polite">
                <div className="section-head">
                  <div>
                    <p className="eyebrow">TARGET AUDIENCE</p>
                    <h2>{audience.count} eligible {audience.count === 1 ? "lead" : "leads"}</h2>
                    <p>Only leads with marketing consent who have not unsubscribed are included.</p>
                  </div>
                  <button className="icon-button" onClick={() => setAudience(null)} aria-label="Close audience preview">×</button>
                </div>
                {audience.recipients.length > 0 ? (
                  <div className="recipient-list">
                    {audience.recipients.map((recipient) => (
                      <div className="recipient-row" key={recipient._id}>
                        <span className="avatar">{recipient.name?.charAt(0)?.toUpperCase() ?? "L"}</span>
                        <span className="recipient-name">{recipient.name}</span>
                        <span>{recipient.interest}</span>
                        <span className="recipient-status">{humanize(recipient.status)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-inline">No eligible leads match this audience yet.</p>
                )}
              </section>
            )}
          </div>

          {editing && (
            <aside className="editor-panel">
              <div className="section-head">
                <div>
                  <p className="eyebrow">{editing === "new" ? "NEW WORK" : "CAMPAIGN EDITOR"}</p>
                  <h2>{editing === "new" ? "Create campaign" : "Edit campaign"}</h2>
                </div>
                <button className="icon-button" onClick={() => setEditing(null)} aria-label="Close editor">×</button>
              </div>
              <form onSubmit={saveCampaign}>
                <label className="field">
                  <span>Campaign name</span>
                  <input required minLength="3" maxLength="150" value={form.title}
                    onChange={(event) => updateForm("title", event.target.value)}
                    placeholder="e.g. Retirement planning series" />
                </label>
                <label className="field">
                  <span>Description <small>Optional</small></span>
                  <textarea maxLength="2000" rows="3" value={form.description}
                    onChange={(event) => updateForm("description", event.target.value)}
                    placeholder="What should this campaign help people understand?" />
                </label>
                <div className="field-row">
                  <label className="field">
                    <span>Strategy</span>
                    <select value={form.strategy} onChange={(event) => updateForm("strategy", event.target.value)}>
                      {STRATEGIES.map((strategy) => <option key={strategy} value={strategy}>{humanize(strategy)}</option>)}
                    </select>
                  </label>
                  <label className="field">
                    <span>Channel</span>
                    <select value={form.channel} onChange={(event) => updateForm("channel", event.target.value)}>
                      {CHANNELS.map((channel) => <option key={channel} value={channel}>{humanize(channel)}</option>)}
                    </select>
                  </label>
                </div>
                <label className="field">
                  <span>Reusable template</span>
                  <select value={form.templateId} onChange={(event) => updateForm("templateId", event.target.value)}>
                    <option value="">No template selected</option>
                    {templateChoices.map((template) => (
                      <option key={template._id} value={template._id}>{template.name}</option>
                    ))}
                  </select>
                  {templateChoices.length === 0 && <small className="helper">No active {humanize(form.channel)} templates are available.</small>}
                </label>
                <label className="field">
                  <span>Interests <small>Comma-separated; leave blank for all</small></span>
                  <input value={form.interests} onChange={(event) => updateForm("interests", event.target.value)}
                    placeholder="Retirement Planning, Investing" />
                </label>
                <fieldset className="field">
                  <legend>Lead statuses <small>None selected means any status</small></legend>
                  <div className="status-options">
                    {LEAD_STATUSES.map((status) => (
                      <label className="check-option" key={status}>
                        <input
                          type="checkbox"
                          checked={form.leadStatuses.includes(status)}
                          onChange={(event) => updateForm(
                            "leadStatuses",
                            event.target.checked
                              ? [...form.leadStatuses, status]
                              : form.leadStatuses.filter((item) => item !== status)
                          )}
                        />
                        {humanize(status)}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="field-row">
                  <label className="field">
                    <span>Status</span>
                    <select value={form.status} onChange={(event) => updateForm("status", event.target.value)}>
                      {allowedStatuses(editing === "new"
                        ? "DRAFT"
                        : campaigns.find((campaign) => campaign._id === editing)?.status ?? "DRAFT")
                        .map((status) => <option key={status} value={status}>{humanize(status)}</option>)}
                    </select>
                  </label>
                  <label className="field">
                    <span>Schedule for <small>Required when scheduled</small></span>
                    <input type="datetime-local" value={form.scheduledAt}
                      onChange={(event) => updateForm("scheduledAt", event.target.value)} />
                  </label>
                </div>
                <div className="form-note">
                  Activating requires a matching active template and at least one consenting, subscribed lead.
                </div>
                <div className="form-actions">
                  <button type="button" className="button button-quiet" onClick={() => setEditing(null)}>Cancel</button>
                  <button type="submit" className="button button-primary" disabled={saving}>
                    {saving ? "Saving…" : "Save campaign"}
                  </button>
                </div>
              </form>
            </aside>
          )}
        </section>
      )}

      {activeTab === "templates" && (
        <section className="templates-section">
          <div className="section-head">
            <div>
              <h2>Reusable templates</h2>
              <p>Approved message content available to this advisor.</p>
            </div>
          </div>
          {templates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">▤</div>
              <h3>No templates available</h3>
              <p>Active templates will appear here when they are added to your advisor profile.</p>
            </div>
          ) : (
            <div className="template-grid">
              {templates.map((template) => (
                <article className="template-card" key={template._id}>
                  <div className="template-topline">
                    <span className="channel-tag">{humanize(template.channel)}</span>
                    <span className="template-active"><span /> Active</span>
                  </div>
                  <h3>{template.name}</h3>
                  {template.subject && <p className="template-subject">Subject: {template.subject}</p>}
                  <p className="template-body">{template.body}</p>
                  <button className="text-button" onClick={() => {
                    setForm({ ...EMPTY_FORM, channel: template.channel, templateId: template._id });
                    setEditing("new");
                    setActiveTab("campaigns");
                    setMessage("");
                  }}>
                    Use in a campaign <span aria-hidden="true">→</span>
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
      <footer className="footer-note">
        <span>FinMarket Enterprise</span>
        <span>Campaigns are scoped to the advisor profile ID above.</span>
      </footer>
    </main>
  );
}
