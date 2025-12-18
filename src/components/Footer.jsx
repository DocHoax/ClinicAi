import { Link, useLocation } from 'react-router-dom'

function Footer() {
    const location = useLocation()

    // Don't show footer on dashboard or chat pages
    if (location.pathname.startsWith('/dashboard') || location.pathname === '/chat') {
        return null
    }

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <Link to="/" className="footer-logo">
                        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="50" cy="50" r="45" fill="#0077B6" />
                            <path d="M50 25 L50 75 M25 50 L75 50" stroke="white" strokeWidth="8" strokeLinecap="round" />
                            <circle cx="50" cy="50" r="12" fill="white" />
                        </svg>
                        ClinicAI
                    </Link>

                    <ul className="footer-links">
                        <li><a href="#features">Features</a></li>
                        <li><a href="#how-it-works">How It Works</a></li>
                        <li><Link to="/onboarding">Get Started</Link></li>
                        <li><a href="#privacy">Privacy</a></li>
                        <li><a href="#terms">Terms</a></li>
                    </ul>
                </div>

                <div className="footer-bottom">
                    <p>© {new Date().getFullYear()} ClinicAI. Supporting SDG 3: Good Health & Well-Being. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer
