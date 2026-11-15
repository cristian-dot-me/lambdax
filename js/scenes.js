/**
 * Real NASA NISAR zone catalog, Red-to-Blue palette stops, and gallery metadata
 * for the LambdaX citizen visualization landing page.
 * Loads verified spatial bounds, capture timestamps, PNG overlays, and statistics
 * from `nisar_live_scenes.json`, falling back seamlessly to built-in defaults
 * when opened offline or over `file://`.
 */
(function (globalScope) {
  'use strict';

  /**
   * Exact 6-stop Red (dry) to Deep Blue (water) color ramp used by NISAR PNG rasters.
   */
  const RED_TO_BLUE_STOPS = {
    x: [0.00, 0.22, 0.45, 0.68, 0.85, 1.00],
    rgb: [
      [220, 38, 38],
      [248, 113, 113],
      [147, 197, 253],
      [59, 130, 246],
      [29, 78, 216],
      [12, 74, 110]
    ]
  };

  /**
   * Plain-language surface moisture legend categories (non-technical wording).
   */
  const PLAIN_HUMIDITY_CATEGORIES = [
    { id: 'water', color: '#0c4a6e', i18nKey: 'hud.legend.water' },
    { id: 'flooded_land', color: '#1d4ed8', i18nKey: 'hud.legend.floodLand' },
    { id: 'flooded_veg', color: '#2563eb', i18nKey: 'hud.legend.floodVeg' },
    { id: 'saturated', color: '#3b82f6', i18nKey: 'hud.legend.saturated' },
    { id: 'humid', color: '#93c5fd', i18nKey: 'hud.legend.humid' },
    { id: 'dry', color: '#f87171', i18nKey: 'hud.legend.dry' },
    { id: 'rock', color: '#dc2626', i18nKey: 'hud.legend.drySoil' }
  ];

  /**
   * Real NASA gallery imagery bundled locally under `PICTURES/`.
   */
  const APPLICATIONS_GALLERY = [
    {
      id: 'maine-coast',
      src: 'PICTURES/hh+hv-imagery-main-USA.png',
      titleKey: 'gallery.card1.title',
      descKey: 'gallery.card1.desc',
      altKey: 'gallery.card1.alt',
      tagKey: 'gallery.card1.tag'
    },
    {
      id: 'north-dakota-crops',
      src: 'PICTURES/north-dakota-crops-USA.png',
      titleKey: 'gallery.card2.title',
      descKey: 'gallery.card2.desc',
      altKey: 'gallery.card2.alt',
      tagKey: 'gallery.card2.tag'
    }
  ];

  const DEFAULT_SANTIAGO_ZONE = {
    zone_id: 'santiago_del_estero_capital',
    view_mode: 'single_map',
    tab_number: 1,
    i18nKey: 'zones.santiago',
    bounds: {
      west: -64.4987,
      south: -27.9933,
      east: -63.8676,
      north: -27.5779
    },
    rows: 42,
    cols: 56,
    blue_image_path: 'nisar_data/santiago_del_estero_capital_gcov_blue.png',
    first_2026_scene: {
      startTime: '2026-06-23T22:23:12Z',
      date: '2026-06-23',
      timeUtc: '22:23',
      platform: 'NASA NISAR',
      blueImagePath: 'nisar_data/santiago_del_estero_capital_gcov_blue.png',
      isFirst2026Image: true
    },
    scenes: [
      {
        startTime: '2026-06-23T22:23:12Z',
        date: '2026-06-23',
        timeUtc: '22:23',
        platform: 'NASA NISAR',
        blueImagePath: 'nisar_data/santiago_del_estero_capital_gcov_blue.png',
        isFirst2026Image: true
      }
    ]
  };

  const DEFAULT_MOZAMBIQUE_ZONE = {
    zone_id: 'mozambique_chokwe_macia_floods_2026',
    view_mode: 'before_after_disaster',
    tab_number: 2,
    i18nKey: 'zones.mozambique',
    bounds: {
      west: 32.80,
      south: -25.15,
      east: 33.35,
      north: -24.40
    },
    rows: 68,
    cols: 50,
    before_scene: {
      startTime: '2026-01-05T03:42:00Z',
      date: '2026-01-05',
      timeUtc: '03:42',
      platform: 'NASA NISAR',
      blue_image_path: 'nisar_data/mozambique_chokwe_macia_floods_2026_before_blue.png',
      overlay_bounds: { west: 32.80, south: -25.15, east: 33.35, north: -24.40 },
      precomputed_stats: {
        flooded_area_ha: 71526,
        mean_wetness_pct: 36.7,
        wet_area_km2: 1218.4,
        low_humidity_pct: 49.5,
        total_polygon_km2: 4614.6
      }
    },
    after_scene: {
      startTime: '2026-01-17T03:42:00Z',
      date: '2026-01-17',
      timeUtc: '03:42',
      platform: 'NASA NISAR',
      blue_image_path: 'nisar_data/mozambique_chokwe_macia_floods_2026_after_blue.png',
      overlay_bounds: { west: 32.80, south: -25.15, east: 33.35, north: -24.40 },
      precomputed_stats: {
        flooded_area_ha: 93215,
        mean_wetness_pct: 38.1,
        wet_area_km2: 1319.8,
        low_humidity_pct: 52.0,
        total_polygon_km2: 4614.6
      }
    }
  };

  const DEFAULT_NEPAL_ZONE = {
    zone_id: 'nepal_china_gyirong_port_floods_2026',
    view_mode: 'before_after_disaster',
    tab_number: 3,
    i18nKey: 'zones.nepal',
    bounds: {
      west: 85.3,
      south: 28.14,
      east: 85.56,
      north: 28.34
    },
    rows: 42,
    cols: 54,
    tracks: [
      {
        track_id: 'track_a_ascending',
        i18nKey: 'tracks.portView',
        bounds: { west: 85.3, south: 28.14, east: 85.56, north: 28.34 },
        rows: 42,
        cols: 54,
        before_scene: {
          startTime: '2026-08-16T12:58:00Z',
          date: '2026-08-16',
          timeUtc: '12:58',
          platform: 'NASA NISAR',
          blue_image_path: 'nisar_data/nepal_china_gyirong_port_floods_2026_track_a_ascending_before_blue.png',
          overlay_bounds: { west: 85.3, south: 28.14, east: 85.56, north: 28.34 },
          precomputed_stats: {
            flooded_area_ha: 56,
            mean_wetness_pct: 13.8,
            wet_area_km2: 1.9,
            low_humidity_pct: 95.5,
            total_polygon_km2: 564.4
          }
        },
        after_scene: {
          startTime: '2026-08-28T12:58:00Z',
          date: '2026-08-28',
          timeUtc: '12:58',
          platform: 'NASA NISAR',
          blue_image_path: 'nisar_data/nepal_china_gyirong_port_floods_2026_track_a_ascending_after_blue.png',
          overlay_bounds: { west: 85.3, south: 28.14, east: 85.56, north: 28.34 },
          precomputed_stats: {
            flooded_area_ha: 6547,
            mean_wetness_pct: 27.4,
            wet_area_km2: 82.3,
            low_humidity_pct: 74.4,
            total_polygon_km2: 564.4
          }
        }
      },
      {
        track_id: 'track_b_descending',
        i18nKey: 'tracks.valleyView',
        bounds: { west: 85.10, south: 27.85, east: 85.60, north: 28.38 },
        rows: 52,
        cols: 48,
        before_scene: {
          startTime: '2026-08-16T12:58:00Z',
          date: '2026-08-16',
          timeUtc: '12:58',
          platform: 'NASA NISAR',
          blue_image_path: 'nisar_data/nepal_china_gyirong_port_floods_2026_track_b_descending_before_blue.png',
          overlay_bounds: { west: 85.10, south: 27.85, east: 85.60, north: 28.38 },
          precomputed_stats: {
            flooded_area_ha: 864,
            mean_wetness_pct: 16.4,
            wet_area_km2: 23.1,
            low_humidity_pct: 93.9,
            total_polygon_km2: 2879.8
          }
        },
        after_scene: {
          startTime: '2026-08-31T23:39:00Z',
          date: '2026-08-31',
          timeUtc: '23:39',
          platform: 'NASA NISAR',
          blue_image_path: 'nisar_data/nepal_china_gyirong_port_floods_2026_track_b_descending_after_blue.png',
          overlay_bounds: { west: 85.10, south: 27.85, east: 85.60, north: 28.38 },
          precomputed_stats: {
            flooded_area_ha: 4320,
            mean_wetness_pct: 19.4,
            wet_area_km2: 127.5,
            low_humidity_pct: 86.0,
            total_polygon_km2: 2879.8
          }
        }
      }
    ],
    before_scene: null,
    after_scene: null
  };

  DEFAULT_NEPAL_ZONE.before_scene = DEFAULT_NEPAL_ZONE.tracks[0].before_scene;
  DEFAULT_NEPAL_ZONE.after_scene = DEFAULT_NEPAL_ZONE.tracks[0].after_scene;

  const DEFAULT_ZONES = [
    DEFAULT_SANTIAGO_ZONE,
    DEFAULT_MOZAMBIQUE_ZONE,
    DEFAULT_NEPAL_ZONE
  ];

  const DEFAULT_ZONES_BY_ID = {
    santiago_del_estero_capital: DEFAULT_SANTIAGO_ZONE,
    mozambique_chokwe_macia_floods_2026: DEFAULT_MOZAMBIQUE_ZONE,
    nepal_china_gyirong_port_floods_2026: DEFAULT_NEPAL_ZONE
  };

  function sanitizeBounds(b) {
    if (!b || typeof b !== 'object') return null;
    return {
      west: Number(b.west),
      south: Number(b.south),
      east: Number(b.east),
      north: Number(b.north)
    };
  }

  function sanitizeStats(rawStats) {
    if (!rawStats || typeof rawStats !== 'object') return null;
    return {
      flooded_area_ha: Number(rawStats.flooded_area_ha || 0),
      mean_wetness_pct: Number(rawStats.mean_wetness_pct || 0),
      wet_area_km2: Number(rawStats.wet_area_km2 || 0),
      low_humidity_pct: Number(rawStats.low_humidity_pct || 0),
      moderate_humidity_pct: Number(rawStats.moderate_humidity_pct || 0),
      high_humidity_pct: Number(rawStats.high_humidity_pct || 0),
      total_polygon_km2: Number(rawStats.total_polygon_km2 || 0)
    };
  }

  /**
   * Strips technical radar fields from an imported scene entry so only citizen-safe
   * metadata (dates, bounds, raster paths, moisture statistics) reaches the UI.
   */
  function sanitizeScene(scene) {
    if (!scene || typeof scene !== 'object') return null;
    const pngPath = scene.blue_image_path || scene.blueImagePath || null;
    const cleanBounds = sanitizeBounds(scene.overlay_bounds || scene.overlayBounds);
    const cleanStats = sanitizeStats(scene.stats || scene.precomputed_stats);
    return {
      startTime: scene.startTime || null,
      date: scene.date || (scene.startTime ? String(scene.startTime).slice(0, 10) : ''),
      timeUtc: scene.timeUtc || (scene.startTime ? String(scene.startTime).slice(11, 16) : '00:00'),
      platform: 'NASA NISAR',
      blue_image_path: pngPath,
      blueImagePath: pngPath,
      overlay_bounds: cleanBounds,
      overlayBounds: cleanBounds,
      stats: cleanStats,
      precomputed_stats: cleanStats,
      isFirst2026Image: Boolean(scene.isFirst2026Image)
    };
  }

  /**
   * Normalizes a single monitoring zone record and strips technical coordinate WKT
   * or polarization metadata.
   */
  function normalizeZone(rawZone, defaultZone) {
    const base = defaultZone || {};
    const merged = Object.assign({}, base, rawZone || {});
    const bounds = sanitizeBounds(merged.bounds || base.bounds || DEFAULT_SANTIAGO_ZONE.bounds);
    const cfg = merged.configuration || {};
    const rows = merged.rows || cfg.rows || base.rows || 42;
    const cols = merged.cols || cfg.cols || base.cols || 56;

    const rawScenes = Array.isArray(merged.scenes) && merged.scenes.length > 0
      ? merged.scenes
      : (base.scenes || []);
    const scenes = rawScenes
      .map(sanitizeScene)
      .filter(Boolean)
      .sort((a, b) => (a.startTime || a.date).localeCompare(b.startTime || b.date));

    let tracks = null;
    const rawTracks = Array.isArray(merged.tracks) && merged.tracks.length > 0
      ? merged.tracks
      : (base.tracks || null);
    if (Array.isArray(rawTracks)) {
      tracks = rawTracks.map((trk, idx) => {
        const fallbackTrack = (base.tracks && base.tracks[idx]) ? base.tracks[idx] : {};
        return {
          track_id: trk.track_id || fallbackTrack.track_id || ('view_' + (idx + 1)),
          i18nKey: fallbackTrack.i18nKey || (idx === 1 ? 'tracks.valleyView' : 'tracks.portView'),
          bounds: sanitizeBounds(trk.bounds || fallbackTrack.bounds || bounds),
          rows: trk.rows || fallbackTrack.rows || rows,
          cols: trk.cols || fallbackTrack.cols || cols,
          before_scene: sanitizeScene(trk.before_scene || fallbackTrack.before_scene),
          after_scene: sanitizeScene(trk.after_scene || fallbackTrack.after_scene)
        };
      });
    }

    const beforeScene = sanitizeScene(merged.before_scene || base.before_scene || (tracks && tracks[0] && tracks[0].before_scene));
    const afterScene = sanitizeScene(merged.after_scene || base.after_scene || (tracks && tracks[0] && tracks[0].after_scene));

    return {
      zone_id: merged.zone_id,
      view_mode: merged.view_mode || base.view_mode || 'single_map',
      tab_number: merged.tab_number || base.tab_number || 1,
      i18nKey: base.i18nKey || 'zones.santiago',
      bounds: bounds,
      rows: Number(rows),
      cols: Number(cols),
      blue_image_path: merged.blue_image_path || base.blue_image_path || null,
      before_scene: beforeScene,
      after_scene: afterScene,
      tracks: tracks,
      scenes: scenes
    };
  }

  /**
   * Merges a `nisar_live_scenes.json` payload with built-in defaults in canonical tab order.
   */
  function mergeZoneCatalog(catalogPayload) {
    const byId = {};
    DEFAULT_ZONES.forEach((zone) => {
      byId[zone.zone_id] = normalizeZone(zone, zone);
    });

    const rawPolygons = (catalogPayload && Array.isArray(catalogPayload.polygons))
      ? catalogPayload.polygons
      : [];

    rawPolygons.forEach((raw) => {
      if (!raw || !raw.zone_id) return;
      const base = DEFAULT_ZONES_BY_ID[raw.zone_id] || null;
      byId[raw.zone_id] = normalizeZone(raw, base);
    });

    const ordered = DEFAULT_ZONES.map((z) => byId[z.zone_id]);
    Object.keys(byId).forEach((id) => {
      if (!DEFAULT_ZONES_BY_ID[id]) ordered.push(byId[id]);
    });
    return ordered;
  }

  /**
   * Fetches real `nisar_live_scenes.json` metadata when served over HTTP(S),
   * falling back cleanly to `DEFAULT_ZONES` on network or `file://` errors.
   */
  async function loadSceneCatalog(url) {
    const targetUrl = url || 'nisar_live_scenes.json';
    if (typeof fetch !== 'function') {
      return mergeZoneCatalog(null);
    }
    try {
      const response = await fetch(targetUrl, { cache: 'no-store' });
      if (!response.ok) return mergeZoneCatalog(null);
      const data = await response.json();
      return mergeZoneCatalog(data);
    } catch (_) {
      return mergeZoneCatalog(null);
    }
  }

  /**
   * Inverts a Red-to-Blue RGB triplet from a real NISAR raster PNG back into
   * estimated moisture percentage in [0, 100], matching the root demo ramp.
   */
  function invertRedBlueRgbToWetnessPct(r, g, b) {
    const xStops = RED_TO_BLUE_STOPS.x;
    const rgbStops = RED_TO_BLUE_STOPS.rgb;
    let bestT = 0.0;
    let bestDist = Infinity;

    for (let i = 0; i < rgbStops.length - 1; i++) {
      const c0 = rgbStops[i];
      const c1 = rgbStops[i + 1];
      const dr = c1[0] - c0[0];
      const dg = c1[1] - c0[1];
      const db = c1[2] - c0[2];
      const lenSq = dr * dr + dg * dg + db * db;
      let u = 0;
      if (lenSq > 0) {
        u = ((r - c0[0]) * dr + (g - c0[1]) * dg + (b - c0[2]) * db) / lenSq;
        u = Math.max(0, Math.min(1, u));
      }
      const pr = c0[0] + u * dr;
      const pg = c0[1] + u * dg;
      const pb = c0[2] + u * db;
      const dist = (r - pr) * (r - pr) + (g - pg) * (g - pg) + (b - pb) * (b - pb);
      if (dist < bestDist) {
        bestDist = dist;
        bestT = xStops[i] + u * (xStops[i + 1] - xStops[i]);
      }
    }

    return Math.max(0, Math.min(100, +(bestT * 100).toFixed(1)));
  }

  const exported = {
    RED_TO_BLUE_STOPS: RED_TO_BLUE_STOPS,
    PLAIN_HUMIDITY_CATEGORIES: PLAIN_HUMIDITY_CATEGORIES,
    APPLICATIONS_GALLERY: APPLICATIONS_GALLERY,
    DEFAULT_ZONES: DEFAULT_ZONES,
    DEFAULT_ZONES_BY_ID: DEFAULT_ZONES_BY_ID,
    mergeZoneCatalog: mergeZoneCatalog,
    loadSceneCatalog: loadSceneCatalog,
    invertRedBlueRgbToWetnessPct: invertRedBlueRgbToWetnessPct,
    getZonesSync: function () {
      return mergeZoneCatalog(null);
    },
    getGalleryItems: function () {
      return APPLICATIONS_GALLERY.slice();
    }
  };

  globalScope.LambdaXScenes = exported;
})(typeof window !== 'undefined' ? window : globalThis);
