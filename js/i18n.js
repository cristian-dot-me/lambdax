/**
 * Bilingual EN/ES localization engine for the LambdaX landing page & Citizen HUD.
 * Provides full English and Spanish translations without technical jargon and
 * emits `lambdax:langchange` events so interactive maps and galleries re-render cleanly.
 */
(function (globalScope) {
  'use strict';

  const STORAGE_KEY = 'lambdax_lang';

  const TRANSLATIONS = {
    en: {
      page: {
        title: 'LambdaX — NISAR Citizen HUD'
      },
      nav: {
        hero: 'Overview',
        demo: 'Demo',
        problem: 'Challenge & Solution',
        features: 'Citizen HUD',
        howItWorks: 'How It Works',
        techStack: 'Tech Stack',
        team: 'Team',
        openHud: 'Explore Maps'
      },
      hero: {
        badge: 'NISAR Citizen HUD',
        title: 'LambdaX',
        subtitle: "Making Earth's hidden surface changes visible.",
        tagline: 'Seeing the Unseen.',
        description:
          'We translate NISAR satellite observations into clear Red-to-Blue surface moisture and flood maps anyone can read in seconds—no scientific background required.',
        ctaPrimary: 'Explore Interactive HUD',
        ctaSecondary: 'How It Works',
        radarTelemetry: 'LIVE SATELLITE VIEW',
        radarFrequency: 'NISAR (All-Weather, Day & Night)',
        scrollHint: 'Scroll to explore'
      },
      demo: {
        title: 'See LambdaX in Action',
        description:
          'Watch how communities, farmers, and responders inspect real 2026 NISAR moisture shifts and flood expansion with zero technical barriers.',
        fallbackBadge: 'Interactive Preview Available Below',
        fallbackTitle: 'Video walkthrough coming soon — explore the live map now',
        fallbackDesc:
          'No external stream is needed: jump straight into the real Santiago del Estero, Mozambique, and Nepal–China NISAR visualizations right below.',
        fallbackCta: 'Open Live Citizen HUD'
      },
      problem: {
        title: 'Seeing Beyond the Clouds',
        subtitle: 'Why everyday flood and soil monitoring needs an all-weather lens.',
        challengeTitle: 'THE CHALLENGE',
        challengeSubtitle: 'Blinded by Clouds & Technical Jargon',
        challengeDesc:
          'During severe cyclones and monsoon storms, thick cloud cover blinds standard camera satellites precisely when floodwaters rise—and raw scientific portals remain too complex for local communities.',
        challengePoint1: 'Dense clouds and nighttime darkness hide sudden river surges from ordinary cameras.',
        challengePoint2: 'Complex scientific charts and coordinate files lock local citizens out of timely insights.',
        solutionTitle: 'OUR SOLUTION',
        solutionSubtitle: 'Translating Radar Into Citizen Intelligence',
        solutionDesc:
          'NISAR sees cleanly through storms day or night. LambdaX turns those measurements into a single Red-to-Blue Citizen HUD with plain-language explanations at every click.',
        solutionPoint1: 'Dry soil appears red and wet or flooded ground turns deep blue—easy to read at a glance.',
        solutionPoint2: 'Side-by-side Before/After views show real 2026 flood expansion in hectares and percentages.'
      },
      features: {
        title: 'Explore the Planet Through Radar',
        subtitle:
          'Interactive Citizen HUD powered by real 2026 NISAR imagery across Santiago del Estero, Mozambique, and the Nepal–China border.',
        inspector: {
          title: 'Understand Every Pixel',
          prompt: 'Click anywhere inside the monitored area on the map to read plain-language surface moisture.',
          latLngLabel: 'Coordinates (Lat, Lon)',
          zoneLabel: 'Monitored Region',
          surfaceLabel: 'Surface Condition',
          moistureLabel: 'Estimated Moisture',
          distWaterLabel: 'Distance to Water',
          defaultDesc:
            'Click any point on the map to find out in plain language whether the ground is dry (red) or wet (blue).',
          compareHeader: 'Before vs. After change at this location:'
        },
        galleryHeading: 'Discover NISAR Applications',
        gallerySubheading:
          'Real NISAR images demonstrating how day-and-night satellite views help protect coasts, forests, and food production worldwide.',
        manifestoHeading: 'Why NISAR matters for the entire planet',
        manifestoText:
          'The importance of the NISAR mission in our daily lives is greater than most people realize. By turning natural physical observations into clear day-and-night views through clouds and thick canopy, communities and specialists can assess flood and drought risks in minutes. LambdaX shows how complex space science can become clear, shared knowledge at the service of our planet. — LambdaX',
        accuracyHeading: 'Note on image accuracy',
        accuracyNote:
          'Images officially processed by (like the gallery examples below) offer the highest scientific detail. In our interactive map explorer, we recolor preview NISAR scenes with a simplified Red-to-Blue model so anyone can interpret moisture at a glance.'
      },
      hud: {
        tab1: 'Santiago del Estero',
        tab2: 'Mozambique (Chokwe / Macia)',
        tab3: 'Nepal–China Border (Gyirong Port)',
        viewBannerSingle: 'Live Moisture Explorer',
        viewBannerCompare: 'Before vs. After Flood Comparator',
        controls: {
          captureDateHeading: 'NISAR Satellite Capture',
          captureDateLabel: '2026 NISAR Image:',
          firstImageTag: 'First 2026 capture',
          showingFirstPrefix: 'Showing the earliest verified 2026 NISAR image',
          showingDatePrefix: 'Showing 2026 NISAR image',
          transparencyLabel: 'Overlay Transparency',
          compareViewsHeading: 'Comparison Views',
          chooseViewPrompt: 'Choose which Before/After view to inspect over the affected area:',
          floodDatesHeading: 'Flood Comparison (2026)',
          beforeColon: 'BEFORE:',
          afterColon: 'AFTER:',
          summaryHeading: 'Flood Change Summary',
          analyzing: 'Verified',
          floodIncreaseLbl: 'Flooded area increase',
          wetSurfaceLbl: 'Very wet surface',
          lowMoistureLbl: 'Low moisture sectors',
          avgChangeLbl: 'Average change',
          moistureDiffSub: 'Moisture difference',
          legendHeading: 'Color Guide (Dry Red to Wet Blue)',
          legendIntro: 'Red marks dry soil; moisture shifts smoothly toward deeper blue:',
          baseMapLabel: 'Base Map:',
          baseMapSatStreets: 'Satellite + Streets View'
        },
        legend: {
          water: 'Deep Navy Blue — Open water (rivers & lagoons)',
          floodLand: 'Intense Blue — Flooded ground or riverbanks',
          floodVeg: 'Bright Blue — Vegetation standing in water',
          saturated: 'Medium Blue — Very wet saturated soil',
          humid: 'Light Sky Blue — Normal moisture for crops',
          dry: 'Light Red — Low surface moisture',
          drySoil: 'Intense Red — Dry soil, roads, or urban ground'
        },
        compare: {
          beforeHeader: 'BEFORE',
          afterHeader: 'AFTER',
          metaSatellite: 'Satellite',
          metaView: 'View',
          metaAvgMoisture: 'Average moisture',
          viewTypeLabel: 'Moisture Map',
          clickHint: 'Click any sector on either map to inspect Before vs. After moisture change',
          deltaLoading: 'Loading real 2026 NISAR comparison...',
          changeLabel: 'Change',
          offlineNotice: 'Map tiles unavailable offline — displaying verified real NISAR overlay preview.'
        }
      },
      zones: {
        santiago: {
          title: 'Santiago del Estero',
          subtitle: 'Capital Area & Dulce River Basin',
          description: 'Explore real 2026 NISAR surface moisture across our home province—click any point to inspect moisture.'
        },
        mozambique: {
          title: 'Mozambique (Chokwe / Macia)',
          subtitle: 'Chokwe–Macia Agricultural Corridor (Limpopo River)',
          description: 'Real NISAR comparison between Jan 5 and Jan 17, 2026 showing widespread river valley flooding.'
        },
        nepal: {
          title: 'Nepal–China Border (Gyirong Port)',
          subtitle: 'Gyirong–Rasuwagadhi Cross-Border Corridor',
          description: 'Real August 2026 comparison captured through dense monsoon cloud cover along Himalayan river valleys.'
        }
      },
      tracks: {
        portView: 'Port Area View',
        valleyView: 'Wider Valley View',
        beforeShort: 'Before',
        afterShort: 'After'
      },
      gallery: {
        openFull: 'Open full-size image',
        card1: {
          tag: 'Coastal & Forests',
          title: 'Coastal Landscape View — Maine, United States',
          desc: 'Official NISAR view over Mount Desert Island and Bar Harbor, clearly separating forests, towns, terrain relief, and coastal water day or night.',
          alt: 'Official NISAR view of forests, towns, and coastal waters in Maine, United States'
        },
        card2: {
          tag: 'Agriculture & Crops',
          title: 'Crops & Wetlands — North Dakota, United States',
          desc: 'Official NISAR view along the Forest River showing crop fields, circular irrigation pivots, woodlands, and wetlands for monitoring food production.',
          alt: 'Official NISAR view of agricultural fields and circular irrigation in North Dakota, United States'
        }
      },
      disclaimer: {
        title: 'Simplified Preview Visualization',
        text: 'Interactive Red-to-Blue maps use simplified preview visualization of NISAR products for fast citizen exploration. Official science archives provide full terrain-calibrated products for formal engineering use.'
      },
      how: {
        title: 'From Data to Clear Insights',
        subtitle: 'Four streamlined stages take satellite measurements from space straight to your browser.',
        step1: {
          num: '01',
          title: 'NISAR',
          sub: 'Cloud-Piercing Satellite Capture',
          desc: 'Captures surface moisture and floodwater dynamics day or night, unaffected by thick storm or monsoon clouds.'
        },
        step2: {
          num: '02',
          title: 'Python Data Pipeline',
          sub: 'Moisture Color Translation',
          desc: 'Converts raw observations into lightweight Red-to-Blue image layers and verified area change summaries.'
        },
        step3: {
          num: '03',
          title: 'Local Scene Catalog',
          sub: 'Instant Browser Assets',
          desc: 'Organizes regional dates, map bounds, and pre-rendered PNG overlays inside a zero-backend static catalog.'
        },
        step4: {
          num: '04',
          title: 'Citizen HUD',
          sub: 'Explore & Understand',
          desc: 'Combines interactive Leaflet maps, Before/After comparisons, and plain-language pixel inspection for everyone.'
        }
      },
      tech: {
        title: 'Built with Open Technologies',
        subtitle: 'Lean static-first architecture focused on speed, transparency, and accessibility.',
        cat1: {
          name: 'Satellite Data',
          items: 'NISAR Mission • Earthdata Search • GeoTIFF Moisture Previews'
        },
        cat2: {
          name: 'Data Processing',
          items: 'Python 3 • NumPy & Raster Pipeline • Automated Scene Catalog (JSON)'
        },
        cat3: {
          name: 'Interactive Mapping',
          items: 'Leaflet 1.9.4 • Esri Satellite + Streets • Synchronized Flood Comparators'
        },
        cat4: {
          name: 'Citizen Interface',
          items: 'HTML5 Canvas Sampling • Vanilla ES6+ • Real-Time EN/ES Bilingual Engine'
        },
        cat5: {
          name: 'Open Distribution',
          items: 'Zero-Backend Static Hosting • Bundled PNG Overlays • Responsive Mobile Layout'
        }
      },
      team: {
        title: 'The People Behind LambdaX',
        subtitle: 'Built from northern Argentina for LambdaX 2026.',
        member1: {
          role: 'Backend & Data Processing',
          desc: 'NISAR data research and satellite scene exploration.'
        },
        member2: {
          role: 'Backend & Data Processing',
          desc: 'Python pipeline and satellite image processing.'
        },
        member3: {
          role: 'Data Research & Data Visualization',
          desc: 'Web interface, interactive maps and SAR data visualization.'
        },
        collabStatement: 'One collaborative team. Shared decisions, shared development, one mission.',
        collabDesc: 'All three team members collaborated throughout the research, development and integration of LambdaX.'
      },
      footer: {
        brand: 'LambdaX',
        tagline: 'Seeing the Unseen.',
        description: 'Exploring Earth, one radar scene at a time.',
        trackHeading: 'Challenge Information',
        track: 'Dancing With the SARs',
        editionLabel: 'Edition:',
        challenge: 'LambdaX 2026',
        locationLabel: 'Location:',
        location: 'Santiago del Estero / Tucumán, Argentina',
        openSourceHeading: 'Open Source',
        github: 'GitHub Repository',
        pipelineLink: 'Full Interactive App',
        docsLink: 'Citizen HUD Section',
        copyright: '© 2026 LambdaX Project — LambdaX.',
        dataSource: 'Built with official NISAR imagery and open web mapping libraries.'
      }
    },
    es: {
      page: {
        title: 'LambdaX — Visor Ciudadano NISAR'
      },
      nav: {
        hero: 'Inicio',
        demo: 'Demo',
        problem: 'Desafío y Solución',
        features: 'Visor Ciudadano',
        howItWorks: 'Cómo Funciona',
        techStack: 'Tecnologías',
        team: 'Equipo',
        openHud: 'Explorar Mapas'
      },
      hero: {
        badge: 'NISAR Citizen HUD',
        title: 'LambdaX',
        subtitle: 'Haciendo visibles los cambios ocultos de la Tierra.',
        tagline: 'Seeing the Unseen.',
        description:
          'Transformamos observaciones satelitales de NISAR en mapas claros de humedad e inundaciones de Rojo a Azul que cualquier persona puede entender en segundos.',
        ctaPrimary: 'Explorar Visor Interactivo',
        ctaSecondary: 'Cómo Funciona',
        radarTelemetry: 'VISTA SATELITAL EN VIVO',
        radarFrequency: 'NISAR (Día y noche, sin bloqueo por nubes)',
        scrollHint: 'Deslizá para explorar'
      },
      demo: {
        title: 'Mirá LambdaX en Acción',
        description:
          'Descubrí cómo comunidades, productores y equipos locales inspeccionan cambios reales de humedad e inundaciones de NISAR 2026 sin barreras técnicas.',
        fallbackBadge: 'Vista Previa Interactiva Abajo',
        fallbackTitle: 'Video demostrativo en preparación — probá el mapa real ahora',
        fallbackDesc:
          'No necesitás esperar: bajá directamente a explorar las visualizaciones reales de Santiago del Estero, Mozambique y la frontera Nepal–China.',
        fallbackCta: 'Abrir Visor Ciudadano'
      },
      problem: {
        title: 'Ver Más Allá de las Nubes',
        subtitle: 'Por qué el monitoreo ciudadano necesita observación capaz de atravesar tormentas.',
        challengeTitle: 'THE CHALLENGE',
        challengeSubtitle: 'Cegados por las Nubes y el Lenguaje Técnico',
        challengeDesc:
          'Durante ciclones y tormentas monzónicas intensas, las nubes cubren las cámaras ópticas justo cuando crecen los ríos—y los portales técnicos resultan difíciles para el público general.',
        challengePoint1: 'La nubosidad espesa y la noche ocultan las crecidas repentinas a los satélites comunes.',
        challengePoint2: 'Tablas científicas complejas y archivos difíciles alejan a la ciudadanía de la información útil.',
        solutionTitle: 'OUR SOLUTION',
        solutionSubtitle: 'Traduciendo Datos en Claridad Ciudadana',
        solutionDesc:
          'NISAR observa a través de tormentas de día o de noche. LambdaX convierte esos datos en un mapa Rojo-a-Azul simple con explicaciones claras en cada punto.',
        solutionPoint1: 'El suelo seco se ve rojo y el suelo muy húmedo o inundado se vuelve azul intenso.',
        solutionPoint2: 'Las vistas Antes y Después muestran la expansión real de las crecidas de 2026 en hectáreas y porcentajes.'
      },
      features: {
        title: 'Explorá el Planeta con Claridad Satelital',
        subtitle:
          'Visor Ciudadano interactivo con imágenes reales 2026 de NISAR en Santiago del Estero, Mozambique y la frontera Nepal–China.',
        inspector: {
          title: 'Entendé Cada Píxel',
          prompt: 'Hacé clic en cualquier punto dentro del área monitoreada para conocer la humedad en lenguaje simple.',
          latLngLabel: 'Coordenadas (Lat, Lon)',
          zoneLabel: 'Región Monitoreada',
          surfaceLabel: 'Estado del Suelo',
          moistureLabel: 'Humedad Estimada',
          distWaterLabel: 'Distancia al Agua',
          defaultDesc:
            'Hacé clic en cualquier punto del mapa para saber en lenguaje claro si el suelo está seco (rojo) o húmedo (azul).',
          compareHeader: 'Cambio Antes vs. Después en este lugar:'
        },
        galleryHeading: 'Descubrí Usos Reales de NISAR',
        gallerySubheading:
          'Imágenes oficiales de NISAR que muestran cómo la observación satelital protege costas, bosques y la producción de alimentos.',
        manifestoHeading: 'Por qué NISAR importa para todo el planeta',
        manifestoText:
          'La importancia de la misión NISAR en nuestra vida diaria es más grande de lo que pensamos. Al transformar observaciones espaciales en vistas claras de día y de noche a través de nubes y follaje denso, comunidades y especialistas pueden evaluar riesgos de inundación o sequía en minutos. LambdaX busca convertir ciencia compleja en conocimiento compartido al servicio del planeta. — LambdaX',
        accuracyHeading: 'Nota sobre la precisión de las imágenes',
        accuracyNote:
          'Las imágenes procesadas oficialmente por la (como las de la galería inferior) ofrecen el máximo detalle científico. En nuestro explorador interactivo recoloreamos vistas previas de NISAR con una escala simple de Rojo a Azul para facilitar su lectura.'
      },
      hud: {
        tab1: 'Santiago del Estero',
        tab2: 'Mozambique (Chokwe / Macia)',
        tab3: 'Frontera Nepal–China (Puerto Gyirong)',
        viewBannerSingle: 'Explorador de Humedad',
        viewBannerCompare: 'Comparador de Inundación Antes vs. Después',
        controls: {
          captureDateHeading: 'Captura Satelital NISAR',
          captureDateLabel: 'Imagen NISAR 2026:',
          firstImageTag: 'Primera imagen 2026',
          showingFirstPrefix: 'Mostrando la primera imagen verificada 2026 de NISAR',
          showingDatePrefix: 'Mostrando imagen NISAR 2026',
          transparencyLabel: 'Transparencia de la Capa',
          compareViewsHeading: 'Vistas de Comparación',
          chooseViewPrompt: 'Elegí qué vista Antes/Después explorar sobre el área afectada:',
          floodDatesHeading: 'Comparación de Inundación (2026)',
          beforeColon: 'ANTES:',
          afterColon: 'DESPUÉS:',
          summaryHeading: 'Resumen de Cambios',
          analyzing: 'Verificado',
          floodIncreaseLbl: 'Aumento del área inundada',
          wetSurfaceLbl: 'Superficie muy húmeda',
          lowMoistureLbl: 'Sectores con poca humedad',
          avgChangeLbl: 'Cambio promedio',
          moistureDiffSub: 'Diferencia de humedad',
          legendHeading: 'Guía de Colores (Rojo seco a Azul húmedo)',
          legendIntro: 'El rojo señala tierra seca; a mayor humedad, el tono avanza hacia azules intensos:',
          baseMapLabel: 'Mapa Base:',
          baseMapSatStreets: 'Vista Satelital + Calles'
        },
        legend: {
          water: 'Azul Marino Profundo — Agua libre (ríos y lagunas)',
          floodLand: 'Azul Intenso — Zona inundada u orillas',
          floodVeg: 'Azul Brillante — Vegetación con agua debajo',
          saturated: 'Azul Medio — Tierra muy mojada y saturada',
          humid: 'Celeste Claro — Humedad normal para cultivos',
          dry: 'Rojo Claro — Poca humedad superficial',
          drySoil: 'Rojo Intenso — Suelo seco, caminos o zona urbana'
        },
        compare: {
          beforeHeader: 'ANTES',
          afterHeader: 'DESPUÉS',
          metaSatellite: 'Satélite',
          metaView: 'Vista',
          metaAvgMoisture: 'Humedad promedio',
          viewTypeLabel: 'Mapa de Humedad',
          clickHint: 'Hacé clic en cualquier sector de ambos mapas para ver cómo cambió la humedad',
          deltaLoading: 'Cargando comparación real NISAR 2026...',
          changeLabel: 'Cambio',
          offlineNotice: 'Mapa base no disponible sin conexión — mostrando vista previa real NISAR.'
        }
      },
      zones: {
        santiago: {
          title: 'Santiago del Estero',
          subtitle: 'Zona Capital y Cuenca del Río Dulce',
          description: 'Explorá la humedad superficial real 2026 captada por NISAR sobre nuestra provincia—hacé clic para inspeccionar.'
        },
        mozambique: {
          title: 'Mozambique (Chokwe / Macia)',
          subtitle: 'Corredor Agrícola Chokwe–Macia (Río Limpopo)',
          description: 'Comparación real de NISAR entre el 5 y el 17 de enero de 2026 mostrando la crecida sobre el valle.'
        },
        nepal: {
          title: 'Frontera Nepal–China (Puerto Gyirong)',
          subtitle: 'Corredor Transfronterizo Gyirong–Rasuwagadhi',
          description: 'Comparación real de agosto de 2026 capturada a través de espesa nubosidad monzónica en el valle del Himalaya.'
        }
      },
      tracks: {
        portView: 'Vista Zona del Puerto',
        valleyView: 'Vista Valle Amplio',
        beforeShort: 'Antes',
        afterShort: 'Después'
      },
      gallery: {
        openFull: 'Abrir imagen completa',
        card1: {
          tag: 'Costas y Bosques',
          title: 'Vista Costera — Maine, Estados Unidos',
          desc: 'Vista oficial de NISAR sobre Mount Desert Island y Bar Harbor, distinguiendo bosques, zonas urbanas, relieve y agua de día o de noche.',
          alt: 'Vista oficial de NISAR de bosques, zonas urbanas y agua costera en Maine, Estados Unidos'
        },
        card2: {
          tag: 'Agricultura y Cultivos',
          title: 'Cultivos y Humedales — Dakota del Norte, Estados Unidos',
          desc: 'Vista oficial de NISAR junto al río Forest mostrando cultivos, círculos de riego, bosques y humedales clave para la producción de alimentos.',
          alt: 'Vista oficial de NISAR de campos agrícolas y círculos de riego en Dakota del Norte, Estados Unidos'
        }
      },
      disclaimer: {
        title: 'Visualización Previa Simplificada',
        text: 'Los mapas interactivos de Rojo a Azul utilizan una visualización previa simplificada de productos NISAR pensada para lectura ciudadana rápida. Los archivos oficiales de la agencia espacial proveen datos calibrados para estudios científicos.'
      },
      how: {
        title: 'De Datos a Información Clara',
        subtitle: 'Cuatro pasos simples llevan las observaciones del espacio directamente a tu navegador.',
        step1: {
          num: '01',
          title: 'NISAR',
          sub: 'Captura en Todo Clima',
          desc: 'Registra humedad superficial e inundaciones de día y de noche, sin verse bloqueado por tormentas ni nubes monzónicas.'
        },
        step2: {
          num: '02',
          title: 'Pipeline Python',
          sub: 'Traducción a Escala de Humedad',
          desc: 'Convierte mediciones oficiales en imágenes livianas de Rojo a Azul y resúmenes de cambio verificados.'
        },
        step3: {
          num: '03',
          title: 'Catálogo Local de Escenas',
          sub: 'Carga Instantánea en Web',
          desc: 'Empaqueta fechas regionales, límites geográficos y capas PNG listas para visualizar sin servidores pesados.'
        },
        step4: {
          num: '04',
          title: 'Visor Ciudadano',
          sub: 'Explorá y Comprendé',
          desc: 'Integra mapas Leaflet interactivos, comparadores Antes/Después e inspección de cada punto en lenguaje simple.'
        }
      },
      tech: {
        title: 'Construido con Tecnologías Abiertas',
        subtitle: 'Arquitectura estática liviana enfocada en velocidad, transparencia y accesibilidad.',
        cat1: {
          name: 'Datos Satelitales',
          items: 'Misión NISAR • Earthdata Search • Vistas GeoTIFF de Humedad'
        },
        cat2: {
          name: 'Procesamiento',
          items: 'Python 3 • NumPy y Raster Pipeline • Catálogo Automático (JSON)'
        },
        cat3: {
          name: 'Mapas Interactivos',
          items: 'Leaflet 1.9.4 • Vista Satelital + Calles Esri • Comparador Sincronizado'
        },
        cat4: {
          name: 'Interfaz Ciudadana',
          items: 'Muestreo HTML5 Canvas • Vanilla ES6+ • Motor Bilingüe EN/ES en Tiempo Real'
        },
        cat5: {
          name: 'Acceso Abierto',
          items: 'Hosting Estático Sin Backend • Capas PNG Incluidas • Diseño Responsivo'
        }
      },
      team: {
        title: 'Las Personas Detrás de LambdaX',
        subtitle: 'Desarrollado desde el norte argentino para LambdaX 2026.',
        member1: {
          role: 'Datos e Investigación',
          desc: 'Investigación de datos NISAR y exploración de escenas satelitales.'
        },
        member2: {
          role: 'Backend y Procesamiento de Datos',
          desc: 'Pipeline en Python y procesamiento de imágenes satelitales.'
        },
        member3: {
          role: 'Frontend y Visualización de Datos',
          desc: 'Interfaz web, mapas interactivos y visualización de datos SAR.'
        },
        collabStatement: 'Un equipo colaborativo. Decisiones compartidas, desarrollo compartido, una misma misión.',
        collabDesc: 'Los tres integrantes del equipo colaboraron a lo largo de la investigación, el desarrollo y la integración de LambdaX.'
      },
      footer: {
        brand: 'LambdaX',
        tagline: 'Seeing the Unseen.',
        description: 'Explorando la Tierra, una escena satelital a la vez.',
        trackHeading: 'Información del Desafío',
        track: 'Dancing With the SARs',
        editionLabel: 'Edición:',
        challenge: 'LambdaX 2026',
        locationLabel: 'Ubicación:',
        location: 'Santiago del Estero / Tucumán, Argentina',
        openSourceHeading: 'Código Abierto',
        github: 'Repositorio GitHub',
        pipelineLink: 'Aplicación Completa',
        docsLink: 'Sección Visor Ciudadano',
        copyright: '© 2026 Proyecto LambdaX — LambdaX.',
        dataSource: 'Construido con imágenes oficiales de NISAR y librerías abiertas de mapas web.'
      }
    }
  };

  let currentLang = 'en';

  function lookupKey(obj, dotPath) {
    if (!obj || !dotPath) return undefined;
    const parts = String(dotPath).split('.');
    let cursor = obj;
    for (let i = 0; i < parts.length; i++) {
      if (cursor && Object.prototype.hasOwnProperty.call(cursor, parts[i])) {
        cursor = cursor[parts[i]];
      } else {
        return undefined;
      }
    }
    return typeof cursor === 'string' ? cursor : undefined;
  }

  function getTranslation(lang, key) {
    const safeLang = lang === 'es' ? 'es' : 'en';
    const val = lookupKey(TRANSLATIONS[safeLang], key);
    if (val !== undefined) return val;
    const fallback = lookupKey(TRANSLATIONS.en, key);
    return fallback !== undefined ? fallback : key;
  }

  function applyTranslations() {
    if (typeof document === 'undefined') return;
    const doc = document;
    doc.documentElement.lang = currentLang;
    doc.title = getTranslation(currentLang, 'page.title');

    doc.querySelectorAll('[data-i18n]').forEach((el) => {
      const val = getTranslation(currentLang, el.getAttribute('data-i18n'));
      if (val !== undefined) el.textContent = val;
    });

    doc.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const val = getTranslation(currentLang, el.getAttribute('data-i18n-html'));
      if (val !== undefined) el.innerHTML = val;
    });

    doc.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const val = getTranslation(currentLang, el.getAttribute('data-i18n-title'));
      if (val !== undefined) el.setAttribute('title', val);
    });

    doc.querySelectorAll('[data-i18n-alt]').forEach((el) => {
      const val = getTranslation(currentLang, el.getAttribute('data-i18n-alt'));
      if (val !== undefined) el.setAttribute('alt', val);
    });

    doc.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
      const val = getTranslation(currentLang, el.getAttribute('data-i18n-aria-label'));
      if (val !== undefined) el.setAttribute('aria-label', val);
    });

    doc.querySelectorAll('.lang-btn[data-lang]').forEach((btn) => {
      const isMatch = btn.getAttribute('data-lang') === currentLang;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
    });
  }

  function dispatchLanguageChange(lang) {
    const detail = { lang: lang };
    if (typeof CustomEvent !== 'function') return;
    if (typeof document !== 'undefined' && typeof document.dispatchEvent === 'function') {
      document.dispatchEvent(new CustomEvent('lambdax:langchange', { detail: detail }));
    }
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('lambdax:langchange', { detail: detail }));
    }
  }

  function setLanguage(lang) {
    currentLang = lang === 'es' ? 'es' : 'en';
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, currentLang);
      }
    } catch (_) {
      /* Ignore storage restrictions in private browsers or tests */
    }
    applyTranslations();
    dispatchLanguageChange(currentLang);
    return currentLang;
  }

  function init() {
    let saved = 'en';
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'es' || stored === 'en') saved = stored;
      }
    } catch (_) {
      saved = 'en';
    }
    currentLang = saved;

    if (typeof document !== 'undefined') {
      document.querySelectorAll('.lang-btn[data-lang]').forEach((btn) => {
        btn.addEventListener('click', function () {
          setLanguage(btn.getAttribute('data-lang'));
        });
      });
    }

    applyTranslations();
    return currentLang;
  }

  const api = {
    TRANSLATIONS: TRANSLATIONS,
    init: init,
    setLanguage: setLanguage,
    applyTranslations: applyTranslations,
    getTranslation: getTranslation,
    t: function (key) {
      return getTranslation(currentLang, key);
    },
    getCurrentLang: function () {
      return currentLang;
    }
  };

  globalScope.LambdaXI18N = api;
  globalScope.I18N = api;
})(typeof window !== 'undefined' ? window : globalThis);
