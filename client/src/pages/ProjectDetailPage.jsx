import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import ResourceState from '../components/ResourceState';
import { getPublicFileUrl, portfolioApi } from '../services/api';

function getProjectStatus(status) {
  if (status === 'in_progress') return 'In progress';
  if (status === 'completed') return 'Completed';
  if (status === 'planned') return 'Planned';
  return '';
}

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const [resource, setResource] = useState({ key: '', status: 'loading', project: null, error: '' });
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${slug}:${attempt}`;

  useEffect(() => {
    const controller = new AbortController();

    portfolioApi.getProject(slug, { signal: controller.signal })
      .then((project) => {
        setResource({ key: requestKey, status: project ? 'success' : 'empty', project: project || null, error: '' });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (error.response?.status === 404) {
          setResource({ key: requestKey, status: 'empty', project: null, error: '' });
          return;
        }
        setResource({
          key: requestKey,
          status: 'error',
          project: null,
          error: error.response?.data?.message || 'Project details could not be loaded from the portfolio API.',
        });
      });

    return () => controller.abort();
  }, [slug, attempt, requestKey]);

  const currentResource = resource.key === requestKey
    ? resource
    : { status: 'loading', project: null, error: '' };
  const project = currentResource.project;
  const statusLabel = project ? getProjectStatus(project.status) : '';

  return (
    <div className="portfolio-site" id="top">
      <Navbar />
      <main className="project-detail-main">
        <div className="detail-eyebrow">Selected work <span>/</span> Project file</div>
        <a className="back-to-projects" href="/#projects"><ArrowLeft size={16} /> Back to all projects</a>

        <ResourceState
          status={currentResource.status}
          error={currentResource.error}
          empty={currentResource.status === 'empty'}
          emptyMessage="This project is not available in the portfolio API."
          onRetry={() => setAttempt((value) => value + 1)}
        >
          {project ? (
            <article className="project-detail">
              <header className="project-detail-heading">
                <p className="eyebrow">Project / {project.slug}</p>
                <h1>{project.title}</h1>
                {project.short_description ? <p className="project-detail-summary">{project.short_description}</p> : null}
                <div className="detail-meta">
                  {statusLabel ? <span className="status-tag">{statusLabel}</span> : null}
                  {project.featured ? <span className="status-tag">Featured</span> : null}
                  {project.github_url ? (
                    <a href={project.github_url} target="_blank" rel="noreferrer">
                      Repository <ArrowUpRight size={15} />
                    </a>
                  ) : null}
                  {project.live_url ? (
                    <a href={project.live_url} target="_blank" rel="noreferrer">
                      Live project <ArrowUpRight size={15} />
                    </a>
                  ) : null}
                </div>
              </header>

              {project.cover_image ? (
                <img
                  className="project-detail-image"
                  src={getPublicFileUrl(project.cover_image)}
                  alt={`${project.title} project`}
                />
              ) : null}

              <div className="project-detail-body">
                <section>
                  <p className="detail-index">01 / Overview</p>
                  <h2>About this project</h2>
                  {project.description ? (
                    <p className="detail-copy">{project.description}</p>
                  ) : (
                    <p className="detail-copy muted-copy">A detailed description has not been added yet.</p>
                  )}
                </section>

                <section>
                  <p className="detail-index">02 / Stack</p>
                  <h2>Technologies</h2>
                  {project.technologies?.length ? (
                    <div className="technology-list">
                      {project.technologies.map((technology) => (
                        <span className="technology-chip" key={technology}>{technology}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="detail-copy muted-copy">Technologies have not been listed yet.</p>
                  )}
                </section>
              </div>
            </article>
          ) : null}
        </ResourceState>
      </main>
      <Footer />
    </div>
  );
}
