import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, ZoomControl, CircleMarker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

type LatLngTuple = [number, number]

function Recenter({ center }: { center: LatLngTuple }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom() || 15)
  }, [center, map])
  return null
}

export default function MapView() {
  const [center, setCenter] = useState<LatLngTuple>([37.7749, -122.4194])

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [])

  const osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  const attribution = '© OpenStreetMap contributors'

  return (
    <div className="h-screen w-screen">
      <MapContainer
        center={center}
        zoom={15}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer url={osmUrl} attribution={attribution} />
        <ZoomControl position="bottomright" />
        <Recenter center={center} />
        <CircleMarker
          center={center}
          radius={7}
          pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.7 }}
        />
      </MapContainer>
    </div>
  )
}
