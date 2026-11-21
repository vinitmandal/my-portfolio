import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Moon, SunMedium, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const navLinks = [
  ['About', 'about'],
  ['Skills', 'skills'],
  ['Education', 'education'],
  ['Experience', 'experience'],
  ['Projects', 'projects'],
  ['Certifications', 'certifications'],
  ['Achievements', 'achievements'],
  ['Resume', 'resume'],
  ['Contact', 'contact'],
];

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const sections = navLinks
      .map(([, id]) => document.getElementById(id))
      .filter(Boolean);

    if (!('IntersectionObserver' in window) || !sections.length) return undefined;

    const observer = new IntersectionObserver(() => {
      const bandTop = window.innerHeight * 0.25;
      const bandBottom = window.innerHeight * 0.35;
      const currentSection = sections.find((section) => {
        const bounds = section.getBoundingClientRect();
        return bounds.top <= bandBottom && bounds.bottom >= bandTop;
      });

      setActiveSection(currentSection?.id || '');
    }, {
      rootMargin: '-25% 0px -65% 0px',
      threshold: 0,
    });

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <header className="portfolio-header">
      <div className="portfolio-nav-wrap">
        <Link to="/" className="portfolio-brand" aria-label="Vinit Kumar Mandal home">
          <span className="brand-monogram">VKM</span>
          <span className="brand-caption">Portfolio <span>·</span> Engineering</span>
        </Link>

        <nav
          className={`portfolio-nav${menuOpen ? ' is-open' : ''}`}
          id="portfolio-navigation"
          aria-label="Main navigation"
        >
          {navLinks.map(([label, id], index) => (
            <a
              key={id}
              href={`#${id}`}
              className={activeSection === id ? 'is-active' : undefined}
              aria-current={activeSection === id ? 'location' : undefined}
              onClick={closeMenu}
            >
              <span className="nav-index">0{index + 1}</span>
              {label}
            </a>
          ))}
        </nav>

        <div className="portfolio-nav-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            aria-pressed={theme === 'dark'}
          >
            {theme === 'light' ? <Moon size={18} /> : <SunMedium size={18} />}
          </button>
          <Link className="admin-shortcut" to="/admin/login" onClick={closeMenu}>Admin <span aria-hidden="true">↗</span></Link>
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-controls="portfolio-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
