import { Link } from 'react-router-dom'
import Footer from '../components/Footer'

function Landing() {
    const features = [
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
            ),
            title: 'Symptom Checking',
            description: 'Safe, non-diagnostic symptom assessment that guides patients to appropriate care without making medical decisions.'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                </svg>
            ),
            title: 'Smart Triage',
            description: 'Urgency-based prioritization that helps patients understand when to seek immediate care or schedule an appointment.'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            ),
            title: 'Easy Booking',
            description: 'Seamless appointment scheduling with automatic reminders to reduce no-shows and improve clinic efficiency.'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
            ),
            title: 'Automated Reminders',
            description: 'Proactive notifications for appointments, medication reminders, and follow-up care instructions.'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ),
            title: 'Patient Follow-ups',
            description: 'Automated post-visit check-ins to ensure patient recovery and catch any complications early.'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            ),
            title: 'Doctor Escalation',
            description: 'Urgent or complex cases are automatically escalated to medical staff with full context for faster response.'
        }
    ]

    const steps = [
        {
            number: '1',
            title: 'Onboard Your Clinic',
            description: 'Fill out a simple form with your clinic details, services, and operating hours.'
        },
        {
            number: '2',
            title: 'Get Your AI Assistant',
            description: 'We instantly generate a custom AI assistant tailored to your specific clinic.'
        },
        {
            number: '3',
            title: 'Start Helping Patients',
            description: 'Embed the chat widget on your site and let AI handle intake, triage, and bookings.'
        }
    ]

    return (
        <>
            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div className="hero-center">
                        <h1 className="hero-title">
                            AI-Powered <span>Healthcare Assistance</span>
                        </h1>
                        <p className="hero-subtitle">
                            Connecting patients with clinics through intelligent AI assistance.
                            Book appointments, check symptoms, and manage healthcare — all in one place.
                        </p>

                        {/* Role Selector */}
                        <div className="role-selector">
                            <div className="role-cards">
                                {/* Patient Card */}
                                <Link to="/find-clinic" className="role-card patient">
                                    <div className="role-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                    <h3>Patient</h3>
                                    <p>Find clinics, check symptoms, and book appointments with AI assistance</p>
                                    <div className="role-features">
                                        <span>🔍 Find Nearby Clinics</span>
                                        <span>💬 AI Symptom Checker</span>
                                        <span>📅 Easy Booking</span>
                                    </div>
                                    <div className="role-btn">
                                        Get Started
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </Link>

                                {/* Clinic Card */}
                                <Link to="/onboarding" className="role-card clinic">
                                    <div className="role-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                                            <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
                                            <path d="M9 9v.01M9 13v.01M9 17v.01" />
                                            <path d="M12 7v10" strokeWidth="2" />
                                            <path d="M9.5 12h5" strokeWidth="2" />
                                        </svg>
                                    </div>
                                    <h3>Clinic / Healthcare Provider</h3>
                                    <p>Automate patient intake, triage, and scheduling with your own AI assistant</p>
                                    <div className="role-features">
                                        <span>🤖 Custom AI Assistant</span>
                                        <span>📊 Patient Dashboard</span>
                                        <span>⚡ Reduce Admin Work</span>
                                    </div>
                                    <div className="role-btn">
                                        Register Clinic
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="hero-quick-links">
                            <span className="text-muted">Quick access:</span>
                            <Link to="/chat" className="quick-link">Try AI Demo</Link>
                            <Link to="/dashboard" className="quick-link">Clinic Dashboard</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features">
                <div className="container">
                    <div className="features-header">
                        <h2 className="features-title">Everything Your Clinic Needs</h2>
                        <p className="features-subtitle">
                            Powerful AI capabilities that support your staff — without making medical decisions
                        </p>
                    </div>
                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div key={index} className="card feature-card animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                                <div className="feature-icon">
                                    {feature.icon}
                                </div>
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-description">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="how-it-works">
                <div className="container">
                    <div className="features-header">
                        <h2 className="features-title">Get Started in Minutes</h2>
                        <p className="features-subtitle">
                            Three simple steps to transform your clinic's patient experience
                        </p>
                    </div>
                    <div className="steps">
                        {steps.map((step, index) => (
                            <div key={index} className="step">
                                <div className="step-number">{step.number}</div>
                                <h3 className="step-title">{step.title}</h3>
                                <p className="step-description">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta">
                <div className="container">
                    <h2 className="cta-title">Ready to Transform Your Clinic?</h2>
                    <p className="cta-subtitle">
                        Join clinics using AI to improve patient care and reduce admin burden
                    </p>
                    <Link to="/onboarding" className="btn btn-lg">
                        Start Your Free Trial
                    </Link>
                </div>
            </section>

            <Footer />
        </>
    )
}

export default Landing
