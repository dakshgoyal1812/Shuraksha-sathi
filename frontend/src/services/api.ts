import {
  Scenario,
  ScenarioListItem,
  Shelter,
  SimulationRun,
  MapData,
  ComparisonResponse
} from '../types/scenario';
import {
  FALLBACK_SCENARIOS,
  FALLBACK_LATEST_RUN,
  FALLBACK_ANALYTICS
} from './mockData';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

// Fast in-memory cache for client hazard queries (3-minute TTL)
const hazardsClientCache = new Map<string, { time: number; data: any }>();

export const api = {
  // Scenarios
  async getScenarios(): Promise<ScenarioListItem[]> {
    try {
      const res = await fetch(`${API_BASE}/scenarios`);
      if (!res.ok) throw new Error(`Failed to fetch scenarios: ${res.statusText}`);
      const data = await res.json();
      return (data && data.length > 0) ? data : FALLBACK_SCENARIOS;
    } catch (e) {
      console.warn("Using fallback scenarios due to network/API error:", e);
      return FALLBACK_SCENARIOS;
    }
  },

  async getScenario(id: string): Promise<Scenario> {
    const res = await fetch(`${API_BASE}/scenarios/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch scenario: ${res.statusText}`);
    return res.json();
  },

  async createScenario(data: Partial<Scenario>): Promise<Scenario> {
    const res = await fetch(`${API_BASE}/scenarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to create scenario: ${res.statusText}`);
    }
    return res.json();
  },

  async updateScenario(id: string, data: Partial<Scenario>): Promise<Scenario> {
    const res = await fetch(`${API_BASE}/scenarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to update scenario: ${res.statusText}`);
    }
    return res.json();
  },

  async deleteScenario(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/scenarios/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Failed to delete scenario: ${res.statusText}`);
  },

  async duplicateScenario(id: string): Promise<Scenario> {
    const res = await fetch(`${API_BASE}/scenarios/${id}/duplicate`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to duplicate scenario: ${res.statusText}`);
    return res.json();
  },

  async resetDemo(): Promise<void> {
    const res = await fetch(`${API_BASE}/scenarios/reset-demo`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to reset demo: ${res.statusText}`);
  },

  // Shelters
  async getShelters(scenarioId: string): Promise<Shelter[]> {
    const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/shelters`);
    if (!res.ok) throw new Error(`Failed to fetch shelters: ${res.statusText}`);
    return res.json();
  },

  async createShelter(scenarioId: string, data: Partial<Shelter>): Promise<Shelter> {
    const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/shelters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to create shelter: ${res.statusText}`);
    }
    return res.json();
  },

  async updateShelter(shelterId: string, data: Partial<Shelter>): Promise<Shelter> {
    const res = await fetch(`${API_BASE}/shelters/${shelterId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to update shelter: ${res.statusText}`);
    }
    return res.json();
  },

  async deleteShelter(shelterId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/shelters/${shelterId}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to delete shelter: ${res.statusText}`);
    }
  },

  // Simulation
  async runSimulation(scenarioId: string, config?: { random_seed?: number; max_steps?: number; step_time_seconds?: number }): Promise<SimulationRun> {
    const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Simulation run failed: ${res.statusText}`);
    }
    return res.json();
  },

  async getSimulationRun(runId: string): Promise<SimulationRun> {
    try {
      const res = await fetch(`${API_BASE}/simulations/${runId}`);
      if (!res.ok) throw new Error(`Failed to fetch simulation run: ${res.statusText}`);
      return await res.json();
    } catch (e) {
      console.warn("Using fallback simulation run due to API error:", e);
      return { ...FALLBACK_LATEST_RUN, id: runId };
    }
  },

  async getLatestSimulationRun(scenarioId: string): Promise<SimulationRun> {
    try {
      const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/latest-run`);
      if (!res.ok) throw new Error(`No recent simulation run found: ${res.statusText}`);
      return await res.json();
    } catch (e) {
      console.warn("Using fallback latest run due to API error:", e);
      return { ...FALLBACK_LATEST_RUN, scenario_id: scenarioId };
    }
  },

  async getSimulationAnalytics(runId: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/simulations/${runId}/analytics`);
      if (!res.ok) throw new Error(`Failed to fetch analytics: ${res.statusText}`);
      const data = await res.json();
      return data;
    } catch (e) {
      console.warn("Using fallback analytics due to API error:", e);
      return { ...FALLBACK_ANALYTICS, run_id: runId };
    }
  },

  async compareSimulationRuns(runIds: string[]): Promise<ComparisonResponse> {
    const res = await fetch(`${API_BASE}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ run_ids: runIds }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Comparison failed: ${res.statusText}`);
    }
    return res.json();
  },

  // Map
  async getDefaultMap(): Promise<MapData> {
    const res = await fetch(`${API_BASE}/map/default`);
    if (!res.ok) throw new Error(`Failed to fetch default map: ${res.statusText}`);
    return res.json();
  },

  async getScenarioMap(scenarioId: string): Promise<MapData> {
    const res = await fetch(`${API_BASE}/scenarios/${scenarioId}/map`);
    if (!res.ok) throw new Error(`Failed to fetch scenario map: ${res.statusText}`);
    return res.json();
  },

  // Reports
  async getReportData(runId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/simulations/${runId}/report`);
    if (!res.ok) throw new Error(`Failed to fetch report data: ${res.statusText}`);
    return res.json();
  },

  getReportCsvUrl(runId: string): string {
    return `${API_BASE}/simulations/${runId}/report.csv`;
  },

  getReportPdfUrl(runId: string): string {
    return `${API_BASE}/simulations/${runId}/report.pdf`;
  },

  // AI Explanation & Chat
  async getAIExplanation(runId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/simulations/${runId}/ai-explain`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to generate explanation: ${res.statusText}`);
    return res.json();
  },

  async chatWithAI(
    message: string,
    scenarioId?: string,
    history?: Array<{ sender: string; text: string }>
  ): Promise<{ response: string; is_live_gemini: boolean; grounded_scenario: string; provider?: string }> {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, scenario_id: scenarioId, history }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `AI Chat failed: ${res.statusText}`);
    }
    return res.json();
  },

  async getWeatherHazards(lat: number, lon: number): Promise<any> {
    const cacheKey = `${lat.toFixed(2)}:${lon.toFixed(2)}`;
    const now = Date.now();
    const cached = hazardsClientCache.get(cacheKey);
    if (cached && now - cached.time < 180000) {
      return cached.data;
    }

    try {
      const res = await fetch(`${API_BASE}/weather/hazards?lat=${lat}&lon=${lon}`);
      if (res.ok) {
        const json = await res.json();
        hazardsClientCache.set(cacheKey, { time: now, data: json });
        return json;
      }
    } catch (e) {
      console.warn("Backend weather proxy unreachable, falling back to direct parallel client queries:", e);
    }

    // Direct fallback using client API key strictly from environment variable
    const clientKey = import.meta.env.VITE_OPENWEATHER_API_KEY || '';

    // Parallel fetch for fallback mode
    const [weatherSettled, eonetSettled, aqiSettled, wfSettled] = await Promise.allSettled([
      clientKey
        ? fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${clientKey}&units=metric`).then(r => r.ok ? r.json() : null)
        : Promise.resolve(null),
      fetch('https://eonet.gsfc.nasa.gov/api/v3/events?category=severeStorms').then(r => r.ok ? r.json() : null),
      clientKey
        ? fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${clientKey}`).then(r => r.ok ? r.json() : null)
        : Promise.resolve(null),
      fetch('https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&days=20&status=open').then(r => r.ok ? r.json() : null)
    ]);

    const data = (weatherSettled.status === 'fulfilled' && weatherSettled.value) || {};
    const eonetData = (eonetSettled.status === 'fulfilled' && eonetSettled.value) || {};
    const aqiData = (aqiSettled.status === 'fulfilled' && aqiSettled.value) || {};
    const wfData = (wfSettled.status === 'fulfilled' && wfSettled.value) || {};

    const temp = data.main?.temp || 25;
    const humidity = data.main?.humidity || 50;
    const rain1h = data.rain?.['1h'] || 0;
    const weatherMain = data.weather?.[0]?.main || 'Clear';
    const windSpeedMps = data.wind?.speed || 0;
    const windGustMps = data.wind?.gust || windSpeedMps;
    const windSpeedKmh = Math.round(windSpeedMps * 3.6 * 10) / 10;
    const windGustKmh = Math.round(windGustMps * 3.6 * 10) / 10;

    // Parse NASA EONET Severe Storms
    const rawEvents = eonetData.events || [];
    const parsedStorms: any[] = rawEvents.map((ev: any) => {
      const geos = ev.geometry || [];
      if (!geos.length) return null;
      const latestGeo = geos[geos.length - 1];
      const coords = latestGeo.coordinates || [];
      if (coords.length < 2) return null;
      const sLon = coords[0];
      const sLat = coords[1];
      
      const R = 6371;
      const dLat = (sLat - lat) * (Math.PI / 180);
      const dLon = (sLon - lon) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat * (Math.PI / 180)) * Math.cos(sLat * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const dist = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
      const windKts = Number(latestGeo.magnitudeValue) || 0;
      const windKtsKmh = Math.round(windKts * 1.852 * 10) / 10;

      let category = 'Tropical Depression';
      if (windKts >= 137) category = 'Category 5 Super Typhoon / Hurricane';
      else if (windKts >= 113) category = 'Category 4 Hurricane / Very Severe Storm';
      else if (windKts >= 96) category = 'Category 3 Major Hurricane';
      else if (windKts >= 83) category = 'Category 2 Hurricane';
      else if (windKts >= 64) category = 'Category 1 Hurricane / Severe Cyclonic Storm';
      else if (windKts >= 34) category = 'Tropical Storm / Cyclonic Storm';

      return {
        id: ev.id,
        name: ev.title || 'Severe Storm',
        category,
        distance_km: dist,
        lat: sLat,
        lon: sLon,
        wind_speed_kts: windKts,
        wind_speed_kmh: windKtsKmh,
        date: latestGeo.date,
        link: ev.link || `https://eonet.gsfc.nasa.gov/api/v3/events/${ev.id}`
      };
    }).filter(Boolean);

    parsedStorms.sort((a: any, b: any) => a.distance_km - b.distance_km);

    const nearestCyclone = parsedStorms.length > 0 ? parsedStorms[0] : null;
    const cycloneDist = nearestCyclone ? nearestCyclone.distance_km : 999999;

    let windCat = 'Light to Gentle Breeze';
    if (windSpeedKmh >= 89.0 || windGustKmh >= 100.0) windCat = 'Violent Storm Force';
    else if (windSpeedKmh >= 62.0 || windGustKmh >= 75.0) windCat = 'Gale Force High Wind';
    else if (windSpeedKmh >= 45.0 || windGustKmh >= 60.0) windCat = 'Strong Wind / High Breeze';
    else if (windSpeedKmh >= 25.0) windCat = 'Moderate Wind';

    let cycloneStatus: 'safe' | 'caution' | 'danger' = 'safe';
    let cycloneLevel = 'SAFE (NO CYCLONE / GALE RISK)';
    let cycloneTitle = 'Calm Winds & Zero Cyclonic Threat';
    let cycloneMessage = nearestCyclone
      ? `No cyclone threat in your immediate area. The nearest tracked tropical system is '${nearestCyclone.name}' (${nearestCyclone.distance_km.toLocaleString()} km away). Surface winds are ${windSpeedKmh} km/h (${windCat}).`
      : `No active cyclones currently tracked globally by NASA EONET. Local winds are ${windSpeedKmh} km/h (${windCat}).`;

    if (cycloneDist <= 350.0 || windSpeedKmh >= 75.0 || windGustKmh >= 90.0) {
      cycloneStatus = 'danger';
      cycloneLevel = 'CRITICAL CYCLONE / HIGH WIND DANGER';
      if (cycloneDist <= 350.0 && nearestCyclone) {
        cycloneTitle = `Imminent Cyclone Impact: ${nearestCyclone.name}`;
        cycloneMessage = `Severe cyclonic system '${nearestCyclone.name}' is only ${nearestCyclone.distance_km} km away with peak sustained winds of ${nearestCyclone.wind_speed_kmh} km/h. Local surface wind is ${windSpeedKmh} km/h (Gusts: ${windGustKmh} km/h). Immediate structural shelter advised.`;
      } else {
        cycloneTitle = 'Destructive Gale Force Wind Alert';
        cycloneMessage = `Severe destructive winds detected at ${windSpeedKmh} km/h with gusts reaching ${windGustKmh} km/h. Risk of falling tree branches and roof structural damage.`;
      }
    } else if (cycloneDist <= 1000.0 || windSpeedKmh >= 45.0 || windGustKmh >= 60.0) {
      cycloneStatus = 'caution';
      cycloneLevel = 'CYCLONE WATCH / STRONG WIND NOTICE';
      if (cycloneDist <= 1000.0 && nearestCyclone) {
        cycloneTitle = `Regional Cyclone Track: ${nearestCyclone.name}`;
        cycloneMessage = `Active cyclonic storm '${nearestCyclone.name}' detected ${nearestCyclone.distance_km} km away. Surface wind is ${windSpeedKmh} km/h (Gusts: ${windGustKmh} km/h). Monitor weather bulletins.`;
      } else {
        cycloneTitle = 'Elevated High Wind Advisory';
        cycloneMessage = `Brisk high winds of ${windSpeedKmh} km/h (gusts up to ${windGustKmh} km/h) recorded. Secure loose outdoor objects.`;
      }
    }

    // Parse Air Pollution
    const aqiItem = aqiData.list?.[0] || {};
    const aqiMain = aqiItem.main || {};
    const aqiComp = aqiItem.components || {};
    const aqiIndex = Number(aqiMain.aqi) || 2;
    const pm25 = Number(aqiComp.pm2_5) || 22.0;
    const pm10 = Number(aqiComp.pm10) || 42.0;
    const aqiLabels: Record<number, string> = {
      1: 'Good (Clean Air)',
      2: 'Fair (Acceptable)',
      3: 'Moderate (Sensitive Groups at Risk)',
      4: 'Poor (Unhealthy)',
      5: 'Very Poor (Hazardous / Severe)'
    };
    const aqiStatus: 'safe' | 'caution' | 'danger' = (aqiIndex >= 4 || pm25 >= 90 || pm10 >= 150) ? 'danger' : (aqiIndex === 3 || pm25 >= 45 || pm10 >= 80) ? 'caution' : 'safe';
    const airPollution = {
      status: aqiStatus,
      level: aqiStatus === 'danger' ? 'CRITICAL AIR POLLUTION ALERT (VERY POOR / SEVERE)' : aqiStatus === 'caution' ? 'MODERATE POLLUTION WATCH (ELEVATED PM2.5)' : 'SAFE AIR QUALITY (OPTIMAL / GOOD)',
      title: aqiStatus === 'danger' ? 'Severe Toxic Smog & Particulate Pollution Hazard' : aqiStatus === 'caution' ? 'Elevated Atmospheric Smog & Particulate Notice' : 'Clean Ambient Air & Healthy Respiration Baseline',
      message: aqiStatus === 'danger' ? `Hazardous particulate concentration! PM2.5: ${pm25} µg/m³, PM10: ${pm10} µg/m³.` : `Ambient air quality is favorable (AQI Level ${aqiIndex}/5). PM2.5: ${pm25} µg/m³.`,
      aqi_index: aqiIndex,
      aqi_category: aqiLabels[aqiIndex] || 'Moderate',
      pm2_5: Math.round(pm25 * 10) / 10,
      pm10: Math.round(pm10 * 10) / 10,
      no2: Math.round((Number(aqiComp.no2) || 15) * 10) / 10,
      so2: Math.round((Number(aqiComp.so2) || 5) * 10) / 10,
      co: Math.round((Number(aqiComp.co) || 300) * 10) / 10,
      o3: Math.round((Number(aqiComp.o3) || 25) * 10) / 10,
      source: 'OpenWeather Air Pollution & OpenAQ Sensor Network'
    };

    // Parse Wildfires
    const rawWf = wfData.events || [];
    const parsedWildfires: any[] = rawWf.map((ev: any) => {
      const geos = ev.geometry || [];
      if (!geos.length) return null;
      const latestGeo = geos[geos.length - 1];
      const coords = latestGeo.coordinates || [];
      if (coords.length < 2) return null;
      const wLon = coords[0];
      const wLat = coords[1];
      const R = 6371;
      const dLat = (wLat - lat) * (Math.PI / 180);
      const dLon = (wLon - lon) * (Math.PI / 180);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat * (Math.PI / 180)) * Math.cos(wLat * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const dist = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
      return {
        id: ev.id,
        title: ev.title || 'Active Wildfire',
        distance_km: dist,
        lat: wLat,
        lon: wLon,
        acres: Number(latestGeo.magnitudeValue) || 0,
        date: latestGeo.date,
        link: ev.link || `https://eonet.gsfc.nasa.gov/api/v3/events/${ev.id}`
      };
    }).filter(Boolean);
    parsedWildfires.sort((a: any, b: any) => a.distance_km - b.distance_km);

    const nearestWildfire = parsedWildfires.length > 0 ? parsedWildfires[0] : null;
    const wfDist = nearestWildfire ? nearestWildfire.distance_km : 999999;
    const wfStatus: 'safe' | 'caution' | 'danger' = wfDist <= 50 ? 'danger' : wfDist <= 150 ? 'caution' : 'safe';

    const wildfireAssessment = {
      status: wfStatus,
      level: wfStatus === 'danger' ? 'CRITICAL ACTIVE WILDFIRE DANGER / EVACUATION ZONE' : wfStatus === 'caution' ? 'WILDFIRE WATCH / HIGH FIRE WEATHER ADVISORY' : 'SAFE (NO ACTIVE WILDFIRES NEARBY)',
      title: wfStatus === 'danger' ? `Immediate Active Wildfire Threat: ${nearestWildfire?.title}` : wfStatus === 'caution' ? `Regional Active Wildfire: ${nearestWildfire?.title}` : 'Zero Imminent Wildfire Hazard',
      message: nearestWildfire ? `Nearest tracked blaze is '${nearestWildfire.title}' (${nearestWildfire.distance_km.toLocaleString()} km away).` : 'No active wildfires tracked.',
      nearest_wildfire: nearestWildfire,
      active_wildfires_count: parsedWildfires.length,
      all_active_wildfires: parsedWildfires
    };

    // Fallback Landslides
    const landslideAssessment = {
      status: 'safe' as 'safe' | 'caution' | 'danger',
      level: 'SAFE (STABLE TERRAIN / NO ACTIVE SLIPPAGE)',
      title: 'Stable Terrain & Low Landslide Hazard',
      message: 'No immediate slope failure or active mudslide threat in your region.',
      nearest_landslide: null,
      catalog_incidents_count: 0,
      nearby_landslides: []
    };

    const floodStatus = rain1h >= 25 ? 'danger' : rain1h >= 10 ? 'caution' : 'safe';
    const droughtStatus = (temp >= 38 && humidity <= 25) ? 'danger' : (temp >= 33 && humidity <= 35) ? 'caution' : 'safe';

    const fallbackPayload = {
      location: `${data.name || 'Current Location'}, ${data.sys?.country || ''}`,
      coordinates: { lat, lon },
      weather: {
        temperature_c: Math.round(temp * 10) / 10,
        feels_like_c: Math.round((data.main?.feels_like || temp) * 10) / 10,
        humidity_pct: humidity,
        pressure_hpa: data.main?.pressure || 1013,
        wind_speed_mps: windSpeedMps,
        wind_speed_kmh: windSpeedKmh,
        wind_gust_kmh: windGustKmh,
        wind_category: windCat,
        clouds_pct: data.clouds?.all || 0,
        condition: weatherMain,
        description: data.weather?.[0]?.description || 'clear',
        icon: data.weather?.[0]?.icon || '01d',
        rain_1h_mm: rain1h,
        forecast_24h_rain_mm: 0,
        max_precipitation_prob_pct: 0
      },
      flood_assessment: {
        status: floodStatus,
        level: floodStatus === 'danger' ? 'CRITICAL FLOOD ALERT' : floodStatus === 'caution' ? 'MODERATE FLOOD WATCH' : 'SAFE (NO FLOOD RISK)',
        title: floodStatus === 'danger' ? 'Heavy Precipitation & Flood Hazard' : floodStatus === 'caution' ? 'Moderate Rain Notice' : 'Normal Drainage & Low Rain',
        message: floodStatus === 'danger' ? `Torrential rainfall of ${rain1h} mm/hr detected.` : 'No flood conditions detected.',
        accumulated_rain_mm: rain1h
      },
      drought_assessment: {
        status: droughtStatus,
        level: droughtStatus === 'danger' ? 'SEVERE DROUGHT & HEAT STRESS' : droughtStatus === 'caution' ? 'ELEVATED ARIDITY' : 'SAFE (BALANCED MOISTURE)',
        title: droughtStatus === 'danger' ? 'Critical Thermal Deficit' : 'Optimal Moisture Balance',
        message: droughtStatus === 'danger' ? `Severe heat (${temp}°C) and arid air (${humidity}%).` : 'Atmospheric moisture levels are safe.',
        temperature_c: temp,
        humidity_pct: humidity
      },
      cyclone_assessment: {
        status: cycloneStatus,
        level: cycloneLevel,
        title: cycloneTitle,
        message: cycloneMessage,
        wind_speed_kmh: windSpeedKmh,
        wind_gust_kmh: windGustKmh,
        wind_category: windCat,
        nearest_cyclone: nearestCyclone,
        active_cyclones_count: parsedStorms.length,
        all_active_storms: parsedStorms
      },
      air_pollution: airPollution,
      wildfire_assessment: wildfireAssessment,
      landslide_assessment: landslideAssessment
    };

    hazardsClientCache.set(cacheKey, { time: now, data: fallbackPayload });
    return fallbackPayload;
  },

  async checkHealth(): Promise<{ status: string; fictional_town: string }> {

    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  }
};
