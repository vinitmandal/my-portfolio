import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  Award,
  BriefcaseBusiness,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  FolderKanban,
  GraduationCap,
  Image,
  LayoutDashboard,
  LogOut,
  Mail,
  Moon,
  Pencil,
  Plus,
  RefreshCw,
  Share2,
  Sun,
  Trash2,
  Trophy,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { adminApi, getApiUrl, getPublicFileUrl } from '../services/api';
import './AdminDashboard.css';

const navigation = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'skills', label: 'Skills', icon: Wrench },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'experience', label: 'Experience', icon: BriefcaseBusiness },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
  { id: 'socialLinks', label: 'Social links', icon: Share2 },
  { id: 'messages', label: 'Inbox', icon: Mail },
  { id: 'resume', label: 'Resume', icon: FileText },
];

function getSocialLinkValueType(platform) {
  const normalized = String(platform || '').trim().toLowerCase();
  const contactLabel = normalized.startsWith('contact:')
    ? normalized.slice('contact:'.length).trim()
    : normalized;

  if (contactLabel === 'email') return 'email';
  if (['phone', 'telephone', 'mobile', 'mobile phone', 'phone number'].includes(contactLabel)) return 'tel';
  if (normalized.startsWith('contact:')) return 'text';
  return 'url';
}

const resourceConfig = {
  profile: {
    title: 'Profile',
    singular: 'profile',
    fields: [
      { name: 'full_name', label: 'Full name', required: true, maxLength: 100 },
      { name: 'title', label: 'Professional title', required: true, maxLength: 150 },
      { name: 'subtitle', label: 'Location / subtitle', maxLength: 200 },
      { name: 'introduction', label: 'Introduction', type: 'textarea' },
      { name: 'about_text', label: 'About', type: 'textarea' },
      { name: 'available_for_opportunities', label: 'Available for opportunities', type: 'checkbox' },
    ],
    columns: [
      { name: 'full_name', label: 'Name' },
      { name: 'title', label: 'Title' },
      { name: 'subtitle', label: 'Location' },
      { name: 'profile_image', label: 'Photo', type: 'image' },
    ],
    upload: { accept: 'image/jpeg,image/png,image/gif,image/webp', label: 'Profile photo', name: 'photo' },
  },
  skills: {
    title: 'Skills',
    singular: 'skill',
    fields: [
      { name: 'name', label: 'Skill name', required: true, maxLength: 100 },
      { name: 'category', label: 'Category', type: 'select', required: true, options: ['programming', 'frontend', 'backend', 'database', 'tools'] },
      { name: 'icon_name', label: 'Icon name', maxLength: 50 },
      { name: 'display_order', label: 'Display order', type: 'number', min: 0 },
    ],
    columns: [
      { name: 'name', label: 'Name' },
      { name: 'category', label: 'Category' },
      { name: 'display_order', label: 'Order' },
    ],
  },
  education: {
    title: 'Education',
    singular: 'education record',
    fields: [
      { name: 'degree', label: 'Degree / level', required: true, maxLength: 150 },
      { name: 'institution', label: 'Institution', required: true, maxLength: 200 },
      { name: 'board', label: 'Board' },
      { name: 'score', label: 'Score', type: 'number', min: 0, max: 100, step: 0.01 },
      { name: 'score_type', label: 'Score type', type: 'select', options: ['percentage', 'cgpa'] },
      { name: 'start_year', label: 'Start year', type: 'number', min: 1900, max: 2100 },
      { name: 'end_year', label: 'End year', type: 'number', min: 1900, max: 2100 },
      { name: 'description', label: 'Notes / result detail', type: 'textarea' },
      { name: 'display_order', label: 'Display order', type: 'number', min: 0 },
    ],
    columns: [
      { name: 'degree', label: 'Degree' },
      { name: 'institution', label: 'Institution' },
      { name: 'score', label: 'Score' },
      { name: 'end_year', label: 'Year' },
    ],
  },
  experience: {
    title: 'Experience',
    singular: 'experience record',
    fields: [
      { name: 'title', label: 'Role / title', required: true, maxLength: 150 },
      { name: 'organization', label: 'Organization', required: true, maxLength: 200 },
      { name: 'type', label: 'Type', type: 'select', required: true, options: ['internship', 'job', 'project_experience'] },
      { name: 'start_date', label: 'Start date', type: 'date' },
      { name: 'end_date', label: 'End date', type: 'date' },
      { name: 'is_current', label: 'Current role', type: 'checkbox' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'display_order', label: 'Display order', type: 'number', min: 0 },
    ],
    columns: [
      { name: 'title', label: 'Role' },
      { name: 'organization', label: 'Organization' },
      { name: 'type', label: 'Type' },
      { name: 'start_date', label: 'Started' },
    ],
  },
  projects: {
    title: 'Projects',
    singular: 'project',
    fields: [
      { name: 'title', label: 'Project title', required: true, maxLength: 150 },
      { name: 'slug', label: 'URL slug', required: true, maxLength: 170, hint: 'Lowercase letters, numbers, and hyphens.' },
      { name: 'short_description', label: 'Short description', maxLength: 300, type: 'textarea' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'technologies', label: 'Technologies', type: 'tags', hint: 'Separate technology names with commas.' },
      { name: 'github_url', label: 'GitHub URL', type: 'url' },
      { name: 'live_url', label: 'Live demo URL', type: 'url' },
      { name: 'status', label: 'Status', type: 'select', required: true, options: ['completed', 'in_progress', 'planned'] },
      { name: 'featured', label: 'Featured project', type: 'checkbox' },
      { name: 'display_order', label: 'Display order', type: 'number', min: 0 },
    ],
    columns: [
      { name: 'title', label: 'Project' },
      { name: 'slug', label: 'Slug' },
      { name: 'status', label: 'Status' },
      { name: 'technologies', label: 'Technologies', type: 'tags' },
      { name: 'cover_image', label: 'Image', type: 'image' },
    ],
    upload: { accept: 'image/jpeg,image/png,image/gif,image/webp', label: 'Cover image', name: 'image' },
  },
  certifications: {
    title: 'Certifications',
    singular: 'certification',
    fields: [
      { name: 'name', label: 'Certificate name', required: true, maxLength: 200 },
      { name: 'issuing_organization', label: 'Issuing organization', required: true, maxLength: 200 },
      { name: 'completion_date', label: 'Completion date', type: 'date' },
      { name: 'credential_url', label: 'Credential URL', type: 'url' },
      { name: 'display_order', label: 'Display order', type: 'number', min: 0 },
    ],
    columns: [
      { name: 'name', label: 'Certificate' },
      { name: 'issuing_organization', label: 'Issuer' },
      { name: 'completion_date', label: 'Completed' },
      { name: 'image_url', label: 'Document', type: 'document' },
    ],
    upload: { accept: 'application/pdf,.pdf', label: 'Certificate PDF', name: 'document' },
  },
  achievements: {
    title: 'Achievements',
    singular: 'achievement',
    fields: [
      { name: 'title', label: 'Title', required: true, maxLength: 200 },
      { name: 'organization', label: 'Organization', maxLength: 200 },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'category', label: 'Category', maxLength: 100 },
      { name: 'display_order', label: 'Display order', type: 'number', min: 0 },
    ],
    columns: [
      { name: 'title', label: 'Title' },
      { name: 'organization', label: 'Organization' },
      { name: 'category', label: 'Category' },
      { name: 'date', label: 'Date' },
    ],
  },
  socialLinks: {
    title: 'Social links',
    singular: 'social link',
    fields: [
      { name: 'platform', label: 'Platform / contact type', required: true, maxLength: 50, hint: 'Use Email, Phone, or Contact: <label> for a plain-text contact detail.' },
      { name: 'url', label: 'URL or contact detail', type: 'url', required: true, maxLength: 500, hint: 'Social links require an HTTP(S) URL. Email and Phone use their matching formats.' },
      { name: 'icon_name', label: 'Icon name', maxLength: 50 },
      { name: 'display_order', label: 'Display order', type: 'number', min: 0 },
    ],
    columns: [
      { name: 'platform', label: 'Platform' },
      { name: 'url', label: 'URL / contact value' },
      { name: 'display_order', label: 'Order' },
    ],
  },
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
};

const errorMessage = (error) => {
  const validationErrors = error.response?.data?.errors;
  if (Array.isArray(validationErrors) && validationErrors.length) {
    return validationErrors.map((item) => item.message).join(' ');
  }
  return error.response?.data?.message || 'The request could not be completed. Please try again.';
};

const slugify = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

function fieldValue(record, field) {
  const value = record?.[field.name];
  if (field.type === 'checkbox') return Boolean(value);
  if (field.type === 'tags') return Array.isArray(value) ? value.join(', ') : '';
  if (field.type === 'date' && value) return String(value).slice(0, 10);
  return value == null ? '' : String(value);
}

function initialForm(resource, record) {
  return Object.fromEntries(resourceConfig[resource].fields.map((field) => (
    [field.name, fieldValue(record, field)]
  )));
}

function toPayload(resource, form) {
  return Object.fromEntries(resourceConfig[resource].fields.flatMap((field) => {
    const value = form[field.name];
    if (field.type === 'checkbox') return [[field.name, Boolean(value)]];
    if (field.type === 'tags') {
      const technologies = [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
      return [[field.name, technologies]];
    }
    if (field.type === 'number') {
      return value === '' && !field.required ? [] : [[field.name, value === '' ? null : Number(value)]];
    }
    if (value === '' && !field.required) return [];
    return [[field.name, value]];
  }));
}

function RecordManager({ resource, records, saving, onSave, onDelete }) {
  const config = resourceConfig[resource];
  const rows = resource === 'profile'
    ? (records ? [records] : [])
    : (Array.isArray(records) ? records : []);
  const [editing, setEditing] = useState(resource === 'profile' && !records);
  const [record, setRecord] = useState(null);
  const [form, setForm] = useState({});
  const [file, setFile] = useState(null);
  const [formError, setFormError] = useState('');
  const [manualSlug, setManualSlug] = useState(false);

  const openEditor = (item) => {
    setRecord(item || null);
    setForm(initialForm(resource, item));
    setFile(null);
    setFormError('');
    setManualSlug(false);
    setEditing(true);
  };

  const handleFieldChange = (field, value) => {
    setForm((current) => {
      const next = { ...current, [field.name]: value };
      if (resource === 'projects' && field.name === 'title' && !manualSlug) {
        next.slug = slugify(value);
      }
      return next;
    });
    if (field.name === 'slug') setManualSlug(true);
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    if (config.upload && file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Files must be 5 MB or smaller.');
        return;
      }
      if (config.upload.name === 'document' && !file.name.toLowerCase().endsWith('.pdf')) {
        setFormError('Certification documents must be PDF files.');
        return;
      }
      if (['image', 'photo'].includes(config.upload.name) && !/\.(jpe?g|png|gif|webp)$/i.test(file.name)) {
        setFormError('Choose a JPG, PNG, GIF, or WebP image.');
        return;
      }
    }

    try {
      await onSave(resource, record, toPayload(resource, form), file);
      setEditing(false);
      setRecord(null);
      setFile(null);
    } catch (error) {
      setFormError(errorMessage(error));
    }
  };

  const renderValue = (item, column) => {
    const value = item[column.name];
    if (column.type === 'tags') {
      return Array.isArray(value) && value.length
        ? <span className="admin-tag-list">{value.map((tag) => <span className="admin-tag" key={tag}>{tag}</span>)}</span>
        : <span className="admin-muted">None</span>;
    }
    if (column.type === 'image' && value) {
      return <a className="admin-file-link" href={getPublicFileUrl(value)} target="_blank" rel="noreferrer"><Image size={15} /> View</a>;
    }
    if (column.type === 'document' && value) {
      return <a className="admin-file-link" href={getPublicFileUrl(value)} target="_blank" rel="noreferrer"><ExternalLink size={15} /> PDF</a>;
    }
    if (column.name === 'featured' || column.name === 'is_current' || column.name === 'available_for_opportunities') {
      return value ? <span className="admin-status-pill">Yes</span> : <span className="admin-muted">No</span>;
    }
    if (['date', 'start_date', 'end_date', 'completion_date'].includes(column.name)) return formatDate(value);
    if (value == null || value === '') return <span className="admin-muted">—</span>;
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="admin-eyebrow">Content library</p>
          <h2>{config.title}</h2>
          <p className="admin-panel-description">
            {resource === 'profile' ? 'Manage the public identity and profile details.' : `Manage ${config.title.toLowerCase()} shown on the public portfolio.`}
          </p>
        </div>
        {resource !== 'profile' ? (
          <button type="button" className="admin-button admin-button-primary" onClick={() => openEditor(null)}>
            <Plus size={16} /> Add {config.singular}
          </button>
        ) : null}
      </div>

      {resource === 'profile' && rows[0]?.profile_image ? (
        <img className="admin-profile-photo" src={getPublicFileUrl(rows[0].profile_image)} alt="Current profile" />
      ) : null}

      {editing ? (
        <form className="admin-editor" onSubmit={handleSubmit}>
          <div className="admin-editor-heading">
            <h3>{record ? `Edit ${config.singular}` : `Create ${config.singular}`}</h3>
            {record ? <button type="button" className="admin-icon-button" aria-label="Close editor" onClick={() => setEditing(false)}><X size={17} /></button> : null}
          </div>
          <div className="admin-form-grid">
            {config.fields.map((field) => (
              <label className={`admin-field ${field.type === 'textarea' ? 'is-wide' : ''} ${field.type === 'checkbox' ? 'is-checkbox' : ''}`} key={field.name}>
                {field.type === 'checkbox' ? (
                  <>
                    <input type="checkbox" checked={Boolean(form[field.name])} onChange={(event) => handleFieldChange(field, event.target.checked)} />
                    <span>{field.label}</span>
                  </>
                ) : (
                  <>
                    <span>{field.label}{field.required ? ' *' : ''}</span>
                    {field.type === 'textarea' ? (
                      <textarea
                        maxLength={field.maxLength}
                        onChange={(event) => handleFieldChange(field, event.target.value)}
                        required={field.required}
                        rows={field.name === 'description' || field.name === 'about_text' ? 5 : 3}
                        value={form[field.name] ?? ''}
                      />
                    ) : field.type === 'select' ? (
                      <select required={field.required} value={form[field.name] ?? ''} onChange={(event) => handleFieldChange(field, event.target.value)}>
                        <option value="">Select…</option>
                        {field.options.map((option) => <option value={option} key={option}>{option.replaceAll('_', ' ')}</option>)}
                      </select>
                    ) : (
                      <input
                        autoComplete={resource === 'socialLinks' && field.name === 'url'
                          ? getSocialLinkValueType(form.platform) === 'email' ? 'email'
                            : getSocialLinkValueType(form.platform) === 'tel' ? 'tel' : 'off'
                          : 'off'}
                        list={resource === 'socialLinks' && field.name === 'platform' ? 'social-link-platform-options' : undefined}
                        max={field.max}
                        maxLength={field.maxLength}
                        min={field.min}
                        onChange={(event) => handleFieldChange(field, event.target.value)}
                        required={field.required}
                        step={field.step}
                        type={resource === 'socialLinks' && field.name === 'url'
                          ? getSocialLinkValueType(form.platform)
                          : field.type === 'tags' ? 'text' : field.type || 'text'}
                        value={form[field.name] ?? ''}
                      />
                    )}
                    {resource === 'socialLinks' && field.name === 'platform' ? (
                      <datalist id="social-link-platform-options">
                        <option value="GitHub" />
                        <option value="LinkedIn" />
                        <option value="Email" />
                        <option value="Phone" />
                        <option value="Contact: Location" />
                        <option value="Contact: Other" />
                      </datalist>
                    ) : null}
                    {field.hint ? <small>{field.hint}</small> : null}
                  </>
                )}
              </label>
            ))}
          </div>

          {config.upload ? (
            <label className="admin-field admin-upload-field">
              <span>{record && resource === 'projects' && record.cover_image ? 'Replace cover image' : record && resource === 'profile' && record.profile_image ? 'Replace profile photo' : config.upload.label}</span>
              <input
                accept={config.upload.accept}
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                type="file"
              />
              <small>{file ? file.name : 'Maximum file size: 5 MB.'}</small>
            </label>
          ) : null}
          {formError ? <p className="admin-notice is-error" role="alert">{formError}</p> : null}
          <div className="admin-editor-actions">
            <button type="submit" className="admin-button admin-button-primary" disabled={saving}>
              {saving ? 'Saving…' : record ? 'Save changes' : `Create ${config.singular}`}
            </button>
            {record ? <button type="button" className="admin-button admin-button-secondary" onClick={() => setEditing(false)}>Cancel</button> : null}
          </div>
        </form>
      ) : null}

      {rows.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                {config.columns.map((column) => <th key={column.name}>{column.label}</th>)}
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id || resource}>
                  {config.columns.map((column) => <td key={column.name}>{renderValue(item, column)}</td>)}
                  <td className="admin-row-actions">
                    <button type="button" className="admin-icon-button" onClick={() => openEditor(item)} aria-label={`Edit ${config.singular}`}><Pencil size={15} /></button>
                    <button type="button" className="admin-icon-button is-danger" onClick={() => onDelete(resource, item)} aria-label={`Delete ${config.singular}`}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !editing ? (
        <div className="admin-empty-state">
          <p>No {config.title.toLowerCase()} records are available yet.</p>
          {resource === 'profile' ? <button type="button" className="admin-button admin-button-primary" onClick={() => openEditor(null)}><Plus size={16} /> Create profile</button> : null}
        </div>
      ) : null}
    </section>
  );
}

function OverviewPanel({ data, onNavigate }) {
  const counts = data?.counts || {};
  const metrics = [
    { key: 'projects', label: 'Projects', icon: FolderKanban, section: 'projects' },
    { key: 'skills', label: 'Skills', icon: Wrench, section: 'skills' },
    { key: 'education', label: 'Education', icon: GraduationCap, section: 'education' },
    { key: 'experience', label: 'Experience', icon: BriefcaseBusiness, section: 'experience' },
    { key: 'achievements', label: 'Achievements', icon: Trophy, section: 'achievements' },
    { key: 'certifications', label: 'Certifications', icon: Award, section: 'certifications' },
    { key: 'unreadMessages', label: 'Unread messages', icon: Mail, section: 'messages' },
  ];
  const profile = data?.profile || null;
  const completionFields = ['full_name', 'title', 'subtitle', 'about_text', 'profile_image'];
  const completion = profile
    ? Math.round((completionFields.filter((field) => Boolean(profile[field])).length / completionFields.length) * 100)
    : 0;
  const messages = data?.recentMessages || [];

  return (
    <div className="admin-overview">
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Dashboard / Overview</p>
            <h2>Your portfolio, at a glance.</h2>
            <p className="admin-panel-description">Live totals from the portfolio database.</p>
          </div>
          <div className="admin-live-pill"><span /> Live data</div>
        </div>
        <div className="admin-metrics-grid">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <button type="button" className="admin-metric-card" key={metric.key} onClick={() => onNavigate(metric.section)}>
                <span className="admin-metric-icon"><Icon size={17} /></span>
                <span className="admin-metric-label">{metric.label}</span>
                <strong>{Number(counts[metric.key] || 0).toLocaleString()}</strong>
                <ArrowUpRight size={15} className="admin-metric-arrow" />
              </button>
            );
          })}
        </div>
      </section>

      <div className="admin-overview-grid">
        <section className="admin-panel admin-recent-panel">
          <div className="admin-subheading">
            <div>
              <p className="admin-eyebrow">Latest correspondence</p>
              <h3>Recent messages</h3>
            </div>
            <button type="button" className="admin-text-button" onClick={() => onNavigate('messages')}>Open inbox <ArrowUpRight size={14} /></button>
          </div>
          {messages.length ? (
            <ul className="admin-recent-list">
              {messages.map((message) => (
                <li className={!message.is_read ? 'is-unread' : ''} key={message.id}>
                  <button type="button" onClick={() => onNavigate('messages')}>
                    <span className="admin-message-dot" />
                    <span className="admin-recent-copy">
                      <strong>{message.name}</strong>
                      <span>{message.subject}</span>
                    </span>
                    <time>{formatDate(message.created_at)}</time>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="admin-empty-state"><p>No contact messages yet.</p></div>
          )}
        </section>

        <section className="admin-panel admin-completion-panel">
          <p className="admin-eyebrow">Profile health</p>
          <h3>Profile completion</h3>
          <div className="admin-progress-track" role="progressbar" aria-label="Profile completion" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${completion}%` }} />
          </div>
          <div className="admin-completion-value"><strong>{completion}%</strong><span>key profile fields completed</span></div>
          <ul>
            {completionFields.map((field) => (
              <li key={field} className={profile?.[field] ? 'is-complete' : ''}>
                <CheckCircle2 size={15} />
                {field.replaceAll('_', ' ')}
              </li>
            ))}
          </ul>
          <button type="button" className="admin-button admin-button-secondary" onClick={() => onNavigate('profile')}><Pencil size={15} /> Edit profile</button>
        </section>
      </div>

      <section className="admin-panel admin-quick-actions">
        <div className="admin-subheading">
          <div><p className="admin-eyebrow">Shortcuts</p><h3>Quick management</h3></div>
        </div>
        <div className="admin-quick-grid">
          {[
            ['projects', 'Manage projects', FolderKanban],
            ['skills', 'Manage skills', Wrench],
            ['achievements', 'Manage achievements', Trophy],
            ['messages', 'Review inbox', Mail],
            ['resume', 'Manage resume', FileText],
          ].map(([target, label, Icon]) => (
            <button type="button" className="admin-quick-card" key={target} onClick={() => onNavigate(target)}>
              <Icon size={17} /><span>{label}</span><ArrowUpRight size={14} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function InboxPanel({ data, busy, onMarkRead, onDelete }) {
  const messages = data?.messages || [];
  const [selectedId, setSelectedId] = useState(null);
  const selected = messages.find((message) => message.id === selectedId) || messages[0] || null;

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="admin-eyebrow">Contact / Inbox</p>
          <h2>Messages from your visitors.</h2>
          <p className="admin-panel-description">{data?.unreadCount || 0} unread of {messages.length} loaded messages.</p>
        </div>
      </div>
      {!messages.length ? (
        <div className="admin-empty-state"><Mail size={24} /><p>Your inbox is clear. New contact form submissions will appear here.</p></div>
      ) : (
        <div className="admin-inbox">
          <div className="admin-message-list" aria-label="Contact messages">
            {messages.map((message) => (
              <button
                type="button"
                key={message.id}
                className={`admin-message-item ${!message.is_read ? 'is-unread' : ''} ${selected?.id === message.id ? 'is-selected' : ''}`}
                onClick={() => {
                  setSelectedId(message.id);
                  if (!message.is_read) onMarkRead(message, true);
                }}
              >
                <span className="admin-message-item-top"><strong>{message.name}</strong><time>{formatDate(message.created_at)}</time></span>
                <span className="admin-message-subject">{message.subject}</span>
                <span className="admin-message-preview">{message.message}</span>
              </button>
            ))}
          </div>
          {selected ? (
            <article className="admin-message-detail">
              <div className="admin-message-detail-head">
                <div>
                  <p className="admin-eyebrow">{selected.is_read ? 'Read message' : 'Unread message'}</p>
                  <h3>{selected.subject}</h3>
                  <p><strong>{selected.name}</strong> · <a href={`mailto:${selected.email}`}>{selected.email}</a></p>
                  <time>{new Date(selected.created_at).toLocaleString()}</time>
                </div>
                <span className={`admin-status-pill ${selected.is_read ? 'is-neutral' : ''}`}>{selected.is_read ? 'Read' : 'Unread'}</span>
              </div>
              <p className="admin-message-body">{selected.message}</p>
              <div className="admin-editor-actions">
                <a className="admin-button admin-button-primary" href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}>Reply by email <ArrowUpRight size={15} /></a>
                <button type="button" className="admin-button admin-button-secondary" onClick={() => onMarkRead(selected, !selected.is_read)} disabled={busy}>
                  {selected.is_read ? 'Mark unread' : 'Mark read'}
                </button>
                <button type="button" className="admin-button admin-button-danger" onClick={() => onDelete(selected)} disabled={busy}><Trash2 size={15} /> Delete</button>
              </div>
            </article>
          ) : null}
        </div>
      )}
    </section>
  );
}

function ResumePanel({ resume, saving, onUpload }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!file) {
      setError('Choose a PDF file to upload.');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.pdf') || (file.type && file.type !== 'application/pdf')) {
      setError('Resume files must be PDF documents.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Resume files must be 5 MB or smaller.');
      return;
    }
    try {
      await onUpload(file);
      setFile(null);
      event.target.reset();
    } catch (uploadError) {
      setError(errorMessage(uploadError));
    }
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="admin-eyebrow">Files / Resume</p>
          <h2>Manage your resume.</h2>
          <p className="admin-panel-description">Upload a PDF up to 5 MB. A new upload replaces the current resume.</p>
        </div>
      </div>
      {resume ? (
        <div className="admin-resume-card">
          <div className="admin-resume-meta">
            <span className="admin-metric-icon"><FileText size={20} /></span>
            <div><strong>{resume.original_name}</strong><span>Uploaded {formatDate(resume.uploaded_at)}</span></div>
            <a className="admin-button admin-button-secondary" href={getApiUrl('/resume/download')}><Download size={15} /> Download</a>
          </div>
          <iframe title="Resume PDF preview" src={getApiUrl('/resume/preview')} />
        </div>
      ) : (
        <div className="admin-empty-state"><FileText size={24} /><p>No resume has been uploaded. Add a verified PDF to enable public preview and download.</p></div>
      )}
      <form className="admin-resume-upload" onSubmit={handleSubmit}>
        <label className="admin-field">
          <span>{resume ? 'Replace current PDF' : 'Select resume PDF'}</span>
          <input accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} type="file" />
        </label>
        {file ? <span className="admin-muted">{file.name}</span> : null}
        {error ? <p className="admin-notice is-error" role="alert">{error}</p> : null}
        <button type="submit" className="admin-button admin-button-primary" disabled={saving}>{saving ? 'Uploading…' : <><Download size={15} /> Upload resume</>}</button>
      </form>
    </section>
  );
}

export default function AdminDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSection = searchParams.get('section') || 'overview';
  const section = navigation.some((item) => item.id === requestedSection) ? requestedSection : 'overview';
  const [data, setData] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState('');
  const [notice, setNotice] = useState({ type: '', message: '' });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const notify = useCallback((type, message) => setNotice({ type, message }), []);

  const loadSection = useCallback(async (target = section) => {
    setLoading(true);
    setPageError('');
    try {
      if (target === 'overview') {
        const [stats, profile] = await Promise.all([
          adminApi.getDashboard(),
          adminApi.getResource('profile'),
        ]);
        setDashboardStats(stats);
        setData({ ...stats, profile });
      } else if (target === 'messages') {
        setData(await adminApi.getMessages());
      } else if (target === 'resume') {
        try {
          setData(await adminApi.getResume());
        } catch (error) {
          if (error.response?.status !== 404) throw error;
          setData(null);
        }
      } else {
        setData(await adminApi.getResource(target));
      }
    } catch (error) {
      setPageError(errorMessage(error));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadSection(section), 0);
    return () => window.clearTimeout(timer);
  }, [loadSection, section]);

  useEffect(() => {
    if (!notice.message) return undefined;
    const timer = window.setTimeout(() => setNotice({ type: '', message: '' }), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const unreadCount = useMemo(() => (
    dashboardStats?.counts?.unreadMessages || (section === 'messages' ? data?.unreadCount : 0) || 0
  ), [dashboardStats, data, section]);

  const navigateSection = (nextSection) => {
    setSearchParams(nextSection === 'overview' ? {} : { section: nextSection });
    setMobileNavOpen(false);
  };

  const refreshStats = async () => {
    const stats = await adminApi.getDashboard();
    setDashboardStats(stats);
    return stats;
  };

  const handleSave = async (resource, record, payload, file) => {
    setSaving(true);
    try {
      const result = await adminApi.saveResource(resource, record?.id || null, payload);
      const savedId = result.data?.id || record?.id;
      if (file) {
        if (resource === 'profile') await adminApi.uploadProfileImage(file);
        if (resource === 'projects') await adminApi.uploadProjectImage(savedId, file);
        if (resource === 'certifications') await adminApi.uploadCertificationDocument(savedId, file);
      }
      await Promise.all([loadSection(section), refreshStats()]);
      notify('success', result.message || `${resourceConfig[resource].singular} saved.`);
    } catch (error) {
      notify('error', errorMessage(error));
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (resource, record) => {
    const label = record?.title || record?.name || record?.full_name || record?.platform || 'this record';
    if (!window.confirm(`Delete “${label}”? This cannot be undone.`)) return;
    setSaving(true);
    try {
      const result = await adminApi.deleteResource(resource, record?.id);
      await Promise.all([loadSection(section), refreshStats()]);
      notify('success', result.message || `${resourceConfig[resource].singular} deleted.`);
    } catch (error) {
      notify('error', errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleMarkRead = async (message, isRead) => {
    setSaving(true);
    try {
      await adminApi.updateMessageRead(message.id, isRead);
      const updatedMessages = await adminApi.getMessages();
      setData(updatedMessages);
      await refreshStats();
      notify('success', isRead ? 'Message marked as read.' : 'Message marked as unread.');
    } catch (error) {
      notify('error', errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMessage = async (message) => {
    if (!window.confirm(`Delete the message from ${message.name}? This cannot be undone.`)) return;
    setSaving(true);
    try {
      const result = await adminApi.deleteMessage(message.id);
      const updatedMessages = await adminApi.getMessages();
      setData(updatedMessages);
      await refreshStats();
      notify('success', result.message || 'Message deleted.');
    } catch (error) {
      notify('error', errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (file) => {
    setSaving(true);
    try {
      const result = await adminApi.uploadResume(file);
      setData(result.data);
      await refreshStats();
      notify('success', result.message || 'Resume uploaded.');
    } catch (error) {
      notify('error', errorMessage(error));
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login', { replace: true });
    } catch (error) {
      notify('error', errorMessage(error));
    }
  };

  const currentTitle = navigation.find((item) => item.id === section)?.label || 'Overview';

  return (
    <main className="admin-app">
      <header className="admin-topbar">
        <Link to="/" className="admin-brand-lockup">
          <span className="admin-brand-mark">VKM</span>
          <span><strong>Portfolio CMS</strong><small>Vinit Kumar Mandal</small></span>
        </Link>
        <div className="admin-topbar-actions">
          <span className="admin-user-label"><span className="admin-online-dot" /> {user?.username || 'Administrator'}</span>
          <button type="button" className="admin-icon-button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button type="button" className="admin-button admin-button-secondary admin-logout" onClick={handleLogout} disabled={authLoading}><LogOut size={15} /> Log out</button>
          <button type="button" className="admin-icon-button admin-mobile-menu" onClick={() => setMobileNavOpen((open) => !open)} aria-label={mobileNavOpen ? 'Close admin navigation' : 'Open admin navigation'} aria-expanded={mobileNavOpen}>
            {mobileNavOpen ? <X size={18} /> : <LayoutDashboard size={18} />}
          </button>
        </div>
      </header>

      <div className="admin-layout">
        <aside className={`admin-sidebar ${mobileNavOpen ? 'is-open' : ''}`}>
          <div className="admin-sidebar-heading"><span className="admin-eyebrow">Workspace</span><span className="admin-connection"><span /> Connected</span></div>
          <nav aria-label="Admin sections">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button type="button" className={section === item.id ? 'is-active' : ''} key={item.id} onClick={() => navigateSection(item.id)} aria-current={section === item.id ? 'page' : undefined}>
                  <Icon size={17} /><span>{item.label}</span>
                  {item.id === 'messages' && unreadCount ? <span className="admin-nav-count">{unreadCount}</span> : null}
                </button>
              );
            })}
          </nav>
          <div className="admin-sidebar-footer">
            <Link to="/" target="_blank" rel="noreferrer">View public portfolio <ExternalLink size={14} /></Link>
            <span>Admin session · Private</span>
          </div>
        </aside>

        <section className="admin-main">
          <div className="admin-page-heading">
            <div>
              <p className="admin-eyebrow">Control room / {currentTitle}</p>
              <h1>{section === 'overview' ? `Good to see you${user?.username ? `, ${user.username}` : ''}.` : currentTitle}</h1>
            </div>
            <button type="button" className="admin-icon-button" aria-label="Refresh current section" onClick={() => loadSection(section)} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'is-spinning' : ''} />
            </button>
          </div>

          {notice.message ? <div className={`admin-toast is-${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>{notice.type === 'success' ? <CheckCircle2 size={17} /> : <X size={17} />}{notice.message}</div> : null}

          {loading ? (
            <div className="admin-loading"><RefreshCw size={18} className="is-spinning" /> Loading {currentTitle.toLowerCase()} from the portfolio API…</div>
          ) : pageError ? (
            <div className="admin-error-state" role="alert"><p>{pageError}</p><button type="button" className="admin-button admin-button-primary" onClick={() => loadSection(section)}>Try again</button></div>
          ) : section === 'overview' ? (
            <OverviewPanel data={data} onNavigate={navigateSection} />
          ) : section === 'messages' ? (
            <InboxPanel data={data} busy={saving} onMarkRead={handleMarkRead} onDelete={handleDeleteMessage} />
          ) : section === 'resume' ? (
            <ResumePanel resume={data} saving={saving} onUpload={handleResumeUpload} />
          ) : (
            <RecordManager
              key={section}
              resource={section}
              records={data}
              saving={saving}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          )}

          <footer className="admin-footer"><span>Portfolio CMS</span><span>Changes are saved to the connected database.</span></footer>
        </section>
      </div>
    </main>
  );
}
