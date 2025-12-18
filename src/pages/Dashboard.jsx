import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardStats, getRecentActivity, getTodayAppointments } from '../services/dashboardApi'

function Dashboard() {
    const DASHBOARD_AUTH_STORAGE_KEY = 'clinicai.dashboard.unlocked'
    const clinicDashboardPassword = useMemo(() => {
        return String(import.meta.env.VITE_CLINIC_DASHBOARD_PASSWORD || '').trim()
    }, [])

    const [unlocked, setUnlocked] = useState(() => {
        try {
            return window.localStorage.getItem(DASHBOARD_AUTH_STORAGE_KEY) === '1'
        } catch {
            return false
        }
    })
    const [accessCode, setAccessCode] = useState('')
    const [authError, setAuthError] = useState(null)

    const [activeTab, setActiveTab] = useState('overview')

    const [statsData, setStatsData] = useState(null)
    const [appointments, setAppointments] = useState([])
    const [recentActivity, setRecentActivity] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
    const inFlightRef = useRef(false)

    const pollMs = useMemo(() => {
        const raw = Number(import.meta.env.VITE_DASHBOARD_POLL_MS)
        if (!Number.isFinite(raw) || raw <= 0) {
            return 10000
        }
        return Math.max(2000, raw)
    }, [])

    const formatRelative = (iso) => {
        if (!iso) return ''
        const ts = new Date(iso).getTime()
        if (!Number.isFinite(ts)) return ''

        const diffMs = Date.now() - ts
        const diffMin = Math.floor(diffMs / 60000)

        if (diffMin < 1) return 'just now'
        if (diffMin === 1) return '1 min ago'
        if (diffMin < 60) return `${diffMin} min ago`

        const diffHr = Math.floor(diffMin / 60)
        if (diffHr === 1) return '1 hour ago'
        if (diffHr < 24) return `${diffHr} hours ago`

        const diffDay = Math.floor(diffHr / 24)
        return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`
    }

    const refresh = async (signal) => {
        if (inFlightRef.current) {
            return
        }

        inFlightRef.current = true
        setError(null)

        try {
            const [statsRes, apptsRes, activityRes] = await Promise.all([
                getDashboardStats({ signal }),
                getTodayAppointments({ signal }),
                getRecentActivity({ signal })
            ])

            setStatsData(statsRes?.stats || null)
            setAppointments(Array.isArray(apptsRes?.appointments) ? apptsRes.appointments : [])
            setRecentActivity(Array.isArray(activityRes?.activity) ? activityRes.activity : [])

            const updatedAt = statsRes?.stats?.updatedAt || new Date().toISOString()
            setLastUpdatedAt(updatedAt)
        } catch (e) {
            if (e?.name !== 'AbortError') {
                setError(e?.message || 'Failed to load dashboard data')
            }
        } finally {
            setLoading(false)
            inFlightRef.current = false
        }
    }

    useEffect(() => {
        if (!unlocked) {
            return
        }

        const controller = new AbortController()
        refresh(controller.signal)

        const interval = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                refresh(controller.signal)
            }
        }, pollMs)

        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                refresh(controller.signal)
            }
        }

        document.addEventListener('visibilitychange', onVisibility)

        return () => {
            window.clearInterval(interval)
            document.removeEventListener('visibilitychange', onVisibility)
            controller.abort()
        }
    }, [pollMs, unlocked])

    const onSubmitAccessCode = (e) => {
        e.preventDefault()
        setAuthError(null)

        if (!clinicDashboardPassword) {
            setAuthError('Dashboard password is not configured. Set VITE_CLINIC_DASHBOARD_PASSWORD in .env.local and restart the dev server.')
            return
        }

        if (accessCode.trim() !== clinicDashboardPassword) {
            setAuthError('Incorrect access code.')
            return
        }

        try {
            window.localStorage.setItem(DASHBOARD_AUTH_STORAGE_KEY, '1')
        } catch {
            // ignore
        }

        setUnlocked(true)
        setAccessCode('')
        setLoading(true)
        setError(null)
    }

    const stats = useMemo(() => {
        return [
            { label: 'Today\'s Appointments', value: statsData?.todayAppointments ?? '—', change: 'Live', icon: 'calendar' },
            { label: 'Pending Inquiries', value: statsData?.pendingInquiries ?? '—', change: 'Live', icon: 'message' },
            { label: 'Active Patients', value: statsData?.activePatients ?? '—', change: 'Live', icon: 'users' },
            { label: 'AI Interactions', value: statsData?.aiInteractions ?? '—', change: 'Live', icon: 'bot' },
        ]
    }, [statsData])

    const getIcon = (type) => {
        switch (type) {
            case 'calendar':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                )
            case 'message':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                )
            case 'users':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                )
            case 'bot':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <rect x="3" y="11" width="18" height="10" rx="2" />
                        <circle cx="12" cy="5" r="2" />
                        <path d="M12 7v4" />
                        <line x1="8" y1="16" x2="8" y2="16" />
                        <line x1="16" y1="16" x2="16" y2="16" />
                    </svg>
                )
            default:
                return null
        }
    }

    const getStatusBadge = (status) => {
        const statusClass = status === 'Confirmed' ? 'badge-success' : 'badge-warning'
        return <span className={`badge ${statusClass}`}>{status}</span>
    }

    if (!unlocked) {
        return (
            <div className="dashboard">
                <main className="dashboard-main" style={{
                    padding: 'var(--spacing-10) var(--spacing-6)',
                    maxWidth: 720,
                    margin: '0 auto'
                }}>
                    <div className="card" style={{ padding: 'var(--spacing-8)' }}>
                        <div className="dashboard-header" style={{ padding: 0, marginBottom: 'var(--spacing-6)' }}>
                            <h1 className="dashboard-title">Clinic Dashboard</h1>
                            <p className="dashboard-subtitle">Enter the clinic access code to continue.</p>
                        </div>

                        <form onSubmit={onSubmitAccessCode}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="clinic-access-code">Access code</label>
                                <input
                                    id="clinic-access-code"
                                    className="form-input"
                                    type="password"
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value)}
                                    placeholder="Enter clinic access code"
                                    autoComplete="current-password"
                                />
                            </div>

                            {authError && (
                                <div className="location-error" style={{ marginBottom: 'var(--spacing-5)' }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 8v4M12 16h.01" />
                                    </svg>
                                    {authError}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center' }}>
                                <button className="btn btn-primary" type="submit">Unlock Dashboard</button>
                                <Link to="/" className="btn btn-secondary">Back</Link>
                            </div>

                            <p style={{ marginTop: 'var(--spacing-5)', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                Note: This is a simple client-side gate. For real security, enforce access on the server.
                            </p>
                        </form>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="dashboard">
            {/* Sidebar */}
            <aside className="sidebar">
                <nav>
                    <ul className="sidebar-nav">
                        <li className="sidebar-item">
                            <a
                                href="#overview"
                                className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="7" height="7" />
                                    <rect x="14" y="3" width="7" height="7" />
                                    <rect x="14" y="14" width="7" height="7" />
                                    <rect x="3" y="14" width="7" height="7" />
                                </svg>
                                Overview
                            </a>
                        </li>
                        <li className="sidebar-item">
                            <a
                                href="#appointments"
                                className={`sidebar-link ${activeTab === 'appointments' ? 'active' : ''}`}
                                onClick={() => setActiveTab('appointments')}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                Appointments
                            </a>
                        </li>
                        <li className="sidebar-item">
                            <a
                                href="#patients"
                                className={`sidebar-link ${activeTab === 'patients' ? 'active' : ''}`}
                                onClick={() => setActiveTab('patients')}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                Patients
                            </a>
                        </li>
                        <li className="sidebar-item">
                            <a
                                href="#messages"
                                className={`sidebar-link ${activeTab === 'messages' ? 'active' : ''}`}
                                onClick={() => setActiveTab('messages')}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                Messages
                                <span className="badge badge-danger" style={{ marginLeft: 'auto' }}>
                                    {statsData?.pendingInquiries ?? 0}
                                </span>
                            </a>
                        </li>
                        <li className="sidebar-item">
                            <a
                                href="#settings"
                                className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`}
                                onClick={() => setActiveTab('settings')}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                </svg>
                                Settings
                            </a>
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Dashboard</h1>
                    <p className="dashboard-subtitle">
                        Welcome back! Here's what's happening at your clinic today.
                        {lastUpdatedAt ? ` • Updated ${formatRelative(lastUpdatedAt)}` : ''}
                    </p>
                    {error && (
                        <div className="location-error" style={{ marginTop: 'var(--spacing-4)' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 8v4M12 16h.01" />
                            </svg>
                            {error}
                        </div>
                    )}
                    {loading && (
                        <div className="location-success" style={{ marginTop: 'var(--spacing-4)' }}>
                            <div className="spinner-small"></div>
                            Loading live data…
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    {stats.map((stat, index) => (
                        <div key={index} className="stat-card card">
                            <div className="stat-header">
                                <span className="stat-label">{stat.label}</span>
                                <div className="stat-icon">
                                    {getIcon(stat.icon)}
                                </div>
                            </div>
                            <div className="stat-value">{stat.value}</div>
                            <div className="stat-change">{stat.change}</div>
                        </div>
                    ))}
                </div>

                {/* Content Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-6)' }}>
                    {/* Appointments Table */}
                    <div className="table-container">
                        <div className="table-header">
                            <h3 className="table-title">Today's Appointments</h3>
                            <Link to="#" className="btn btn-sm btn-secondary">View All</Link>
                        </div>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Time</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map((apt) => (
                                    <tr key={apt.id}>
                                        <td><strong>{apt.patient}</strong></td>
                                        <td>{apt.time}</td>
                                        <td>{apt.type}</td>
                                        <td>{getStatusBadge(apt.status)}</td>
                                    </tr>
                                ))}
                                {!loading && appointments.length === 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ color: 'var(--text-secondary)' }}>
                                            No appointments found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Recent Activity */}
                    <div className="card" style={{ height: 'fit-content' }}>
                        <h3 style={{ marginBottom: 'var(--spacing-5)' }}>Recent Activity</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                            {recentActivity.map((activity) => (
                                <div key={activity.id} style={{
                                    padding: 'var(--spacing-3)',
                                    background: 'var(--background)',
                                    borderRadius: 'var(--radius-lg)',
                                    borderLeft: `3px solid ${activity.type === 'success' ? 'var(--accent)' :
                                            activity.type === 'warning' ? 'var(--warning)' : 'var(--primary)'
                                        }`
                                }}>
                                    <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-1)' }}>
                                        {activity.message}
                                    </p>
                                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                        {formatRelative(activity.timestamp)}
                                    </span>
                                </div>
                            ))}
                            {!loading && recentActivity.length === 0 && (
                                <p style={{ color: 'var(--text-secondary)' }}>No recent activity.</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default Dashboard
