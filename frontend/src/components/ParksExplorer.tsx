import { useEffect, useState, useCallback } from 'react'
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps'
import { Home, Navigation, Trees, Mountain, Landmark, Flag } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

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

function ParkMarker({ park, onClick }: { park: Park; onClick: () => void }) {
  const map = useMap()
  
  if (!map) return null

  return <Marker position={park.location} onClick={onClick} />
}

function LayerToggles({ 
  showLocal, 
  showState, 
  showNationalParks, 
  showNationalMonuments,
  onToggleLocal,
  onToggleState,
  onToggleNationalParks,
  onToggleNationalMonuments,
  localCount,
  stateCount,
  nationalParksCount,
  nationalMonumentsCount,
  onHomeClick,
  onZoomIn,
  onZoomOut
}: { 
  showLocal: boolean
  showState: boolean
  showNationalParks: boolean
  showNationalMonuments: boolean
  onToggleLocal: () => void
  onToggleState: () => void
  onToggleNationalParks: () => void
  onToggleNationalMonuments: () => void
  localCount: number
  stateCount: number
  nationalParksCount: number
  nationalMonumentsCount: number
  onHomeClick: () => void
  onZoomIn: () => void
  onZoomOut: () => void
}){
  const baseBtn = "w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm border border-black/10 shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center justify-center transition-all duration-200 cursor-pointer"

  const layers = [
    { 
      show: showLocal, 
      toggle: onToggleLocal, 
      iconColor: 'text-emerald-600', 
      ringColor: 'ring-emerald-200',
      label: 'Local Parks',
      icon: Trees,
      count: localCount
    },
    { 
      show: showState, 
      toggle: onToggleState, 
      iconColor: 'text-amber-600', 
      ringColor: 'ring-amber-200',
      label: 'State Parks',
      icon: Mountain,
      count: stateCount
    },
    { 
      show: showNationalParks, 
      toggle: onToggleNationalParks, 
      iconColor: 'text-rose-600', 
      ringColor: 'ring-rose-200',
      label: 'National Parks',
      icon: Landmark,
      count: nationalParksCount
    },
    { 
      show: showNationalMonuments, 
      toggle: onToggleNationalMonuments, 
      iconColor: 'text-violet-600', 
      ringColor: 'ring-violet-200',
      label: 'National Monuments',
      icon: Flag,
      count: nationalMonumentsCount
    },
  ]

  return (
    <TooltipProvider delayDuration={300}>
      <div className="absolute right-4 bottom-4 z-[1000] flex flex-col items-center gap-2.5">
        {layers.map((layer) => {
          const Icon = layer.icon
          return (
            <Tooltip key={layer.label}>
              <TooltipTrigger asChild>
                <button
                  aria-label={`${layer.show ? 'Hide' : 'Show'} ${layer.label}`}
                  aria-pressed={layer.show}
                  className={`${baseBtn} relative ${layer.show ? `ring-2 ${layer.ringColor}` : ''}`}
                  onClick={layer.toggle}
                >
                  <Icon 
                    size={18} 
                    className={layer.show ? layer.iconColor : 'text-zinc-600'}
                    strokeWidth={2.5}
                  />
                  {layer.count > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
                      {layer.count > 99 ? '99+' : layer.count}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-white text-zinc-900 border border-zinc-200 shadow-md">
                <p className="text-sm font-medium">{layer.label}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label="Home"
              className={baseBtn}
              onClick={onHomeClick}
            >
              <Home size={18} className="text-[#1a73e8]" strokeWidth={2.5} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-white text-zinc-900 border border-zinc-200 shadow-md">
            <p className="text-sm font-medium">Home</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label="Zoom in"
              className={baseBtn}
              onClick={onZoomIn}
            >
              <span className="text-lg leading-none text-zinc-700">+</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-white text-zinc-900 border border-zinc-200 shadow-md">
            <p className="text-sm font-medium">Zoom in</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label="Zoom out"
              className={baseBtn}
              onClick={onZoomOut}
            >
              <span className="text-lg leading-none text-zinc-700">−</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-white text-zinc-900 border border-zinc-200 shadow-md">
            <p className="text-sm font-medium">Zoom out</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
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

      const types: string[] = []
      if (showLocal) types.push('local')
      if (showState) types.push('state')
      if (showNationalParks) types.push('national_park')
      if (showNationalMonuments) types.push('national_monument')

      if (types.length === 0) {
        onParksFound([])
        onError('')
        return
      }

      try {
        if (abortController) {
          abortController.abort()
        }
        abortController = new AbortController()

        const ne = bounds.getNorthEast()
        const sw = bounds.getSouthWest()
        const bbox = `${sw.lng()},${sw.lat()},${ne.lng()},${ne.lat()}`
        
        const url = `${BACKEND_URL}/parks?bbox=${bbox}&types=${types.join(',')}&limit=1000`
        
        const response = await fetch(url, {
          signal: abortController.signal
        })
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        
        const data = await response.json()
        
        const parks: Park[] = data.map((park: any) => {
          const location = { lat: park.latitude, lng: park.longitude }
          const distance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(userLocation.lat, userLocation.lng),
            new google.maps.LatLng(location.lat, location.lng)
          ) / 1609.34

          return {
            id: park.id,
            name: park.name,
            location,
            type: park.type.replace('_', '-') as 'local' | 'state' | 'national-park' | 'national-monument',
            address: park.state_code || '',
            distance: Math.round(distance * 10) / 10,
            state: park.state_code
          }
        })

        const sortedParks = parks.sort((a, b) => a.distance - b.distance)

        console.info('Parks from API:', {
          totalParks: sortedParks.length,
          zoom: zoom
        })

        onParksFound(sortedParks)
        
        if (sortedParks.length === 0) {
          onError('No parks in this area. Pan or zoom to explore different regions.')
        } else {
          onError('')
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Parks fetch failed:', err)
          onError('Failed to load parks. Please try again.')
        }
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
    local: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    state: 'bg-amber-100 text-amber-800 border-amber-200',
    'national-park': 'bg-rose-100 text-rose-800 border-rose-200',
    'national-monument': 'bg-violet-100 text-violet-800 border-violet-200',
  }

  const typeLabels = {
    local: 'Local',
    state: 'State',
    'national-park': 'National Park',
    'national-monument': 'National Monument',
  }

  const selectedPark = parks.find(p => p.id === selectedParkId)

  return (
    <div className="h-full overflow-y-auto bg-white/90 backdrop-blur-md border-l border-black/10">
      {error && (
        <div className="mx-3 mt-3 p-3 bg-amber-100 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">{error}</p>
        </div>
      )}
      {selectedPark && (
        <div className="m-3 mb-4 rounded-xl bg-white/95 border border-black/10 shadow-xl p-4">
          <h2 className="text-lg font-bold text-zinc-900 mb-2">{selectedPark.name}</h2>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${typeColors[selectedPark.type]}`}>
                {typeLabels[selectedPark.type]}
              </span>
              <span className="text-sm text-zinc-700 font-semibold">{selectedPark.distance} mi away</span>
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPark.location.lat},${selectedPark.location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full hover:bg-zinc-100 text-sky-600 transition"
              aria-label="Directions"
              onClick={(e) => e.stopPropagation()}
            >
              <Navigation size={18} strokeWidth={2.5} />
            </a>
          </div>
        </div>
      )}
      <div className="p-2 space-y-2">
        {parks.map((park) => (
          <div
            key={park.id}
            className={`rounded-xl p-3 cursor-pointer transition-all duration-150 border shadow-sm hover:shadow ${
              selectedParkId === park.id 
                ? 'bg-white ring-2 ring-sky-400/50 border-sky-200' 
                : 'bg-white hover:bg-zinc-50 border-zinc-200'
            }`}
            onClick={() => onParkClick(park)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-zinc-900 text-[15px] truncate leading-tight">{park.name}</h3>
                <div className="flex items-center gap-2 mt-2.5">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium border ${typeColors[park.type]}`}>
                    {typeLabels[park.type]}
                  </span>
                  <span className="text-sm text-zinc-600 font-medium">{park.distance} mi</span>
                </div>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${park.location.lat},${park.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full hover:bg-zinc-100 text-sky-600 transition flex-shrink-0"
                aria-label="Directions"
                onClick={(e) => e.stopPropagation()}
              >
                <Navigation size={18} strokeWidth={2.5} />
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

  const localCount = allParks.filter(p => p.type === 'local').length
  const stateCount = allParks.filter(p => p.type === 'state').length
  const nationalParksCount = allParks.filter(p => p.type === 'national-park').length
  const nationalMonumentsCount = allParks.filter(p => p.type === 'national-monument').length

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
        setZoom(15)
      },
      (error) => {
        console.error('Error getting location:', error)
        if (userLocation) {
          setCenter(userLocation)
          setZoom(15)
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
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

  const handleZoomIn = () => {
    setZoom((prevZoom) => (prevZoom || 11) + 1)
  }

  const handleZoomOut = () => {
    setZoom((prevZoom) => Math.max((prevZoom || 11) - 1, 1))
  }

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
              localCount={localCount}
              stateCount={stateCount}
              nationalParksCount={nationalParksCount}
              nationalMonumentsCount={nationalMonumentsCount}
              onHomeClick={handleLocationClick}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
            />
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
