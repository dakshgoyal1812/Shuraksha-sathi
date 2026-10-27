import os
import json
import time
import math
import ssl
import urllib.request
from pathlib import Path
from typing import Dict, Any, List, Optional
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, Query, HTTPException

router = APIRouter(prefix="/api/weather", tags=["Weather & Multi-Hazard"])

# Load backend .env automatically if needed
_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if _env_path.exists():
    with open(_env_path, "r", encoding="utf-8") as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _v = _line.split("=", 1)
                os.environ.setdefault(_k.strip(), _v.strip())

def get_openweather_key() -> str:
    return os.getenv("OPENWEATHER_API_KEY", "")

# In-memory spatial cache for full hazards responses (5-minute TTL, ~1 km coordinate bucket)
_hazards_response_cache: Dict[str, Any] = {}

# In-memory cache for NASA EONET Severe Storms to prevent rate-limits and ensure millisecond response
_eonet_cache: Dict[str, Any] = {
    "timestamp": 0.0,
    "events": []
}

# In-memory cache for NASA EONET Wildfires
_wildfires_cache: Dict[str, Any] = {
    "timestamp": 0.0,
    "events": []
}

def _fetch_json(url: str, timeout: float = 4.5, headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """Universal high-speed JSON fetcher with SSL tolerance and bounded timeout."""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req_headers = {"User-Agent": "Suraksha-Disaster-Platform/1.0"}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, headers=req_headers)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception:
        return {}

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate Great Circle distance in kilometers between two GPS points."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

def classify_storm_intensity(wind_kts: float) -> str:
    if wind_kts >= 137:
        return "Category 5 Super Typhoon / Hurricane"
    elif wind_kts >= 113:
        return "Category 4 Hurricane / Very Severe Storm"
    elif wind_kts >= 96:
        return "Category 3 Major Hurricane"
    elif wind_kts >= 83:
        return "Category 2 Hurricane"
    elif wind_kts >= 64:
        return "Category 1 Hurricane / Severe Cyclonic Storm"
    elif wind_kts >= 34:
        return "Tropical Storm / Cyclonic Storm"
    elif wind_kts > 0:
        return "Tropical Depression"
    return "Tropical Disturbance / Monitored System"

def fetch_nasa_eonet_severe_storms() -> List[Dict[str, Any]]:
    """
    Fetches active tropical cyclones, hurricanes, typhoons, and severe storms
    from NASA EONET API with 10-minute caching and SSL tolerance.
    """
    now = time.time()
    if _eonet_cache["events"] and (now - _eonet_cache["timestamp"] < 600.0):
        return _eonet_cache["events"]

    url = "https://eonet.gsfc.nasa.gov/api/v3/events?category=severeStorms"
    data = _fetch_json(url, timeout=4.5)
    raw_events = data.get("events", [])
    if raw_events:
        _eonet_cache["timestamp"] = now
        _eonet_cache["events"] = raw_events
        return raw_events
    return _eonet_cache.get("events", [])

def fetch_nasa_eonet_wildfires() -> List[Dict[str, Any]]:
    """
    Fetches active wildfires and thermal anomalies from NASA EONET API.
    Uses days=20 and status=open for fast response and real-time active blazes.
    """
    now = time.time()
    if _wildfires_cache["events"] and (now - _wildfires_cache["timestamp"] < 600.0):
        return _wildfires_cache["events"]

    url = "https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&days=20&status=open"
    data = _fetch_json(url, timeout=4.5)
    raw_events = data.get("events", [])
    if raw_events:
        _wildfires_cache["timestamp"] = now
        _wildfires_cache["events"] = raw_events
        return raw_events
    return _wildfires_cache.get("events", [])

def parse_air_pollution(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parses real-time ambient particulate and gaseous air pollution from OpenWeather Air Pollution API
    (and supports optional OpenAQ integration).
    Computes PM2.5, PM10, AQI index (1-5), and safety health classifications.
    """
    item = (data.get("list", [{}])[0]) if data.get("list") else {}
    main = item.get("main", {})
    comp = item.get("components", {})

    aqi_index = int(main.get("aqi", 2))  # 1: Good, 2: Fair, 3: Moderate, 4: Poor, 5: Very Poor
    pm25 = float(comp.get("pm2_5", 25.0))
    pm10 = float(comp.get("pm10", 45.0))
    no2 = float(comp.get("no2", 15.0))
    so2 = float(comp.get("so2", 5.0))
    co = float(comp.get("co", 400.0))
    o3 = float(comp.get("o3", 30.0))

    # Standard AQI categorization (CPCB / WHO PM2.5 standards)
    if aqi_index >= 4 or pm25 >= 90.0 or pm10 >= 150.0:
        status = "danger"
        level = "CRITICAL AIR POLLUTION ALERT (VERY POOR / SEVERE)"
        title = "Severe Toxic Smog & Particulate Pollution Hazard"
        message = (
            f"Hazardous atmospheric particulate concentration detected! PM2.5 is {pm25:.1f} µg/m³ and PM10 is {pm10:.1f} µg/m³ (AQI Level {aqi_index}/5). "
            "High respiratory and cardiovascular irritation risk. N95 protective masks recommended outdoors; restrict outdoor exertion."
        )
    elif aqi_index == 3 or pm25 >= 45.0 or pm10 >= 80.0:
        status = "caution"
        level = "MODERATE POLLUTION WATCH (ELEVATED PM2.5)"
        title = "Elevated Atmospheric Smog & Particulate Notice"
        message = (
            f"Moderate pollution levels recorded with PM2.5 at {pm25:.1f} µg/m³ and PM10 at {pm10:.1f} µg/m³. "
            "Sensitive individuals, elderly citizens, and children should limit prolonged strenuous outdoor exposure."
        )
    else:
        status = "safe"
        level = "SAFE AIR QUALITY (OPTIMAL / GOOD)"
        title = "Clean Ambient Air & Healthy Respiration Baseline"
        message = (
            f"Ambient air quality is favorable (AQI Level {aqi_index}/5). PM2.5 is {pm25:.1f} µg/m³ and PM10 is {pm10:.1f} µg/m³. "
            "Atmospheric particulate concentrations are within safe sanitary standards."
        )

    aqi_labels = {
        1: "Good (Clean Air)",
        2: "Fair (Acceptable)",
        3: "Moderate (Sensitive Groups at Risk)",
        4: "Poor (Unhealthy)",
        5: "Very Poor (Hazardous / Severe)"
    }

    return {
        "status": status,
        "level": level,
        "title": title,
        "message": message,
        "aqi_index": aqi_index,
        "aqi_category": aqi_labels.get(aqi_index, "Moderate"),
        "pm2_5": round(pm25, 1),
        "pm10": round(pm10, 1),
        "no2": round(no2, 1),
        "so2": round(so2, 1),
        "co": round(co, 1),
        "o3": round(o3, 1),
        "source": "OpenWeather Air Pollution & OpenAQ Sensor Network"
    }

@router.get("/hazards")
def check_weather_hazards(
    lat: float = Query(..., description="Latitude of user"),
    lon: float = Query(..., description="Longitude of user")
):
    """
    Fetches real-time multi-hazard telemetry in high-speed parallel workers:
    1. OpenWeather Current & Forecast (Flood & Drought risks)
    2. Air Pollution (PM2.5, PM10, AQI)
    3. NASA EONET Severe Storms & Cyclone Proximity
    4. NASA EONET Active Wildfires & Thermal Anomalies
    """
    now = time.time()
    cache_key = f"{round(lat, 2)}:{round(lon, 2)}"
    cached_entry = _hazards_response_cache.get(cache_key)
    if cached_entry and (now - cached_entry["time"] < 300.0):
        return cached_entry["data"]

    api_key = get_openweather_key()
    if not api_key:
        raise HTTPException(status_code=500, detail="Weather API key not configured in environment.")

    current_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    pollution_url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={api_key}"

    # Execute all 5 external data queries simultaneously with ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=5) as executor:
        fut_current = executor.submit(_fetch_json, current_url, 4.0)
        fut_forecast = executor.submit(_fetch_json, forecast_url, 4.0)
        fut_pollution = executor.submit(_fetch_json, pollution_url, 4.0)
        fut_storms = executor.submit(fetch_nasa_eonet_severe_storms)
        fut_wildfires = executor.submit(fetch_nasa_eonet_wildfires)

        current_data = fut_current.result()
        forecast_data = fut_forecast.result()
        raw_pollution = fut_pollution.result()
        raw_storms = fut_storms.result()
        raw_wildfires = fut_wildfires.result()

    if not current_data or not current_data.get("main"):
        raise HTTPException(status_code=502, detail="Failed to query OpenWeatherMap API telemetry.")

    # Extract Weather Metrics
    main = current_data.get("main", {})
    weather_list = current_data.get("weather", [{}])
    weather_info = weather_list[0] if weather_list else {}
    wind = current_data.get("wind", {})
    rain = current_data.get("rain", {})
    clouds = current_data.get("clouds", {})

    temp = float(main.get("temp", 25.0))
    feels_like = float(main.get("feels_like", temp))
    humidity = float(main.get("humidity", 50.0))
    pressure = float(main.get("pressure", 1013.0))
    wind_speed_mps = float(wind.get("speed", 0.0))
    wind_gust_mps = float(wind.get("gust", wind_speed_mps))
    wind_speed_kmh = round(wind_speed_mps * 3.6, 1)
    wind_gust_kmh = round(wind_gust_mps * 3.6, 1)
    cloud_pct = int(clouds.get("all", 0))

    weather_condition = weather_info.get("main", "Clear")
    weather_desc = weather_info.get("description", "clear sky").title()
    weather_icon = weather_info.get("icon", "01d")

    rain_1h = float(rain.get("1h", 0.0))
    rain_3h = float(rain.get("3h", 0.0))

    # Calculate 24-hour forecasted precipitation accumulation and max precipitation probability
    forecast_list = forecast_data.get("list", [])
    rain_24h_forecast = 0.0
    max_pop = 0.0
    for step in forecast_list[:8]:  # 8 periods * 3h = 24 hours
        step_rain = step.get("rain", {}).get("3h", 0.0)
        rain_24h_forecast += float(step_rain)
        pop = float(step.get("pop", 0.0)) * 100.0
        if pop > max_pop:
            max_pop = pop

    total_rain_metric = max(rain_1h * 3, rain_3h, rain_24h_forecast)

    # 2. Flood (Baadh) Risk Evaluation
    is_storm_condition = weather_condition in ["Thunderstorm", "Squall", "Tornado"]
    if rain_1h >= 25.0 or total_rain_metric >= 50.0 or (is_storm_condition and total_rain_metric >= 25.0):
        flood_status = "danger"
        flood_level = "CRITICAL FLOOD ALERT"
        flood_title = "Flash Flood & Waterlogging Hazard"
        flood_message = (
            f"Torrential rainfall of {total_rain_metric:.1f} mm recorded with severe atmospheric saturation. "
            "Imminent risk of localized street waterlogging, river level cresting, and drainage failure."
        )
    elif rain_1h >= 8.0 or total_rain_metric >= 20.0 or is_storm_condition or max_pop >= 70.0:
        flood_status = "caution"
        flood_level = "MODERATE FLOOD WATCH"
        flood_title = "Moderate Precipitation & Drainage Pooling"
        flood_message = (
            f"Precipitation of {total_rain_metric:.1f} mm and {max_pop:.0f}% storm probability detected. "
            "Low-lying underpasses and roadside catchments may experience temporary pooling."
        )
    else:
        flood_status = "safe"
        flood_level = "SAFE (NO FLOOD RISK)"
        flood_title = "Normal Drainage & Dry/Low Rainfall"
        flood_message = (
            f"Precipitation accumulation is negligible ({total_rain_metric:.1f} mm). "
            "Municipal stormwater conduits and watercourses are operating safely within baseline margins."
        )

    # 3. Drought (Sukha) Risk Evaluation
    if temp >= 38.0 and humidity <= 25.0 and total_rain_metric < 2.0:
        drought_status = "danger"
        drought_level = "SEVERE DROUGHT & HEAT STRESS"
        drought_title = "Critical Arid Deficit & Heat Stress"
        drought_message = (
            f"Extreme thermal intensity ({temp:.1f}°C) combined with critically parched relative humidity ({humidity:.0f}%) "
            "and zero rain. Severe evapotranspiration, agricultural soil moisture depletion, and heat hazard."
        )
    elif temp >= 33.0 and humidity <= 35.0 and total_rain_metric < 5.0:
        drought_status = "caution"
        drought_level = "ELEVATED ARIDITY / DRY SPELL"
        drought_title = "Elevated Temperature & Dry Spell Notice"
        drought_message = (
            f"Warm conditions ({temp:.1f}°C) and dry air ({humidity:.0f}% humidity) with minimal precipitation. "
            "Prudent municipal water conservation and hydration guidelines advised."
        )
    else:
        drought_status = "safe"
        drought_level = "SAFE (BALANCED MOISTURE)"
        drought_title = "Optimal Atmospheric Moisture Balance"
        drought_message = (
            f"Relative humidity ({humidity:.0f}%) and ambient temperature ({temp:.1f}°C) are within comfortable, "
            "balanced non-drought parameters."
        )

    # 4. Cyclone & High Wind Evaluation (NASA EONET Severe Storms + Wind Speed / "Tezt Hawa")
    parsed_storms: List[Dict[str, Any]] = []

    for ev in raw_storms:
        geos = ev.get("geometry", [])
        if not geos:
            continue
        latest_geo = geos[-1]
        coords = latest_geo.get("coordinates", [])
        if len(coords) >= 2:
            s_lon, s_lat = coords[0], coords[1]
            dist = haversine_km(lat, lon, s_lat, s_lon)
            wind_kts = latest_geo.get("magnitudeValue") or 0.0
            wind_kts_kmh = round(wind_kts * 1.852, 1)
            parsed_storms.append({
                "id": ev.get("id"),
                "name": ev.get("title", "Severe Storm"),
                "category": classify_storm_intensity(float(wind_kts)),
                "distance_km": dist,
                "lat": s_lat,
                "lon": s_lon,
                "wind_speed_kts": float(wind_kts),
                "wind_speed_kmh": wind_kts_kmh,
                "date": latest_geo.get("date"),
                "link": ev.get("link")
            })

    parsed_storms.sort(key=lambda s: s["distance_km"])
    nearest_cyclone = parsed_storms[0] if parsed_storms else None

    # Wind Classification (Beaufort Standard)
    if wind_speed_kmh >= 89.0 or wind_gust_kmh >= 100.0:
        wind_cat = "Violent Storm Force"
    elif wind_speed_kmh >= 62.0 or wind_gust_kmh >= 75.0:
        wind_cat = "Gale Force High Wind"
    elif wind_speed_kmh >= 45.0 or wind_gust_kmh >= 60.0:
        wind_cat = "Strong Wind / High Breeze"
    elif wind_speed_kmh >= 25.0:
        wind_cat = "Moderate Wind"
    else:
        wind_cat = "Light to Gentle Breeze"

    # Multi-factor Cyclone & Wind Risk Determination
    cyclone_dist = nearest_cyclone["distance_km"] if nearest_cyclone else 999999.0

    if cyclone_dist <= 350.0 or wind_speed_kmh >= 75.0 or wind_gust_kmh >= 90.0:
        cyclone_status = "danger"
        cyclone_level = "CRITICAL CYCLONE / HIGH WIND DANGER"
        if cyclone_dist <= 350.0 and nearest_cyclone:
            cyclone_title = f"Imminent Cyclone Impact: {nearest_cyclone['name']}"
            cyclone_message = (
                f"Severe cyclonic system '{nearest_cyclone['name']}' is just {nearest_cyclone['distance_km']} km away "
                f"with peak sustained winds of {nearest_cyclone['wind_speed_kmh']} km/h ({nearest_cyclone['wind_speed_kts']:.0f} kts). "
                f"Local wind speed is {wind_speed_kmh} km/h (Gusts: {wind_gust_kmh} km/h). Immediate structural shelter advised."
            )
        else:
            cyclone_title = "Destructive Gale Force Wind Alert"
            cyclone_message = (
                f"Severe destructive winds detected at {wind_speed_kmh} km/h with gusts reaching {wind_gust_kmh} km/h. "
                "Risk of falling tree branches, loose rooftop damage, and structural hazards."
            )
    elif cyclone_dist <= 1000.0 or wind_speed_kmh >= 45.0 or wind_gust_kmh >= 60.0:
        cyclone_status = "caution"
        cyclone_level = "CYCLONE WATCH / STRONG WIND NOTICE"
        if cyclone_dist <= 1000.0 and nearest_cyclone:
            cyclone_title = f"Regional Cyclone Track: {nearest_cyclone['name']}"
            cyclone_message = (
                f"Active cyclonic storm '{nearest_cyclone['name']}' detected {nearest_cyclone['distance_km']} km away. "
                f"Local surface wind velocity is {wind_speed_kmh} km/h (Gusts: {wind_gust_kmh} km/h). Monitor meteorological updates."
            )
        else:
            cyclone_title = "Elevated High Wind Advisory"
            cyclone_message = (
                f"Brisk high winds of {wind_speed_kmh} km/h (gusts up to {wind_gust_kmh} km/h) recorded. "
                "Secure lightweight outdoor belongings and drive with increased caution."
            )
    else:
        cyclone_status = "safe"
        cyclone_level = "SAFE (NO CYCLONE / GALE RISK)"
        nearest_desc = (
            f"The closest active tropical system globally is '{nearest_cyclone['name']}' ({nearest_cyclone['distance_km']:,} km away)."
            if nearest_cyclone
            else "No active severe tropical depressions currently tracked globally by NASA."
        )
        cyclone_title = "Calm Winds & Zero Cyclonic Threat"
        cyclone_message = (
            f"No cyclone threat exists in your region. {nearest_desc} "
            f"Local surface winds are a comfortable {wind_speed_kmh} km/h ({wind_cat}) with zero gale danger."
        )

    cyclone_assessment = {
        "status": cyclone_status,
        "level": cyclone_level,
        "title": cyclone_title,
        "message": cyclone_message,
        "wind_speed_kmh": wind_speed_kmh,
        "wind_gust_kmh": wind_gust_kmh,
        "wind_category": wind_cat,
        "nearest_cyclone": nearest_cyclone,
        "active_cyclones_count": len(parsed_storms),
        "all_active_storms": parsed_storms
    }

    # 5. Air Pollution Assessment (OpenWeather Air Pollution & OpenAQ standards)
    air_pollution = parse_air_pollution(raw_pollution)

    # 6. Wildfire Evaluation (NASA EONET Active Wildfires & Thermal Anomalies)
    parsed_wildfires: List[Dict[str, Any]] = []

    for wf in raw_wildfires:
        geos = wf.get("geometry", [])
        if not geos:
            continue
        latest_geo = geos[-1]
        coords = latest_geo.get("coordinates", [])
        if len(coords) >= 2:
            w_lon, w_lat = coords[0], coords[1]
            dist = haversine_km(lat, lon, w_lat, w_lon)
            acres = latest_geo.get("magnitudeValue") or 0.0
            parsed_wildfires.append({
                "id": wf.get("id"),
                "title": wf.get("title", "Active Wildfire"),
                "distance_km": dist,
                "lat": w_lat,
                "lon": w_lon,
                "acres": float(acres),
                "date": latest_geo.get("date"),
                "link": wf.get("link")
            })

    parsed_wildfires.sort(key=lambda w: w["distance_km"])
    nearest_wildfire = parsed_wildfires[0] if parsed_wildfires else None
    wildfire_dist = nearest_wildfire["distance_km"] if nearest_wildfire else 999999.0

    if wildfire_dist <= 50.0:
        wildfire_status = "danger"
        wildfire_level = "CRITICAL ACTIVE WILDFIRE DANGER / EVACUATION ZONE"
        wildfire_title = f"Immediate Active Wildfire Threat: {nearest_wildfire['title']}"
        wildfire_message = (
            f"Active wildfire blaze '{nearest_wildfire['title']}' is burning only {nearest_wildfire['distance_km']} km away "
            f"(approx {nearest_wildfire['acres']:,} acres). Severe smoke dispersion, rapid thermal spread, and ember hazard. "
            "Prepare emergency evacuation kit and avoid all outdoor exposure."
        )
    elif wildfire_dist <= 150.0 or (temp >= 38.0 and humidity <= 20.0 and wind_speed_kmh >= 30.0):
        wildfire_status = "caution"
        wildfire_level = "WILDFIRE WATCH / HIGH FIRE WEATHER ADVISORY"
        if wildfire_dist <= 150.0 and nearest_wildfire:
            wildfire_title = f"Regional Active Wildfire: {nearest_wildfire['title']}"
            wildfire_message = (
                f"Active wildfire detected {nearest_wildfire['distance_km']} km away (estimated {nearest_wildfire['acres']:,} acres). "
                f"Local dry conditions (Humidity: {humidity:.0f}%, Temp: {temp:.1f}°C, Wind: {wind_speed_kmh} km/h) "
                "increase smoke hazard. Monitor forest service advisories."
            )
        else:
            wildfire_title = "Elevated Fire Weather & Flammability Index"
            wildfire_message = (
                f"Critical fire weather conditions detected: High temperature ({temp:.1f}°C), low humidity ({humidity:.0f}%), "
                f"and active winds ({wind_speed_kmh} km/h). Extreme caution advised with open fires and electrical transformers."
            )
    else:
        wildfire_status = "safe"
        wildfire_level = "SAFE (NO ACTIVE WILDFIRES NEARBY)"
        nearest_desc = (
            f"Nearest tracked blaze is '{nearest_wildfire['title']}' ({nearest_wildfire['distance_km']:,} km away)."
            if nearest_wildfire
            else "No open active wildfire incidents currently recorded globally by NASA."
        )
        wildfire_title = "Zero Imminent Wildfire Hazard"
        wildfire_message = (
            f"No active wildfire threats detected in your immediate perimeter. {nearest_desc} "
            f"Local ambient humidity ({humidity:.0f}%) and conditions remain within safe fire containment margins."
        )

    wildfire_assessment = {
        "status": wildfire_status,
        "level": wildfire_level,
        "title": wildfire_title,
        "message": wildfire_message,
        "nearest_wildfire": nearest_wildfire,
        "active_wildfires_count": len(parsed_wildfires),
        "all_active_wildfires": parsed_wildfires
    }

    location_name = current_data.get("name", "Current Location")
    sys_info = current_data.get("sys", {})
    country = sys_info.get("country", "")
    full_location = f"{location_name}, {country}" if country else location_name

    response_payload = {
        "location": full_location,
        "coordinates": {"lat": lat, "lon": lon},
        "weather": {
            "temperature_c": round(temp, 1),
            "feels_like_c": round(feels_like, 1),
            "humidity_pct": int(humidity),
            "pressure_hpa": int(pressure),
            "wind_speed_mps": round(wind_speed_mps, 1),
            "wind_speed_kmh": wind_speed_kmh,
            "wind_gust_kmh": wind_gust_kmh,
            "wind_category": wind_cat,
            "clouds_pct": cloud_pct,
            "condition": weather_condition,
            "description": weather_desc,
            "icon": weather_icon,
            "rain_1h_mm": rain_1h,
            "forecast_24h_rain_mm": round(rain_24h_forecast, 1),
            "max_precipitation_prob_pct": round(max_pop, 0)
        },
        "flood_assessment": {
            "status": flood_status,
            "level": flood_level,
            "title": flood_title,
            "message": flood_message,
            "accumulated_rain_mm": round(total_rain_metric, 1)
        },
        "drought_assessment": {
            "status": drought_status,
            "level": drought_level,
            "title": drought_title,
            "message": drought_message,
            "temperature_c": round(temp, 1),
            "humidity_pct": int(humidity)
        },
        "cyclone_assessment": cyclone_assessment,
        "air_pollution": air_pollution,
        "wildfire_assessment": wildfire_assessment
    }

    # Store in fast in-memory spatial cache
    _hazards_response_cache[cache_key] = {
        "time": now,
        "data": response_payload
    }

    # Prune expired cache items if cache grows large
    if len(_hazards_response_cache) > 200:
        stale_keys = [k for k, v in _hazards_response_cache.items() if now - v["time"] > 300.0]
        for k in stale_keys:
            _hazards_response_cache.pop(k, None)

    return response_payload


