import { useEffect, useState, useCallback } from 'react'
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps'
import { Locate, Navigation } from 'lucide-react'
import federalSitesData from '../data/federal_sites.json'

type LatLng = { lat: number; lng: number }

type Park = {
  id: string
  name: string
  location: LatLng
  type: 'local' | 'state' | 'national-park' | 'national-monument'
  address: string
  distance: number
  state?: string
}


function Recenter({ center, zoom }: { center: LatLng; zoom?: number }) {
  const map = useMap()
  useEffect(() => {
    if (map) {
      map.setCenter(center)
      if (zoom !== undefined) {
        map.setZoom(zoom)
      }
    }
  }, [center, zoom, map])
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
    'national-park': '#ef4444',
    'national-monument': '#a855f7',
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

function LayerToggles({ 
  showLocal, 
  showState, 
  showNationalParks, 
  showNationalMonuments,
  onToggleLocal,
  onToggleState,
  onToggleNationalParks,
  onToggleNationalMonuments
}: { 
  showLocal: boolean
  showState: boolean
  showNationalParks: boolean
  showNationalMonuments: boolean
  onToggleLocal: () => void
  onToggleState: () => void
  onToggleNationalParks: () => void
  onToggleNationalMonuments: () => void
}) {
  const gmBtn = "w-10 h-10 rounded-full bg-white ring-1 ring-black/10 shadow-[0_1px_2px_rgba(0,0,0,0.2)] hover:bg-gray-50 active:shadow-sm flex items-center justify-center transition cursor-pointer"

  const layers = [
    { show: showLocal, toggle: onToggleLocal, color: '#22c55e', label: 'Local Parks', letter: 'L' },
    { show: showState, toggle: onToggleState, color: '#eab308', label: 'State Parks', letter: 'S' },
    { show: showNationalParks, toggle: onToggleNationalParks, color: '#ef4444', label: 'National Parks', letter: 'NP' },
    { show: showNationalMonuments, toggle: onToggleNationalMonuments, color: '#a855f7', label: 'National Monuments', letter: 'NM' },
  ]

  return (
    <div className="absolute right-4 bottom-[180px] z-[1000] flex flex-col items-center gap-2">
      {layers.map((layer) => (
        <button
          key={layer.label}
          aria-label={`${layer.show ? 'Hide' : 'Show'} ${layer.label}`}
          aria-pressed={layer.show}
          title={`${layer.show ? 'Hide' : 'Show'} ${layer.label}`}
          className={gmBtn}
          onClick={layer.toggle}
          style={{
            backgroundColor: layer.show ? layer.color : '#ffffff',
            opacity: layer.show ? 1 : 0.5
          }}
        >
          <span className={`text-xs font-bold ${layer.show ? 'text-white' : 'text-gray-700'}`}>
            {layer.letter}
          </span>
        </button>
      ))}
    </div>
  )
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

function ParksSearcher({ 
  onParksFound, 
  onError,
  showLocal,
  showState,
  showNationalParks,
  showNationalMonuments,
  userLocation
}: { 
  onParksFound: (parks: Park[]) => void
  onError: (error: string) => void
  showLocal: boolean
  showState: boolean
  showNationalParks: boolean
  showNationalMonuments: boolean
  userLocation: LatLng
}){
  const map = useMap()

  useEffect(() => {
    if (!map) return

    let timeoutId: NodeJS.Timeout
    let retryCount = 0
    let abortController: AbortController | null = null

    const searchParks = async () => {
      const mapCenter = map.getCenter()
      const bounds = map.getBounds()
      const zoom = map.getZoom() || 11
      
      if (!mapCenter || !bounds) {
        if (retryCount < 5) {
          retryCount++
          setTimeout(searchParks, 250)
        }
        return
      }

      const center = {
        lat: mapCenter.lat(),
        lng: mapCenter.lng(),
      }

      console.info('Viewport search:', {
        center: center,
        zoom: zoom,
        bounds: bounds.toUrlValue()
      })

      const allSites: Park[] = []

      if (showNationalParks) {
        federalSitesData.nationalParks.forEach((park: any) => {
          const location = { lat: park.lat, lng: park.lng }
          const distance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(userLocation.lat, userLocation.lng),
            new google.maps.LatLng(location.lat, location.lng)
          ) / 1609.34

          allSites.push({
            id: `np-${park.name}`,
            name: park.name,
            location,
            type: 'national-park',
            address: park.state || '',
            distance: Math.round(distance * 10) / 10,
            state: park.state
          })
        })
      }

      if (showNationalMonuments) {
        federalSitesData.nationalMonuments.forEach((monument: any) => {
          const location = { lat: monument.lat, lng: monument.lng }
          const distance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(userLocation.lat, userLocation.lng),
            new google.maps.LatLng(location.lat, location.lng)
          ) / 1609.34

          allSites.push({
            id: `nm-${monument.name}`,
            name: monument.name,
            location,
            type: 'national-monument',
            address: monument.state || '',
            distance: Math.round(distance * 10) / 10,
            state: monument.state
          })
        })
      }

      if (showState && zoom >= 9) {
        try {
          const ne = bounds.getNorthEast()
          const sw = bounds.getSouthWest()
          const bbox = `${sw.lat()},${sw.lng()},${ne.lat()},${ne.lng()}`
          
          const overpassQuery = `[out:json][timeout:15];(node["leisure"="park"]["name"~"State Park",i](${bbox});way["leisure"="park"]["name"~"State Park",i](${bbox}););out center 100;`
          
          if (abortController) {
            abortController.abort()
          }
          abortController = new AbortController()
          
          const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: overpassQuery,
            signal: abortController.signal
          })
          
          if (response.ok) {
            const data = await response.json()
            data.elements?.forEach((element: any) => {
              const lat = element.lat || element.center?.lat
              const lon = element.lon || element.center?.lon
              if (lat && lon) {
                const location = { lat, lng: lon }
                const distance = google.maps.geometry.spherical.computeDistanceBetween(
                  new google.maps.LatLng(userLocation.lat, userLocation.lng),
                  new google.maps.LatLng(lat, lon)
                ) / 1609.34

                allSites.push({
                  id: `sp-${element.id}`,
                  name: element.tags?.name || 'State Park',
                  location,
                  type: 'state',
                  address: '',
                  distance: Math.round(distance * 10) / 10,
                  state: element.tags?.['addr:state']
                })
              }
            })
          }
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            console.warn('State parks fetch failed:', err)
          }
        }
      }

      if (showLocal && zoom >= 11) {
        try {
          const ne = bounds.getNorthEast()
          const sw = bounds.getSouthWest()
          const bbox = `${sw.lat()},${sw.lng()},${ne.lat()},${ne.lng()}`
          
          const overpassQuery = `[out:json][timeout:15];(node["leisure"="park"](${bbox});way["leisure"="park"](${bbox}););out center 100;`
          
          if (abortController) {
            abortController.abort()
          }
          abortController = new AbortController()
          
          const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: overpassQuery,
            signal: abortController.signal
          })
          
          if (response.ok) {
            const data = await response.json()
            data.elements?.forEach((element: any) => {
              const name = element.tags?.name
              if (!name || name.toLowerCase().includes('state park')) return
              
              const lat = element.lat || element.center?.lat
              const lon = element.lon || element.center?.lon
              if (lat && lon) {
                const location = { lat, lng: lon }
                const distance = google.maps.geometry.spherical.computeDistanceBetween(
                  new google.maps.LatLng(userLocation.lat, userLocation.lng),
                  new google.maps.LatLng(lat, lon)
                ) / 1609.34

                allSites.push({
                  id: `lp-${element.id}`,
                  name: name,
                  location,
                  type: 'local',
                  address: '',
                  distance: Math.round(distance * 10) / 10,
                  state: element.tags?.['addr:state']
                })
              }
            })
          }
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            console.warn('Local parks fetch failed:', err)
          }
        }
      }

      const visibleSites = allSites.filter((site) => {
        const siteLatLng = new google.maps.LatLng(site.location.lat, site.location.lng)
        return bounds.contains(siteLatLng)
      }).sort((a, b) => a.distance - b.distance)

      console.info('Sites filtered:', {
        totalSites: allSites.length,
        visibleInViewport: visibleSites.length,
        zoom: zoom
      })

      onParksFound(visibleSites)
      
      if (visibleSites.length === 0) {
        onError('No parks in this area. Pan or zoom to explore different regions.')
      } else {
        onError('')
      }
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
      if (abortController) {
        abortController.abort()
      }
    }
  }, [map, onParksFound, onError, showLocal, showState, showNationalParks, showNationalMonuments, userLocation])

  return null
}

function ParksList({ parks, selectedParkId, onParkClick, error }: { parks: Park[]; selectedParkId: string | null; onParkClick: (park: Park) => void; error: string }) {
  const typeColors = {
    local: 'bg-green-100 text-green-800',
    state: 'bg-yellow-100 text-yellow-800',
    'national-park': 'bg-red-100 text-red-800',
    'national-monument': 'bg-purple-100 text-purple-800',
  }

  const typeLabels = {
    local: 'Local',
    state: 'State',
    'national-park': 'National Park',
    'national-monument': 'National Monument',
  }

  return (
    <div className="h-full overflow-y-auto bg-white border-l border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-600">{parks.length} sites found</p>
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
                {park.state && <p className="text-sm text-gray-600 mt-1">{park.state}</p>}
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
  const [userLocation, setUserLocation] = useState<LatLng>({ lat: 37.7749, lng: -122.4194 })
  const [zoom, setZoom] = useState<number | undefined>(undefined)
  const [allParks, setAllParks] = useState<Park[]>([])
  const [selectedParkId, setSelectedParkId] = useState<string | null>(null)
  const [error, setError] = useState<string>('')
  const [showLocal, setShowLocal] = useState(true)
  const [showState, setShowState] = useState(true)
  const [showNationalParks, setShowNationalParks] = useState(true)
  const [showNationalMonuments, setShowNationalMonuments] = useState(true)
  const [parkingLotCache, setParkingLotCache] = useState<Record<string, LatLng>>({})

  const parks = allParks.filter(park => {
    if (park.type === 'local' && !showLocal) return false
    if (park.type === 'state' && !showState) return false
    if (park.type === 'national-park' && !showNationalParks) return false
    if (park.type === 'national-monument' && !showNationalMonuments) return false
    return true
  })

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCenter(location)
        setUserLocation(location)
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [])

  const handleLocationClick = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCenter(location)
        setUserLocation(location)
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const handleParkClick = useCallback(async (park: Park) => {
    setSelectedParkId(park.id)
    
    if (parkingLotCache[park.id]) {
      setCenter(parkingLotCache[park.id])
      setZoom(17)
      return
    }
    
    try {
      const service = new google.maps.places.PlacesService(document.createElement('div'))
      
      const request: google.maps.places.TextSearchRequest = {
        query: `${park.name} parking`,
        location: new google.maps.LatLng(park.location.lat, park.location.lng),
        radius: 2000, // 2km radius
      }
      
      service.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          let closestParking = results[0]
          let minDistance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(park.location.lat, park.location.lng),
            results[0].geometry!.location!
          )
          
          for (let i = 1; i < Math.min(results.length, 5); i++) {
            const distance = google.maps.geometry.spherical.computeDistanceBetween(
              new google.maps.LatLng(park.location.lat, park.location.lng),
              results[i].geometry!.location!
            )
            if (distance < minDistance) {
              minDistance = distance
              closestParking = results[i]
            }
          }
          
          const parkingLocation = {
            lat: closestParking.geometry!.location!.lat(),
            lng: closestParking.geometry!.location!.lng()
          }
          
          setParkingLotCache(prev => ({ ...prev, [park.id]: parkingLocation }))
          setCenter(parkingLocation)
          setZoom(17)
        } else {
          setCenter(park.location)
          setZoom(15)
        }
      })
    } catch (err) {
      console.warn('Failed to find parking lot:', err)
      setCenter(park.location)
      setZoom(15)
    }
  }, [parkingLotCache])

  const handleMarkerClick = useCallback((park: Park) => {
    setSelectedParkId(park.id)
  }, [])

  const handleParksFound = useCallback((foundParks: Park[]) => {
    setAllParks(foundParks)
  }, [])

  const handleError = useCallback((errorMsg: string) => {
    setError(errorMsg)
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
            <BlueDotMarker position={userLocation} />
            <Recenter center={center} zoom={zoom} />
            <LayerToggles
              showLocal={showLocal}
              showState={showState}
              showNationalParks={showNationalParks}
              showNationalMonuments={showNationalMonuments}
              onToggleLocal={() => setShowLocal(!showLocal)}
              onToggleState={() => setShowState(!showState)}
              onToggleNationalParks={() => setShowNationalParks(!showNationalParks)}
              onToggleNationalMonuments={() => setShowNationalMonuments(!showNationalMonuments)}
            />
            <MapControls onLocate={handleLocationClick} />
            <ParksSearcher 
              onParksFound={handleParksFound} 
              onError={handleError}
              showLocal={showLocal}
              showState={showState}
              showNationalParks={showNationalParks}
              showNationalMonuments={showNationalMonuments}
              userLocation={userLocation}
            />
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
        <ParksList parks={parks} selectedParkId={selectedParkId} onParkClick={handleParkClick} error={error} />
      </div>
    </div>
  )
}
