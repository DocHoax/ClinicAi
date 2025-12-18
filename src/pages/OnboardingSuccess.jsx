import { Link } from 'react-router-dom'

function OnboardingSuccess() {
    return (
        <div className="success-page">
            <div className="success-content">
                <div className="success-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>

                <h1 className="success-title">You're All Set! 🎉</h1>

                <p className="success-message">
                    Your ClinicAI assistant has been created and is ready to help your patients.
                    You can now access your dashboard to customize settings and monitor interactions.
                </p>

                <div className="success-actions">
                    <Link to="/dashboard" className="btn btn-primary btn-lg">
                        Go to Dashboard
                    </Link>
                    <Link to="/chat" className="btn btn-secondary btn-lg">
                        Test Chat Widget
                    </Link>
                </div>

                <div className="card" style={{ marginTop: 'var(--spacing-10)', textAlign: 'left' }}>
                    <h3 style={{ marginBottom: 'var(--spacing-4)' }}>What's Next?</h3>
                    <ul style={{ color: 'var(--text-secondary)', lineHeight: '2' }}>
                        <li>✅ Explore your dashboard to view patient interactions</li>
                        <li>✅ Test the chat widget to see how patients will interact</li>
                        <li>✅ Share the chat link with your first patients</li>
                        <li>✅ Connect with your n8n backend for full automation</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default OnboardingSuccess
