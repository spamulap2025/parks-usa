import { useEffect, useState } from 'react'
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps'

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

function ZoomControls() {
  const map = useMap()

  if (!map) return null

  return (
    <div className="absolute right-4 bottom-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={() => map.setZoom((map.getZoom() || 15) + 1)}
        className="w-10 h-10 bg-white rounded shadow-md hover:bg-gray-100 flex items-center justify-center text-xl font-semibold"
      >
        +
      </button>
      <button
        onClick={() => map.setZoom((map.getZoom() || 15) - 1)}
        className="w-10 h-10 bg-white rounded shadow-md hover:bg-gray-100 flex items-center justify-center text-xl font-semibold"
      >
        −
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

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string

  return (
    <div className="h-screen w-screen relative">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={15}
          gestureHandling="greedy"
          disableDefaultUI
          className="h-full w-full"
        >
          <Marker position={center} />
          <Recenter center={center} />
          <ZoomControls />
        </Map>
      </APIProvider>
    </div>
  )
}
