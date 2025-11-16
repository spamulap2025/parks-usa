import { useEffect, useState, useCallback } from 'react'
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps'
import { Locate, Navigation } from 'lucide-react'

type LatLng = { lat: number; lng: number }

type Park = {
  id: string
  name: string
  location: LatLng
  type: 'local' | 'state' | 'national'
  address: string
  distance: number
}

const NATIONAL_PARKS = [
  'Acadia National Park',
  'Arches National Park',
  'Badlands National Park',
  'Big Bend National Park',
  'Biscayne National Park',
  'Black Canyon of the Gunnison National Park',
  'Bryce Canyon National Park',
  'Canyonlands National Park',
  'Capitol Reef National Park',
  'Carlsbad Caverns National Park',
  'Channel Islands National Park',
  'Congaree National Park',
  'Crater Lake National Park',
  'Cuyahoga Valley National Park',
  'Death Valley National Park',
  'Denali National Park',
  'Dry Tortugas National Park',
  'Everglades National Park',
  'Gates of the Arctic National Park',
  'Gateway Arch National Park',
  'Glacier National Park',
  'Glacier Bay National Park',
  'Grand Canyon National Park',
  'Grand Teton National Park',
  'Great Sand Dunes National Park',
  'Great Smoky Mountains National Park',
  'Guadalupe Mountains National Park',
  'Haleakalā National Park',
  'Hawai\'i Volcanoes National Park',
  'Hot Springs National Park',
  'Indiana Dunes National Park',
  'Isle Royale National Park',
  'Joshua Tree National Park',
  'Katmai National Park',
  'Kenai Fjords National Park',
  'Kings Canyon National Park',
  'Kobuk Valley National Park',
  'Lake Clark National Park',
  'Lassen Volcanic National Park',
  'Mammoth Cave National Park',
  'Mesa Verde National Park',
  'Mount Rainier National Park',
  'North Cascades National Park',
  'Olympic National Park',
  'Petrified Forest National Park',
  'Pinnacles National Park',
  'Redwood National and State Parks',
  'Rocky Mountain National Park',
  'Saguaro National Park',
  'Sequoia National Park',
  'Shenandoah National Park',
  'Theodore Roosevelt National Park',
  'Virgin Islands National Park',
  'Voyageurs National Park',
  'White Sands National Park',
  'Wind Cave National Park',
  'Wrangell–St. Elias National Park',
  'Yellowstone National Park',
  'Yosemite National Park',
  'Zion National Park',
]

function isNationalPark(parkName: string): boolean {
  const normalizedName = parkName.toLowerCase().trim()
  return NATIONAL_PARKS.some(np => normalizedName.includes(np.toLowerCase()))
}

function Recenter({ center }: { center: LatLng }) {
  const map = useMap()
  useEffect(() => {
    if (map) {
      map.setCenter(center)
    }
  }, [center, map])
  return null
}

function BlueDotMarker({ position }: { position: LatLng }) {
  const map = useMap()
  
  if (!map) return null

  const blueDotIcon: google.maps.Symbol = {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 8,
    fillColor: '#1a73e8',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
  }

  return <Marker position={position} icon={blueDotIcon} clickable={false} />
}

function ParkMarker({ park, isSelected, onClick }: { park: Park; isSelected: boolean; onClick: () => void }) {
  const map = useMap()
  
  if (!map) return null

  const colors = {
    local: '#22c55e',
    state: '#eab308',
    national: '#ef4444',
  }

  const parkIcon: google.maps.Symbol = {
    path: google.maps.SymbolPath.CIRCLE,
    scale: isSelected ? 12 : 8,
    fillColor: colors[park.type],
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
  }

  return <Marker position={park.location} icon={parkIcon} onClick={onClick} />
}

function MapControls({ onLocate }: { onLocate: () => void }) {
  const map = useMap()

  if (!map) return null

  const gmBtn = "w-10 h-10 rounded-full bg-white ring-1 ring-black/10 shadow-[0_1px_2px_rgba(0,0,0,0.2)] hover:bg-gray-50 active:shadow-sm flex items-center justify-center transition"

  return (
    <div className="absolute right-4 bottom-4 z-[1000] flex flex-col items-center gap-2">
      <button
        aria-label="Zoom in"
        title="Zoom in"
        className={gmBtn}
        onClick={() => map.setZoom((map.getZoom() || 15) + 1)}
      >
        <span className="text-xl font-medium text-gray-700">+</span>
      </button>
      <button
        aria-label="Zoom out"
        title="Zoom out"
        className={gmBtn}
        onClick={() => map.setZoom((map.getZoom() || 15) - 1)}
      >
        <span className="text-xl font-medium text-gray-700">−</span>
      </button>
      <button
        aria-label="Your location"
        title="Your location"
        className={gmBtn}
        onClick={onLocate}
      >
        <Locate size={18} className="text-gray-700" />
      </button>
    </div>
  )
}

function ParksSearcher({ onParksFound, onError }: { onParksFound: (parks: Park[]) => void; onError: (error: string) => void }) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    let timeoutId: NodeJS.Timeout
    let searchId = 0
    let retryCount = 0

    const searchParks = () => {
      const mapCenter = map.getCenter()
      const bounds = map.getBounds()
      
      if (!mapCenter || !bounds) {
        if (retryCount < 5) {
          retryCount++
          setTimeout(searchParks, 250)
        }
        return
      }

      const currentSearchId = ++searchId

      const center = {
        lat: mapCenter.lat(),
        lng: mapCenter.lng(),
      }

      const ne = bounds.getNorthEast()
      const distanceToCorner = google.maps.geometry.spherical.computeDistanceBetween(
        mapCenter,
        ne
      )
      
      const radius = Math.min(50000, distanceToCorner)

      console.info('Parks search:', {
        center: center,
        zoom: map.getZoom(),
        bounds: bounds.toUrlValue(),
        radius: Math.round(radius)
      })

      const service = new google.maps.places.PlacesService(map)
      
      const request = {
        location: center,
        radius: radius,
        type: 'park',
        keyword: 'park',
      }

      service.nearbySearch(request, (results, status) => {
        if (currentSearchId !== searchId) return

        console.info('Places API response:', {
          status: status,
          resultsCount: results?.length || 0
        })

        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const allParks: Park[] = results
            .filter((place) => {
              const name = place.name || ''
              return isNationalPark(name)
            })
            .map((place) => {
            const name = place.name || 'Unknown Park'
            const type: 'local' | 'state' | 'national' = 'national'

            const location = {
              lat: place.geometry?.location?.lat() || 0,
              lng: place.geometry?.location?.lng() || 0,
            }

            const distance = google.maps.geometry.spherical.computeDistanceBetween(
              new google.maps.LatLng(center.lat, center.lng),
              new google.maps.LatLng(location.lat, location.lng)
            ) / 1609.34

            return {
              id: place.place_id || Math.random().toString(),
              name,
              location,
              type,
              address: place.vicinity || '',
              distance: Math.round(distance * 10) / 10,
            }
          })

          const visibleParks = allParks.filter((park) => {
            const parkLatLng = new google.maps.LatLng(park.location.lat, park.location.lng)
            return bounds.contains(parkLatLng)
          }).sort((a, b) => a.distance - b.distance)

          console.info('Parks filtered:', {
            total: allParks.length,
            visible: visibleParks.length
          })

          onParksFound(visibleParks)
          onError('')
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          onParksFound([])
          onError('No National Parks found in this area. Try zooming out or moving the map.')
        } else if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
          onParksFound([])
          onError('Places API access denied. Please check API key restrictions.')
        } else {
          onParksFound([])
          onError(`Places API error: ${status}`)
        }
      })
    }

    const handleIdle = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(searchParks, 500)
    }

    const listener = google.maps.event.addListener(map, 'idle', handleIdle)
    const onceListener = google.maps.event.addListenerOnce(map, 'idle', searchParks)
    
    return () => {
      google.maps.event.removeListener(listener)
      google.maps.event.removeListener(onceListener)
      clearTimeout(timeoutId)
    }
  }, [map, onParksFound, onError])

  return null
}

function ParksList({ parks, selectedParkId, onParkClick, error, onSearchArea }: { parks: Park[]; selectedParkId: string | null; onParkClick: (park: Park) => void; error: string; onSearchArea: () => void }) {
  const typeColors = {
    local: 'bg-green-100 text-green-800',
    state: 'bg-yellow-100 text-yellow-800',
    national: 'bg-red-100 text-red-800',
  }

  const typeLabels = {
    local: 'Local',
    state: 'State',
    national: 'National',
  }

  return (
    <div className="h-full overflow-y-auto bg-white border-l border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">National Parks</h2>
        <p className="text-sm text-gray-600">{parks.length} parks found</p>
        <p className="text-xs text-gray-500 mt-1">America the Beautiful pass accepted</p>
        <button
          onClick={onSearchArea}
          className="mt-2 w-full px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Search this area
        </button>
      </div>
      {error && (
        <div className="p-4 bg-yellow-50 border-b border-yellow-200">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}
      <div className="divide-y divide-gray-200">
        {parks.map((park) => (
          <div
            key={park.id}
            className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
              selectedParkId === park.id ? 'bg-blue-50' : ''
            }`}
            onClick={() => onParkClick(park)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{park.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{park.address}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeColors[park.type]}`}>
                    {typeLabels[park.type]}
                  </span>
                  <span className="text-sm text-gray-500">{park.distance} mi</span>
                </div>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${park.location.lat},${park.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
                onClick={(e) => e.stopPropagation()}
                title="Get directions"
              >
                <Navigation size={18} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ParksExplorer() {
  const [center, setCenter] = useState<LatLng>({ lat: 37.7749, lng: -122.4194 })
  const [parks, setParks] = useState<Park[]>([])
  const [selectedParkId, setSelectedParkId] = useState<string | null>(null)
  const [error, setError] = useState<string>('')
  const [searchTrigger, setSearchTrigger] = useState(0)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [])

  const handleLocationClick = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const handleParkClick = useCallback((park: Park) => {
    setSelectedParkId(park.id)
    setCenter(park.location)
  }, [])

  const handleMarkerClick = useCallback((park: Park) => {
    setSelectedParkId(park.id)
  }, [])

  const handleParksFound = useCallback((foundParks: Park[]) => {
    setParks(foundParks)
  }, [])

  const handleError = useCallback((errorMsg: string) => {
    setError(errorMsg)
  }, [])

  const handleSearchArea = useCallback(() => {
    setSearchTrigger(prev => prev + 1)
  }, [])

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string

  return (
    <div className="h-screen w-screen flex">
      <div className="w-[80%] relative">
        <APIProvider apiKey={apiKey} libraries={['places', 'geometry']}>
          <Map
            defaultCenter={center}
            defaultZoom={11}
            gestureHandling="greedy"
            disableDefaultUI
            mapTypeId="satellite"
            className="h-full w-full"
          >
            <BlueDotMarker position={center} />
            <Recenter center={center} />
            <MapControls onLocate={handleLocationClick} />
            <ParksSearcher onParksFound={handleParksFound} onError={handleError} key={searchTrigger} />
            {parks.map((park) => (
              <ParkMarker
                key={park.id}
                park={park}
                isSelected={selectedParkId === park.id}
                onClick={() => handleMarkerClick(park)}
              />
            ))}
          </Map>
        </APIProvider>
      </div>
      <div className="w-[20%]">
        <ParksList parks={parks} selectedParkId={selectedParkId} onParkClick={handleParkClick} error={error} onSearchArea={handleSearchArea} />
      </div>
    </div>
  )
}
