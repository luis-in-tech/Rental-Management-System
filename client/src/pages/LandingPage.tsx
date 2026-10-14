import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import {
  Building2, ShieldCheck, Zap, Droplets, Receipt,
  BellRing, ArrowRight, CheckCircle2, ChevronRight,
  Sparkles, ChevronDown, LogIn, UserPlus
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState<any[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    authAPI.getSignupOptions()
      .then(res => setBuildings(res.data?.buildings || []))
      .catch(() => {
        setBuildings([
          { id: '1', name: 'Building A' },
          { id: '2', name: 'Building B' },
          { id: '3', name: 'Building C' },
          { id: '4', name: 'Building D' },
          { id: '5', name: 'Building E' },
        ]);
      });
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const portalRoute = user?.role === 'tenant' ? '/tenant' : '/dashboard';

  const faqs = [
    {
      q: 'How do I register as a tenant in RentaHub?',
      a: 'After finalizing your lease contract with the property manager, click "Tenant Sign Up". Select your assigned building and room number, and submit your contact details for verification.',
    },
    {
      q: 'When can I log into my resident portal?',
      a: 'Once your registration is submitted, management verifies your details against your signed lease agreement. After approval, you can sign in anytime using your email and password.',
    },
    {
      q: 'How are my water and electricity bills calculated?',
      a: 'Each unit has dedicated submeters. Your monthly statements accurately reflect only your personal consumption with meter reading photos attached for total transparency.',
    },
    {
      q: 'Where do property managers log in?',
      a: 'Management and landlords use the same sign-in page. The system automatically detects your administrative access and opens your management portal.',
    },
  ];

  return (
    <div className="landing-page">
      {/* ===== NAVIGATION BAR ===== */}
      <nav className="landing-nav">
        <div className="landing-nav-container">
          <Link to="/" className="landing-logo">
            <div className="logo-icon">R</div>
            <div>
              <span className="logo-title">RentaHub</span>
              <span className="logo-subtitle">Modern Rental Living</span>
            </div>
          </Link>

          <div className="landing-nav-links">
            <a href="#residences">Residences</a>
            <a href="#features">Resident Perks</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#faq">FAQ</a>
          </div>

          <div className="landing-nav-actions">
            {user ? (
              <button 
                onClick={() => navigate(portalRoute)} 
                className="btn btn-primary"
                style={{ gap: '0.4rem' }}
              >
                <span>{user.role === 'tenant' ? 'My Resident Hub' : 'Management Portal'}</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary btn-signin">
                  <LogIn size={15} />
                  <span>Sign In</span>
                </Link>
                <Link to="/login?mode=signup" className="btn btn-primary btn-signup">
                  <UserPlus size={15} />
                  <span>Tenant Sign Up</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <header className="landing-hero">
        <div className="landing-hero-glow glow-1" />
        <div className="landing-hero-glow glow-2" />

        <div className="landing-hero-content">
          <div className="landing-badge">
            <Sparkles size={14} className="landing-badge-icon" />
            <span>Modern Living & Transparent Resident Portal</span>
          </div>

          <h1 className="landing-hero-title">
            Modern Rental Living, <br />
            <span className="gradient-text">Made Simple & Transparent.</span>
          </h1>

          <p className="landing-hero-desc">
            Welcome to RentaHub. View your monthly utility submeters, check billing receipts,
            and stay updated with community notices — all in one simple, secure resident portal.
          </p>

          <div className="landing-hero-cta">
            <Link to="/login?mode=signup" className="btn btn-primary btn-hero">
              <UserPlus size={18} />
              <span>Tenant Sign Up</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn btn-hero-secondary">
              <LogIn size={18} />
              <span>Resident Sign In</span>
            </Link>
          </div>

          {/* Clean Metric Highlights */}
          <div className="landing-metrics-strip">
            <div className="metric-item">
              <div className="metric-icon"><Building2 size={20} /></div>
              <div className="metric-text">
                <strong>Managed Residences</strong>
                <span>Buildings A through E</span>
              </div>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <div className="metric-icon"><Zap size={20} /></div>
              <div className="metric-text">
                <strong>Submetered Utilities</strong>
                <span>Pay only for what you consume</span>
              </div>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <div className="metric-icon"><ShieldCheck size={20} /></div>
              <div className="metric-text">
                <strong>Verified Community</strong>
                <span>Safe, contract-backed residency</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resident Portal Visual Preview */}
        <div className="landing-mockup-wrapper">
          <div className="landing-mockup-card">
            <div className="mockup-header">
              <div className="mockup-dots">
                <span /><span /><span />
              </div>
              <div className="mockup-header-title">Resident Portal Preview</div>
              <div className="badge badge-success" style={{ fontSize: '0.72rem' }}>Verified Resident</div>
            </div>

            <div className="mockup-body">
              <div className="mockup-stat-row">
                <div className="mockup-stat-box">
                  <div className="stat-box-label">Water Submeter</div>
                  <div className="stat-box-val text-cyan">Transparent</div>
                  <div className="stat-box-sub"><Droplets size={12} /> Individual meter readings</div>
                </div>
                <div className="mockup-stat-box">
                  <div className="stat-box-label">Electricity Submeter</div>
                  <div className="stat-box-val text-gold">Tracked</div>
                  <div className="stat-box-sub"><Zap size={12} /> Verified monthly photos</div>
                </div>
                <div className="mockup-stat-box">
                  <div className="stat-box-label">Billing Invoices</div>
                  <div className="stat-box-val text-success">Digital</div>
                  <div className="stat-box-sub"><CheckCircle2 size={12} /> Instant online receipts</div>
                </div>
              </div>

              <div className="mockup-announcement">
                <BellRing size={16} className="text-accent" />
                <div className="announcement-text">
                  <strong>Building Notice:</strong> Routine water tank maintenance scheduled for Saturday at 9:00 AM.
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== RESIDENCES SECTION ===== */}
      <section id="residences" className="landing-section">
        <div className="section-head">
          <span className="section-tag">OUR PROPERTIES</span>
          <h2 className="section-title">Residential Communities</h2>
          <p className="section-subtitle">
            Explore our welcoming residential buildings equipped with dedicated utility submeters
            and professional property upkeep.
          </p>
        </div>

        <div className="properties-grid">
          {buildings.slice(0, 5).map((b, idx) => (
            <div key={b.id || idx} className="property-card">
              <div className="property-card-top">
                <div className="property-badge">Building {String.fromCharCode(65 + idx)}</div>
                <span className="badge badge-muted" style={{ fontSize: '0.72rem' }}>
                  Managed Residence
                </span>
              </div>

              <div className="property-info">
                <h3>{b.name || `Building ${String.fromCharCode(65 + idx)}`}</h3>
                <p className="property-address">Prime residential neighborhood with quick access to transit and daily essentials.</p>

                <div className="property-tags">
                  <span className="prop-tag"><Zap size={12} /> Individual Power Submeter</span>
                  <span className="prop-tag"><Droplets size={12} /> Water Submeter</span>
                  <span className="prop-tag"><ShieldCheck size={12} /> Secure Entry</span>
                </div>
              </div>

              <div className="property-footer">
                <span className="text-muted text-sm">Leased Unit?</span>
                <Link 
                  to={`/login?mode=signup&buildingId=${b.id}`} 
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '0.3rem' }}
                >
                  <span>Register Contract</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== RESIDENT PERKS ===== */}
      <section id="features" className="landing-section bg-alt">
        <div className="section-head">
          <span className="section-tag">RESIDENT ADVANTAGE</span>
          <h2 className="section-title">Why Residents Love RentaHub</h2>
          <p className="section-subtitle">
            Everything you need for a comfortable, stress-free tenancy.
          </p>
        </div>

        <div className="perks-grid">
          <div className="perk-card">
            <div className="perk-icon-wrapper bg-blue-tint">
              <Droplets className="perk-icon text-cyan" size={26} />
            </div>
            <h3>Fair Submeter Utility Tracking</h3>
            <p>
              Pay strictly for your own usage. Water and electricity meters are photographed
              each month so you always know your exact consumption.
            </p>
          </div>

          <div className="perk-card">
            <div className="perk-icon-wrapper bg-gold-tint">
              <Receipt className="perk-icon text-gold" size={26} />
            </div>
            <h3>Paperless Digital Billing</h3>
            <p>
              Receive your monthly statement directly on your phone or laptop.
              Review itemized details, due dates, and past payment history anytime.
            </p>
          </div>

          <div className="perk-card">
            <div className="perk-icon-wrapper bg-accent-tint">
              <BellRing className="perk-icon text-accent" size={26} />
            </div>
            <h3>Community Announcements</h3>
            <p>
              Get notified immediately about building notices, maintenance schedules,
              and community advisories from management.
            </p>
          </div>

          <div className="perk-card">
            <div className="perk-icon-wrapper bg-green-tint">
              <ShieldCheck className="perk-icon text-success" size={26} />
            </div>
            <h3>Verified Tenancy & Safety</h3>
            <p>
              Every tenant account is verified against a valid lease contract to ensure
              a secure, authorized, and peaceful community for all residents.
            </p>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="landing-section">
        <div className="section-head">
          <span className="section-tag">EASY STEPS</span>
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Getting connected to your resident portal takes just a few moments.
          </p>
        </div>

        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">01</div>
            <h4>Sign Your Lease</h4>
            <p>Complete your tenancy contract with the property manager and receive your assigned room.</p>
          </div>

          <div className="step-connector" />

          <div className="step-card">
            <div className="step-number">02</div>
            <h4>Register Online</h4>
            <p>Submit your name, contact number, and contracted room via the Tenant Sign Up page.</p>
          </div>

          <div className="step-connector" />

          <div className="step-card">
            <div className="step-number">03</div>
            <h4>Fast Verification</h4>
            <p>Management reviews your submission against your lease agreement and activates your portal.</p>
          </div>

          <div className="step-connector" />

          <div className="step-card">
            <div className="step-number">04</div>
            <h4>Access Your Portal</h4>
            <p>Log in anytime to view transparent utility bills, digital receipts, and building updates.</p>
          </div>
        </div>
      </section>

      {/* ===== FAQ SECTION ===== */}
      <section id="faq" className="landing-section bg-alt">
        <div className="section-head">
          <span className="section-tag">HELP & QUESTIONS</span>
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">
            Common questions regarding tenant onboarding and portal access.
          </p>
        </div>

        <div className="faq-container">
          {faqs.map((f, i) => (
            <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
              <button className="faq-question" onClick={() => toggleFaq(i)}>
                <span>{f.q}</span>
                <ChevronDown size={18} className="faq-chevron" />
              </button>
              {openFaq === i && (
                <div className="faq-answer">
                  <p>{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ===== SIMPLE & CLEAN FOOTER ===== */}
      <footer className="landing-footer">
        <div className="landing-footer-container">
          <div className="footer-col-main">
            <div className="landing-logo">
              <div className="logo-icon">R</div>
              <div>
                <span className="logo-title">RentaHub</span>
                <span className="logo-subtitle">Modern Rental Living</span>
              </div>
            </div>
            <p className="footer-tagline">
              Modern rental residences with transparent submeter utility tracking,
              paperless invoicing, and dedicated property upkeep.
            </p>
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#residences">Residences</a></li>
              <li><a href="#features">Resident Perks</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Portal Access</h4>
            <ul>
              <li><Link to="/login?mode=signup">Tenant Sign Up</Link></li>
              <li><Link to="/login">Resident Sign In</Link></li>
              <li><Link to="/login" style={{ color: 'var(--text-muted)' }}>Staff & Management Login</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} RentaHub. All rights reserved.</div>
          <div className="footer-bottom-links">
            <Link to="/login" style={{ color: '#64748b', textDecoration: 'none' }}>Management Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
