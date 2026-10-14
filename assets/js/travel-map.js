(function () {
  const mapElement = document.getElementById('travel-map');
  const dataElement = document.getElementById('travel-map-data');

  if (!mapElement || !dataElement || typeof L === 'undefined') return;

  const destinations = JSON.parse(dataElement.textContent);
  const journal = document.querySelector('[data-travel-journal]');
  const status = document.querySelector('[data-travel-status]');
  const markerLayer = L.featureGroup();
  const markers = new Map();

  const map = L.map(mapElement, {
    minZoom: 2,
    maxZoom: 12,
    scrollWheelZoom: false,
    zoomControl: false
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);
  markerLayer.addTo(map);

  function markerIcon(index) {
    return L.divIcon({
      className: 'travel-map__marker-wrap',
      html: `<span class="travel-map__marker travel-map__marker--${index + 1}"></span>`,
      iconAnchor: [14, 14],
      iconSize: [28, 28]
    });
  }

  function showDestination(destination, marker, shouldFly) {
    const image = journal.querySelector('[data-travel-image]');
    journal.classList.toggle('has-no-image', !destination.image);

    if (destination.image) {
      image.src = destination.image;
      image.alt = `Scenes from ${destination.title}`;
    } else {
      image.removeAttribute('src');
      image.alt = '';
    }

    journal.querySelector('[data-travel-category]').textContent = destination.category;
    journal.querySelector('[data-travel-title]').textContent = destination.title;
    journal.querySelector('[data-travel-description]').textContent = destination.description;
    journal.querySelector('[data-travel-link]').href = destination.url;
    journal.classList.add('is-visible');

    document.querySelectorAll('.travel-map__marker').forEach((element) => element.classList.remove('is-active'));
    marker.getElement()?.querySelector('.travel-map__marker')?.classList.add('is-active');

    if (shouldFly) {
      map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 5), { duration: 0.8 });
    }
  }

  destinations.forEach((destination, index) => {
    destination.index = index;
    const marker = L.marker([destination.latitude, destination.longitude], {
      icon: markerIcon(index),
      title: destination.title,
      alt: `View ${destination.title}`,
      riseOnHover: true
    });

    marker.on('click', () => showDestination(destination, marker, true));
    marker.bindTooltip(destination.title, { direction: 'top', offset: [0, -8] });
    markers.set(destination.title, { destination, marker });
    marker.addTo(markerLayer);
  });

  function fitVisibleMarkers() {
    if (markerLayer.getLayers().length) {
      map.fitBounds(markerLayer.getBounds(), { padding: [45, 45], maxZoom: 5 });
    }
  }

  mapElement.addEventListener('wheel', () => map.scrollWheelZoom.enable(), { once: true });
  fitVisibleMarkers();
  showDestination(destinations[0], markers.get(destinations[0].title).marker, false);
  status.textContent = `${destinations.length} places on the map`;
  mapElement.setAttribute('tabindex', '0');
})();