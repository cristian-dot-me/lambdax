/**
 * Interactive Leaflet & Real NISAR Red-to-Blue Map Controller for LambdaX Citizen HUD.
 * Powers single-region inspection (Santiago del Estero) and synchronized Before/After flood
 * comparisons (Mozambique & Nepal–China), sharing core math and data structures with root `index.html`.
 */
(function (globalScope) {
  'use strict';

  const RIO_DULCE_WAYPOINTS = [
    [-27.578, -64.485],
    [-27.675, -64.382],
    [-27.752, -64.285],
    [-27.788, -64.250],
    [-27.848, -64.178],
    [-27.915, -64.095],
    [-27.992, -64.015]
  ];

  const CATEGORY_META = {
    en: {
      water: {
        color: '#0c4a6e',
        badgeText: 'OPEN WATER (100% WATER)',
        surfaceTag: 'River, lagoon, reservoir, or water body',
        citizenDesc: 'Open surface water such as a river channel or lagoon. Deep navy blue marks standing water.'
      },
      flooded_land: {
        color: '#1d4ed8',
        badgeText: 'FLOODED AREA / WATER-COVERED',
        surfaceTag: 'Riverbank or low ground with standing water',
        citizenDesc: 'Ground partially covered by floodwater or saturated mud along a bank. Intense blue indicates flooding.'
      },
      flooded_veg: {
        color: '#2563eb',
        badgeText: 'FLOODED VEGETATION',
        surfaceTag: 'Trees or grasslands with water underneath',
        citizenDesc: 'Satellite readings detect standing water underneath woodland or marsh vegetation.'
      },
      saturated: {
        color: '#3b82f6',
        badgeText: 'VERY WET SOIL',
        surfaceTag: 'Saturated soil with high water content',
        citizenDesc: 'Soil holds a high amount of surface water. Medium blue highlights very wet or muddy terrain.'
      },
      humid: {
        color: '#93c5fd',
        badgeText: 'NORMAL MOISTURE',
        surfaceTag: 'Balanced soil favorable for crops',
        citizenDesc: 'Light sky blue indicates healthy surface moisture supportive for crops, pastures, and woods.'
      },
      dry: {
        color: '#f87171',
        badgeText: 'LOW MOISTURE',
        surfaceTag: 'Soil with low surface moisture',
        citizenDesc: 'Light red marks terrain retaining little surface moisture and starting to dry out.'
      },
      arid_rock: {
        color: '#dc2626',
        badgeText: 'DRY SOIL OR URBAN AREA',
        surfaceTag: 'Dry terrain, road, or built-up area',
        citizenDesc: 'Intense red marks dry ground, bare soil, roads, or buildings holding minimal surface water.'
      },
      nodata: {
        color: '#475569',
        badgeText: 'NO COVERAGE ON THIS DATE',
        surfaceTag: 'Edge outside the satellite pass',
        citizenDesc: 'This edge fell outside the area captured by NISAR on this specific date.'
      }
    },
    es: {
      water: {
        color: '#0c4a6e',
        badgeText: 'AGUA LIBRE (100% AGUA)',
        surfaceTag: 'Río, laguna, embalse o espejo de agua',
        citizenDesc: 'Hay agua libre en la superficie (cauce de río o laguna). El azul marino profundo indica agua.'
      },
      flooded_land: {
        color: '#1d4ed8',
        badgeText: 'ZONA ANEGADA / CON AGUA',
        surfaceTag: 'Orilla o terreno bajo con agua acumulada',
        citizenDesc: 'Terreno cubierto por agua o barro muy profundo en la orilla. El azul intenso señala anegamiento.'
      },
      flooded_veg: {
        color: '#2563eb',
        badgeText: 'VEGETACIÓN CON AGUA',
        surfaceTag: 'Árboles o pastizales con agua debajo',
        citizenDesc: 'El satélite detecta agua acumulada sobre el suelo debajo de la vegetación o monte.'
      },
      saturated: {
        color: '#3b82f6',
        badgeText: 'TIERRA MUY MOJADA',
        surfaceTag: 'Suelo saturado con exceso de humedad',
        citizenDesc: 'El suelo conserva mucha agua en superficie. El azul medio marca sectores muy húmedos o con barro.'
      },
      humid: {
        color: '#93c5fd',
        badgeText: 'HUMEDAD NORMAL',
        surfaceTag: 'Tierra firme con buena reserva de agua',
        citizenDesc: 'El celeste claro señala humedad equilibrada, favorable para cultivos, pasturas y monte.'
      },
      dry: {
        color: '#f87171',
        badgeText: 'POCA HUMEDAD',
        surfaceTag: 'Suelo con baja humedad superficial',
        citizenDesc: 'El rojo claro indica terreno que conserva poca humedad en superficie y empieza a secarse.'
      },
      arid_rock: {
        color: '#dc2626',
        badgeText: 'SUELO SECO O ZONA URBANA',
        surfaceTag: 'Terreno seco, camino o área edificada',
        citizenDesc: 'El rojo intenso muestra suelo seco, caminos o ciudad donde casi no hay agua superficial.'
      },
      nodata: {
        color: '#475569',
        badgeText: 'SIN COBERTURA EN ESTA FECHA',
        surfaceTag: 'Borde fuera de la pasada satelital',
        citizenDesc: 'Este borde quedó fuera de la cobertura capturada por NISAR en esta fecha.'
      }
    }
  };

  function getLang() {
    if (globalScope.LambdaXI18N && typeof globalScope.LambdaXI18N.getCurrentLang === 'function') {
      return globalScope.LambdaXI18N.getCurrentLang();
    }
    return 'en';
  }

  function translate(key) {
    if (globalScope.LambdaXI18N && typeof globalScope.LambdaXI18N.getTranslation === 'function') {
      return globalScope.LambdaXI18N.getTranslation(getLang(), key);
    }
    return key;
  }

  function classifyWetnessPct(humidityPct) {
    if (humidityPct >= 95.0) return 'water';
    if (humidityPct >= 81.0) return 'flooded_land';
    if (humidityPct >= 72.0) return 'flooded_veg';
    if (humidityPct >= 48.0) return 'saturated';
    if (humidityPct >= 26.0) return 'humid';
    if (humidityPct >= 12.0) return 'dry';
    return 'arid_rock';
  }

  function getCategoryMeta(type, lang) {
    const safeLang = lang === 'es' ? 'es' : 'en';
    const bag = CATEGORY_META[safeLang] || CATEGORY_META.en;
    return bag[type] || bag.humid;
  }

  function lonToTileX(lon, zoom) {
    return ((lon + 180) / 360) * Math.pow(2, zoom);
  }

  function latToTileY(lat, zoom) {
    const rad = (lat * Math.PI) / 180;
    return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, zoom);
  }

  function computeSeasonalOffset(dateStr, midLat) {
    if (!dateStr) return 0;
    const d = new Date(dateStr + 'T12:00:00Z');
    const dayOfYear = Math.floor((d - new Date(Date.UTC(d.getUTCFullYear(), 0, 0))) / 86400000) || 15;
    const peakDoy = midLat < 0 ? 40 : 210;
    const wave = Math.cos(((dayOfYear - peakDoy) / 365.25) * 2 * Math.PI);
    const burst = Math.max(0, Math.sin(dayOfYear * 0.45) * (wave > 0 ? 11.5 : 3.5));
    return +(wave * 10.5 + burst).toFixed(1);
  }

  function formatNumber(n) {
    return Number(n).toLocaleString();
  }

  class LambdaXMapController {
    constructor() {
      const scenesApi = globalScope.LambdaXScenes;
      this.scenesApi = scenesApi;
      this.zones = scenesApi ? scenesApi.getZonesSync() : [];
      this.activeZoneIndex = 0;
      this.activeTrackIndex = 0;
      this.activeSceneIndex = 0;
      this.overlayOpacity = 0.78;
      this.selectedSpot = null;

      this.rasterCache = new Map();
      this.surfaceCache = { key: '', cells: null };

      this.hasLeaflet = typeof globalScope.L !== 'undefined';
      this.mapSingle = null;
      this.mapBefore = null;
      this.mapAfter = null;
      this.singleBaseControl = null;
      this.singleBaseLayers = null;

      this.overlays = {
        single: null,
        before: null,
        after: null,
        boundsSingle: null,
        boundsBefore: null,
        boundsAfter: null,
        riverLayer: null,
        highlightSingle: null,
        highlightBefore: null,
        highlightAfter: null
      };

      this.isSyncingViewports = false;
      this._initialized = false;
    }

    /**
     * Boots the Citizen HUD: wires DOM events, initializes Leaflet (or offline fallback),
     * loads `nisar_live_scenes.json`, and activates Tab 1 (Santiago del Estero).
     */
    async init() {
      if (typeof document === 'undefined') return this;
      this.bindDomEvents();
      this.initMaps();

      if (this.scenesApi && typeof this.scenesApi.loadSceneCatalog === 'function') {
        const loaded = await this.scenesApi.loadSceneCatalog('nisar_live_scenes.json');
        if (Array.isArray(loaded) && loaded.length > 0) {
          this.zones = loaded;
        }
      }

      await this.selectZone(0);
      this._initialized = true;
      return this;
    }

    getActiveZone() {
      const baseZone = this.zones[this.activeZoneIndex] || this.zones[0];
      if (!baseZone) return null;
      if (!Array.isArray(baseZone.tracks) || baseZone.tracks.length === 0) {
        return baseZone;
      }
      const trk = baseZone.tracks[this.activeTrackIndex] || baseZone.tracks[0];
      return Object.assign({}, baseZone, {
        bounds: trk.bounds || baseZone.bounds,
        rows: trk.rows || baseZone.rows,
        cols: trk.cols || baseZone.cols,
        before_scene: trk.before_scene || baseZone.before_scene,
        after_scene: trk.after_scene || baseZone.after_scene,
        active_track: trk
      });
    }

    bindDomEvents() {
      document.querySelectorAll('[data-zone-index]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-zone-index')) || 0;
          this.selectZone(idx);
        });
      });

      const sceneSelect = document.getElementById('hud-scene-select');
      if (sceneSelect) {
        sceneSelect.addEventListener('change', async () => {
          this.activeSceneIndex = Number(sceneSelect.value) || 0;
          this.updateSingleSceneNote();
          await this.renderSingleMapOverlay();
          const zone = this.getActiveZone();
          if (this.selectedSpot) {
            this.handleMapClick(this.selectedSpot.lat, this.selectedSpot.lon, this.selectedSpot.clickedBefore);
          } else if (zone) {
            this.inspectZoneCenter(zone);
          }
        });
      }

      const handleOpacityInput = (val) => {
        this.setOverlayTransparency(Number(val));
      };

      const singleSlider = document.getElementById('hud-opacity-slider');
      if (singleSlider) {
        singleSlider.addEventListener('input', (e) => handleOpacityInput(e.target.value));
      }

      const compareSlider = document.getElementById('hud-compare-opacity-slider');
      if (compareSlider) {
        compareSlider.addEventListener('input', (e) => handleOpacityInput(e.target.value));
      }

      const baseSelect = document.getElementById('hud-basemap-select');
      if (baseSelect) {
        baseSelect.addEventListener('change', () => this.switchSingleBaseLayer(baseSelect.value));
      }

      document.addEventListener('lambdax:langchange', () => {
        this.handleLanguageChange();
      });
    }

    createLeafletBaseLayers() {
      const L = globalScope.L;
      const esriSat = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, attribution: '© Esri, Maxar' }
      );
      const esriLabels = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      );
      const esriRoads = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, opacity: 0.8 }
      );
      const hybridGroup = L.layerGroup([esriSat, esriRoads, esriLabels]);

      return {
        defaultLayer: hybridGroup,
        layers: { hybrid: hybridGroup }
      };
    }

    initMaps() {
      if (!this.hasLeaflet) {
        this.bindFallbackClick('hud-map-single', false);
        this.bindFallbackClick('hud-map-before', true);
        this.bindFallbackClick('hud-map-after', false);
        return;
      }

      const L = globalScope.L;
      const elSingle = document.getElementById('hud-map-single');
      const elBefore = document.getElementById('hud-map-before');
      const elAfter = document.getElementById('hud-map-after');
      if (!elSingle || !elBefore || !elAfter) return;

      this.singleBaseLayers = this.createLeafletBaseLayers();
      this.mapSingle = L.map(elSingle, {
        center: [-27.7856, -64.1832],
        zoom: 11,
        minZoom: 4,
        preferCanvas: true,
        layers: [this.singleBaseLayers.defaultLayer]
      });

      this.overlays.riverLayer = L.layerGroup().addTo(this.mapSingle);
      L.polyline(RIO_DULCE_WAYPOINTS, {
        color: '#38bdf8',
        weight: 2.8,
        opacity: 0.85,
        interactive: false
      }).addTo(this.overlays.riverLayer);

      const baseA = this.createLeafletBaseLayers();
      this.mapBefore = L.map(elBefore, {
        center: [-24.775, 33.075],
        zoom: 10,
        minZoom: 4,
        preferCanvas: true,
        layers: [baseA.defaultLayer],
        zoomControl: false
      });

      const baseB = this.createLeafletBaseLayers();
      this.mapAfter = L.map(elAfter, {
        center: [-24.775, 33.075],
        zoom: 10,
        minZoom: 4,
        preferCanvas: true,
        layers: [baseB.defaultLayer],
        zoomControl: false
      });

      this.syncViewportPair(this.mapBefore, this.mapAfter);
      this.syncViewportPair(this.mapAfter, this.mapBefore);

      this.mapSingle.on('click', (ev) => this.handleMapClick(ev.latlng.lat, ev.latlng.lng, false));
      this.mapBefore.on('click', (ev) => this.handleMapClick(ev.latlng.lat, ev.latlng.lng, true));
      this.mapAfter.on('click', (ev) => this.handleMapClick(ev.latlng.lat, ev.latlng.lng, false));

      this.refreshLeafletLayerControl();
    }

    bindFallbackClick(containerId, clickedBefore) {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.addEventListener('click', (ev) => {
        const zone = this.getActiveZone();
        if (!zone) return;
        const rect = container.getBoundingClientRect();
        let left = rect.left;
        let top = rect.top;
        let width = rect.width;
        let height = rect.height;

        const img = container.querySelector && container.querySelector('.hud-fallback-raster');
        if (img && img.naturalWidth > 0 && img.naturalHeight > 0 && width > 0 && height > 0) {
          const imgRatio = img.naturalWidth / img.naturalHeight;
          const boxRatio = width / height;
          if (imgRatio > boxRatio) {
            const fitH = width / imgRatio;
            top += (height - fitH) / 2;
            height = fitH;
          } else {
            const fitW = height * imgRatio;
            left += (width - fitW) / 2;
            width = fitW;
          }
        }

        const fx = width > 0 ? Math.max(0, Math.min(1, (ev.clientX - left) / width)) : 0.5;
        const fy = height > 0 ? Math.max(0, Math.min(1, (ev.clientY - top) / height)) : 0.5;
        const b = zone.bounds;
        const lon = b.west + fx * (b.east - b.west);
        const lat = b.north - fy * (b.north - b.south);
        this.handleMapClick(lat, lon, clickedBefore);
      });
    }

    syncViewportPair(src, dst) {
      if (!src || !dst) return;
      src.on('move', () => {
        if (this.isSyncingViewports) return;
        this.isSyncingViewports = true;
        dst.setView(src.getCenter(), src.getZoom(), { animate: false });
        this.isSyncingViewports = false;
      });
    }

    switchSingleBaseLayer(layerKey) {
      if (!this.mapSingle || !this.singleBaseLayers) return;
      const mapLayers = this.singleBaseLayers.layers;
      Object.values(mapLayers).forEach((lyr) => {
        if (this.mapSingle.hasLayer(lyr)) this.mapSingle.removeLayer(lyr);
      });
      if (mapLayers[layerKey]) {
        mapLayers[layerKey].addTo(this.mapSingle);
      }
    }

    refreshLeafletLayerControl() {
      if (!this.hasLeaflet || !this.mapSingle || !this.singleBaseLayers) return;
      const L = globalScope.L;
      if (this.singleBaseControl) {
        this.mapSingle.removeControl(this.singleBaseControl);
      }
      const { hybrid } = this.singleBaseLayers.layers;
      const baseMaps = {};
      baseMaps[translate('hud.controls.baseMapSatStreets')] = hybrid;
      this.singleBaseControl = L.control.layers(baseMaps, null, { position: 'topleft', collapsed: true }).addTo(this.mapSingle);
    }

    setOverlayTransparency(percentValue) {
      const pct = Math.max(0, Math.min(100, Number(percentValue) || 0));
      this.overlayOpacity = pct / 100;

      const s1 = document.getElementById('hud-opacity-slider');
      const s2 = document.getElementById('hud-compare-opacity-slider');
      const v1 = document.getElementById('hud-opacity-val');
      const v2 = document.getElementById('hud-compare-opacity-val');
      if (s1 && s1.value !== String(pct)) s1.value = String(pct);
      if (s2 && s2.value !== String(pct)) s2.value = String(pct);
      if (v1) v1.textContent = `${pct}%`;
      if (v2) v2.textContent = `${pct}%`;

      ['single', 'before', 'after'].forEach((slot) => {
        const layer = this.overlays[slot];
        if (layer && typeof layer.setOpacity === 'function') {
          layer.setOpacity(this.overlayOpacity);
        }
      });

      document.querySelectorAll('.hud-fallback-raster').forEach((imgEl) => {
        imgEl.style.opacity = String(this.overlayOpacity);
      });
    }

    async selectZone(zoneIndex) {
      const safeIndex = Math.max(0, Math.min(this.zones.length - 1, Number(zoneIndex) || 0));
      this.activeZoneIndex = safeIndex;
      this.activeTrackIndex = 0;
      this.activeSceneIndex = 0;
      this.selectedSpot = null;
      this.clearHighlightBoxes();

      document.querySelectorAll('[data-zone-index]').forEach((btn) => {
        const isMatch = Number(btn.getAttribute('data-zone-index')) === safeIndex;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });

      await this.activateCurrentZone();
    }

    async selectTrack(trackIndex) {
      this.activeTrackIndex = Number(trackIndex) || 0;
      this.selectedSpot = null;
      this.surfaceCache = { key: '', cells: null };
      this.clearHighlightBoxes();
      await this.activateCurrentZone();
    }

    async activateCurrentZone() {
      const zone = this.getActiveZone();
      if (!zone) return;

      const isCompare = zone.view_mode === 'before_after_disaster';
      this.updateZoneHeader(zone);
      this.toggleModeLayouts(isCompare);
      this.renderTrackButtons(zone);
      this.renderBoundsOnMaps(zone);

      if (isCompare) {
        await this.renderComparisonZone(zone);
      } else {
        this.populateSingleSceneSelector(zone);
        this.updateSingleSceneNote();
        await this.renderSingleMapOverlay();
      }

      this.inspectZoneCenter(zone);
    }

    updateZoneHeader(zone) {
      const keyBase = zone.i18nKey || 'zones.santiago';
      const titleEl = document.getElementById('hud-zone-title');
      const subEl = document.getElementById('hud-zone-subtitle');
      const descEl = document.getElementById('hud-zone-desc');
      if (titleEl) titleEl.textContent = translate(`${keyBase}.title`);
      if (subEl) subEl.textContent = translate(`${keyBase}.subtitle`);
      if (descEl) descEl.textContent = translate(`${keyBase}.description`);
    }

    toggleModeLayouts(isCompare) {
      const sbSingle = document.getElementById('hud-sidebar-single');
      const sbCompare = document.getElementById('hud-sidebar-compare');
      const stSingle = document.getElementById('hud-stage-single');
      const stCompare = document.getElementById('hud-stage-compare');

      if (sbSingle) sbSingle.style.display = isCompare ? 'none' : 'block';
      if (sbCompare) sbCompare.style.display = isCompare ? 'block' : 'none';
      if (stSingle) stSingle.style.display = isCompare ? 'none' : 'block';
      if (stCompare) stCompare.style.display = isCompare ? 'grid' : 'none';

      if (this.hasLeaflet) {
        setTimeout(() => {
          if (this.mapSingle) this.mapSingle.invalidateSize();
          if (this.mapBefore) this.mapBefore.invalidateSize();
          if (this.mapAfter) this.mapAfter.invalidateSize();
        }, 60);
      }
    }

    renderTrackButtons(zone) {
      const card = document.getElementById('hud-views-card');
      const container = document.getElementById('hud-views-buttons');
      if (!card || !container) return;

      const tracks = Array.isArray(zone.tracks) ? zone.tracks : [];
      if (tracks.length === 0) {
        card.style.display = 'none';
        container.innerHTML = '';
        return;
      }

      card.style.display = 'block';
      container.innerHTML = '';
      const beforeWord = translate('tracks.beforeShort');
      const afterWord = translate('tracks.afterShort');

      tracks.forEach((trk, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `hud-view-btn${idx === this.activeTrackIndex ? ' active' : ''}`;
        btn.addEventListener('click', () => this.selectTrack(idx));

        const titleStrong = document.createElement('strong');
        titleStrong.textContent = translate(trk.i18nKey || (idx === 1 ? 'tracks.valleyView' : 'tracks.portView'));
        btn.appendChild(titleStrong);

        const dateMeta = document.createElement('span');
        const dA = trk.before_scene ? trk.before_scene.date : '--';
        const dB = trk.after_scene ? trk.after_scene.date : '--';
        dateMeta.textContent = `${beforeWord}: ${dA} → ${afterWord}: ${dB}`;
        btn.appendChild(dateMeta);

        container.appendChild(btn);
      });
    }

    renderBoundsOnMaps(zone) {
      const b = zone.bounds;
      if (!b || !this.hasLeaflet) return;
      const L = globalScope.L;
      const coords = [
        [b.south, b.west],
        [b.south, b.east],
        [b.north, b.east],
        [b.north, b.west]
      ];
      const leafletBounds = [[b.south, b.west], [b.north, b.east]];

      const configs = [
        { map: this.mapSingle, key: 'boundsSingle' },
        { map: this.mapBefore, key: 'boundsBefore' },
        { map: this.mapAfter, key: 'boundsAfter' }
      ];

      configs.forEach(({ map, key }) => {
        if (!map) return;
        if (this.overlays[key]) map.removeLayer(this.overlays[key]);
        this.overlays[key] = L.polygon(coords, {
          color: '#52D9D9',
          weight: 2,
          dashArray: '5,4',
          fillOpacity: 0.0,
          interactive: false
        }).addTo(map);
        map.fitBounds(leafletBounds, { padding: [16, 16] });
      });

      if (this.mapSingle && this.overlays.riverLayer) {
        const showRiver = zone.zone_id === 'santiago_del_estero_capital';
        if (showRiver && !this.mapSingle.hasLayer(this.overlays.riverLayer)) {
          this.mapSingle.addLayer(this.overlays.riverLayer);
        } else if (!showRiver && this.mapSingle.hasLayer(this.overlays.riverLayer)) {
          this.mapSingle.removeLayer(this.overlays.riverLayer);
        }
      }
    }

    populateSingleSceneSelector(zone) {
      const selectEl = document.getElementById('hud-scene-select');
      if (!selectEl) return;
      const scenes = Array.isArray(zone.scenes) ? zone.scenes : [];
      const firstTag = translate('hud.controls.firstImageTag');

      selectEl.innerHTML = '';
      scenes.forEach((sc, idx) => {
        const opt = document.createElement('option');
        opt.value = String(idx);
        const suffix = idx === 0 ? ` • ${firstTag}` : '';
        opt.textContent = `${sc.date} (${sc.timeUtc || '00:00'} UTC)${suffix}`;
        selectEl.appendChild(opt);
      });

      const safeIdx = Math.max(0, Math.min(scenes.length - 1, this.activeSceneIndex));
      selectEl.selectedIndex = safeIdx;
    }

    updateSingleSceneNote() {
      const noteEl = document.getElementById('hud-scene-note');
      const zone = this.getActiveZone();
      if (!noteEl || !zone) return;
      const scenes = zone.scenes || [];
      const scene = scenes[this.activeSceneIndex] || zone.first_2026_scene;
      if (!scene) return;
      const prefix = this.activeSceneIndex === 0
        ? translate('hud.controls.showingFirstPrefix')
        : translate('hud.controls.showingDatePrefix');
      noteEl.innerHTML = `<strong>${prefix}:</strong> ${scene.date} (${scene.timeUtc || '00:00'} UTC).`;
    }

    getOrCacheBundledRaster(imagePath, overlayBounds) {
      if (!imagePath) return null;
      const existing = this.rasterCache.get(imagePath);
      if (existing && existing.ready) {
        if (overlayBounds) existing.bounds = overlayBounds;
        return existing;
      }
      const grids = globalScope.LambdaXRasterGrids;
      if (grids && typeof grids.getRasterRecord === 'function') {
        const rec = grids.getRasterRecord(imagePath, overlayBounds);
        if (rec && rec.ready) {
          this.rasterCache.set(imagePath, rec);
          return rec;
        }
      }
      return null;
    }

    preloadRasterCanvas(imagePath, overlayBounds) {
      if (!imagePath) {
        return Promise.resolve(null);
      }
      const bundled = this.getOrCacheBundledRaster(imagePath, overlayBounds);
      if (bundled) {
        return Promise.resolve(bundled);
      }
      if (typeof document === 'undefined' || typeof Image === 'undefined') {
        return Promise.resolve(null);
      }
      const existing = this.rasterCache.get(imagePath);
      if (existing && existing.promise) {
        return existing.promise;
      }

      const promise = new Promise((resolve) => {
        const img = new Image();
        const isHttpPage = typeof globalScope.location !== 'undefined' && /^https?:$/i.test(globalScope.location.protocol);
        const isRemoteUrl = /^https?:\/\//i.test(imagePath);
        if (isHttpPage && isRemoteUrl) {
          img.crossOrigin = 'anonymous';
        }
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            const rec = {
              ready: true,
              width: canvas.width,
              height: canvas.height,
              data: data,
              bounds: overlayBounds
            };
            this.rasterCache.set(imagePath, rec);
            resolve(rec);
          } catch (_) {
            this.rasterCache.delete(imagePath);
            resolve(null);
          }
        };
        img.onerror = () => {
          this.rasterCache.delete(imagePath);
          resolve(null);
        };
        img.src = imagePath;
      });

      this.rasterCache.set(imagePath, { ready: false, bounds: overlayBounds, promise });
      return promise;
    }

    sampleRasterWetness(rasterRecord, exactLat, exactLon, cellBounds) {
      if (!rasterRecord || !rasterRecord.ready || !rasterRecord.bounds) return null;
      const rb = rasterRecord.bounds;
      const w = rasterRecord.width;
      const h = rasterRecord.height;
      const tenths = rasterRecord.tenths;
      const data = rasterRecord.data;
      const lonSpan = rb.east - rb.west;
      const latSpan = rb.north - rb.south;
      if (lonSpan <= 0 || latSpan <= 0 || w <= 0 || h <= 0 || (!tenths && !data)) return null;

      const invert = this.scenesApi
        ? this.scenesApi.invertRedBlueRgbToWetnessPct
        : (() => 30.0);

      const readPx = (px, py) => {
        if (tenths) {
          const raw = tenths[py * w + px];
          if (raw === undefined || raw === 65535) return null;
          return +(raw / 10).toFixed(1);
        }
        const idx = (py * w + px) * 4;
        if (data[idx + 3] <= 15) return null;
        return invert(data[idx], data[idx + 1], data[idx + 2]);
      };

      if (exactLat !== null && exactLon !== null) {
        if (exactLat < rb.south || exactLat > rb.north || exactLon < rb.west || exactLon > rb.east) {
          return { hasValidPixel: false };
        }
        const cx = Math.max(0, Math.min(w - 1, Math.floor(((exactLon - rb.west) / lonSpan) * w)));
        const cy = Math.max(0, Math.min(h - 1, Math.floor(((rb.north - exactLat) / latSpan) * h)));
        const direct = readPx(cx, cy);
        if (direct !== null) return { hasValidPixel: true, humidityPct: direct };
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const near = readPx(nx, ny);
              if (near !== null) return { hasValidPixel: true, humidityPct: near };
            }
          }
        }
        return { hasValidPixel: false };
      }

      let sum = 0;
      let count = 0;
      const { latS, latN, lonW, lonE } = cellBounds;
      for (let sy = 0.25; sy <= 0.76; sy += 0.25) {
        const sLat = latS + sy * (latN - latS);
        if (sLat < rb.south || sLat > rb.north) continue;
        const py = Math.max(0, Math.min(h - 1, Math.floor(((rb.north - sLat) / latSpan) * h)));
        for (let sx = 0.25; sx <= 0.76; sx += 0.25) {
          const sLon = lonW + sx * (lonE - lonW);
          if (sLon < rb.west || sLon > rb.east) continue;
          const px = Math.max(0, Math.min(w - 1, Math.floor(((sLon - rb.west) / lonSpan) * w)));
          const val = readPx(px, py);
          if (val !== null) {
            sum += val;
            count++;
          }
        }
      }

      return count > 0
        ? { hasValidPixel: true, humidityPct: +(sum / count).toFixed(1) }
        : { hasValidPixel: false };
    }

    async analyzeSurfaceMask(zone) {
      const b = zone.bounds;
      const rows = zone.rows || 42;
      const cols = zone.cols || 56;
      const cacheKey = `${b.west.toFixed(4)},${b.south.toFixed(4)},${b.east.toFixed(4)},${b.north.toFixed(4)}_${rows}x${cols}`;
      if (this.surfaceCache.key === cacheKey && this.surfaceCache.cells) {
        return this.surfaceCache.cells;
      }

      const cells = Array.from({ length: rows }, () => new Array(cols));
      const latStep = (b.north - b.south) / rows;
      const lonStep = (b.east - b.west) / cols;

      for (let r = 0; r < rows; r++) {
        const latC = b.south + (r + 0.5) * latStep;
        for (let c = 0; c < cols; c++) {
          const lonC = b.west + (c + 0.5) * lonStep;
          let distKm = 12.0;
          if (zone.zone_id === 'santiago_del_estero_capital') {
            let minDeg = 999;
            for (let i = 0; i < RIO_DULCE_WAYPOINTS.length; i++) {
              const d = Math.hypot(latC - RIO_DULCE_WAYPOINTS[i][0], lonC - RIO_DULCE_WAYPOINTS[i][1]);
              if (d < minDeg) minDeg = d;
            }
            distKm = +(minDeg * 111).toFixed(2);
          } else {
            const centerLat = (b.south + b.north) / 2;
            const centerLon = (b.west + b.east) / 2;
            distKm = +(Math.hypot(latC - centerLat, lonC - centerLon) * 111 * 0.45).toFixed(2);
          }
          cells[r][c] = {
            distWaterKm: distKm,
            isWaterBody: distKm < 0.35 && zone.zone_id === 'santiago_del_estero_capital'
          };
        }
      }

      this.surfaceCache = { key: cacheKey, cells: cells };
      return cells;
    }

    evaluateSpotForScene(zone, r, c, scene, exactLat, exactLon) {
      const b = zone.bounds;
      const rows = zone.rows || 42;
      const cols = zone.cols || 56;
      const latStep = (b.north - b.south) / rows;
      const lonStep = (b.east - b.west) / cols;
      const latS = b.south + r * latStep;
      const latN = latS + latStep;
      const lonW = b.west + c * lonStep;
      const lonE = lonW + lonStep;
      const latCenter = (latS + latN) / 2;
      const lonCenter = (lonW + lonE) / 2;

      const maskRow = this.surfaceCache.cells && this.surfaceCache.cells[r];
      const surf = (maskRow && maskRow[c]) ? maskRow[c] : { distWaterKm: 4.5, isWaterBody: false };

      const pngPath = (scene && (scene.blueImagePath || scene.blue_image_path)) || zone.blue_image_path;
      const overlayBounds = (scene && (scene.overlayBounds || scene.overlay_bounds)) || zone.bounds;
      const record = this.getOrCacheBundledRaster(pngPath, overlayBounds)
        || (pngPath ? this.rasterCache.get(pngPath) : null);

      let humidityPct = null;
      let type = null;

      if (record && record.ready) {
        const sampled = this.sampleRasterWetness(record, exactLat, exactLon, { latS, latN, lonW, lonE });
        if (sampled) {
          if (sampled.hasValidPixel) {
            humidityPct = sampled.humidityPct;
            type = classifyWetnessPct(humidityPct);
          } else {
            humidityPct = 0.0;
            type = 'nodata';
          }
        }
      }

      if (type === null) {
        const dateStr = scene ? scene.date : '2026-01-05';
        const offset = computeSeasonalOffset(dateStr, (b.south + b.north) / 2);
        const micro = Math.sin(r * 0.65 + c * 0.45) * 4.2 + Math.cos(r * 0.3 - c * 0.7) * 3.1;
        if (surf.isWaterBody) {
          humidityPct = 98.0;
        } else {
          const riverBoost = Math.max(0, (4.5 - surf.distWaterKm) * 5.2);
          humidityPct = +Math.max(6.0, Math.min(89.0, 26.0 + riverBoost + offset + micro)).toFixed(1);
        }
        type = classifyWetnessPct(humidityPct);
      }

      const meta = getCategoryMeta(type, getLang());
      return {
        r: r,
        c: c,
        latS: latS,
        latN: latN,
        lonW: lonW,
        lonE: lonE,
        latCenter: latCenter,
        lonCenter: lonCenter,
        clickLat: exactLat,
        clickLon: exactLon,
        humidityPct: humidityPct,
        type: type,
        color: meta.color,
        badgeText: meta.badgeText,
        surfaceTag: meta.surfaceTag,
        citizenDesc: meta.citizenDesc,
        distWaterKm: surf.distWaterKm
      };
    }

    applyLeafletOverlay(map, currentLayer, imageUrl, bounds) {
      if (!this.hasLeaflet || !map) return null;
      const L = globalScope.L;
      if (currentLayer && map.hasLayer(currentLayer)) {
        map.removeLayer(currentLayer);
      }
      if (!imageUrl || !bounds) return null;
      return L.imageOverlay(
        imageUrl,
        [[bounds.south, bounds.west], [bounds.north, bounds.east]],
        { opacity: this.overlayOpacity, interactive: false, className: 'pixelated-grid' }
      ).addTo(map);
    }

    renderFallbackContainerPreview(containerId, pngPath) {
      if (this.hasLeaflet) return;
      const el = document.getElementById(containerId);
      if (!el) return;
      let img = el.querySelector('.hud-fallback-raster');
      if (!img) {
        el.innerHTML = '';
        img = document.createElement('img');
        img.className = 'hud-fallback-raster';
        img.alt = 'NISAR surface moisture preview';
        img.style.opacity = String(this.overlayOpacity);
        el.appendChild(img);

        const note = document.createElement('div');
        note.className = 'hud-offline-badge';
        note.textContent = translate('hud.compare.offlineNotice');
        el.appendChild(note);
      }
      if (pngPath) img.src = pngPath;
    }

    async renderSingleMapOverlay() {
      const zone = this.getActiveZone();
      if (!zone) return;
      const scenes = zone.scenes || [];
      const scene = scenes[this.activeSceneIndex] || zone.first_2026_scene || scenes[0];
      const pngPath = (scene && (scene.blueImagePath || scene.blue_image_path)) || zone.blue_image_path;
      const overlayBounds = (scene && (scene.overlayBounds || scene.overlay_bounds)) || zone.bounds;

      await this.analyzeSurfaceMask(zone);
      await this.preloadRasterCanvas(pngPath, overlayBounds);

      this.overlays.single = this.applyLeafletOverlay(
        this.mapSingle,
        this.overlays.single,
        pngPath,
        overlayBounds
      );
      this.renderFallbackContainerPreview('hud-map-single', pngPath);
    }

    async renderComparisonZone(zone) {
      const sceneA = zone.before_scene;
      const sceneB = zone.after_scene;
      if (!sceneA || !sceneB) return;

      const pngA = sceneA.blue_image_path || sceneA.blueImagePath;
      const pngB = sceneB.blue_image_path || sceneB.blueImagePath;
      const boundsA = sceneA.overlay_bounds || sceneA.overlayBounds || zone.bounds;
      const boundsB = sceneB.overlay_bounds || sceneB.overlayBounds || zone.bounds;

      await this.analyzeSurfaceMask(zone);
      await Promise.all([
        this.preloadRasterCanvas(pngA, boundsA),
        this.preloadRasterCanvas(pngB, boundsB)
      ]);

      this.overlays.before = this.applyLeafletOverlay(this.mapBefore, this.overlays.before, pngA, boundsA);
      this.overlays.after = this.applyLeafletOverlay(this.mapAfter, this.overlays.after, pngB, boundsB);
      this.renderFallbackContainerPreview('hud-map-before', pngA);
      this.renderFallbackContainerPreview('hud-map-after', pngB);

      this.updateComparisonReadouts(zone, sceneA, sceneB);
    }

    updateComparisonReadouts(zone, sceneA, sceneB) {
      const isEs = getLang() === 'es';
      const setElText = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.textContent = txt;
      };
      const setElHtml = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
      };

      const statsA = sceneA.precomputed_stats || {};
      const statsB = sceneB.precomputed_stats || {};
      const dateA = `${sceneA.date} (${sceneA.timeUtc || '03:42'} UTC)`;
      const dateB = `${sceneB.date} (${sceneB.timeUtc || '03:42'} UTC)`;

      setElText('hud-compare-before-date', dateA);
      setElText('hud-compare-after-date', dateB);
      setElText('hud-before-date-badge', dateA);
      setElText('hud-after-date-badge', dateB);

      const meanA = Number(statsA.mean_wetness_pct || 0);
      const meanB = Number(statsB.mean_wetness_pct || 0);
      const meanDelta = +(meanB - meanA).toFixed(1);
      const meanSign = meanDelta >= 0 ? '+' : '';

      setElText('hud-before-vsm', `${meanA.toFixed(1)}%`);
      setElText('hud-after-vsm', `${meanB.toFixed(1)}%`);

      const floodHaA = Math.round(statsA.flooded_area_ha || 0);
      const floodHaB = Math.round(statsB.flooded_area_ha || 0);
      const deltaFloodHa = floodHaB - floodHaA;
      const floodSign = deltaFloodHa >= 0 ? '+' : '';

      const wetKm2A = Number(statsA.wet_area_km2 || 0);
      const wetKm2B = Number(statsB.wet_area_km2 || 0);
      const deltaWetKm2 = +(wetKm2B - wetKm2A).toFixed(1);
      const wetSign = deltaWetKm2 >= 0 ? '+' : '';

      const lowPctA = Number(statsA.low_humidity_pct || 0);
      const lowPctB = Number(statsB.low_humidity_pct || 0);
      const totalKm2 = Number(statsB.total_polygon_km2 || 0);

      setElText('hud-dmg-flood-ha', `${floodSign}${formatNumber(deltaFloodHa)} ha`);
      setElText('hud-dmg-flood-sub', isEs
        ? `Antes: ${formatNumber(floodHaA)} ha → Desp.: ${formatNumber(floodHaB)} ha`
        : `Before: ${formatNumber(floodHaA)} ha → After: ${formatNumber(floodHaB)} ha`);

      setElText('hud-dmg-wet-km2', `${formatNumber(wetKm2B)} km²`);
      setElText('hud-dmg-wet-sub', isEs
        ? `Antes: ${formatNumber(wetKm2A)} km² (${wetSign}${deltaWetKm2} km²)`
        : `Before: ${formatNumber(wetKm2A)} km² (${wetSign}${deltaWetKm2} km²)`);

      setElText('hud-dmg-dry-pct', `${lowPctB.toFixed(1)}%`);
      setElText('hud-dmg-dry-sub', isEs
        ? `Suelo seco (Antes: ${lowPctA.toFixed(1)}%)`
        : `Low moisture (Before: ${lowPctA.toFixed(1)}%)`);

      setElText('hud-dmg-mean-delta', `${meanSign}${meanDelta}%`);

      const areaClause = totalKm2 > 0
        ? (isEs ? ` sobre ${formatNumber(totalKm2)} km²` : ` over ${formatNumber(totalKm2)} km²`)
        : '';

      setElHtml('hud-dmg-intro', isEs
        ? `Comparación real NISAR entre <b>${sceneA.date}</b> (Antes) y <b>${sceneB.date}</b> (Después)${areaClause}:`
        : `Real NISAR comparison between <b>${sceneA.date}</b> (Before) and <b>${sceneB.date}</b> (After)${areaClause}:`);

      let badgeLabel = isEs ? 'Cambios moderados' : 'Moderate changes';
      let narrativeHtml = isEs
        ? `Variación de <b>${floodSign}${formatNumber(deltaFloodHa)} ha</b> en área inundada y <b>${meanSign}${meanDelta}%</b> en humedad promedio.`
        : `Variation of <b>${floodSign}${formatNumber(deltaFloodHa)} ha</b> in flooded area and <b>${meanSign}${meanDelta}%</b> in average moisture.`;

      if (deltaFloodHa >= 1000) {
        badgeLabel = isEs ? 'Expansión de inundación' : 'Flood expansion';
        narrativeHtml = isEs
          ? `La superficie con agua o inundada creció en <b>${floodSign}${formatNumber(deltaFloodHa)} ha</b> (de <b>${formatNumber(floodHaA)} ha</b> a <b>${formatNumber(floodHaB)} ha</b>), pasando de <b>${formatNumber(wetKm2A)} km²</b> a <b>${formatNumber(wetKm2B)} km²</b> muy húmedos.`
          : `Flooded ground grew by <b>${floodSign}${formatNumber(deltaFloodHa)} ha</b> (from <b>${formatNumber(floodHaA)} ha</b> to <b>${formatNumber(floodHaB)} ha</b>), while very wet area shifted from <b>${formatNumber(wetKm2A)} km²</b> to <b>${formatNumber(wetKm2B)} km²</b>.`;
      }

      setElText('hud-dmg-badge', badgeLabel);
      setElHtml('hud-dmg-narrative', narrativeHtml);

      setElHtml('hud-delta-footer-summary', isEs
        ? `<strong>Resumen (${sceneA.date} → ${sceneB.date}):</strong> Área inundada: <b>${formatNumber(floodHaA)} → ${formatNumber(floodHaB)} ha (${floodSign}${formatNumber(deltaFloodHa)} ha)</b>`
        : `<strong>Summary (${sceneA.date} → ${sceneB.date}):</strong> Flooded area: <b>${formatNumber(floodHaA)} → ${formatNumber(floodHaB)} ha (${floodSign}${formatNumber(deltaFloodHa)} ha)</b>`);
      setElText('hud-delta-footer-highlight', isEs
        ? `Humedad promedio: ${meanSign}${meanDelta}%`
        : `Average moisture: ${meanSign}${meanDelta}%`);
    }

    inspectZoneCenter(zone) {
      if (!zone || !zone.bounds) return;
      const b = zone.bounds;
      const centerLat = (b.south + b.north) / 2;
      const centerLon = (b.west + b.east) / 2;
      this.handleMapClick(centerLat, centerLon, false);
    }

    handleMapClick(lat, lon, clickedBefore) {
      const zone = this.getActiveZone();
      if (!zone || !zone.bounds) return;
      const b = zone.bounds;
      if (lat < b.south || lat > b.north || lon < b.west || lon > b.east) return;

      const rows = zone.rows || 42;
      const cols = zone.cols || 56;
      const latStep = (b.north - b.south) / rows;
      const lonStep = (b.east - b.west) / cols;
      const r = Math.max(0, Math.min(rows - 1, Math.floor((lat - b.south) / latStep)));
      const c = Math.max(0, Math.min(cols - 1, Math.floor((lon - b.west) / lonStep)));

      this.selectedSpot = { r: r, c: c, lat: lat, lon: lon, clickedBefore: Boolean(clickedBefore) };

      let targetScene = null;
      if (zone.view_mode === 'before_after_disaster') {
        targetScene = clickedBefore ? zone.before_scene : zone.after_scene;
      } else {
        targetScene = (zone.scenes && zone.scenes[this.activeSceneIndex]) || zone.first_2026_scene;
      }

      const cell = this.evaluateSpotForScene(zone, r, c, targetScene, lat, lon);
      this.highlightCellOnMaps(zone, cell);
      this.renderInspector(zone, cell);
    }

    clearHighlightBoxes() {
      const pairs = [
        [this.mapSingle, 'highlightSingle'],
        [this.mapBefore, 'highlightBefore'],
        [this.mapAfter, 'highlightAfter']
      ];
      pairs.forEach(([map, key]) => {
        if (map && this.overlays[key]) {
          map.removeLayer(this.overlays[key]);
          this.overlays[key] = null;
        }
      });
    }

    highlightCellOnMaps(zone, cell) {
      this.clearHighlightBoxes();
      if (!this.hasLeaflet) return;
      const L = globalScope.L;
      const rectBounds = [[cell.latS, cell.lonW], [cell.latN, cell.lonE]];
      const opts = { color: '#52D9D9', weight: 2.5, fillOpacity: 0.16, interactive: false };

      if (zone.view_mode === 'before_after_disaster') {
        if (this.mapBefore) this.overlays.highlightBefore = L.rectangle(rectBounds, opts).addTo(this.mapBefore);
        if (this.mapAfter) this.overlays.highlightAfter = L.rectangle(rectBounds, opts).addTo(this.mapAfter);
      } else if (this.mapSingle) {
        this.overlays.highlightSingle = L.rectangle(rectBounds, opts).addTo(this.mapSingle);
      }
    }

    renderInspector(zone, cell) {
      const isEs = getLang() === 'es';
      const setEl = (id, fn) => {
        const el = document.getElementById(id);
        if (el) fn(el);
      };

      const lat = cell.clickLat !== null ? cell.clickLat : cell.latCenter;
      const lon = cell.clickLon !== null ? cell.clickLon : cell.lonCenter;

      setEl('insp-badge', (el) => {
        el.textContent = cell.badgeText;
        el.style.background = cell.color;
        el.style.color = (cell.type === 'humid' || cell.type === 'dry') ? '#061A26' : '#ffffff';
      });
      setEl('insp-surface-tag', (el) => {
        el.textContent = cell.surfaceTag;
      });
      setEl('insp-latlng', (el) => {
        el.textContent = `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
      });
      setEl('insp-zone-name', (el) => {
        el.textContent = translate(`${zone.i18nKey || 'zones.santiago'}.title`);
      });
      setEl('insp-moisture-val', (el) => {
        el.textContent = cell.type === 'nodata' ? '--' : `${cell.humidityPct.toFixed(1)}%`;
      });
      setEl('insp-moisture-bar', (el) => {
        el.style.width = cell.type === 'nodata' ? '0%' : `${Math.min(100, cell.humidityPct)}%`;
        el.style.background = cell.color;
      });
      setEl('insp-dist-water', (el) => {
        el.textContent = `${cell.distWaterKm.toFixed(2)} km`;
      });
      setEl('insp-desc', (el) => {
        el.textContent = cell.citizenDesc;
      });

      const cmpBox = document.getElementById('insp-compare-box');
      const cmpDetails = document.getElementById('insp-compare-details');
      if (!cmpBox || !cmpDetails) return;

      if (zone.view_mode === 'before_after_disaster' && zone.before_scene && zone.after_scene) {
        const cA = this.evaluateSpotForScene(zone, cell.r, cell.c, zone.before_scene, cell.clickLat, cell.clickLon);
        const cB = this.evaluateSpotForScene(zone, cell.r, cell.c, zone.after_scene, cell.clickLat, cell.clickLon);
        cmpBox.style.display = 'block';

        const beforeLbl = isEs ? 'Antes' : 'Before';
        const afterLbl = isEs ? 'Después' : 'After';
        const noCov = isEs ? 'Sin cobertura en este borde' : 'Outside capture edge';

        if (cA.type === 'nodata' || cB.type === 'nodata') {
          const valA = cA.type === 'nodata' ? noCov : `${cA.humidityPct}% (${cA.badgeText})`;
          const valB = cB.type === 'nodata' ? noCov : `${cB.humidityPct}% (${cB.badgeText})`;
          cmpDetails.innerHTML =
            `<strong>${beforeLbl} (${zone.before_scene.date}):</strong> ${valA}<br/>` +
            `<strong>${afterLbl} (${zone.after_scene.date}):</strong> ${valB}`;
        } else {
          const delta = +(cB.humidityPct - cA.humidityPct).toFixed(1);
          const sign = delta >= 0 ? '+' : '';
          let msg = isEs ? 'Humedad estable entre ambas fechas.' : 'Stable moisture between both dates.';
          if (cA.type === 'water' && cB.type === 'water') {
            msg = isEs ? 'Agua permanente en ambas fechas.' : 'Permanent water body on both dates.';
          } else if (delta >= 8.0) {
            msg = isEs ? 'Aumento notable de humedad en este punto.' : 'Notable moisture increase at this point.';
          } else if (delta <= -8.0) {
            msg = isEs ? 'Este sector perdió humedad superficial.' : 'Surface moisture decreased at this location.';
          }
          cmpDetails.innerHTML =
            `<strong>${beforeLbl} (${zone.before_scene.date}):</strong> ${cA.humidityPct}% (${cA.badgeText})<br/>` +
            `<strong>${afterLbl} (${zone.after_scene.date}):</strong> ${cB.humidityPct}% (${cB.badgeText})<br/>` +
            `<span class="insp-delta-highlight">${isEs ? 'Cambio' : 'Change'}: ${sign}${delta}% — ${msg}</span>`;
        }
      } else {
        cmpBox.style.display = 'none';
      }
    }

    handleLanguageChange() {
      const zone = this.getActiveZone();
      if (!zone) return;
      this.refreshLeafletLayerControl();
      this.updateZoneHeader(zone);
      this.renderTrackButtons(zone);

      if (zone.view_mode === 'before_after_disaster') {
        this.updateComparisonReadouts(zone, zone.before_scene, zone.after_scene);
      } else {
        this.populateSingleSceneSelector(zone);
        this.updateSingleSceneNote();
      }

      if (this.selectedSpot) {
        this.handleMapClick(this.selectedSpot.lat, this.selectedSpot.lon, this.selectedSpot.clickedBefore);
      }
    }
  }

  globalScope.LambdaXMapController = LambdaXMapController;
  globalScope.initLambdaXMaps = function () {
    const controller = new LambdaXMapController();
    globalScope.mapController = controller;
    controller.init();
    return controller;
  };
})(typeof window !== 'undefined' ? window : globalThis);
