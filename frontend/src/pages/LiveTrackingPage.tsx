import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import {
  Navigation,
  Compass,
  Radio,
  MapPin,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Activity,
  RefreshCw,
  Crosshair,
  Info,
  Calendar,
  Layers,
  Sliders,
  ChevronRight,
  ExternalLink,
  Volume2,
  VolumeX,
  Clock,
  Eye,
  CheckCircle2,
  AlertOctagon,
  LifeBuoy,
  CloudRain,
  Sun,
  Droplets,
  Thermometer,
  Wind,
  CloudLightning,
  Waves,
  Flame,
  CloudFog
} from 'lucide-react';
import { api } from '../services/api';

interface Earthquake {
  id: string;
  mag: number;
  place: string;
  time: number;
  lat: number;
  lng: number;
  depth: number;
  distanceKm: number;
  url?: string;
}

interface ProtectionAssessment {
  status: 'safe' | 'caution' | 'danger';
  title: string;
  badge: string;
  message: string;
  criticalCount: number;
  maxMag: number;
  closestDistKm: number;
  closestPlace: string;
}

interface WeatherData {
  location: string;
  temperature_c: number;
  feels_like_c: number;
  humidity_pct: number;
  pressure_hpa: number;
  wind_speed_mps: number;
  clouds_pct: number;
  condition: string;
  description: string;
  icon: string;
  rain_1h_mm: number;
  forecast_24h_rain_mm: number;
  max_precipitation_prob_pct: number;
}

interface HazardAssessment {
  status: 'safe' | 'caution' | 'danger';
  level: string;
  title: string;
  message: string;
  accumulated_rain_mm?: number;
  temperature_c?: number;
  humidity_pct?: number;
}

interface CycloneStorm {
  id: string;
  name: string;
  category?: string;
  distance_km: number;
  lat: number;
  lon: number;
  wind_speed_kts: number;
  wind_speed_kmh: number;
  date?: string;
  link?: string;
}

interface CycloneAssessment {
  status: 'safe' | 'caution' | 'danger';
  level: string;
  title: string;
  message: string;
  wind_speed_kmh: number;
  wind_gust_kmh: number;
  wind_category: string;
  nearest_cyclone?: CycloneStorm | null;
  active_cyclones_count: number;
  all_active_storms: CycloneStorm[];
}

interface AirPollutionData {
  status: 'safe' | 'caution' | 'danger';
  level: string;
  title: string;
  message: string;
  aqi_index: number;
  aqi_category: string;
  pm2_5: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
  source: string;
}

interface WildfireEvent {
  id: string;
  title: string;
  distance_km: number;
  lat: number;
  lon: number;
  acres: number;
  date?: string;
  link?: string;
}

interface WildfireAssessment {
  status: 'safe' | 'caution' | 'danger';
  level: string;
  title: string;
  message: string;
  nearest_wildfire?: WildfireEvent | null;
  active_wildfires_count: number;
  all_active_wildfires: WildfireEvent[];
}

// Haversine formula to calculate accurate distance between two GPS coordinates in kilometers
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Play Emergency Web Audio Alert Siren / Chime
function playEmergencyAlarm(type: 'danger' | 'caution') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'danger') {
      // Urgent two-tone alert
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.55);
      osc.frequency.setValueAtTime(920, ctx.currentTime + 0.6);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.85);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.95);
    } else {
      // Milder notification chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    }
  } catch (err) {
    console.warn('Audio alert could not play automatically:', err);
  }
}

export const LiveTrackingPage: React.FC = () => {
  // Geolocation State
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
    timestamp?: number;
  } | null>(null);

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isLiveWatching, setIsLiveWatching] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Status text in clean professional English
  const [statusText, setStatusText] = useState<string>(
    'Click the button above to locate your GPS position and evaluate real-time 200 km earthquake, flood, and drought protection status.'
  );
  const [statusType, setStatusType] = useState<'info' | 'loading' | 'success' | 'error' | 'warning' | 'danger'>('info');

  // Earthquake Data & Controls
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [isLoadingQuakes, setIsLoadingQuakes] = useState<boolean>(false);
  const [radiusKm, setRadiusKm] = useState<number>(200); // 200 km default as requested
  const [minMagnitude, setMinMagnitude] = useState<number>(3.0); // 3.0+ default
  const [daysRange, setDaysRange] = useState<number>(30); // 30 days default
  const [selectedQuake, setSelectedQuake] = useState<Earthquake | null>(null);
  const [protectionAssessment, setProtectionAssessment] = useState<ProtectionAssessment | null>(null);

  // Weather, Flood, Drought, Cyclone, Air Pollution & Wildfire States
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [floodAssessment, setFloodAssessment] = useState<HazardAssessment | null>(null);
  const [droughtAssessment, setDroughtAssessment] = useState<HazardAssessment | null>(null);
  const [cycloneAssessment, setCycloneAssessment] = useState<CycloneAssessment | null>(null);
  const [airPollution, setAirPollution] = useState<AirPollutionData | null>(null);
  const [wildfireAssessment, setWildfireAssessment] = useState<WildfireAssessment | null>(null);

  const [selectedCyclone, setSelectedCyclone] = useState<CycloneStorm | null>(null);
  const [selectedWildfire, setSelectedWildfire] = useState<WildfireEvent | null>(null);

  const [activeSidebarTab, setActiveSidebarTab] = useState<'quakes' | 'cyclones' | 'wildfires'>('quakes');
  const [rightPanelMode, setRightPanelMode] = useState<'tests' | 'feeds'>('tests');
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);

  // Map & Layers References
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const protectionZoneCircleRef = useRef<L.Circle | null>(null);
  const earthquakeLayerRef = useRef<L.LayerGroup | null>(null);
  const cycloneLayerRef = useRef<L.LayerGroup | null>(null);
  const wildfireLayerRef = useRef<L.LayerGroup | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const quakeMarkersMapRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const cycloneMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const wildfireMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let resizeObserver: ResizeObserver | null = null;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629], // Default center: India
        zoom: 5,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const eqLayer = L.layerGroup().addTo(map);
      earthquakeLayerRef.current = eqLayer;
      const cycLayer = L.layerGroup().addTo(map);
      cycloneLayerRef.current = cycLayer;
      const wfLayer = L.layerGroup().addTo(map);
      wildfireLayerRef.current = wfLayer;
      mapInstanceRef.current = map;

      // Force initial size recalculation
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    // Observe container size adjustments for flawless responsive rendering
    if (mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Compute Earthquake Protection Assessment within 200 km
  const evaluateProtectionStatus = useCallback(
    (quakeList: Earthquake[], radius: number): ProtectionAssessment => {
      if (quakeList.length === 0) {
        return {
          status: 'safe',
          title: 'FULLY PROTECTED: SAFE SEISMIC ZONE',
          badge: 'PROTECTED (SAFE ZONE)',
          message: `Zero significant earthquakes recorded within your ${radius} km radius in the past 30 days. Your area is seismically stable.`,
          criticalCount: 0,
          maxMag: 0,
          closestDistKm: 0,
          closestPlace: 'None',
        };
      }

      const maxMag = Math.max(...quakeList.map((q) => q.mag));
      const closest = quakeList[0]; // sorted by distance
      const criticalQuakes = quakeList.filter((q) => q.mag >= 4.5 || (q.mag >= 3.8 && q.distanceKm <= 100));

      if (maxMag >= 5.0 || criticalQuakes.length > 0) {
        return {
          status: 'danger',
          title: 'CRITICAL HAZARD: HIGH SEISMIC RISK DETECTED',
          badge: 'CRITICAL ALERT (HIGH HAZARD)',
          message: `Significant seismic activity (M${maxMag.toFixed(1)}) detected within your ${radius} km perimeter. Exercise maximum vigilance and follow emergency safety protocols.`,
          criticalCount: criticalQuakes.length,
          maxMag,
          closestDistKm: closest.distanceKm,
          closestPlace: closest.place,
        };
      }

      if (maxMag >= 3.5 || closest.distanceKm <= 150) {
        return {
          status: 'caution',
          title: 'ELEVATED NOTICE: MODERATE SEISMIC ACTIVITY',
          badge: 'ELEVATED CAUTION (MODERATE)',
          message: `${quakeList.length} moderate seismic events recorded within ${radius} km (Closest: ${closest.distanceKm} km away). While no immediate destruction is reported, remain alert.`,
          criticalCount: 0,
          maxMag,
          closestDistKm: closest.distanceKm,
          closestPlace: closest.place,
        };
      }

      return {
        status: 'safe',
        title: 'SURROUNDING AREA STABLE (LOW SEISMIC IMPACT)',
        badge: 'STABLE (LOW RISK)',
        message: `Only minor micro-tremors detected within ${radius} km. Normal safety conditions apply.`,
        criticalCount: 0,
        maxMag,
        closestDistKm: closest.distanceKm,
        closestPlace: closest.place,
      };
    },
    []
  );

  // 3. Fetch Real-Time Weather, Flood, Drought & NASA EONET Cyclone Risk
  const fetchWeatherAndHazards = useCallback(
    async (lat: number, lon: number) => {
      setIsLoadingWeather(true);
      try {
        const data = await api.getWeatherHazards(lat, lon);
        if (data && data.weather) {
          setWeatherData({
            location: data.location || 'Current Coordinates',
            ...data.weather,
          });
          setFloodAssessment(data.flood_assessment);
          setDroughtAssessment(data.drought_assessment);
          setCycloneAssessment(data.cyclone_assessment);
          setAirPollution(data.air_pollution);
          setWildfireAssessment(data.wildfire_assessment);

          // Plot NASA EONET Active Cyclones / Severe Storms on Map
          if (cycloneLayerRef.current) {
            cycloneLayerRef.current.clearLayers();
            cycloneMarkersMapRef.current.clear();

            const storms: CycloneStorm[] = data.cyclone_assessment?.all_active_storms || [];
            storms.forEach((storm) => {
              const markerColor =
                storm.wind_speed_kts >= 100
                  ? '#DC2626'
                  : storm.wind_speed_kts >= 64
                  ? '#EA580C'
                  : '#2563EB';

              const customIcon = L.divIcon({
                className: 'custom-cyclone-div-icon',
                html: `
                  <div style="
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: ${markerColor};
                    box-shadow: 0 0 12px ${markerColor}AA;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 16px;
                    cursor: pointer;
                    border: 2px solid #FFFFFF;
                  " title="${storm.name}">
                    🌀
                  </div>
                `,
                iconSize: [32, 32],
                iconAnchor: [16, 16],
              });

              const marker = L.marker([storm.lat, storm.lon], { icon: customIcon });

              marker.bindPopup(`
                <div style="font-family: system-ui, sans-serif; font-size: 13px; line-height: 1.4; min-width: 240px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px;">
                    <span style="font-weight: 800; color: #0F172A; font-size: 14px;">🌀 ${storm.name}</span>
                    <span style="background: ${markerColor}; color: #FFFFFF; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px;">
                      ${storm.category || 'Severe Storm'}
                    </span>
                  </div>
                  <div style="color: #1E293B; margin-bottom: 3px;"><b>NASA EONET ID:</b> ${storm.id}</div>
                  <div style="color: #1E293B; margin-bottom: 3px;"><b>Max Sustained Winds:</b> ${storm.wind_speed_kmh} km/h (${storm.wind_speed_kts} kts)</div>
                  <div style="color: #64748B; font-size: 11px; margin-bottom: 2px;"><b>Coordinates:</b> ${storm.lat.toFixed(2)}°, ${storm.lon.toFixed(2)}°</div>
                  ${storm.date ? `<div style="color: #64748B; font-size: 11px; margin-bottom: 4px;"><b>Reported Date:</b> ${new Date(storm.date).toLocaleString()}</div>` : ''}
                  <div style="color: #2563EB; font-weight: 700; font-size: 12px; margin-top: 5px; padding-top: 5px; border-top: 1px dashed #CBD5E1;">
                    📍 Distance from your position: ${storm.distance_km.toLocaleString()} km
                  </div>
                  <div style="margin-top: 6px;">
                    <a href="${storm.link || 'https://eonet.gsfc.nasa.gov/api/v3/events?category=severeStorms'}" target="_blank" rel="noreferrer" style="color: #2563EB; text-decoration: underline; font-size: 11px; font-weight: 600;">
                      View NASA EONET Report ↗
                    </a>
                  </div>
                </div>
              `);

              marker.on('click', () => {
                setSelectedCyclone(storm);
                setActiveSidebarTab('cyclones');
                setRightPanelMode('feeds');
              });

              if (cycloneLayerRef.current) {
                cycloneLayerRef.current.addLayer(marker);
              }
              cycloneMarkersMapRef.current.set(storm.id, marker);
            });
          }

          // Plot NASA EONET Active Wildfires on Map
          if (wildfireLayerRef.current) {
            wildfireLayerRef.current.clearLayers();
            wildfireMarkersMapRef.current.clear();

            const fires: WildfireEvent[] = data.wildfire_assessment?.all_active_wildfires || [];
            fires.forEach((fire) => {
              const markerColor = fire.distance_km <= 50 ? '#DC2626' : fire.distance_km <= 150 ? '#EA580C' : '#E11D48';

              const customIcon = L.divIcon({
                className: 'custom-wildfire-div-icon',
                html: `
                  <div style="
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    background: ${markerColor};
                    box-shadow: 0 0 12px ${markerColor}CC;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 15px;
                    cursor: pointer;
                    border: 2px solid #FFFFFF;
                  " title="${fire.title}">
                    🔥
                  </div>
                `,
                iconSize: [30, 30],
                iconAnchor: [15, 15],
              });

              const marker = L.marker([fire.lat, fire.lon], { icon: customIcon });

              marker.bindPopup(`
                <div style="font-family: system-ui, sans-serif; font-size: 13px; line-height: 1.4; min-width: 240px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px;">
                    <span style="font-weight: 800; color: #0F172A; font-size: 14px;">🔥 ${fire.title}</span>
                    <span style="background: ${markerColor}; color: #FFFFFF; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px;">
                      Active Blaze
                    </span>
                  </div>
                  <div style="color: #1E293B; margin-bottom: 3px;"><b>Burn Area:</b> ${fire.acres > 0 ? `${fire.acres.toLocaleString()} acres` : 'Thermal hotspot detected'}</div>
                  <div style="color: #64748B; font-size: 11px; margin-bottom: 2px;"><b>Coordinates:</b> ${fire.lat.toFixed(2)}°, ${fire.lon.toFixed(2)}°</div>
                  ${fire.date ? `<div style="color: #64748B; font-size: 11px; margin-bottom: 4px;"><b>Reported Date:</b> ${new Date(fire.date).toLocaleString()}</div>` : ''}
                  <div style="color: #DC2626; font-weight: 700; font-size: 12px; margin-top: 5px; padding-top: 5px; border-top: 1px dashed #CBD5E1;">
                    📍 Distance from your position: ${fire.distance_km.toLocaleString()} km
                  </div>
                  <div style="margin-top: 6px;">
                    <a href="${fire.link || 'https://eonet.gsfc.nasa.gov/api/v3/events'}" target="_blank" rel="noreferrer" style="color: #DC2626; text-decoration: underline; font-size: 11px; font-weight: 600;">
                      View NASA Wildfire Details ↗
                    </a>
                  </div>
                </div>
              `);

              marker.on('click', () => {
                setSelectedWildfire(fire);
                setActiveSidebarTab('wildfires');
                setRightPanelMode('feeds');
              });

              if (wildfireLayerRef.current) {
                wildfireLayerRef.current.addLayer(marker);
              }
              wildfireMarkersMapRef.current.set(fire.id, marker);
            });
          }

          if (soundEnabled) {
            const isDanger =
              data.flood_assessment?.status === 'danger' ||
              data.drought_assessment?.status === 'danger' ||
              data.cyclone_assessment?.status === 'danger' ||
              data.air_pollution?.status === 'danger' ||
              data.wildfire_assessment?.status === 'danger';

            const isCaution =
              data.flood_assessment?.status === 'caution' ||
              data.drought_assessment?.status === 'caution' ||
              data.cyclone_assessment?.status === 'caution' ||
              data.air_pollution?.status === 'caution' ||
              data.wildfire_assessment?.status === 'caution';

            if (isDanger) {
              playEmergencyAlarm('danger');
            } else if (isCaution) {
              playEmergencyAlarm('caution');
            }
          }
        }
      } catch (err) {
        console.warn('Weather hazard assessment error:', err);
      } finally {
        setIsLoadingWeather(false);
      }
    },
    [soundEnabled]
  );

  // 4. Fetch USGS Earthquake Data around User Coordinates
  const fetchEarthquakesAround = useCallback(
    async (lat: number, lng: number, rad: number, minMag: number, days: number) => {
      setIsLoadingQuakes(true);
      setStatusType('loading');
      setStatusText(`Querying USGS Global Seismic Network for earthquakes within ${rad} km...`);

      try {
        const endDate = new Date().toISOString().split('T')[0];
        const startDateObj = new Date();
        startDateObj.setDate(startDateObj.getDate() - days);
        const startDate = startDateObj.toISOString().split('T')[0];

        const apiUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startDate}&endtime=${endDate}&minmagnitude=${minMag}&latitude=${lat}&longitude=${lng}&maxradiuskm=${rad}`;

        const res = await fetch(apiUrl);
        if (!res.ok) {
          throw new Error(`USGS API response status: ${res.status}`);
        }
        const data = await res.json();

        if (earthquakeLayerRef.current) {
          earthquakeLayerRef.current.clearLayers();
          quakeMarkersMapRef.current.clear();
        }

        const features = data.features || [];
        const parsedList: Earthquake[] = [];

        features.forEach((f: any) => {
          const coords = f.geometry?.coordinates || [0, 0, 0];
          const quakeLng = coords[0];
          const quakeLat = coords[1];
          const depth = coords[2] || 0;
          const mag = Number(f.properties?.mag) || 0;
          const place = f.properties?.place || 'Unknown location';
          const time = f.properties?.time || Date.now();
          const dist = calculateDistanceKm(lat, lng, quakeLat, quakeLng);

          const quakeItem: Earthquake = {
            id: f.id,
            mag,
            place,
            time,
            lat: quakeLat,
            lng: quakeLng,
            depth,
            distanceKm: dist,
            url: f.properties?.url,
          };
          parsedList.push(quakeItem);

          // Magnitude color scheme
          let fillColor = '#EAB308'; // < 4.0: Amber/Yellow
          let strokeColor = '#CA8A04';
          if (mag >= 5.0) {
            fillColor = '#DC2626'; // >= 5.0: Danger Red
            strokeColor = '#991B1B';
          } else if (mag >= 4.0) {
            fillColor = '#EA580C'; // 4.0 - 4.9: Severe Orange
            strokeColor = '#C2410C';
          }

          const circle = L.circleMarker([quakeLat, quakeLng], {
            radius: Math.max(mag * 3.4, 6),
            fillColor: fillColor,
            color: strokeColor,
            weight: 2,
            opacity: 0.95,
            fillOpacity: 0.7,
          });

          const formattedDate = new Date(time).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          });

          circle.bindPopup(`
            <div style="font-family: system-ui, sans-serif; font-size: 13px; line-height: 1.4; min-width: 220px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px;">
                <span style="font-weight: 800; color: #0F172A; font-size: 14px;">M ${mag.toFixed(1)} Earthquake</span>
                <span style="background: ${fillColor}; color: #FFFFFF; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px;">
                  ${mag >= 5.0 ? 'CRITICAL' : mag >= 4.0 ? 'MODERATE' : 'MINOR'}
                </span>
              </div>
              <div style="color: #1E293B; margin-bottom: 3px;"><b>Location:</b> ${place}</div>
              <div style="color: #64748B; font-size: 11px; margin-bottom: 2px;"><b>Time:</b> ${formattedDate}</div>
              <div style="color: #64748B; font-size: 11px; margin-bottom: 4px;"><b>Depth:</b> ${depth.toFixed(1)} km</div>
              <div style="color: #2563EB; font-weight: 700; font-size: 12px; margin-top: 4px; padding-top: 4px; border-top: 1px dashed #CBD5E1;">
                📍 Distance from your position: ${dist} km
              </div>
            </div>
          `);

          circle.on('click', () => {
            setSelectedQuake(quakeItem);
            setActiveSidebarTab('quakes');
            setRightPanelMode('feeds');
          });

          if (earthquakeLayerRef.current) {
            earthquakeLayerRef.current.addLayer(circle);
          }
          quakeMarkersMapRef.current.set(f.id, circle);
        });

        // Sort by closest distance to user
        parsedList.sort((a, b) => a.distanceKm - b.distanceKm);
        setEarthquakes(parsedList);

        // Run Protection Assessment Engine
        const assessment = evaluateProtectionStatus(parsedList, rad);
        setProtectionAssessment(assessment);

        // Sound alert trigger
        if (soundEnabled) {
          if (assessment.status === 'danger') {
            playEmergencyAlarm('danger');
          } else if (assessment.status === 'caution') {
            playEmergencyAlarm('caution');
          }
        }

        if (parsedList.length === 0) {
          setStatusType('success');
          setStatusText(`No significant earthquakes detected within ${rad} km over the past ${days} days (Seismically Protected).`);
        } else {
          if (assessment.status === 'danger') {
            setStatusType('danger');
            setStatusText(`ALERT: ${parsedList.length} earthquakes detected within ${rad} km! Maximum Magnitude: M${assessment.maxMag.toFixed(1)}.`);
          } else if (assessment.status === 'caution') {
            setStatusType('warning');
            setStatusText(`Notice: ${parsedList.length} seismic events recorded. Nearest epicenter: ${parsedList[0].place} (${parsedList[0].distanceKm} km away).`);
          } else {
            setStatusType('success');
            setStatusText(`${parsedList.length} minor micro-tremors detected. Area is within normal safe thresholds.`);
          }
        }
      } catch (err: any) {
        console.error('USGS fetch error:', err);
        setStatusType('error');
        setStatusText(`Failed to load seismic data: ${err.message || err}`);
      } finally {
        setIsLoadingQuakes(false);
      }
    },
    [evaluateProtectionStatus, soundEnabled]
  );

  // 5. Update User Location & Protection Perimeter Circle on Leaflet Map
  const updateUserPositionOnMap = useCallback(
    (lat: number, lng: number, accuracy?: number, assessmentStatus: 'safe' | 'caution' | 'danger' = 'safe') => {
      const map = mapInstanceRef.current;
      if (!map) return;

      // Custom pulsing beacon marker for user
      const userBeaconIcon = L.divIcon({
        className: 'suraksha-user-beacon',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-blue-500 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-5 w-5 bg-blue-600 border-2 border-white shadow-xl items-center justify-center">
              <span class="h-2 w-2 rounded-full bg-white"></span>
            </span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      if (!userMarkerRef.current) {
        const marker = L.marker([lat, lng], { icon: userBeaconIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; font-size: 13px; line-height: 1.4;">
            <div style="font-weight: 800; color: #1E3A8A; margin-bottom: 2px;">📍 You Are Here</div>
            <div style="font-size: 11px; color: #475569;">Live Location (Accurate to ±${accuracy ? Math.round(accuracy) : '15'}m)</div>
            <div style="font-size: 11px; color: #64748B; font-family: monospace; margin-top: 4px;">
              ${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E
            </div>
          </div>
        `);
        userMarkerRef.current = marker;
      } else {
        userMarkerRef.current.setLatLng([lat, lng]);
      }

      // Draw or update Protection Buffer Circle around user
      const radiusMeters = radiusKm * 1000;
      let circleColor = '#10B981'; // Green for safe
      let circleFill = '#D1FAE5';
      if (assessmentStatus === 'danger') {
        circleColor = '#EF4444'; // Red
        circleFill = '#FEE2E2';
      } else if (assessmentStatus === 'caution') {
        circleColor = '#F59E0B'; // Amber
        circleFill = '#FEF3C7';
      }

      if (!protectionZoneCircleRef.current) {
        protectionZoneCircleRef.current = L.circle([lat, lng], {
          radius: radiusMeters,
          color: circleColor,
          fillColor: circleFill,
          fillOpacity: 0.12,
          weight: 2,
          dashArray: '6, 6',
        }).addTo(map);

        protectionZoneCircleRef.current.bindTooltip(
          `🛡️ ${radiusKm} km Seismic Evaluation Perimeter`,
          { permanent: false, direction: 'top' }
        );
      } else {
        protectionZoneCircleRef.current.setLatLng([lat, lng]);
        protectionZoneCircleRef.current.setRadius(radiusMeters);
        protectionZoneCircleRef.current.setStyle({
          color: circleColor,
          fillColor: circleFill,
        });
      }

      // User GPS Accuracy ring
      if (accuracy && accuracy > 0) {
        if (!userAccuracyCircleRef.current) {
          userAccuracyCircleRef.current = L.circle([lat, lng], {
            radius: accuracy,
            color: '#3B82F6',
            fillColor: '#93C5FD',
            fillOpacity: 0.15,
            weight: 1,
          }).addTo(map);
        } else {
          userAccuracyCircleRef.current.setLatLng([lat, lng]);
          userAccuracyCircleRef.current.setRadius(accuracy);
        }
      }
    },
    [radiusKm]
  );

  // Update protection zone color on map whenever assessment changes
  useEffect(() => {
    if (userLocation && protectionZoneCircleRef.current) {
      const status = protectionAssessment?.status || 'safe';
      let circleColor = '#10B981';
      let circleFill = '#D1FAE5';
      if (status === 'danger') {
        circleColor = '#EF4444';
        circleFill = '#FEE2E2';
      } else if (status === 'caution') {
        circleColor = '#F59E0B';
        circleFill = '#FEF3C7';
      }
      protectionZoneCircleRef.current.setStyle({
        color: circleColor,
        fillColor: circleFill,
      });
    }
  }, [protectionAssessment, userLocation]);

  // 6. User Requests Location ("Check Location & Triple Hazard Protection")
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setStatusType('error');
      setStatusText('Your browser does not support Geolocation services.');
      return;
    }

    setIsLocating(true);
    setStatusType('loading');
    setStatusText('Requesting GPS location access from browser...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        setUserLocation({
          lat,
          lng,
          accuracy,
          timestamp: pos.timestamp,
        });

        setStatusType('loading');
        setStatusText(`Location acquired: Lat ${lat.toFixed(2)}°, Lon ${lng.toFixed(2)}°. Evaluating Earthquake, Flood & Drought risks...`);

        // Center map on user
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 7.5, { duration: 1.5 });
        }
        updateUserPositionOnMap(lat, lng, accuracy, 'safe');

        // Simultaneously fetch Earthquake, Weather, Flood, and Drought Data
        fetchEarthquakesAround(lat, lng, radiusKm, minMagnitude, daysRange);
        fetchWeatherAndHazards(lat, lng);
      },
      (err) => {
        setIsLocating(false);
        setStatusType('error');
        if (err.code === 1) {
          setStatusText('Location permission was denied. Please allow location access in your browser address bar.');
        } else if (err.code === 2) {
          setStatusText('Unable to retrieve location: GPS signal unavailable or device location is turned off.');
        } else if (err.code === 3) {
          setStatusText('Location request timed out. Please try again.');
        } else {
          setStatusText(`Location error: ${err.message}`);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  // 7. Continuous Live GPS Tracking Toggle
  const toggleLiveWatching = () => {
    if (isLiveWatching) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsLiveWatching(false);
      setStatusType('info');
      setStatusText('Continuous GPS tracking paused.');
    } else {
      if (!navigator.geolocation) {
        setStatusType('error');
        setStatusText('Your browser does not support Geolocation services.');
        return;
      }

      setIsLiveWatching(true);
      setStatusType('loading');
      setStatusText('Continuous real-time GPS tracking active...');

      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = pos.coords.accuracy;

          setUserLocation({
            lat,
            lng,
            accuracy,
            timestamp: pos.timestamp,
          });

          updateUserPositionOnMap(
            lat,
            lng,
            accuracy,
            protectionAssessment?.status || 'safe'
          );
        },
        (err) => {
          setIsLiveWatching(false);
          setStatusType('error');
          setStatusText(`GPS watch error: ${err.message}`);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
        }
      );

      watchIdRef.current = id;
    }
  };

  // Center on User button
  const handleCenterOnUser = () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 7.5, { duration: 1.2 });
      if (userMarkerRef.current) {
        userMarkerRef.current.openPopup();
      }
    } else {
      handleGetLocation();
    }
  };

  // Select an earthquake from list
  const handleSelectQuake = (quake: Earthquake) => {
    setSelectedQuake(quake);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([quake.lat, quake.lng], 7.5, { duration: 1.2 });
      const marker = quakeMarkersMapRef.current.get(quake.id);
      if (marker) {
        marker.openPopup();
      }
    }
  };

  // Select a cyclone from list
  const handleSelectCyclone = (storm: CycloneStorm) => {
    setSelectedCyclone(storm);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([storm.lat, storm.lon], 6, { duration: 1.5 });
      const marker = cycloneMarkersMapRef.current.get(storm.id);
      if (marker) {
        marker.openPopup();
      }
    }
  };

  // Select a wildfire from list
  const handleSelectWildfire = (fire: WildfireEvent) => {
    setSelectedWildfire(fire);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([fire.lat, fire.lon], 7, { duration: 1.5 });
      const marker = wildfireMarkersMapRef.current.get(fire.id);
      if (marker) {
        marker.openPopup();
      }
    }
  };

  // Apply filters
  const handleApplyFilters = () => {
    if (userLocation) {
      fetchEarthquakesAround(
        userLocation.lat,
        userLocation.lng,
        radiusKm,
        minMagnitude,
        daysRange
      );
      fetchWeatherAndHazards(userLocation.lat, userLocation.lng);
    }
  };

  // Determine overall worst hazard level among all 6 Pillars:
  // Earthquake, Cyclone/Gale, Flood, Drought, Air Pollution, Wildfires
  const worstHazardStatus = (
    protectionAssessment?.status === 'danger' ||
    cycloneAssessment?.status === 'danger' ||
    floodAssessment?.status === 'danger' ||
    droughtAssessment?.status === 'danger' ||
    airPollution?.status === 'danger' ||
    wildfireAssessment?.status === 'danger'
  ) ? 'danger' : (
    protectionAssessment?.status === 'caution' ||
    cycloneAssessment?.status === 'caution' ||
    floodAssessment?.status === 'caution' ||
    droughtAssessment?.status === 'caution' ||
    airPollution?.status === 'caution' ||
    wildfireAssessment?.status === 'caution'
  ) ? 'caution' : 'safe';

  // 6 Multi-Hazard Threat Evaluation Tests (Vertical Layout)
  const renderHazardTests = () => (
    <div className="flex flex-col space-y-3">
      {/* Pillar 1: Earthquake / Seismic (200 km) */}
      <div
        className={`p-3.5 rounded-2xl border transition-all ${
          protectionAssessment?.status === 'danger'
            ? 'bg-red-50/80 border-red-300 text-red-950 shadow-xs'
            : protectionAssessment?.status === 'caution'
            ? 'bg-amber-50/80 border-amber-300 text-amber-950 shadow-xs'
            : 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-black/5">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg text-white ${
                protectionAssessment?.status === 'danger'
                  ? 'bg-red-600'
                  : protectionAssessment?.status === 'caution'
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
            >
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
              1. Earthquake Threat
            </span>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              protectionAssessment?.status === 'danger'
                ? 'bg-red-200 text-red-900'
                : protectionAssessment?.status === 'caution'
                ? 'bg-amber-200 text-amber-900'
                : 'bg-emerald-200 text-emerald-900'
            }`}
          >
            {protectionAssessment ? protectionAssessment.badge : 'PENDING SCAN'}
          </span>
        </div>

        <div className="mt-2.5">
          <div className="text-xs font-bold text-slate-900">
            {protectionAssessment ? protectionAssessment.title : '200 km Seismic Evaluation'}
          </div>
          <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">
            {protectionAssessment
              ? protectionAssessment.message
              : 'Click check button to scan USGS seismic sensor stations within 200 km.'}
          </p>

          <div className="mt-2.5 pt-2 border-t border-black/5 grid grid-cols-3 gap-1.5 text-center text-xs">
            <div className="p-1.5 bg-white/70 rounded-lg">
              <span className="text-[10px] text-slate-500 block">Radius</span>
              <span className="font-bold text-slate-800">{radiusKm} km</span>
            </div>
            <div className="p-1.5 bg-white/70 rounded-lg">
              <span className="text-[10px] text-slate-500 block">Quakes</span>
              <span className="font-bold text-slate-800">{earthquakes.length}</span>
            </div>
            <div className="p-1.5 bg-white/70 rounded-lg">
              <span className="text-[10px] text-slate-500 block">Nearest</span>
              <span className="font-bold text-blue-600 truncate block">
                {earthquakes.length > 0 ? `${earthquakes[0].distanceKm}km` : 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pillar 2: Cyclone & High Wind Threat ("Chakravat & Tezt Hawa" - NASA EONET) */}
      <div
        className={`p-3.5 rounded-2xl border transition-all ${
          cycloneAssessment?.status === 'danger'
            ? 'bg-rose-50/90 border-rose-400 text-rose-950 shadow-xs'
            : cycloneAssessment?.status === 'caution'
            ? 'bg-amber-50/80 border-amber-300 text-amber-950 shadow-xs'
            : 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-black/5">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg text-white ${
                cycloneAssessment?.status === 'danger'
                  ? 'bg-rose-600'
                  : cycloneAssessment?.status === 'caution'
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
            >
              <Wind className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
              2. Cyclone & Wind (Tezt Hawa)
            </span>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              cycloneAssessment?.status === 'danger'
                ? 'bg-rose-200 text-rose-900'
                : cycloneAssessment?.status === 'caution'
                ? 'bg-amber-200 text-amber-900'
                : 'bg-emerald-200 text-emerald-900'
            }`}
          >
            {cycloneAssessment ? cycloneAssessment.level : 'PENDING SCAN'}
          </span>
        </div>

        <div className="mt-2.5">
          <div className="text-xs font-bold text-slate-900">
            {cycloneAssessment ? cycloneAssessment.title : 'NASA EONET Severe Storms'}
          </div>
          <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">
            {cycloneAssessment
              ? cycloneAssessment.message
              : 'Tracks active global tropical cyclones from NASA EONET and evaluates real-time gale force winds (Tezt Hawa).'}
          </p>

          <div className="mt-2.5 pt-2 border-t border-black/5 grid grid-cols-3 gap-1.5 text-center text-xs">
            <div className="p-1.5 bg-white/70 rounded-lg">
              <span className="text-[10px] text-slate-500 block">Nearest Storm</span>
              <span className="font-bold text-slate-800 truncate block" title={cycloneAssessment?.nearest_cyclone?.name || 'None'}>
                {cycloneAssessment?.nearest_cyclone ? `${Math.round(cycloneAssessment.nearest_cyclone.distance_km)} km` : 'None'}
              </span>
            </div>
            <div className="p-1.5 bg-white/70 rounded-lg">
              <span className="text-[10px] text-slate-500 block">Wind Velocity</span>
              <span className="font-bold text-slate-800 truncate block">
                {cycloneAssessment ? `${cycloneAssessment.wind_speed_kmh} km/h` : '—'}
              </span>
            </div>
            <div className="p-1.5 bg-white/70 rounded-lg">
              <span className="text-[10px] text-slate-500 block">Wind Gusts</span>
              <span className="font-bold text-blue-600 truncate block">
                {cycloneAssessment ? `${cycloneAssessment.wind_gust_kmh} km/h` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pillar 3: Flood Threat (Baadh) */}
      <div
        className={`p-3.5 rounded-2xl border transition-all ${
          floodAssessment?.status === 'danger'
            ? 'bg-blue-50/80 border-blue-400 text-blue-950 shadow-xs'
            : floodAssessment?.status === 'caution'
            ? 'bg-sky-50/80 border-sky-300 text-sky-950 shadow-xs'
            : 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-black/5">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg text-white ${
                floodAssessment?.status === 'danger'
                  ? 'bg-blue-600'
                  : floodAssessment?.status === 'caution'
                  ? 'bg-sky-500'
                  : 'bg-emerald-600'
              }`}
            >
              <CloudRain className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
              3. Flood Threat (Baadh)
            </span>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              floodAssessment?.status === 'danger'
                ? 'bg-blue-200 text-blue-900'
                : floodAssessment?.status === 'caution'
                ? 'bg-sky-200 text-sky-900'
                : 'bg-emerald-200 text-emerald-900'
            }`}
          >
            {floodAssessment ? floodAssessment.level : 'PENDING SCAN'}
          </span>
        </div>

        <div className="mt-2.5">
          <div className="text-xs font-bold text-slate-900">
            {floodAssessment ? floodAssessment.title : 'Precipitation & Drainage Analysis'}
          </div>
          <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">
            {floodAssessment
              ? floodAssessment.message
              : 'Evaluates real-time rainfall volume, storm surges, and localized waterlogging risk.'}
          </p>

          <div className="mt-2.5 pt-2 border-t border-black/5 grid grid-cols-3 gap-1.5 text-center text-xs">
            <div className="p-1.5 bg-white/70 rounded-lg">
              <span className="text-[10px] text-slate-500 block">Rainfall</span>
              <span className="font-bold text-slate-800 truncate block">
                {weatherData ? `${weatherData.rain_1h_mm} mm` : '—'}
              </span>
            </div>
            <div className="p-1.5 bg-white/70 rounded-lg">
              <span className="text-[10px] text-slate-500 block">Storm Prob</span>
              <span className="font-bold text-slate-800 truncate block">
                {weatherData ? `${weatherData.max_precipitation_prob_pct}%` : '—'}
              </span>
            </div>
            <div className="p-1.5 bg-white/70 rounded-lg">
              <span className="text-[10px] text-slate-500 block">Status</span>
              <span className="font-bold text-emerald-600 truncate block">
                {floodAssessment?.status === 'safe' ? 'No Flood' : (floodAssessment?.level || 'Safe')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pillar 4: Drought Threat (Sukha) */}
      <div
        className={`p-3.5 rounded-2xl border transition-all ${
          droughtAssessment?.status === 'danger'
            ? 'bg-amber-50/90 border-amber-400 text-amber-950 shadow-xs'
            : droughtAssessment?.status === 'caution'
            ? 'bg-orange-50/80 border-orange-300 text-orange-950 shadow-xs'
            : 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-black/5">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg text-white ${
                droughtAssessment?.status === 'danger'
                  ? 'bg-amber-600'
                  : droughtAssessment?.status === 'caution'
                  ? 'bg-orange-500'
                  : 'bg-emerald-600'
              }`}
            >
              <Sun className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
              4. Drought Threat (Sukha)
            </span>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              droughtAssessment?.status === 'danger'
                ? 'bg-amber-200 text-amber-900'
                : droughtAssessment?.status === 'caution'
                ? 'bg-orange-200 text-orange-900'
                : 'bg-emerald-200 text-emerald-900'
            }`}
          >
            {droughtAssessment ? droughtAssessment.level : 'PENDING SCAN'}
          </span>
        </div>

        <div className="mt-2.5">
          <div className="text-xs font-bold text-slate-900">
            {droughtAssessment ? droughtAssessment.title : 'Aridity & Soil Moisture Index'}
          </div>
          <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">
            {droughtAssessment
              ? droughtAssessment.message
              : 'Analyzes ambient thermal stress, relative atmospheric humidity, and soil evapotranspiration.'}
          </p>

          <div className="mt-2.5 pt-2 border-t border-black/5 grid grid-cols-3 gap-1.5 text-center text-xs">
            <div className="p-1.5 bg-white/70 rounded-lg">
              <span className="text-[10px] text-slate-500 block">Temp</span>
              <span className="font-bold text-slate-800 truncate block">
                {weatherData ? `${weatherData.temperature_c}°C` : '—'}
              </span>
            </div>
            <div className="p-1.5 bg-white/70 rounded-lg">
              <span className="text-[10px] text-slate-500 block">Humidity</span>
              <span className="font-bold text-slate-800 truncate block">
                {weatherData ? `${weatherData.humidity_pct}%` : '—'}
              </span>
            </div>
            <div className="p-1.5 bg-white/70 rounded-lg">
              <span className="text-[10px] text-slate-500 block">Condition</span>
              <span className="font-bold text-emerald-600 truncate block">
                {droughtAssessment?.status === 'safe' ? 'Normal' : (droughtAssessment?.level || 'Safe')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pillar 5: Air Pollution & AQI */}
      <div
        className={`p-3.5 rounded-2xl border transition-all ${
          airPollution?.status === 'danger'
            ? 'bg-purple-50/90 border-purple-400 text-purple-950 shadow-xs'
            : airPollution?.status === 'caution'
            ? 'bg-amber-50/80 border-amber-300 text-amber-950 shadow-xs'
            : 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-black/5">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg text-white ${
                airPollution?.status === 'danger'
                  ? 'bg-purple-600'
                  : airPollution?.status === 'caution'
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
            >
              <CloudFog className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
              5. Air Pollution & AQI
            </span>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              airPollution?.status === 'danger'
                ? 'bg-purple-200 text-purple-900'
                : airPollution?.status === 'caution'
                ? 'bg-amber-200 text-amber-900'
                : 'bg-emerald-200 text-emerald-900'
            }`}
          >
            {airPollution ? airPollution.aqi_category : 'PENDING SCAN'}
          </span>
        </div>

        <div className="mt-2.5">
          <div className="text-xs font-bold text-slate-900">
            {airPollution ? airPollution.title : 'Ambient Air & Particulate Smog'}
          </div>
          <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">
            {airPollution
              ? airPollution.message
              : 'Monitors real-time PM2.5, PM10, and atmospheric smog concentrations against WHO & OpenAQ safety standards.'}
          </p>

          <div className="mt-2.5 pt-2 border-t border-black/5 grid grid-cols-3 gap-1.5 text-center text-xs">
            <div className="p-1.5 bg-white/70 rounded-lg">
              <span className="text-[10px] text-slate-500 block">PM2.5</span>
              <span className="font-bold text-slate-800 truncate block">
                {airPollution ? `${airPollution.pm2_5} µg` : '—'}
              </span>
            </div>
            <div className="p-1.5 bg-white/70 rounded-lg">
              <span className="text-[10px] text-slate-500 block">PM10</span>
              <span className="font-bold text-slate-800 truncate block">
                {airPollution ? `${airPollution.pm10} µg` : '—'}
              </span>
            </div>
            <div className="p-1.5 bg-white/70 rounded-lg">
              <span className="text-[10px] text-slate-500 block">AQI Index</span>
              <span className={`font-bold truncate block ${airPollution?.status === 'danger' ? 'text-purple-700 font-extrabold' : 'text-emerald-600'}`}>
                {airPollution ? `${airPollution.aqi_index} / 5` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pillar 6: Wildfire Threat */}
      <div
        className={`p-3.5 rounded-2xl border transition-all ${
          wildfireAssessment?.status === 'danger'
            ? 'bg-rose-50/90 border-rose-400 text-rose-950 shadow-xs'
            : wildfireAssessment?.status === 'caution'
            ? 'bg-orange-50/80 border-orange-300 text-orange-950 shadow-xs'
            : 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-black/5">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg text-white ${
                wildfireAssessment?.status === 'danger'
                  ? 'bg-rose-600'
                  : wildfireAssessment?.status === 'caution'
                  ? 'bg-orange-500'
                  : 'bg-emerald-600'
              }`}
            >
              <Flame className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs uppercase tracking-wider text-slate-900">
              6. Wildfire Threat
            </span>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              wildfireAssessment?.status === 'danger'
                ? 'bg-rose-200 text-rose-900'
                : wildfireAssessment?.status === 'caution'
                ? 'bg-orange-200 text-orange-900'
                : 'bg-emerald-200 text-emerald-900'
            }`}
          >
            {wildfireAssessment ? wildfireAssessment.level : 'PENDING SCAN'}
          </span>
        </div>

        <div className="mt-2.5">
          <div className="text-xs font-bold text-slate-900">
            {wildfireAssessment ? wildfireAssessment.title : 'NASA EONET Active Wildfires'}
          </div>
          <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">
            {wildfireAssessment
              ? wildfireAssessment.message
              : 'Tracks active wildfire events, thermal anomalies, and burned acreage globally via NASA EONET.'}
          </p>

          <div className="mt-2.5 pt-2 border-t border-black/5 grid grid-cols-3 gap-1.5 text-center text-xs">
            <div className="p-1.5 bg-white/70 rounded-lg">
              <span className="text-[10px] text-slate-500 block">Nearest Blaze</span>
              <span className="font-bold text-slate-800 truncate block" title={wildfireAssessment?.nearest_wildfire?.title || 'None'}>
                {wildfireAssessment?.nearest_wildfire ? `${Math.round(wildfireAssessment.nearest_wildfire.distance_km)} km` : 'None'}
              </span>
            </div>
            <div className="p-1.5 bg-white/70 rounded-lg">
              <span className="text-[10px] text-slate-500 block">Burn Area</span>
              <span className="font-bold text-slate-800 truncate block">
                {wildfireAssessment?.nearest_wildfire?.acres ? `${Math.round(wildfireAssessment.nearest_wildfire.acres)} ac` : '0 ac'}
              </span>
            </div>
            <div className="p-1.5 bg-white/70 rounded-lg">
              <span className="text-[10px] text-slate-500 block">Tracked Fires</span>
              <span className="font-bold text-rose-600 truncate block">
                {wildfireAssessment ? wildfireAssessment.active_wildfires_count : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E1E7EF] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 shadow-xs">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
                Universal 6-Pillar Multi-Hazard Defense Radar
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                6-PILLAR SHIELD
              </span>
            </div>
            <p className="text-xs text-[#65758B] mt-0.5">
              Simultaneous real-time evaluation: Earthquake, Cyclone & Gale Winds (Tez Hawa), Flood Inundation, Drought, Air Pollution / AQI, and NASA Wildfires.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Main Locate & Check Safety Button */}
          <button
            onClick={handleGetLocation}
            disabled={isLocating || isLoadingWeather}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 active:scale-95 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isLocating || isLoadingWeather ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Navigation className="w-4 h-4 text-emerald-400" />
            )}
            <span>{isLocating || isLoadingWeather ? 'Analyzing 6-Pillar Radar...' : 'Check All 6 Hazards (Live Radar)'}</span>
          </button>

          {/* Continuous Watch Toggle */}
          <button
            onClick={toggleLiveWatching}
            disabled={!userLocation && !isLiveWatching}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
              isLiveWatching
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            } cursor-pointer disabled:opacity-40`}
            title="Continuous real-time GPS tracking"
          >
            <Compass className={`w-4 h-4 ${isLiveWatching ? 'animate-spin' : ''}`} />
            <span>{isLiveWatching ? 'GPS Active: Watching' : 'Live Watch Mode'}</span>
          </button>

          {/* Sound Alert Toggle */}
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playEmergencyAlarm('caution');
            }}
            className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
            }`}
            title={soundEnabled ? 'Alert Siren: ON (Click to mute)' : 'Alert Siren: MUTED (Click to enable)'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {userLocation && (
            <button
              onClick={handleCenterOnUser}
              className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors border border-slate-200 cursor-pointer"
              title="Center map on my location"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Live Status Strip */}
      <div
        className={`px-4 py-3 rounded-xl border text-xs flex items-center justify-between gap-3 transition-colors ${
          statusType === 'loading'
            ? 'bg-blue-50 border-blue-200 text-blue-800'
            : worstHazardStatus === 'danger'
            ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold animate-pulse'
            : worstHazardStatus === 'caution'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : statusType === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {statusType === 'loading' ? (
            <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-blue-600" />
          ) : worstHazardStatus === 'danger' ? (
            <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
          ) : worstHazardStatus === 'caution' ? (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          ) : statusType === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-slate-500 shrink-0" />
          )}
          <span className="font-medium">{statusText}</span>
        </div>

        {userLocation && (
          <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-slate-600 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200">
            <span>LAT: {userLocation.lat.toFixed(4)}°</span>
            <span>•</span>
            <span>LON: {userLocation.lng.toFixed(4)}°</span>
            {userLocation.accuracy && (
              <>
                <span>•</span>
                <span>±{Math.round(userLocation.accuracy)}m</span>
              </>
            )}
          </div>
        )}
      </div>
      {/* Real-time Weather & Multi-Hazard Telemetry Widget Bar */}
      {weatherData && (
        <div className="bg-white p-4 rounded-2xl border border-[#E1E7EF] shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center p-1">
              <img
                src={`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`}
                alt={weatherData.condition}
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{weatherData.location}</span>
                <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {weatherData.description}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Multi-hazard sensors: OpenWeather, OpenAQ, NASA EONET & USGS
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs">
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-rose-500" />
              <span><b>{weatherData.temperature_c}°C</b> (Feels {weatherData.feels_like_c}°C)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span>Humidity: <b>{weatherData.humidity_pct}%</b></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-teal-500" />
              <span>Wind: <b>{cycloneAssessment ? `${cycloneAssessment.wind_speed_kmh} km/h` : `${weatherData.wind_speed_mps} m/s`}</b> {cycloneAssessment ? `(${cycloneAssessment.wind_category})` : ''}</span>
            </div>
            {airPollution && (
              <div className="flex items-center gap-1.5 text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                <CloudFog className="w-3.5 h-3.5 text-purple-600" />
                <span>AQI: <b>{airPollution.aqi_category}</b> (PM2.5: {airPollution.pm2_5} µg)</span>
              </div>
            )}
            {cycloneAssessment?.nearest_cyclone && (
              <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                <span>🌀</span>
                <span>Cyclone: <b>{cycloneAssessment.nearest_cyclone.name}</b> ({cycloneAssessment.nearest_cyclone.distance_km.toLocaleString()} km)</span>
              </div>
            )}
            {wildfireAssessment?.nearest_wildfire && (
              <div className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                <span>🔥</span>
                <span>Wildfire: <b>{wildfireAssessment.nearest_wildfire.title}</b> ({Math.round(wildfireAssessment.nearest_wildfire.distance_km)} km)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Leaflet Map (Left) + Multi-Hazard Threat Tests & Feeds (Right Vertical) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Leaflet Map Container */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-[#E1E7EF] bg-slate-100 shadow-sm h-[680px]">
            <div id="live-tracking-map" ref={mapContainerRef} className="w-full h-full" />

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-md text-[11px] text-slate-700 flex flex-wrap items-center gap-3.5">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600 border border-white shadow-xs"></span>
                <span className="font-bold text-slate-900">Your Location</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full border border-dashed border-emerald-500 bg-emerald-100"></span>
                <span className="text-slate-700 font-medium">{radiusKm} km Assessment Perimeter</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-600"></span>
                <span>Minor (&lt; 4.0)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-orange-500 border border-orange-700"></span>
                <span>Moderate (4.0 - 4.9)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-600 border border-red-800"></span>
                <span>Critical Hazard (5.0+)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white">🌀</span>
                <span className="font-semibold text-slate-800">NASA Cyclone</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-red-600 flex items-center justify-center text-[10px] text-white">🔥</span>
                <span className="font-semibold text-slate-800">NASA Wildfire</span>
              </div>
            </div>

            {/* Floating Map Re-center Action */}
            <div className="absolute top-4 right-4 z-[400] flex flex-col gap-1.5">
              <button
                onClick={handleCenterOnUser}
                className="p-2.5 rounded-xl bg-white/90 backdrop-blur-xs text-slate-700 hover:text-slate-900 hover:bg-white shadow-md border border-slate-200 transition-all cursor-pointer"
                title="Center map on my location"
              >
                <Crosshair className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Map Query Customizer Filters */}
          <div className="bg-white p-4 rounded-xl border border-[#E1E7EF] shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>Detection Settings:</span>
              </div>

              {/* Radius Filter */}
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Radius:</span>
                <select
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1 text-xs font-semibold focus:ring-1 focus:ring-slate-400 outline-none"
                >
                  <option value={100}>100 km (Immediate Area)</option>
                  <option value={200}>200 km (Recommended / Default)</option>
                  <option value={350}>350 km (Regional Zone)</option>
                  <option value={500}>500 km (Extended Perimeter)</option>
                </select>
              </div>

              {/* Min Magnitude */}
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Min Mag:</span>
                <select
                  value={minMagnitude}
                  onChange={(e) => setMinMagnitude(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-slate-400 outline-none"
                >
                  <option value={2.5}>2.5+ (All Minor)</option>
                  <option value={3.0}>3.0+ (Default)</option>
                  <option value={4.0}>4.0+ (Moderate Only)</option>
                  <option value={5.0}>5.0+ (Critical Hazards Only)</option>
                </select>
              </div>

              {/* Time Window */}
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Window:</span>
                <select
                  value={daysRange}
                  onChange={(e) => setDaysRange(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-slate-400 outline-none"
                >
                  <option value={7}>Past 7 Days</option>
                  <option value={15}>Past 15 Days</option>
                  <option value={30}>Past 30 Days (Default)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleApplyFilters}
              disabled={isLoadingQuakes || isLoadingWeather || !userLocation}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQuakes || isLoadingWeather ? 'animate-spin' : ''}`} />
              <span>Update Data</span>
            </button>
          </div>
        </div>

        {/* Right: Threat Intelligence & 7 Multi-Hazard Tests / Feeds */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-[#E1E7EF] shadow-xs flex flex-col h-[760px]">
            {/* Top Header & View Switcher */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 tracking-tight">Threat Intelligence</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  worstHazardStatus === "danger"
                    ? "bg-rose-100 text-rose-700"
                    : worstHazardStatus === "caution"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}>
                  {worstHazardStatus.toUpperCase()}
                </span>
              </div>

              {/* Segmented Switcher: [ 6 Threat Tests ] | [ Live Feeds ] */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setRightPanelMode("tests")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    rightPanelMode === "tests"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>6 Threat Tests</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelMode("feeds")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    rightPanelMode === "feeds"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 text-rose-500" />
                  <span>Live Feeds</span>
                </button>
              </div>
            </div>

            {/* Mode 1: 6 Multi-Hazard Threat Tests (Vertical Stack) */}
            {rightPanelMode === "tests" && (
              <div className="flex-1 overflow-y-auto pr-1 mt-3 space-y-3">
                {renderHazardTests()}
              </div>
            )}

            {/* Mode 2: Live Activity Feeds */}
            {rightPanelMode === "feeds" && (
              <div className="flex-1 flex flex-col min-h-0 mt-3">
            <div className="flex flex-col gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Hazard Feeds</span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {activeSidebarTab === 'quakes'
                    ? `${earthquakes.length} Quakes`
                    : activeSidebarTab === 'cyclones'
                    ? `${cycloneAssessment?.all_active_storms?.length || 0} Cyclones`
                    : `${wildfireAssessment?.all_active_wildfires?.length || 0} Fires`}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setActiveSidebarTab('quakes')}
                  className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    activeSidebarTab === 'quakes'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <Activity className="w-3 h-3 text-rose-500 shrink-0" />
                  <span className="truncate">Seismic ({earthquakes.length})</span>
                </button>

                <button
                  onClick={() => setActiveSidebarTab('cyclones')}
                  className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    activeSidebarTab === 'cyclones'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <Wind className="w-3 h-3 text-blue-600 shrink-0" />
                  <span className="truncate">Cyclones ({cycloneAssessment?.all_active_storms?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveSidebarTab('wildfires')}
                  className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    activeSidebarTab === 'wildfires'
                      ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <Flame className="w-3 h-3 text-orange-600 shrink-0" />
                  <span className="truncate">Fires ({wildfireAssessment?.all_active_wildfires?.length || 0})</span>
                </button>
              </div>
            </div>

            {/* Earthquakes Feed */}
            {activeSidebarTab === 'quakes' && (
              <div className="mt-3 space-y-2.5 overflow-y-auto max-h-[640px] pr-1">
                {earthquakes.length === 0 ? (
                  <div className="text-center py-12 px-4 text-slate-400">
                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500" />
                    <p className="text-xs font-medium text-slate-600">
                      {userLocation
                        ? `No earthquakes detected within ${radiusKm} km over the past ${daysRange} days.`
                        : 'Click the button above to locate your GPS position and begin multi-hazard scanning.'}
                    </p>
                    {userLocation && (
                      <div className="mt-2 text-[11px] text-emerald-600 font-semibold flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Safe Seismic Zone</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="text-[11px] font-bold text-slate-500 mb-1">
                      Total {earthquakes.length} Earthquakes Detected:
                    </div>

                    {earthquakes.map((quake) => {
                      const isSelected = selectedQuake?.id === quake.id;
                      const formattedTime = new Date(quake.time).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      });

                      return (
                        <div
                          key={quake.id}
                          onClick={() => handleSelectQuake(quake)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-300 shadow-xs'
                              : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-black ${
                                  quake.mag >= 5.0
                                    ? 'bg-red-600 text-white'
                                    : quake.mag >= 4.0
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-yellow-400 text-yellow-950'
                                }`}
                              >
                                Magnitude: {quake.mag.toFixed(1)}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-blue-600 whitespace-nowrap">
                              {quake.distanceKm} km away
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-slate-800 mt-1.5 line-clamp-2">
                            {quake.place}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200/60">
                            <div className="flex items-center gap-1 text-[10px]">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{formattedTime}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">Depth: {quake.depth.toFixed(0)} km</span>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {/* NASA EONET Active Cyclones & Storms Feed */}
            {activeSidebarTab === 'cyclones' && (
              <div className="mt-3 space-y-2.5 overflow-y-auto max-h-[640px] pr-1">
                {(!cycloneAssessment?.all_active_storms || cycloneAssessment.all_active_storms.length === 0) ? (
                  <div className="text-center py-12 px-4 text-slate-400">
                    <Wind className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500" />
                    <p className="text-xs font-medium text-slate-600">
                      {userLocation
                        ? 'No active tropical cyclones or hurricanes currently tracked globally by NASA EONET.'
                        : 'Click "Check All 6 Hazards" above to query real-time NASA EONET severe storm telemetry.'}
                    </p>
                    {userLocation && (
                      <div className="mt-2 text-[11px] text-emerald-600 font-semibold flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Cyclone Free Perimeter</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="text-[11px] font-bold text-slate-500 mb-1 flex items-center justify-between">
                      <span>Global Cyclones (NASA EONET):</span>
                      <span className="text-[10px] text-blue-600 font-semibold">Sorted by Distance</span>
                    </div>

                    {cycloneAssessment.all_active_storms.map((storm) => {
                      const isSelected = selectedCyclone?.id === storm.id;
                      const badgeClass =
                        storm.wind_speed_kts >= 100
                          ? 'bg-red-600 text-white'
                          : storm.wind_speed_kts >= 64
                          ? 'bg-orange-500 text-white'
                          : 'bg-blue-600 text-white';

                      return (
                        <div
                          key={storm.id}
                          onClick={() => handleSelectCyclone(storm)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50/90 border-blue-300 ring-1 ring-blue-300 shadow-xs'
                              : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">🌀</span>
                              <span className="text-xs font-bold text-slate-900">{storm.name}</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-blue-600 whitespace-nowrap">
                              {storm.distance_km.toLocaleString()} km away
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}`}>
                              {storm.category || 'Severe Storm'}
                            </span>
                            <span className="text-[11px] text-slate-600 font-semibold">
                              {storm.wind_speed_kmh} km/h ({storm.wind_speed_kts} kts)
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200/60">
                            <div className="flex items-center gap-1 text-[10px]">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{storm.lat.toFixed(1)}°, {storm.lon.toFixed(1)}°</span>
                            </div>
                            <a
                              href={storm.link || `https://eonet.gsfc.nasa.gov/api/v3/events/${storm.id}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                            >
                              <span>NASA EONET</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {/* NASA EONET Active Wildfires Feed */}
            {activeSidebarTab === 'wildfires' && (
              <div className="mt-3 space-y-2.5 overflow-y-auto max-h-[640px] pr-1">
                {(!wildfireAssessment?.all_active_wildfires || wildfireAssessment.all_active_wildfires.length === 0) ? (
                  <div className="text-center py-12 px-4 text-slate-400">
                    <Flame className="w-8 h-8 mx-auto mb-2 opacity-30 text-rose-500" />
                    <p className="text-xs font-medium text-slate-600">
                      {userLocation
                        ? 'No active wildfire blazes currently recorded globally in open status by NASA EONET.'
                        : 'Click "Check All 6 Hazards" above to query real-time NASA wildfire hotspots.'}
                    </p>
                    {userLocation && (
                      <div className="mt-2 text-[11px] text-emerald-600 font-semibold flex items-center justify-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Wildfire Safe Perimeter</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="text-[11px] font-bold text-slate-500 mb-1 flex items-center justify-between">
                      <span>Active Wildfires (NASA EONET):</span>
                      <span className="text-[10px] text-rose-600 font-semibold">Sorted by Distance</span>
                    </div>

                    {wildfireAssessment.all_active_wildfires.map((fire) => {
                      const isSelected = selectedWildfire?.id === fire.id;
                      const badgeClass =
                        fire.distance_km <= 50
                          ? 'bg-red-600 text-white'
                          : fire.distance_km <= 150
                          ? 'bg-orange-500 text-white'
                          : 'bg-rose-600 text-white';

                      return (
                        <div
                          key={fire.id}
                          onClick={() => handleSelectWildfire(fire)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-rose-50/90 border-rose-300 ring-1 ring-rose-300 shadow-xs'
                              : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">🔥</span>
                              <span className="text-xs font-bold text-slate-900 line-clamp-1">{fire.title}</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-rose-600 whitespace-nowrap">
                              {Math.round(fire.distance_km).toLocaleString()} km away
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}`}>
                              {fire.acres > 0 ? `${Math.round(fire.acres).toLocaleString()} acres burned` : 'Active Thermal Hotspot'}
                            </span>
                            {fire.date && (
                              <span className="text-[10px] text-slate-500">
                                {new Date(fire.date).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200/60">
                            <div className="flex items-center gap-1 text-[10px]">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{fire.lat.toFixed(1)}°, {fire.lon.toFixed(1)}°</span>
                            </div>
                            <a
                              href={fire.link || `https://eonet.gsfc.nasa.gov/api/v3/events/${fire.id}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] text-rose-600 hover:underline flex items-center gap-0.5"
                            >
                              <span>NASA EONET</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
</div>
  );
};

export default LiveTrackingPage;
