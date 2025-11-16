import { useEffect, useState } from 'react'
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps'
import { Locate } from 'lucide-react'

type LatLng = { lat: number; lng: number }

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

export default function MapView() {
  const [center, setCenter] = useState<LatLng>({ lat: 37.7749, lng: -122.4194 })

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

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string

  return (
    <div className="h-screen w-screen relative">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={15}
          gestureHandling="greedy"
          disableDefaultUI
          mapTypeId="satellite"
          className="h-full w-full"
        >
          <BlueDotMarker position={center} />
          <Recenter center={center} />
          <MapControls onLocate={handleLocationClick} />
        </Map>
      </APIProvider>
    </div>
  )
}
