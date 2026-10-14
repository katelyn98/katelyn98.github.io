---
layout: default
title: travel
travel_blog: Whispering my Wanderlust
permalink: /travel/
description: Notes and photographs from places I have explored.
display_categories: [Europe & UK, Central America, North America]
travel_map: true

nav: true
---

<div class="travel-index">
  <div class="travel-map__stage">
    <header class="travel-map__title">
      <h1>Whispering my <em>Wanderlust</em></h1>
      <p>Click or drag to explore</p>
    </header>

    <div id="travel-map" role="region" aria-label="Interactive map of travel journals"></div>

    <aside class="travel-map__journal" data-travel-journal aria-live="polite">
      <div class="travel-map__photo">
        <img data-travel-image src="" alt="">
      </div>
      <div class="travel-map__journal-body">
        <span data-travel-category></span>
        <h2 data-travel-title></h2>
        <p data-travel-description></p>
        <a data-travel-link href="">Open the journal <span aria-hidden="true">↗</span></a>
      </div>
    </aside>

    <p class="travel-map__status" data-travel-status aria-live="polite"></p>
  </div>

</div>

<script id="travel-map-data" type="application/json">
[
  {% assign destinations = site.travel | sort: "title" %}
  {% for destination in destinations %}
  {
    "title": {{ destination.title | jsonify }},
    "description": {{ destination.description | jsonify }},
    "category": {{ destination.category | jsonify }},
    "image": {% if destination.img %}{{ destination.img | relative_url | jsonify }}{% else %}null{% endif %},
    "url": {{ destination.url | relative_url | jsonify }},
    "latitude": {{ destination.latitude | jsonify }},
    "longitude": {{ destination.longitude | jsonify }}
  }{% unless forloop.last %},{% endunless %}
  {% endfor %}
]
</script>
