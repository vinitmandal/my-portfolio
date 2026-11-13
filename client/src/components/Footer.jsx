import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export default function Footer({ fullName = 'Vinit Kumar Mandal' }) {
  const [year] = useState(() => new Date().getFullYear());

  return (
    <footer className="portfolio-footer">
      <div className="footer-rule" />
      <div className="footer-content">
        <div>
          <p className="footer-kicker">A portfolio in progress</p>
          <p className="footer-name">{fullName}</p>
        </div>
        <div className="footer-meta">
          <span>© {year}</span>
          <Link to="/admin/login">Admin access <ArrowUpRight size={14} /></Link>
          <a href="#top">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
