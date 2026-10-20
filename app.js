// Club Routes: overlays every route in data/routes.json on a Leaflet map.
// The page is view-only. Routes are added by the repository owner, who commits
// GPX files to /routes; the GitHub Action then rebuilds data/routes.json.
(() => {
  const OVERLAP = { color: '#1f4e8c', weight: 3, opacity: 0.35 };
  const SELECTED = { color: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#d6402b', weight: 5, opacity: 1 };

  const $ = s => document.querySelector(s);
  const list = $('#list'), summary = $('#summary'), search = $('#search');
  const sortSel = $('#sort'), modeSel = $('#colour-mode');

  // ---------- map ----------
  const map = L.map('map', { preferCanvas: true }).setView([55.68, 12.57], 9);
  const renderer = L.canvas({ tolerance: 6 }); // wider click target on thin lines
  const bases = {
    'Light': L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19, subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }),
    'OpenStreetMap': L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }),
    'CyclOSM': L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
      maxZoom: 20, attribution: '<a href="https://www.cyclosm.org">CyclOSM</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    })
  };
  bases['Light'].addTo(map);
  L.control.layers(bases, null, { position: 'topright' }).addTo(map);
  L.control.scale({ imperial: false }).addTo(map);

  // ---------- state ----------
  const routes = [];
  let selectedId = null;

  const hue = i => `hsl(${(i * 137.508) % 360} 70% 45%)`; // golden-angle spread
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function styleFor(r) {
    if (r.id === selectedId) return SELECTED;
    if (modeSel.value === 'distinct') return { color: r.colour, weight: 3, opacity: 0.85 };
    return OVERLAP;
  }

  function matches(r) {
    const q = search.value.trim().toLowerCase();
    return !q || r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
  }

  function addRoute(r) {
    r.visible = true;
    r.colour = hue(routes.length);
    r.layer = L.polyline(r.lines, { renderer, ...styleFor(r) });
    r.layer.on('click', e => { select(r.id, false); popup(r, e.latlng); });
    r.layer.on('mouseover', () => { if (r.id !== selectedId) r.layer.setStyle({ weight: 5, opacity: 0.9 }); });
    r.layer.on('mouseout', () => r.layer.setStyle(styleFor(r)));
    routes.push(r);
  }

  function popup(r, latlng) {
    L.popup().setLatLng(latlng)
      .setContent(`<b>${esc(r.name)}</b>${r.km} km · ${r.gain} m climbing<br><a href="${esc(r.file)}" download>Download GPX</a>`)
      .openOn(map);
  }

  function refreshMap() {
    for (const r of routes) {
      const show = r.visible && matches(r);
      if (show && !map.hasLayer(r.layer)) r.layer.addTo(map);
      if (!show && map.hasLayer(r.layer)) r.layer.remove();
      r.layer.setStyle(styleFor(r));
    }
    const sel = routes.find(r => r.id === selectedId);
    if (sel && map.hasLayer(sel.layer)) sel.layer.bringToFront();
  }

  function renderList() {
    const key = sortSel.value;
    const shown = routes.filter(matches).sort((a, b) =>
      key === 'name' ? a.name.localeCompare(b.name, undefined, { numeric: true }) : b[key] - a[key]);
    list.innerHTML = '';
    for (const r of shown) {
      const li = document.createElement('li');
      li.dataset.id = r.id;
      if (r.id === selectedId) li.className = 'active';
      li.innerHTML = `
        <input type="checkbox" ${r.visible ? 'checked' : ''} aria-label="Show on map">
        <span class="name">${modeSel.value === 'distinct' ? `<span class="swatch" style="background:${r.colour}"></span>` : ''}${esc(r.name)}</span>
        <span class="meta">${r.km} km · ${r.gain} m</span>`;
      li.querySelector('input').addEventListener('click', e => {
        e.stopPropagation();
        r.visible = e.target.checked;
        refreshMap();
      });
      li.addEventListener('click', () => select(r.id, true));
      list.appendChild(li);
    }
    const total = routes.reduce((s, r) => s + r.km, 0);
    summary.textContent = `${routes.length} routes · ${Math.round(total).toLocaleString()} km in total` +
      (shown.length !== routes.length ? ` · ${shown.length} match` : '');
  }

  function select(id, zoom) {
    selectedId = selectedId === id && zoom ? null : id;
    const r = routes.find(x => x.id === id);
    if (r && selectedId) {
      r.visible = true;
      if (zoom) map.fitBounds(r.layer.getBounds(), { padding: [30, 30] });
    }
    refreshMap();
    renderList();
    const li = list.querySelector(`li[data-id="${CSS.escape(id)}"]`);
    if (li) li.scrollIntoView({ block: 'nearest' });
  }

  function fitVisible() {
    const layers = routes.filter(r => map.hasLayer(r.layer)).map(r => r.layer);
    if (layers.length) map.fitBounds(L.featureGroup(layers).getBounds(), { padding: [20, 20] });
  }

  // ---------- events ----------
  search.addEventListener('input', () => { refreshMap(); renderList(); });
  sortSel.addEventListener('change', renderList);
  modeSel.addEventListener('change', () => { refreshMap(); renderList(); });
  $('#all-on').addEventListener('click', () => { routes.filter(matches).forEach(r => r.visible = true); refreshMap(); renderList(); });
  $('#all-off').addEventListener('click', () => { routes.filter(matches).forEach(r => r.visible = false); refreshMap(); renderList(); });
  $('#fit').addEventListener('click', fitVisible);
  map.on('click', () => { if (selectedId) { selectedId = null; refreshMap(); renderList(); } });

  // ---------- boot ----------
  (async () => {
    try {
      const res = await fetch('data/routes.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      ((await res.json()).routes || []).forEach(addRoute);
    } catch {
      summary.textContent = 'Could not load routes.';
      return;
    }
    refreshMap(); renderList();
    if (routes.length) fitVisible();
    else summary.textContent = 'No routes yet.';
  })();
})();
