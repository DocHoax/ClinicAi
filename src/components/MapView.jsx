import { useEffect, useRef, useState } from 'react'

/**
 * MapView Component
 * 
 * For production, add your Google Maps API key to index.html:
 * <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"></script>
 * 
 * For the hackathon demo, this shows a styled placeholder map with clinic markers.
 */
function MapView({ clinics, onClinicSelect, selectedClinic, userLocation }) {
    const mapRef = useRef(null)
    const [mapLoaded, setMapLoaded] = useState(false)
    const [map, setMap] = useState(null)
    const markersRef = useRef([])
    const userMarkerRef = useRef(null)

    // Check if Google Maps is available
    const isGoogleMapsAvailable = typeof window !== 'undefined' && window.google && window.google.maps

    // Default center (New York City)
    const defaultCenter = { lat: 40.7128, lng: -74.0060 }

    useEffect(() => {
        if (isGoogleMapsAvailable && mapRef.current && !map) {
            // Initialize Google Map
            const googleMap = new window.google.maps.Map(mapRef.current, {
                center: userLocation || defaultCenter,
                zoom: 13,
                styles: [
                    {
                        featureType: 'poi.medical',
                        elementType: 'geometry',
                        stylers: [{ color: '#e8f4f8' }]
                    },
                    {
                        featureType: 'water',
                        elementType: 'geometry',
                        stylers: [{ color: '#c9e9f6' }]
                    }
                ]
            })
            setMap(googleMap)
            setMapLoaded(true)
        }
    }, [isGoogleMapsAvailable, userLocation])

    useEffect(() => {
        if (!map || !isGoogleMapsAvailable) {
            return
        }

        if (userMarkerRef.current) {
            userMarkerRef.current.setMap(null)
            userMarkerRef.current = null
        }

        if (userLocation) {
            userMarkerRef.current = new window.google.maps.Marker({
                position: userLocation,
                map,
                title: 'Your location'
            })
        }
    }, [map, isGoogleMapsAvailable, userLocation])

    useEffect(() => {
        if (map && clinics && isGoogleMapsAvailable) {
            // Clear existing markers
            markersRef.current.forEach(marker => marker.setMap(null))
            markersRef.current = []

            const bounds = new window.google.maps.LatLngBounds()
            let hasBounds = false

            // Add markers for each clinic
            clinics.forEach(clinic => {
                if (clinic.coordinates) {
                    const marker = new window.google.maps.Marker({
                        position: clinic.coordinates,
                        map: map,
                        title: clinic.name,
                        icon: {
                            url: 'data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
                  <circle cx="12" cy="12" r="10" fill="#0077B6"/>
                  <path d="M12 7v10M7 12h10" stroke="white" stroke-width="2" stroke-linecap="round"/>
                </svg>
              `),
                            scaledSize: new window.google.maps.Size(32, 32)
                        }
                    })

                    marker.addListener('click', () => {
                        onClinicSelect && onClinicSelect(clinic)
                    })

                    markersRef.current.push(marker)

                    bounds.extend(clinic.coordinates)
                    hasBounds = true
                }
            })

            if (userLocation) {
                bounds.extend(userLocation)
                hasBounds = true
            }

            if (hasBounds) {
                map.fitBounds(bounds)
                const listener = window.google.maps.event.addListenerOnce(map, 'idle', () => {
                    if (map.getZoom() > 15) {
                        map.setZoom(15)
                    }
                })
                return () => {
                    window.google.maps.event.removeListener(listener)
                }
            }
        }
    }, [map, clinics, isGoogleMapsAvailable])

    useEffect(() => {
        if (!map || !isGoogleMapsAvailable || !selectedClinic?.coordinates) {
            return
        }

        map.panTo(selectedClinic.coordinates)
        if (map.getZoom() < 14) {
            map.setZoom(14)
        }
    }, [map, isGoogleMapsAvailable, selectedClinic])

    // Render placeholder map for demo (when Google Maps API is not available)
    if (!isGoogleMapsAvailable) {
        return (
            <div className="map-container">
                <div className="map-placeholder">
                    {/* SVG Map Illustration */}
                    <div className="map-grid">
                        {/* Streets */}
                        <div className="map-street horizontal" style={{ top: '20%' }}></div>
                        <div className="map-street horizontal" style={{ top: '50%' }}></div>
                        <div className="map-street horizontal" style={{ top: '80%' }}></div>
                        <div className="map-street vertical" style={{ left: '15%' }}></div>
                        <div className="map-street vertical" style={{ left: '45%' }}></div>
                        <div className="map-street vertical" style={{ left: '75%' }}></div>

                        {/* Clinic Markers */}
                        {clinics.slice(0, 6).map((clinic, index) => {
                            const positions = [
                                { top: '25%', left: '20%' },
                                { top: '35%', left: '55%' },
                                { top: '55%', left: '30%' },
                                { top: '45%', left: '70%' },
                                { top: '70%', left: '50%' },
                                { top: '60%', left: '85%' },
                            ]
                            const pos = positions[index] || { top: '50%', left: '50%' }

                            return (
                                <button
                                    key={clinic.id}
                                    className={`map-marker ${selectedClinic?.id === clinic.id ? 'selected' : ''}`}
                                    style={{ top: pos.top, left: pos.left }}
                                    onClick={() => onClinicSelect && onClinicSelect(clinic)}
                                    title={clinic.name}
                                >
                                    <svg viewBox="0 0 24 24" width="32" height="32">
                                        <circle cx="12" cy="12" r="10" fill="currentColor" />
                                        <path d="M12 7v10M7 12h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    <span className="marker-label">{index + 1}</span>
                                </button>
                            )
                        })}

                        {/* User Location */}
                        {userLocation && (
                            <div className="user-marker" style={{ top: '40%', left: '40%' }}>
                                <div className="user-marker-pulse"></div>
                                <div className="user-marker-dot"></div>
                            </div>
                        )}
                    </div>

                    {/* Map Controls */}
                    <div className="map-controls">
                        <button className="map-control-btn" title="Zoom in">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35M8 11h6M11 8v6" />
                            </svg>
                        </button>
                        <button className="map-control-btn" title="Zoom out">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35M8 11h6" />
                            </svg>
                        </button>
                    </div>

                    {/* Legend */}
                    <div className="map-legend">
                        <div className="legend-item">
                            <div className="legend-marker clinic"></div>
                            <span>ClinicAI Partner</span>
                        </div>
                        {userLocation && (
                            <div className="legend-item">
                                <div className="legend-marker user"></div>
                                <span>Your Location</span>
                            </div>
                        )}
                    </div>

                    {/* Demo Notice */}
                    <div className="map-demo-notice">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4M12 8h.01" />
                        </svg>
                        <span>Demo Map View • Add Google Maps API key for live map</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="map-container">
            <div ref={mapRef} className="google-map"></div>
            {!mapLoaded && (
                <div className="map-loading">
                    <div className="spinner"></div>
                    <p>Loading map...</p>
                </div>
            )}
        </div>
    )
}

export default MapView
