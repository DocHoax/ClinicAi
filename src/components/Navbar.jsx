import { Link, useLocation } from 'react-router-dom'

function Navbar() {
    const location = useLocation()
    const isDashboard = location.pathname.startsWith('/dashboard')

    return (
        <nav className="navbar">
            <div className="container navbar-content">
                <Link to="/" className="navbar-logo">
                    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="45" fill="currentColor" />
                        <path d="M50 25 L50 75 M25 50 L75 50" stroke="white" strokeWidth="8" strokeLinecap="round" />
                        <circle cx="50" cy="50" r="12" fill="white" />
                    </svg>
                    ClinicAI
                </Link>

                {!isDashboard && (
                    <ul className="navbar-nav">
                        <li><Link to="/find-clinic" className="navbar-link">Find Clinic</Link></li>
                        <li><a href="#features" className="navbar-link">Features</a></li>
                        <li><a href="#how-it-works" className="navbar-link">How It Works</a></li>
                        <li><Link to="/chat" className="navbar-link">Patient Demo</Link></li>
                    </ul>
                )}

                <div className="navbar-actions">
                    {isDashboard ? (
                        <Link to="/" className="btn btn-secondary btn-sm">Back to Home</Link>
                    ) : (
                        <>
                            <Link to="/dashboard" className="btn btn-secondary btn-sm">Dashboard</Link>
                            <Link to="/onboarding" className="btn btn-primary btn-sm">Get Started</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default Navbar
