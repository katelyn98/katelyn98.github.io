---
layout: page
title: portfolio
permalink: /portfolio/
description: Video portfolio with previews and fullscreen playback.
nav: true
---

<style>
  .portfolio-intro {
    margin-bottom: 1.5rem;
  }

  .portfolio-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1.25rem;
  }

  .portfolio-card {
    border: 1px solid #d9dee8;
    border-radius: 12px;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 6px 18px rgba(9, 30, 66, 0.08);
  }

  .portfolio-card video,
  .portfolio-card img {
    width: 100%;
    height: 210px;
    object-fit: cover;
    display: block;
    background: #0b1020;
  }

  .portfolio-copy {
    padding: 0.85rem 0.95rem 1rem;
  }

  .portfolio-copy h3 {
    margin: 0 0 0.4rem;
    font-size: 1.05rem;
  }

  .portfolio-copy p {
    margin: 0 0 0.65rem;
    color: #374151;
    line-height: 1.45;
  }

  .fullscreen-btn {
    border: 1px solid #c7d2e5;
    background: #f6f8fc;
    color: #1f2937;
    border-radius: 8px;
    padding: 0.38rem 0.7rem;
    font-size: 0.86rem;
    font-weight: 600;
    cursor: pointer;
  }

  .fullscreen-btn:hover {
    background: #e9eef9;
  }
</style>

{% assign portfolio_videos = site.static_files | where_exp: "file", "file.path contains '/assets/vid/'" %}

<div class="portfolio-intro">
  <p>
    Explore selected portfolio videos. Use the player controls or the fullscreen button on each card.
  </p>
</div>

{% if portfolio_videos.size > 0 %}
  <div class="portfolio-grid">
    {% for video in portfolio_videos %}
      {% assign slug = video.basename %}
      {% assign readable_name = slug | replace: '-', ' ' | replace: '_', ' ' %}
      {% assign meta = site.data.portfolio_videos[slug] %}
      {% assign video_title = meta.title | default: readable_name %}
      {% assign video_description = meta.description | default: "Short description coming soon." %}
      {% assign video_id = "portfolio-video-" | append: forloop.index %}

      <article class="portfolio-card">
        {% if meta.thumbnail %}
          <video id="{{ video_id }}" controls preload="metadata" playsinline poster="{{ meta.thumbnail | relative_url }}">
            <source src="{{ video.path | relative_url }}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        {% else %}
          <video id="{{ video_id }}" controls preload="metadata" playsinline>
            <source src="{{ video.path | relative_url }}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        {% endif %}

        <div class="portfolio-copy">
          <h3>{{ video_title }}</h3>
          <p>{{ video_description }}</p>
          <button class="fullscreen-btn" type="button" onclick="openPortfolioFullscreen('{{ video_id }}')">
            Fullscreen
          </button>
        </div>
      </article>
    {% endfor %}
  </div>
{% else %}
  <p>
    Add your videos to <code>assets/vid/</code> and they will appear here automatically.
  </p>
{% endif %}

<script>
  function openPortfolioFullscreen(videoId) {
    var el = document.getElementById(videoId);
    if (!el) return;

    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen();
    }
  }
</script>
