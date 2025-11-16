import { useEffect, useState, useCallback } from 'react'
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps'
import { Locate, Navigation } from 'lucide-react'

type LatLng = { lat: number; lng: number }

type Park = {
  id: string
  name: string
  location: LatLng
  type: 'local' | 'state' | 'national-park' | 'national-monument'
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

const NATIONAL_MONUMENTS = [
  'Admiralty Island National Monument',
  'African Burial Ground National Monument',
  'Agate Fossil Beds National Monument',
  'Agua Fria National Monument',
  'Aleutian Islands World War II National Monument',
  'Alibates Flint Quarries National Monument',
  'Aniakchak National Monument',
  'Avi Kwa Ame National Monument',
  'Aztec Ruins National Monument',
  'Baaj Nwaavjo I\'tah Kukveni – Ancestral Footprints of the Grand Canyon National Monument',
  'Bandelier National Monument',
  'Basin and Range National Monument',
  'Bears Ears National Monument',
  'Belmont‑Paul Women\'s Equality National Monument',
  'Berryessa Snow Mountain National Monument',
  'Birmingham Civil Rights National Monument',
  'Booker T. Washington National Monument',
  'Browns Canyon National Monument',
  'Buck Island Reef National Monument',
  'Cabrillo National Monument',
  'California Coastal National Monument',
  'Camp Hale — Continental Divide National Monument',
  'Camp Nelson National Monument',
  'Canyon de Chelly National Monument',
  'Canyons of the Ancients National Monument',
  'Cape Krusenstern National Monument',
  'Capulin Volcano National Monument',
  'Carlisle Federal Indian Boarding School National Monument',
  'Carrizo Plain National Monument',
  'Casa Grande Ruins National Monument',
  'Castillo de San Marcos National Monument',
  'Castle Clinton National Monument',
  'Castle Mountains National Monument',
  'Castner Range National Monument',
  'Cedar Breaks National Monument',
  'César E. Chávez National Monument',
  'Charles Young Buffalo Soldiers National Monument',
  'Chimney Rock National Monument',
  'Chiricahua National Monument',
  'Chuckwalla National Monument',
  'Colorado National Monument',
  'Craters of the Moon National Monument',
  'Devils Postpile National Monument',
  'Devils Tower National Monument',
  'Dinosaur National Monument',
  'Effigy Mounds National Monument',
  'El Malpais National Monument',
  'El Morro National Monument',
  'Emmett Till and Mamie Till‑Mobley National Monument',
  'Florissant Fossil Beds National Monument',
  'Fort Frederica National Monument',
  'Fort Matanzas National Monument',
  'Fort McHenry National Monument',
  'Fort Monroe National Monument',
  'Fort Pulaski National Monument',
  'Fort Stanwix National Monument',
  'Fort Union National Monument',
  'Fossil Butte National Monument',
  'Frances Perkins National Monument',
  'Freedom Riders National Monument',
  'George Washington Birthplace National Monument',
  'George Washington Carver National Monument',
  'Gila Cliff Dwellings National Monument',
  'Giant Sequoia National Monument',
  'Gold Butte National Monument',
  'Governors Island National Monument',
  'Grand Canyon–Parashant National Monument',
  'Grand Portage National Monument',
  'Grand Staircase–Escalante National Monument',
  'Hagerman Fossil Beds National Monument',
  'Hanford Reach National Monument',
  'Harriet Tubman Underground Railroad National Monument',
  'Hohokam Pima National Monument',
  'Hovenweep National Monument',
  'Ironwood Forest National Monument',
  'Jewel Cave National Monument',
  'Jurassic National Monument',
  'Kasha‑Katuwe Tent Rocks National Monument',
  'Katahdin Woods and Waters National Monument',
  'Lava Beds National Monument',
  'Little Bighorn Battlefield National Monument',
  'Marianas Trench Marine National Monument',
  'Medgar and Myrlie Evers Home National Monument',
  'Military Working Dog Teams National Monument',
  'Mill Springs Battlefield National Monument',
  'Misty Fjords National Monument',
  'Mojave Trails National Monument',
  'Montezuma Castle National Monument',
  'Mount St. Helens Volcanic National Monument',
  'Muir Woods National Monument',
  'Natural Bridges National Monument',
  'Navajo National Monument',
  'Newberry Volcanic National Monument',
  'Northeast Canyons and Seamounts Marine National Monument',
  'Oregon Caves National Monument',
  'Organ Mountains–Desert Peaks National Monument',
  'Organ Pipe Cactus National Monument',
  'Pacific Islands Heritage Marine National Monument',
  'Papahānaumokuākea Marine National Monument',
  'Petroglyph National Monument',
  'Pipe Spring National Monument',
  'Pipestone National Monument',
  'Pompeys Pillar National Monument',
  'Poverty Point National Monument',
  'Prehistoric Trackways National Monument',
  'President Lincoln and Soldiers\' Home National Monument',
  'Rainbow Bridge National Monument',
  'Río Grande del Norte National Monument',
  'Rose Atoll Marine National Monument',
  'Russell Cave National Monument',
  'Saint Francis Dam Disaster National Monument',
  'Salinas Pueblo Missions National Monument',
  'San Gabriel Mountains National Monument',
  'San Juan Islands National Monument',
  'Sand to Snow National Monument',
  'Santa Rosa and San Jacinto Mountains National Monument',
  'Sáttítla Highlands National Monument',
  'Scotts Bluff National Monument',
  'Sonoran Desert National Monument',
  'Springfield 1908 Race Riot National Monument',
  'Statue of Liberty National Monument',
  'Stonewall National Monument',
  'Sunset Crater Volcano National Monument',
  'Timpanogos Cave National Monument',
  'Tonto National Monument',
  'Tule Lake National Monument',
  'Tule Springs Fossil Beds National Monument',
  'Tuzigoot National Monument',
  'Upper Missouri River Breaks National Monument',
  'Vermilion Cliffs National Monument',
  'Virgin Islands Coral Reef National Monument',
  'Waco Mammoth National Monument',
  'Walnut Canyon National Monument',
  'Wupatki National Monument',
  'Yucca House National Monument',
]

function getFederalSiteType(siteName: string): 'national-park' | 'national-monument' | null {
  const normalizedName = siteName.toLowerCase().trim()
  
  if (NATIONAL_PARKS.some(np => normalizedName.includes(np.toLowerCase()))) {
    return 'national-park'
  }
  
  if (NATIONAL_MONUMENTS.some(nm => normalizedName.includes(nm.toLowerCase()))) {
    return 'national-monument'
  }
  
  return null
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
              return getFederalSiteType(name) !== null
            })
            .map((place) => {
            const name = place.name || 'Unknown Park'
            const siteType = getFederalSiteType(name)
            const type: 'local' | 'state' | 'national-park' | 'national-monument' = siteType || 'local'

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
          onError('No National Parks or Monuments found in this area. Try zooming out or moving the map.')
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
        <h2 className="text-lg font-semibold text-gray-900">National Parks & Monuments</h2>
        <p className="text-sm text-gray-600">{parks.length} sites found</p>
        <p className="text-xs text-gray-500 mt-1">America the Beautiful pass accepted</p>
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
            <ParksSearcher onParksFound={handleParksFound} onError={handleError} />
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
