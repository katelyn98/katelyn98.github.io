---
layout: page
title: portfolio
permalink: /portfolio/
description: Interactive demos and project walkthroughs.
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
  .portfolio-card img,
  .portfolio-card iframe {
    width: 100%;
    height: 210px;
    display: block;
    background: #0b1020;
  }

  .portfolio-card video,
  .portfolio-card img {
    object-fit: cover;
  }

  .portfolio-card iframe {
    border: 0;
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

  .publication-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin: 0.55rem 0 0;
  }

  .publication-tag {
    border: 1px solid #c7d2e5;
    border-radius: 999px;
    padding: 0.22rem 0.55rem;
    background: #f6f8fc;
    color: #1f2937;
    font-size: 0.78rem;
    font-weight: 600;
  }

  .publication-tag:hover {
    background: #e9eef9;
    color: #1f2937;
    text-decoration: none;
  }
</style>

{% assign portfolio_videos = site.static_files | where_exp: "file", "file.path contains '/assets/vid/'" %}
{% assign portfolio_projects = site.data.portfolio_projects %}

{% if portfolio_videos.size > 0 or portfolio_projects.size > 0 %}
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
          {% if meta.demo or meta.publications %}
            <div class="publication-tags" aria-label="Project links">
              {% if meta.demo %}
                <a class="publication-tag" href="{{ meta.demo }}" target="_blank" rel="noopener noreferrer">Demo</a>
              {% endif %}
              {% for publication in meta.publications %}
                <a class="publication-tag" href="{{ publication.url | relative_url }}">{{ publication.label }}</a>
              {% endfor %}
            </div>
          {% endif %}
        </div>
      </article>
    {% endfor %}

    {% for project in portfolio_projects %}
      <article class="portfolio-card">
        {% if project.video %}
          <video autoplay muted loop playsinline preload="metadata" aria-label="{{ project.title }} demo">
            <source src="{{ project.video | relative_url }}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        {% elsif project.embed %}
          <iframe src="{{ project.embed }}" title="{{ project.title }} video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        {% else %}
          <a href="{{ project.url }}" target="_blank" rel="noopener noreferrer">
            <img src="{{ project.thumbnail | relative_url }}" alt="Screenshot of the {{ project.title }} interactive visualization">
          </a>
        {% endif %}

        <div class="portfolio-copy">
          <h3>{{ project.title }}</h3>
          <p>{{ project.description }}</p>
          {% if project.github or project.demo or project.publications %}
            <div class="publication-tags" aria-label="Project links">
              {% if project.github %}
                <a class="publication-tag" href="{{ project.github }}" target="_blank" rel="noopener noreferrer">Source code</a>
              {% endif %}
              {% if project.demo %}
                <a class="publication-tag" href="{{ project.demo }}" target="_blank" rel="noopener noreferrer">Demo</a>
              {% endif %}
              {% for publication in project.publications %}
                <a class="publication-tag" href="{{ publication.url | relative_url }}">{{ publication.label }}</a>
              {% endfor %}
            </div>
          {% endif %}
        </div>
      </article>
    {% endfor %}
  </div>
{% else %}
  <p>
    Add your videos to <code>assets/vid/</code> and they will appear here automatically.
  </p>
{% endif %}
