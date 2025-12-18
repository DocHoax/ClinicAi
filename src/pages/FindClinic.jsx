import { useEffect, useMemo, useRef, useState } from 'react'
import Footer from '../components/Footer'
import MapView from '../components/MapView'

const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-js'

function loadGoogleMapsScript(apiKey) {
    if (typeof window === 'undefined') {
        return Promise.resolve(false)
    }

    if (window.google && window.google.maps) {
        return Promise.resolve(true)
    }

    const trimmedKey = typeof apiKey === 'string' ? apiKey.trim() : ''
    if (!trimmedKey) {
        return Promise.resolve(false)
    }

    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID)
    if (existingScript) {
        if (existingScript.getAttribute('data-loaded') === 'true') {
            return Promise.resolve(true)
        }

        return new Promise((resolve, reject) => {
            const onLoad = () => {
                existingScript.setAttribute('data-loaded', 'true')
                resolve(true)
            }
            const onError = () => reject(new Error('Failed to load Google Maps'))

            existingScript.addEventListener('load', onLoad, { once: true })
            existingScript.addEventListener('error', onError, { once: true })

            // If the script already loaded but events won't fire, poll briefly.
            const start = Date.now()
            const interval = window.setInterval(() => {
                if (window.google && window.google.maps) {
                    window.clearInterval(interval)
                    existingScript.setAttribute('data-loaded', 'true')
                    resolve(true)
                    return
                }

                if (Date.now() - start > 15000) {
                    window.clearInterval(interval)
                    reject(new Error('Timed out loading Google Maps'))
                }
            }, 200)
        })
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.id = GOOGLE_MAPS_SCRIPT_ID
        script.async = true
        script.defer = true
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(trimmedKey)}&libraries=places`
        script.onload = () => {
            script.setAttribute('data-loaded', 'true')
            resolve(true)
        }
        script.onerror = () => reject(new Error('Failed to load Google Maps'))
        document.head.appendChild(script)
    })
}

function FindClinic() {
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState('map') // 'list' or 'map'
    const [selectedClinic, setSelectedClinic] = useState(null)
    const [userLocation, setUserLocation] = useState(null)
    const [locationLoading, setLocationLoading] = useState(false)
    const [locationError, setLocationError] = useState(null)

    const [clinics, setClinics] = useState([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchError, setSearchError] = useState(null)
    const lastSearchIdRef = useRef(0)
    const didRunInitialSearchRef = useRef(false)
    const placesContainerRef = useRef(null)

    const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    const [mapsError, setMapsError] = useState(null)
    const [mapsLoading, setMapsLoading] = useState(false)
    const [mapsReady, setMapsReady] = useState(false)

    const defaultCenter = useMemo(() => ({ lat: 40.7128, lng: -74.0060 }), [])

    useEffect(() => {
        let cancelled = false

        setMapsError(null)
        setMapsLoading(true)
        setMapsReady(false)

        loadGoogleMapsScript(googleMapsApiKey)
            .then((loaded) => {
                if (!cancelled) {
                    setMapsReady(Boolean(loaded))
                    setMapsLoading(false)
                }
            })
            .catch((error) => {
                if (!cancelled) {
                    setMapsError(error?.message || 'Failed to load Google Maps')
                    setMapsLoading(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [googleMapsApiKey])

    const getPlacesService = () => {
        if (typeof window === 'undefined' || !window.google?.maps?.places) {
            return null
        }

        if (placesContainerRef.current && document.body.contains(placesContainerRef.current)) {
            return new window.google.maps.places.PlacesService(placesContainerRef.current)
        }

        const container = document.createElement('div')
        container.style.display = 'none'
        document.body.appendChild(container)
        placesContainerRef.current = container

        return new window.google.maps.places.PlacesService(container)
    }

    const toRadians = (deg) => (deg * Math.PI) / 180

    const haversineMiles = (a, b) => {
        const R = 3958.8
        const dLat = toRadians(b.lat - a.lat)
        const dLng = toRadians(b.lng - a.lng)
        const lat1 = toRadians(a.lat)
        const lat2 = toRadians(b.lat)

        const sinDLat = Math.sin(dLat / 2)
        const sinDLng = Math.sin(dLng / 2)

        const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng
        return 2 * R * Math.asin(Math.sqrt(h))
    }

    const formatDistance = (miles) => {
        if (!Number.isFinite(miles)) return ''
        if (miles < 0.1) return '< 0.1 mi'
        return `${miles.toFixed(miles < 10 ? 1 : 0)} mi`
    }

    const mapPlaceToClinic = (place, center) => {
        const location = place?.geometry?.location
        const coordinates = location
            ? { lat: location.lat(), lng: location.lng() }
            : null
        const distanceMiles = center && coordinates ? haversineMiles(center, coordinates) : null

        return {
            id: place.place_id || `${place.name}-${place.formatted_address}`,
            placeId: place.place_id,
            name: place.name || 'Clinic',
            address: place.formatted_address || place.vicinity || '',
            rating: typeof place.rating === 'number' ? place.rating : null,
            reviews: typeof place.user_ratings_total === 'number' ? place.user_ratings_total : null,
            distance: distanceMiles != null ? formatDistance(distanceMiles) : '',
            coordinates,
            mapsUrl: place.place_id
                ? `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(place.place_id)}`
                : null
        }
    }

    const performSearch = (query) => {
        const trimmedQuery = typeof query === 'string' ? query.trim() : ''
        const effectiveQuery = trimmedQuery || 'clinic'
        const center = userLocation || defaultCenter

        if (!mapsReady) {
            return
        }

        const service = getPlacesService()
        if (!service) {
            setSearchError('Google Places is not available. Ensure the Maps API loads with the Places library enabled.')
            return
        }

        setSearchError(null)
        setSearchLoading(true)
        const searchId = ++lastSearchIdRef.current

        const request = {
            query: effectiveQuery,
            location: new window.google.maps.LatLng(center.lat, center.lng),
            radius: 15000
        }

        service.textSearch(request, (results, status) => {
            if (searchId !== lastSearchIdRef.current) {
                return
            }

            setSearchLoading(false)

            const ok = status === window.google.maps.places.PlacesServiceStatus.OK
            const zero = status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS

            if (zero) {
                setClinics([])
                return
            }

            if (!ok) {
                setSearchError(`Clinic search failed: ${status}`)
                setClinics([])
                return
            }

            const normalized = (results || [])
                .map((place) => mapPlaceToClinic(place, center))
                .filter((clinic) => clinic.coordinates)
                .slice(0, 20)

            setClinics(normalized)
            setSelectedClinic((prev) => {
                if (!prev) return null
                return normalized.find((c) => c.id === prev.id) || null
            })
        })
    }

    useEffect(() => {
        if (!mapsReady || didRunInitialSearchRef.current) {
            return
        }

        didRunInitialSearchRef.current = true
        performSearch('clinic')
    }, [mapsReady])

    useEffect(() => {
        return () => {
            if (placesContainerRef.current && document.body.contains(placesContainerRef.current)) {
                document.body.removeChild(placesContainerRef.current)
            }
        }
    }, [])

    const filteredClinics = clinics

    const handleUseMyLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser')
            return
        }

        setLocationLoading(true)
        setLocationError(null)

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                })
                setLocationLoading(false)
                // In production, you would recalculate distances and sort by proximity
            },
            (error) => {
                setLocationLoading(false)
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setLocationError('Location access denied. Please enable location permissions.')
                        break
                    case error.POSITION_UNAVAILABLE:
                        setLocationError('Location information unavailable.')
                        break
                    case error.TIMEOUT:
                        setLocationError('Location request timed out.')
                        break
                    default:
                        setLocationError('An error occurred getting your location.')
                }
            }
        )
    }

    const renderStars = (rating) => {
        if (typeof rating !== 'number') {
            return null
        }
        const stars = []
        const fullStars = Math.floor(rating)
        const hasHalfStar = rating % 1 >= 0.5

        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <svg key={i} viewBox="0 0 24 24" fill="var(--warning)" width="16" height="16">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            )
        }
        if (hasHalfStar) {
            stars.push(
                <svg key="half" viewBox="0 0 24 24" width="16" height="16">
                    <defs>
                        <linearGradient id="halfGrad">
                            <stop offset="50%" stopColor="var(--warning)" />
                            <stop offset="50%" stopColor="var(--border)" />
                        </linearGradient>
                    </defs>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="url(#halfGrad)" />
                </svg>
            )
        }
        for (let i = stars.length; i < 5; i++) {
            stars.push(
                <svg key={i} viewBox="0 0 24 24" fill="var(--border)" width="16" height="16">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            )
        }
        return stars
    }

    const ClinicCard = ({ clinic, compact = false }) => (
        <div
            className={`clinic-card card ${selectedClinic?.id === clinic.id ? 'selected' : ''} ${compact ? 'compact' : ''}`}
            onClick={() => setSelectedClinic(clinic)}
        >
            <div className="clinic-card-header">
                <div className="clinic-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
                        <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 13v.01M9 17v.01" />
                    </svg>
                </div>
                <div className="clinic-info">
                    <h3>{clinic.name}</h3>
                    <div className="clinic-rating">
                        {typeof clinic.rating === 'number' ? (
                            <>
                                <div className="stars">{renderStars(clinic.rating)}</div>
                                <span>{clinic.rating}</span>
                                {typeof clinic.reviews === 'number' && (
                                    <span className="text-muted">({clinic.reviews} reviews)</span>
                                )}
                            </>
                        ) : (
                            <span className="text-muted">No rating yet</span>
                        )}
                    </div>
                </div>
            </div>

            {!compact && (
                <>
                    <div className="clinic-details">
                        <div className="detail-row">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>{clinic.address}</span>
                            {clinic.distance ? <span className="distance">{clinic.distance}</span> : null}
                        </div>
                    </div>
                </>
            )}
        </div>
    )

    return (
        <>
            <div className="find-clinic-page">
                <div className="container">
                    {/* Header */}
                    <div className="find-clinic-header">
                        <h1>Find a Clinic Near You</h1>
                        <p>Search from our network of trusted healthcare providers powered by ClinicAI</p>
                    </div>

                    {/* Search Bar */}
                    <div className="search-section">
                        <div className="search-bar">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search clinics (e.g., urgent care, dentist, pediatrics)…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        performSearch(searchQuery)
                                    }
                                }}
                                className="search-input"
                            />
                            <button
                                className="location-btn"
                                onClick={handleUseMyLocation}
                                disabled={locationLoading}
                                title="Use my location"
                            >
                                {locationLoading ? (
                                    <div className="spinner-small"></div>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                                    </svg>
                                )}
                            </button>

                            <button
                                className="btn btn-primary"
                                onClick={() => performSearch(searchQuery)}
                                disabled={!mapsReady || searchLoading}
                                title={!mapsReady ? 'Google Maps must load first' : 'Search'}
                            >
                                Search
                            </button>
                        </div>

                        {locationError && (
                            <div className="location-error">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 8v4M12 16h.01" />
                                </svg>
                                {locationError}
                            </div>
                        )}

                        {userLocation && (
                            <div className="location-success">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                                Location detected! Showing nearest clinics.
                            </div>
                        )}

                        {searchError && (
                            <div className="location-error">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 8v4M12 16h.01" />
                                </svg>
                                {searchError}
                            </div>
                        )}
                    </div>

                    {/* View Toggle & Results Count */}
                    <div className="results-header">
                        <div className="results-info">
                            <p>
                                Showing <strong>{filteredClinics.length}</strong> clinics
                                {searchLoading ? ' (searching...)' : ''}
                            </p>
                        </div>

                        <div className="view-toggle">
                            <button
                                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                    <line x1="8" y1="6" x2="21" y2="6" />
                                    <line x1="8" y1="12" x2="21" y2="12" />
                                    <line x1="8" y1="18" x2="21" y2="18" />
                                    <line x1="3" y1="6" x2="3.01" y2="6" />
                                    <line x1="3" y1="12" x2="3.01" y2="12" />
                                    <line x1="3" y1="18" x2="3.01" y2="18" />
                                </svg>
                                List
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'map' ? 'active' : ''}`}
                                onClick={() => setViewMode('map')}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                                    <line x1="8" y1="2" x2="8" y2="18" />
                                    <line x1="16" y1="6" x2="16" y2="22" />
                                </svg>
                                Map
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    {viewMode === 'list' ? (
                        /* List View */
                        <div className="clinic-grid">
                            {filteredClinics.map(clinic => (
                                <ClinicCard key={clinic.id} clinic={clinic} />
                            ))}
                        </div>
                    ) : (
                        /* Map View */
                        <div className="map-layout">
                            <div className="map-sidebar">
                                <h3>Nearby Clinics</h3>
                                <div className="map-clinic-list">
                                    {filteredClinics.map((clinic, index) => (
                                        <div
                                            key={clinic.id}
                                            className={`map-clinic-item ${selectedClinic?.id === clinic.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedClinic(clinic)}
                                        >
                                            <div className="map-clinic-number">{index + 1}</div>
                                            <div className="map-clinic-info">
                                                <h4>{clinic.name}</h4>
                                                <p>{clinic.address}</p>
                                                <div className="map-clinic-meta">
                                                                    {clinic.distance ? <span className="distance">{clinic.distance}</span> : null}
                                                                    {typeof clinic.rating === 'number' ? (
                                                                        <span className="rating">⭐ {clinic.rating}</span>
                                                                    ) : (
                                                                        <span className="rating">No rating</span>
                                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="map-main">
                                {!googleMapsApiKey && (
                                    <div className="location-error">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 8v4M12 16h.01" />
                                        </svg>
                                        Google Maps API key missing. Set VITE_GOOGLE_MAPS_API_KEY to enable the live map.
                                    </div>
                                )}

                                {mapsError && (
                                    <div className="location-error">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 8v4M12 16h.01" />
                                        </svg>
                                        {mapsError}
                                    </div>
                                )}

                                {googleMapsApiKey && mapsLoading && (
                                    <div className="location-success">
                                        <div className="spinner-small"></div>
                                        Loading Google Maps…
                                    </div>
                                )}

                                {googleMapsApiKey && !mapsLoading && mapsReady === false && !mapsError && (
                                    <div className="location-error">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 8v4M12 16h.01" />
                                        </svg>
                                        Google Maps did not initialize. Check API key restrictions and billing.
                                    </div>
                                )}

                                <MapView
                                    clinics={filteredClinics}
                                    selectedClinic={selectedClinic}
                                    onClinicSelect={setSelectedClinic}
                                    userLocation={userLocation}
                                />
                                {selectedClinic && (
                                    <div className="map-popup">
                                        <button className="popup-close" onClick={() => setSelectedClinic(null)}>×</button>
                                        <ClinicCard clinic={selectedClinic} compact={false} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {filteredClinics.length === 0 && (
                        <div className="no-results">
                            <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" width="64" height="64">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                                <path d="M8 8l6 6M14 8l-6 6" />
                            </svg>
                            <h3>No clinics found</h3>
                            <p>Try a different search (example: urgent care, pediatrics, dentist)</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    setSearchQuery('')
                                    performSearch('clinic')
                                }}
                            >
                                Show Clinics
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    )
}

export default FindClinic
