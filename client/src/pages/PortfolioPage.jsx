import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Copy, Download, ExternalLink, FileText, LoaderCircle, Mail, MapPin, MessageCircle, Phone, Search, Send, X } from 'lucide-react';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import ResourceState from '../components/ResourceState';
import SectionHeader from '../components/SectionHeader';
import { getApiUrl, getPublicFileUrl, portfolioApi } from '../services/api';
import './PortfolioPage.css';

const resourceKeys = ['profile', 'skills', 'education', 'experience', 'projects', 'certifications', 'achievements', 'resume'];
const EMPTY_ARRAY = Object.freeze([]);

function createInitialResources() {
  return Object.fromEntries(resourceKeys.map((key) => [key, { status: 'loading', data: null, error: '' }]));
}

function ApiContent({ resource, emptyMessage, onRetry, isEmpty, children }) {
  return (
    <ResourceState
      status={resource.status}
      error={resource.error}
      empty={isEmpty(resource.data)}
      emptyMessage={emptyMessage}
      onRetry={onRetry}
    >
      {children}
    </ResourceState>
  );
}

function statusLabel(status) {
  if (status === 'in_progress') return 'In progress';
  if (status === 'completed') return 'Completed';
  if (status === 'planned') return 'Planned';
  return 'Status not specified';
}

function formatYear(dateValue) {
  if (!dateValue) return '';
  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? String(dateValue) : String(parsed.getFullYear());
}

function experiencePeriod(item) {
  const start = formatYear(item.start_date);
  const end = item.is_current ? 'Present' : formatYear(item.end_date);
  if (start && end) return `${start} — ${end}`;
  return start || end;
}

function getSocialLinkKind(platform) {
  const normalized = String(platform || '').trim().toLowerCase();
  const isContact = normalized.startsWith('contact:');
  const contactLabel = isContact ? normalized.slice('contact:'.length).trim() : normalized;

  if (contactLabel === 'email') return 'email';
  if (['phone', 'telephone', 'mobile', 'mobile phone', 'phone number'].includes(contactLabel)) return 'phone';
  return isContact ? 'contact' : 'social';
}

function getDirectContact(link) {
  const kind = getSocialLinkKind(link.platform);
  if (kind === 'social') return null;

  const platform = String(link.platform || '').trim();
  const label = platform.toLowerCase().startsWith('contact:')
    ? platform.slice('contact:'.length).trim()
    : platform;
  const isLocation = /address|location/i.test(label);

  return {
    kind,
    label: label || 'Contact',
    icon: kind === 'email' ? Mail : kind === 'phone' ? Phone : isLocation ? MapPin : MessageCircle,
    href: kind === 'email'
      ? `mailto:${link.url}`
      : kind === 'phone'
        ? `tel:${String(link.url).replace(/[^\d+]/g, '')}`
        : null,
  };
}

function validateContact(form) {
  const name = form.name.trim();
  const email = form.email.trim();
  const subject = form.subject.trim();
  const message = form.message.trim();

  if (!name || name.length > 100) return 'Enter your name (up to 100 characters).';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) return 'Enter a valid email address.';
  if (!subject || subject.length > 200) return 'Enter a subject (up to 200 characters).';
  if (!message || message.length > 5000) return 'Enter a message (up to 5,000 characters).';

  return '';
}

function ResumeSection({ resource, onRetry }) {
  const [preview, setPreview] = useState({ status: 'idle', url: '', error: '' });
  const resume = resource.data;
  const isPdf = resume?.original_name?.toLowerCase().endsWith('.pdf');

const openPreview = () => {
  if (!resume?.file_path) return;

  const url = getPublicFileUrl(resume.file_path);

  setPreview({
    status: 'ready',
    url,
    error: '',
  });
};

  return (
    <section className="portfolio-section resume-section" id="resume">
      <div className="section-index">08 <span>/</span> Resume</div>
      <SectionHeader
        eyebrow="Resume"
        title="A closer look."
        description="Preview or download the current resume file, when one is available."
      />
      <ApiContent
        resource={resource}
        isEmpty={(data) => !data}
        emptyMessage="No resume has been uploaded yet."
        onRetry={onRetry}
      />
      {resource.status === 'success' && resume ? (
        <div className="resume-card">
          <div className="resume-file-mark" aria-hidden="true"><FileText size={26} /></div>
          <div className="resume-file-details">
            <p className="resume-label">Latest file</p>
            <h3>{resume.original_name}</h3>
            {resume.uploaded_at ? <p>Updated {new Date(resume.uploaded_at).toLocaleDateString()}</p> : null}
          </div>
          <div className="resume-actions">
            {isPdf ? (
              <button
                type="button"
                className="button button-quiet"
                onClick={openPreview}
                disabled={preview.status === 'loading'}
              >
                {preview.status === 'loading' ? 'Preparing…' : 'Preview PDF'}
              </button>
            ) : (
              <span className="resume-note">Preview is available for PDF files.</span>
            )}
            <a className="button button-primary" href={getApiUrl('/resume/download')} download>
              <Download size={16} /> Download
            </a>
          </div>
          {preview.status === 'error' ? <p className="inline-error" role="alert">{preview.error}</p> : null}
          {preview.status === 'ready' ? (
            <div className="resume-preview">
              <div className="resume-preview-heading">
                <p>PDF preview</p>
                <button type="button" className="icon-quiet" onClick={() => setPreview({ status: 'idle', url: '', error: '' })} aria-label="Close resume preview">
                  <X size={18} />
                </button>
              </div>
              <iframe title={`${resume.original_name} preview`} src={preview.url} />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default function PortfolioPage() {
  const [resources, setResources] = useState(createInitialResources);
  const [attempt, setAttempt] = useState(0);
  const [projectFilter, setProjectFilter] = useState('all');
  const [projectSearch, setProjectSearch] = useState('');
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactState, setContactState] = useState({ status: 'idle', message: '' });
  const contactSubmissionInProgress = useRef(false);
  const [contactCopyState, setContactCopyState] = useState({ key: '', status: 'idle' });
  const profile = resources.profile.data?.profile || null;
  console.log("Profile image:", profile?.profile_image);
  const socialLinks = resources.profile.data?.socialLinks || EMPTY_ARRAY;
  const directContacts = socialLinks
    .map((link) => ({ link, contact: getDirectContact(link) }))
    .filter(({ contact }) => contact);
  const verifiedSocialLinks = socialLinks.filter((link) => getSocialLinkKind(link.platform) === 'social');
  const skills = resources.skills.data || {};
  const projects = resources.projects.data || EMPTY_ARRAY;

  useEffect(() => {
    const controller = new AbortController();

    const loaders = {
      profile: () => portfolioApi.getProfile({ signal: controller.signal }),
      skills: () => portfolioApi.getSkills({ signal: controller.signal }),
      education: () => portfolioApi.getEducation({ signal: controller.signal }),
      experience: () => portfolioApi.getExperience({ signal: controller.signal }),
      projects: () => portfolioApi.getProjects({ signal: controller.signal }),
      certifications: () => portfolioApi.getCertifications({ signal: controller.signal }),
      achievements: () => portfolioApi.getAchievements({ signal: controller.signal }),
      resume: () => portfolioApi.getResume({ signal: controller.signal }),
    };

    Object.entries(loaders).forEach(([key, load]) => {
      load()
        .then((data) => {
          if (controller.signal.aborted) return;
          const isMissingProfile = key === 'profile' && !data?.profile;
          setResources((current) => ({
            ...current,
            [key]: {
              status: isMissingProfile ? 'empty' : 'success',
              data,
              error: '',
            },
          }));
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          if (key === 'resume' && error.response?.status === 404) {
            setResources((current) => ({
              ...current,
              resume: { status: 'empty', data: null, error: '' },
            }));
            return;
          }
          setResources((current) => ({
            ...current,
            [key]: {
              status: 'error',
              data: null,
              error: error.response?.data?.message || 'This section could not be loaded from the portfolio API.',
            },
          }));
        });
    });

    return () => controller.abort();
  }, [attempt]);

  const retry = () => {
    setResources(createInitialResources());
    setAttempt((value) => value + 1);
  };

  const handleCopyContact = async (value, key) => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard access is unavailable in this browser context.');
      }
      await navigator.clipboard.writeText(value);
      setContactCopyState({ key, status: 'copied' });
    } catch (error) {
      console.error('Unable to copy the public contact detail.', error);
      setContactCopyState({ key, status: 'error' });
    }
  };

  const categories = useMemo(() => (
    ['all', ...new Set(projects.map((project) => project.status || 'unspecified'))]
  ), [projects]);
  const visibleProjects = useMemo(() => {
    const query = projectSearch.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesStatus = projectFilter === 'all'
        || (project.status || 'unspecified') === projectFilter;
      const searchable = [
        project.title,
        project.short_description,
        project.description,
        ...(project.technologies || []),
      ].filter(Boolean).join(' ').toLowerCase();
      return matchesStatus && (!query || searchable.includes(query));
    });
  }, [projectFilter, projectSearch, projects]);

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    if (contactSubmissionInProgress.current) return;

    const validationError = validateContact(contactForm);
    if (validationError) {
      setContactState({ status: 'error', message: validationError });
      return;
    }

    contactSubmissionInProgress.current = true;
    setContactState({ status: 'sending', message: 'Sending your message…' });
    try {
      const result = await portfolioApi.submitContact({
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        subject: contactForm.subject.trim(),
        message: contactForm.message.trim(),
      });
      setContactState({ status: 'success', message: result.message || 'Your message was sent.' });
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      const validationErrors = error.response?.data?.errors;
      const validationMessage = Array.isArray(validationErrors)
        ? validationErrors.map((item) => item.message).filter(Boolean).join(' ')
        : '';
      setContactState({
        status: 'error',
        message: validationMessage || error.response?.data?.message || 'Your message could not be sent. Please try again.',
      });
    } finally {
      contactSubmissionInProgress.current = false;
    }
  };

  const skillCount = Object.values(skills).reduce((total, items) => total + (Array.isArray(items) ? items.length : 0), 0);

  return (
    <div className="portfolio-site" id="top">
      <Navbar />
      <main>
        <section className="portfolio-hero">
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow"><span className="eyebrow-rule" /> Portfolio / Engineering</p>
              <ApiContent
                resource={resources.profile}
                isEmpty={(data) => !data?.profile}
                emptyMessage="Profile information has not been published yet."
                onRetry={retry}
              />
              {profile ? (
                <>
                  <h1>{profile.full_name}</h1>
                  <p className="hero-role">{profile.title}</p>
                  {profile.introduction ? <p className="hero-intro">{profile.introduction}</p> : null}
                  <div className="hero-actions">
                    <a className="button button-primary" href="#projects">Explore projects <ArrowRight size={17} /></a>
                    <a className="button button-quiet" href="#contact">Start a conversation <span aria-hidden="true">↘</span></a>
                  </div>
                  <div className="hero-location">
                    <MapPin size={16} />
                    <span>{profile.subtitle || 'Location not provided'}</span>
                    {typeof profile.available_for_opportunities === 'boolean' ? (
                      <span className={`availability ${profile.available_for_opportunities ? 'is-available' : ''}`}>
                        <i aria-hidden="true" />
                        {profile.available_for_opportunities ? 'Available' : 'Unavailable'}
                      </span>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>

            {profile ? (
              <aside className="hero-index-card" aria-label="Portfolio index">
                {/* <div className="index-card-top"><span>VKM / INDEX</span><span>01—08</span></div>
                <div className="monogram-art" aria-hidden="true">
                  <span>{profile.full_name.split(/\s+/).map((part) => part[0]).slice(0, 3).join('')}</span>
                </div> */}
                <div className="index-card-top">
  <span>VKM / INDEX</span>
  <span>01—08</span>
</div>


<div className="monogram-art profile-photo-art">
  <img
    src={new URL(
      profile.profile_image,
      getApiUrl('/')
    ).href}
    alt={profile.full_name}
    onError={(e) => console.error("Image failed to load:", e.currentTarget.src)}
  />
</div>

                <p className="index-card-name">{profile.full_name}</p>
                <p className="index-card-role">{profile.title}</p>
                <div className="index-card-rule" />
                <div className="index-card-stats">
                  <div><span>Skills</span><strong>{resources.skills.status === 'success' ? skillCount : '—'}</strong></div>
                  <div><span>Projects</span><strong>{resources.projects.status === 'success' ? projects.length : '—'}</strong></div>
                  <div><span>Location</span><strong className="location-value">{profile.subtitle || '—'}</strong></div>
                </div>
              </aside>
            ) : null}
            <p className="hero-footnote">Software <span>·</span> Education <span>·</span> Projects</p>
          </div>
        </section>

        <section className="portfolio-section about-section" id="about">
          <div className="section-index">01 <span>/</span> About</div>
          <div className="about-layout">
            <SectionHeader eyebrow="A short introduction" title="Curiosity, craft, and systems thinking." />
            <div className="about-copy">
              <ApiContent
                resource={resources.profile}
                isEmpty={(data) => !data?.profile}
                emptyMessage="Profile information has not been published yet."
                onRetry={retry}
              />
              {profile ? (
                profile.about_text || profile.introduction
                  ? <p>{profile.about_text || profile.introduction}</p>
                  : <p className="muted-copy">A personal biography has not been added yet.</p>
              ) : null}
              {profile?.subtitle ? <p className="about-location"><MapPin size={15} /> {profile.subtitle}</p> : null}
            </div>
          </div>
        </section>

        <section className="portfolio-section skills-section" id="skills">
          <div className="section-index">02 <span>/</span> Skills</div>
          <SectionHeader eyebrow="Tools of the trade" title="A practical, evolving toolkit." description="Technologies and tools currently listed in the portfolio database." />
          <ApiContent
            resource={resources.skills}
            isEmpty={(data) => !data || Object.values(data).every((items) => !items?.length)}
            emptyMessage="No skills have been added yet."
            onRetry={retry}
          >
            <div className="skills-grid">
              {Object.entries(skills).map(([category, items], index) => (
                <article className="skill-group" key={category}>
                  <div className="skill-group-head"><span>0{index + 1}</span><span>{items.length.toString().padStart(2, '0')} items</span></div>
                  <h3>{category}</h3>
                  <ul>
                    {items.map((item) => <li key={item.id || item.name}>{item.name}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </ApiContent>
        </section>

        <section className="portfolio-section education-section" id="education">
          <div className="section-index">03 <span>/</span> Education</div>
          <SectionHeader eyebrow="Learning path" title="Built through study and practice." />
          <ApiContent
            resource={resources.education}
            isEmpty={(data) => !data?.length}
            emptyMessage="No verified education records have been added yet."
            onRetry={retry}
          >
            <div className="education-list">
              {(resources.education.data || EMPTY_ARRAY).map((item, index) => (
                <article className="education-row" key={item.id || `${item.degree}-${item.institution}`}>
                  <span className="education-index">0{index + 1}</span>
                  <div className="education-main">
                    <h3>{item.degree}</h3>
                    <p>{item.institution}</p>
                    {item.board ? <span className="education-board">{item.board}</span> : null}
                  </div>
                  <div className="education-result">
                    {item.score != null ? (
                      <strong>{item.score_type === 'cgpa' ? `CGPA ${Number(item.score).toFixed(2)}` : `${item.score}%`}</strong>
                    ) : null}
                    {item.description ? <span>{item.description}</span> : null}
                  </div>
                  <span className="education-years">
                    {[item.start_year, item.end_year].filter(Boolean).join(' — ') || 'Year not provided'}
                  </span>
                </article>
              ))}
            </div>
          </ApiContent>
        </section>

        <section className="portfolio-section experience-section" id="experience">
          <div className="section-index">04 <span>/</span> Experience</div>
          <SectionHeader eyebrow="Practice and participation" title="Experience, clearly distinguished." description="Internship and project-learning entries returned by the portfolio API." />
          <ApiContent
            resource={resources.experience}
            isEmpty={(data) => !data?.length}
            emptyMessage="No experience entries have been added yet."
            onRetry={retry}
          >
            <div className="experience-grid">
              {(resources.experience.data || EMPTY_ARRAY).map((item, index) => (
                <article className="experience-card" key={item.id || `${item.title}-${item.organization}`}>
                  <div className="experience-card-top">
                    <span className="record-index">0{index + 1} / {item.type === 'internship' ? 'Internship' : 'Project experience'}</span>
                    {experiencePeriod(item) ? <span className="record-period">{experiencePeriod(item)}</span> : null}
                  </div>
                  <h3>{item.title}</h3>
                  <p className="experience-organization">{item.organization}</p>
                  {item.description ? <p className="experience-description">{item.description}</p> : null}
                </article>
              ))}
            </div>
          </ApiContent>
        </section>

        <section className="portfolio-section projects-section" id="projects">
          <div className="section-index">05 <span>/</span> Projects</div>
          <div className="projects-heading">
            <SectionHeader eyebrow="Selected work" title="Ideas made tangible." description="Browse project records from the portfolio API. Select a card for its detail view." />
            {resources.projects.status === 'success' && projects.length ? (
              <label className="project-search">
                <Search size={17} />
                <span className="visually-hidden">Search projects</span>
                <input value={projectSearch} onChange={(event) => setProjectSearch(event.target.value)} placeholder="Search title or stack" />
                {projectSearch ? <button type="button" onClick={() => setProjectSearch('')} aria-label="Clear project search"><X size={16} /></button> : null}
              </label>
            ) : null}
          </div>
          <ApiContent
            resource={resources.projects}
            isEmpty={(data) => !data?.length}
            emptyMessage="No projects have been published yet."
            onRetry={retry}
          >
            <div className="project-filters" aria-label="Filter projects by status">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={projectFilter === category ? 'filter-chip is-active' : 'filter-chip'}
                  onClick={() => setProjectFilter(category)}
                  aria-pressed={projectFilter === category}
                >
                  {category === 'all' ? 'All projects' : category === 'unspecified' ? 'Unspecified' : statusLabel(category)}
                  <span>{category === 'all' ? projects.length : projects.filter((project) => (project.status || 'unspecified') === category).length}</span>
                </button>
              ))}
            </div>
            {visibleProjects.length ? (
              <div className="projects-grid">
                {visibleProjects.map((project, index) => (
                  <article className="project-card" key={project.id || project.slug}>
                    <div className="project-card-top">
                      <span className="project-number">PROJECT / 0{index + 1}</span>
                      {project.status ? <span className="project-status">{statusLabel(project.status)}</span> : null}
                    </div>
                    <h3><Link to={`/projects/${encodeURIComponent(project.slug)}`}>{project.title}</Link></h3>
                    {project.short_description ? <p className="project-summary">{project.short_description}</p> : null}
                    {project.description ? <p className="project-description">{project.description}</p> : null}
                    {project.technologies?.length ? (
                      <ul className="project-technologies">
                        {project.technologies.map((technology) => <li key={technology}>{technology}</li>)}
                      </ul>
                    ) : (
                      <p className="project-stack-empty">Technology details not listed.</p>
                    )}
                    <div className="project-card-footer">
                      <Link to={`/projects/${encodeURIComponent(project.slug)}`}>Read project file <ArrowRight size={16} /></Link>
                      <div className="project-external-links">
                        {project.github_url ? <a href={project.github_url} target="_blank" rel="noreferrer" aria-label={`Repository for ${project.title}`}><ExternalLink size={16} /></a> : null}
                        {project.live_url ? <a href={project.live_url} target="_blank" rel="noreferrer" aria-label={`Live project ${project.title}`}><ExternalLink size={16} /></a> : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="resource-message is-empty" role="status">No projects match this search and filter.</div>
            )}
          </ApiContent>
        </section>



<section className="portfolio-section certifications-section" id="certifications">
  <div className="section-index">06 <span>/</span> Certifications</div>

  <SectionHeader
    eyebrow="Verified records"
    title="Certifications and credentials."
    description="Only records returned by the portfolio API are shown."
  />

  <ApiContent
    resource={resources.certifications}
    isEmpty={(data) => !data?.length}
    emptyMessage="No verified certifications have been added yet."
    onRetry={retry}
  >
    <div className="certifications-grid">
      {(resources.certifications.data || EMPTY_ARRAY).map((item) => (
        <article
          className="certification-card"
          key={item.id || `${item.name}-${item.issuing_organization}`}
        >
          <p>{item.issuing_organization}</p>
          <h3>{item.name}</h3>

          {item.completion_date ? (
            <time dateTime={item.completion_date}>
              {formatYear(item.completion_date)}
            </time>
          ) : null}

          <div className="certification-actions">
            {item.image_url && (
              <a
                className="certification-action primary"
                href={getPublicFileUrl(item.image_url)}
                target="_blank"
                rel="noreferrer"
              >
                View Certificate <ExternalLink size={14} />
              </a>
            )}

            {item.credential_url && (
              <a
                className="certification-action secondary"
                href={item.credential_url}
                target="_blank"
                rel="noreferrer"
              >
                Credential <ExternalLink size={14} />
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  </ApiContent>
</section>

        <section className="portfolio-section achievements-section" id="achievements">
          <div className="section-index">07 <span>/</span> Achievements</div>
          <SectionHeader eyebrow="Community and leadership" title="Showing up, contributing, learning." description="Leadership and participation entries supplied to the portfolio database." />
          <ApiContent
            resource={resources.achievements}
            isEmpty={(data) => !data?.length}
            emptyMessage="No achievement records have been added yet."
            onRetry={retry}
          >
            <ol className="achievement-list">
              {(resources.achievements.data || EMPTY_ARRAY).map((item, index) => (
                <li key={item.id || `${item.title}-${item.organization || index}`}>
                  <span className="achievement-number">0{index + 1}</span>
                  <div>
                    <h3>{item.title}{item.organization ? <span> / {item.organization}</span> : null}</h3>
                    {item.description ? <p>{item.description}</p> : null}
                  </div>
                  {item.date ? <time dateTime={item.date}>{formatYear(item.date)}</time> : null}
                </li>
              ))}
            </ol>
          </ApiContent>
        </section>

        <ResumeSection resource={resources.resume} onRetry={retry} />

        <section className="portfolio-section contact-section" id="contact">
          <div className="section-index">09 <span>/</span> Contact</div>
          <div className="contact-layout">
            <div className="contact-copy">
              <SectionHeader eyebrow="Open channel" title="Have a project in mind?" description="Have an idea, opportunity, or question? I’d be glad to hear from you." />
              {profile?.subtitle ? <p className="contact-location"><MapPin size={16} /> {profile.subtitle}</p> : null}
              <p className="contact-note">Use the form or reach out through the links below.</p>
              {verifiedSocialLinks.length ? (
                <div className="contact-channel-group">
                  <p className="contact-channel-label">Social links</p>
                  <ul className="verified-social-links" aria-label="Social links">
                    {verifiedSocialLinks.map((link) => (
                      <li key={`${link.platform}-${link.url}`}>
                        <a href={link.url} target="_blank" rel="noreferrer">
                          {link.platform} <ExternalLink size={14} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {directContacts.length ? (
                <div className="contact-channel-group">
                  <p className="contact-channel-label">Direct contact</p>
                  <div className="direct-contact-list">
                    {directContacts.map(({ link, contact }) => {
                      const ContactIcon = contact.icon;
                      const contactKey = `${link.id || link.platform}-${link.url}`;
                      const copyStatus = contactCopyState.key === contactKey ? contactCopyState.status : 'idle';

                      return (
                        <div className="direct-contact-box" key={contactKey}>
                          <div className="direct-contact-main">
                            <ContactIcon size={16} aria-hidden="true" />
                            {contact.href
                              ? <a className="direct-contact-value" href={contact.href}>{link.url}</a>
                              : <span className="direct-contact-value">{link.url}</span>}
                          </div>
                          <div className="direct-contact-actions">
                            <button
                              className="direct-contact-copy"
                              type="button"
                              onClick={() => handleCopyContact(link.url, contactKey)}
                              aria-label={`Copy ${contact.label}: ${link.url}`}
                            >
                              {copyStatus === 'copied' ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                            {copyStatus === 'copied' ? <span className="direct-contact-feedback" role="status">Copied!</span> : null}
                            {copyStatus === 'error' ? <span className="direct-contact-feedback is-error" role="alert">Copy failed</span> : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
            <form className="contact-form" onSubmit={handleContactSubmit} noValidate aria-busy={contactState.status === 'sending'}>
              <div className="contact-field-row">
                <label>
                  <span>Name</span>
                  <input autoComplete="name" name="name" maxLength={100} required value={contactForm.name} onChange={(event) => setContactForm((form) => ({ ...form, name: event.target.value }))} />
                </label>
                <label>
                  <span>Email</span>
                  <input autoComplete="email" name="email" type="email" maxLength={150} required value={contactForm.email} onChange={(event) => setContactForm((form) => ({ ...form, email: event.target.value }))} />
                </label>
              </div>
              <label>
                <span>Subject</span>
                <input name="subject" maxLength={200} required value={contactForm.subject} onChange={(event) => setContactForm((form) => ({ ...form, subject: event.target.value }))} />
              </label>
              <label>
                <span>Message</span>
                <textarea name="message" rows={5} maxLength={5000} required value={contactForm.message} onChange={(event) => setContactForm((form) => ({ ...form, message: event.target.value }))} />
              </label>
              {contactState.message ? (
                <p className={`contact-feedback ${contactState.status}`} role={contactState.status === 'error' ? 'alert' : 'status'} aria-live={contactState.status === 'error' ? 'assertive' : 'polite'}>{contactState.message}</p>
              ) : null}
              <button className="button button-primary contact-submit" type="submit" disabled={contactState.status === 'sending'}>
                {contactState.status === 'sending' ? 'Sending…' : 'Send message'}
                {contactState.status === 'sending' ? <LoaderCircle className="contact-spinner" size={16} aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer fullName={profile?.full_name || 'Vinit Kumar Mandal'} />
    </div>
  );
}
