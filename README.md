# λ LambdaX — NASA NISAR 

LambdaX is an easy to understand web application that translates complex technical an scientific data about the NISAR satellite to a simple and intuitive interface where any person can tell what they are watching and how it could help toasses damages after natural disasters. The current working demo shows two cases of natural disasters and how NISAR was important to visually allow researchersshare the data with the population. 
---

## The Problem & How LambdaX Solves It

- SAR technology can observe Earth's surface day or night through heavy clouds, rain, and vegetation, making it vital for flood response and environmental monitoring. However, radar imagery measurements are difficult for the general public to interpret without specialized training.
- LambdaX converts NISAR's radar scenes into an intuitive Red-to-Blue surface moisture scale inside a simple browser interface. Users can explore monitored regions, compare Before and After flood events side-by-side, click on any area for a plain-language summary, and draw their own conclusions about the importance of the NISAR mission.

---

## Important Features

- **Visualizes NASA NISAR radar data:** Displays NISAR L-band radar imagery using a dry to wet/flooded color scale.
- **Monitors local & disaster regions:**
  - **Regional Moisture View:** Interactive map of Santiago del Estero (Argentina).  
  - **Before / After flood comparisons:** Synchronized side-by-side maps showing flood impacts in Mozambique (Chokwe / Macia) and the Nepal–China border (Gyirong Port, across Ascending and Descending radar tracks) where cloud cover blocks traditional optical cameras.  
- **Explains Data in plain language:** Allows users to click anywhere inside a monitored zone to inspect its moisture level and Before/After variation without technical jargon.  
- **Highlights Global SAR Applications:** Includes an educational tab showcasing official NASA NISAR imagery (coastal ecosystems and agricultural crops) and explaining the physics behind radar remote sensing.  

- **Exclusivity:** This project only uses NASA NISAR satellite data. It does not include data from any other satellite mission. Although an earlier version of the project included complementary data from NASA temperature and weather satellites, we decided to reduce project complexity and include only NISAR data. It is technically feasible and convenient to improve current data.  
- **Not reliable for granular scientific analysis:** The Before/After map overlays use a simplified recoloring of NISAR preview imagery designed for public understanding; official imagery processed directly by NASA is much more accurate and fully calibrated for terrain and radiometry.  
- **No Complex Infrastructure:** It does not require databases, external frameworks, or build pipelines to run. Hardcoded and pre-processed imagery has been included in the demo in order to allow users visualize how calibrated data for flooding analysis purposes looks like.

---

## General Architecture

The project is split into two main components:

1. **Offline Data Pipeline (`fetch_nisar_live.py`):** A Python script that queries NASA Earthdata for NISAR scenes over the configured regions, converts the radar preview images into the Red-to-Blue moisture overlays (`nisar_data/`), and writes a local scene catalog (`nisar_live_scenes.json`).
2. **Web HUD (`index.html`):** A self-contained web application that reads the local catalog and images, rendering interactive maps, synchronized Before/After comparison panels, and the educational gallery (`PICTURES/`).

---

## How to Run Locally

1. **Clone or open the repository directory:**
   ```bash
   cd lambdax
   ```

2. **Start a local web server (Python 3):**
   ```bash
   python3 -m http.server 8000
   ```

3. **Open the HUD in your browser:**
   Navigate to `http://localhost:8000`

*(Optional)* Since pre-processed NISAR images and metadata are already included in `nisar_data/` and `nisar_live_scenes.json`, the app works immediately. To re-fetch or reprocess the NISAR scenes with Python, run:
```bash
python3 fetch_nisar_live.py --reprocess-local
```

---

## Architecture Diagram

```text
  +-------------------------------------------------------------------------+
  |                         EXTERNAL DATA SOURCES                           |
  |                                                                         |
  |  [NASA Earthdata CMR API]   [ASF Earthdata Cloud]   [Esri / CARTO / OSM]|
  |  (NISAR L2 GCOV Metadata)   (LATLON Browse PNGs)    (Base Map Tiles)    |
  +-------------+-------------------------+----------------------+----------+
                |                         |                      |
                v                         v                      |
  +---------------------------------------------------+          |
  | 1. OFFLINE PYTHON PIPELINE (fetch_nisar_live.py)  |          |
  |    - Queries CMR by polygon & date                |          |
  |    - Downloads browse PNGs from ASF Cloud         |          |
  |    - Crops & recolors to Red-to-Blue moisture     |          |
  +-------------+-------------------------+-----------+          |
                |                         |                      |
                v                         v                      |
  +---------------------------------------------------+          |
  | 2. STATIC LOCAL ASSETS                            |          |
  |    - nisar_live_scenes.json (Metadata & Stats)    |          |
  |    - nisar_data/*_blue.png  (Moisture Overlays)   |          |
  |    - PICTURES/*.png         (NASA SAR Gallery)    |          |
  +---------------------------+-----------------------+          |
                              |                                  |
                              v                                  v
  +-------------------------------------------------------------------------+
  | 3. INTERACTIVE WEB HUD (index.html)                                     |
  |                                                                         |
  |    +---------------------------------------------------------------+    |
  |    | Bilingual Engine (Default: EN [USA Flag] <-> ES [Spain Flag]) |    |
  |    +---------------------------------------------------------------+    |
  |    | Tab 1: Single Map Monitor (Santiago del Estero)               |    |
  |    | Tabs 2 & 3: Synchronized Before/After (Mozambique & Nepal)    |    |
  |    | Tab 4: Educational Gallery (Current & Future SAR Uses)        |    |
  |    | Canvas Pixel Sampler & Citizen Humidity Inspector             |    |
  |    +---------------------------------------------------------------+    |
  +-------------------------------------------------------------------------+
```

