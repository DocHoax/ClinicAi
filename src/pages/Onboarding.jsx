import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Onboarding() {
    const navigate = useNavigate()
    const [currentStep, setCurrentStep] = useState(1)
    const [formData, setFormData] = useState({
        // Step 1: Clinic Info
        clinicName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        // Step 2: Services
        services: [],
        // Step 3: Hours
        hours: {
            monday: { open: '09:00', close: '17:00', closed: false },
            tuesday: { open: '09:00', close: '17:00', closed: false },
            wednesday: { open: '09:00', close: '17:00', closed: false },
            thursday: { open: '09:00', close: '17:00', closed: false },
            friday: { open: '09:00', close: '17:00', closed: false },
            saturday: { open: '09:00', close: '13:00', closed: false },
            sunday: { open: '', close: '', closed: true },
        }
    })

    const steps = [
        { number: 1, label: 'Clinic Info' },
        { number: 2, label: 'Services' },
        { number: 3, label: 'Hours' },
        { number: 4, label: 'Review' },
    ]

    const availableServices = [
        'General Checkups',
        'Vaccinations',
        'Lab Tests',
        'Mental Health',
        'Pediatrics',
        'Women\'s Health',
        'Chronic Disease Management',
        'Urgent Care',
        'Physical Therapy',
        'Dermatology',
        'Cardiology',
        'Orthopedics',
    ]

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleServiceToggle = (service) => {
        setFormData(prev => ({
            ...prev,
            services: prev.services.includes(service)
                ? prev.services.filter(s => s !== service)
                : [...prev.services, service]
        }))
    }

    const handleHoursChange = (day, field, value) => {
        setFormData(prev => ({
            ...prev,
            hours: {
                ...prev.hours,
                [day]: { ...prev.hours[day], [field]: value }
            }
        }))
    }

    const handleNext = () => {
        if (currentStep < 4) setCurrentStep(currentStep + 1)
    }

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1)
    }

    const handleSubmit = () => {
        // In production, this would send to the n8n webhook
        console.log('Submitting clinic data:', formData)
        navigate('/onboarding/success')
    }

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div>
                        <h3 className="form-step-title">Tell us about your clinic</h3>
                        <div className="form-group">
                            <label className="form-label">Clinic Name *</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., Downtown Family Clinic"
                                value={formData.clinicName}
                                onChange={(e) => handleInputChange('clinicName', e.target.value)}
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Email *</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="clinic@example.com"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone *</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    placeholder="(555) 123-4567"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Street Address *</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="123 Health Street"
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">City *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Your City"
                                    value={formData.city}
                                    onChange={(e) => handleInputChange('city', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">State *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="State"
                                    value={formData.state}
                                    onChange={(e) => handleInputChange('state', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )

            case 2:
                return (
                    <div>
                        <h3 className="form-step-title">What services does your clinic offer?</h3>
                        <p className="text-secondary" style={{ marginBottom: 'var(--spacing-6)' }}>
                            Select all that apply. This helps the AI assistant provide accurate information.
                        </p>
                        <div className="services-grid">
                            {availableServices.map((service, index) => (
                                <label
                                    key={index}
                                    className={`service-option ${formData.services.includes(service) ? 'selected' : ''}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.services.includes(service)}
                                        onChange={() => handleServiceToggle(service)}
                                    />
                                    <span className="service-checkbox">
                                        {formData.services.includes(service) && (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </span>
                                    <span>{service}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )

            case 3:
                return (
                    <div>
                        <h3 className="form-step-title">Set your operating hours</h3>
                        <p className="text-secondary" style={{ marginBottom: 'var(--spacing-6)' }}>
                            Let patients know when you're available.
                        </p>
                        <div className="hours-grid">
                            {Object.entries(formData.hours).map(([day, data]) => (
                                <div key={day} className="hours-row">
                                    <span className="hours-day" style={{ textTransform: 'capitalize' }}>{day}</span>
                                    <input
                                        type="time"
                                        className="form-input"
                                        value={data.open}
                                        disabled={data.closed}
                                        onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                                        style={{ opacity: data.closed ? 0.5 : 1 }}
                                    />
                                    <input
                                        type="time"
                                        className="form-input"
                                        value={data.close}
                                        disabled={data.closed}
                                        onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                                        style={{ opacity: data.closed ? 0.5 : 1 }}
                                    />
                                    <label className="hours-toggle">
                                        <input
                                            type="checkbox"
                                            checked={data.closed}
                                            onChange={(e) => handleHoursChange(day, 'closed', e.target.checked)}
                                        />
                                        Closed
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )

            case 4:
                return (
                    <div>
                        <h3 className="form-step-title">Review your information</h3>
                        <p className="text-secondary" style={{ marginBottom: 'var(--spacing-6)' }}>
                            Please verify everything looks correct before submitting.
                        </p>

                        <div className="card" style={{ marginBottom: 'var(--spacing-5)' }}>
                            <h4 style={{ marginBottom: 'var(--spacing-3)', color: 'var(--primary)' }}>Clinic Information</h4>
                            <p><strong>Name:</strong> {formData.clinicName || '—'}</p>
                            <p><strong>Email:</strong> {formData.email || '—'}</p>
                            <p><strong>Phone:</strong> {formData.phone || '—'}</p>
                            <p><strong>Address:</strong> {formData.address}, {formData.city}, {formData.state}</p>
                        </div>

                        <div className="card" style={{ marginBottom: 'var(--spacing-5)' }}>
                            <h4 style={{ marginBottom: 'var(--spacing-3)', color: 'var(--primary)' }}>Services Offered</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
                                {formData.services.length > 0 ? formData.services.map((service, index) => (
                                    <span key={index} className="badge badge-primary">{service}</span>
                                )) : <span className="text-muted">No services selected</span>}
                            </div>
                        </div>

                        <div className="card">
                            <h4 style={{ marginBottom: 'var(--spacing-3)', color: 'var(--primary)' }}>Operating Hours</h4>
                            {Object.entries(formData.hours).map(([day, data]) => (
                                <p key={day} style={{ textTransform: 'capitalize' }}>
                                    <strong>{day}:</strong> {data.closed ? 'Closed' : `${data.open} - ${data.close}`}
                                </p>
                            ))}
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div className="onboarding">
            <div className="container onboarding-container">
                <div className="onboarding-header">
                    <h1 className="onboarding-title">Set Up Your Clinic</h1>
                    <p className="onboarding-subtitle">Get your AI assistant ready in just a few minutes</p>
                </div>

                {/* Progress Steps */}
                <div className="progress-steps">
                    {steps.map((step) => (
                        <div
                            key={step.number}
                            className={`progress-step ${currentStep === step.number ? 'active' : ''
                                } ${currentStep > step.number ? 'completed' : ''}`}
                        >
                            <div className="progress-step-number">
                                {currentStep > step.number ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : (
                                    step.number
                                )}
                            </div>
                            <span className="progress-step-label">{step.label}</span>
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <div className="form-card card">
                    {renderStep()}

                    <div className="form-actions">
                        {currentStep > 1 ? (
                            <button className="btn btn-secondary" onClick={handleBack}>
                                Back
                            </button>
                        ) : (
                            <div></div>
                        )}

                        {currentStep < 4 ? (
                            <button className="btn btn-primary" onClick={handleNext}>
                                Continue
                            </button>
                        ) : (
                            <button className="btn btn-primary" onClick={handleSubmit}>
                                Create My AI Assistant
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Onboarding
