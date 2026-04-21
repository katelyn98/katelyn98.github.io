---
layout: wedding
permalink: /a-k-wedding2026/registry/
title: Registry
hero_accent: Gift Registry
hide_hero_title: true
hero_lead_primary: Your love and presence are the greatest gift. If you would still like to give, we would be so grateful for support as we move to Seattle together. Your contribution will help with moving costs and legal fees as we start our next chapter together in Seattle.
hide_hero_lead_secondary: true
hide_hero_meta: true
hide_hero_photo: true
hero_image: /assets/img/wedding/main.jpg
registry_tracking_endpoint: "https://script.google.com/macros/s/AKfycbwoHRQt-aUzwZ3sgYHkTklanwrY7_3hkHQBMXIPeNcVM0kzdL1_2l7Yutr5-IvUXNZA/exec"
registry_payment:
  paypal_url: "https://paypal.me/KateCMorrison"
  venmo_url: "https://venmo.com/Katelyn-Morrison-6"
  zelle_name: "Katelyn Morrison"
  zelle_detail: "alvaroandkatefm@gmail.com"
show_registry_methods_highlight: true
show_registry_track_highlight: true
hero_highlight:
  kicker: "Registry Item"
  title: "Help us move to Seattle!"
  goal: "Goal: $10,000"
  contributed_amount: 0
  goal_amount: 10000
---

{% if page.registry_tracking_endpoint and page.registry_tracking_endpoint != "" %}
<script>
  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('registry-log-form');
    var submitButton = document.getElementById('registry-log-submit');
    var processingMessage = document.getElementById('registry-log-processing');
    var progressRoot = document.querySelector('[data-registry-progress]');

    function formatUsd(amount) {
      var value = Number(amount || 0);
      var rounded = Math.round(value * 100) / 100;
      var hasCents = Math.abs(rounded % 1) > 0;

      return '$' + rounded.toLocaleString('en-US', {
        minimumFractionDigits: hasCents ? 2 : 0,
        maximumFractionDigits: hasCents ? 2 : 0
      });
    }

    function updateProgress(totalRaised, goalAmount, contributionCount) {
      var safeGoal = Number(goalAmount || 0);
      var safeTotal = Math.max(0, Number(totalRaised || 0));
      var safeCount = Math.max(0, Number(contributionCount || 0));
      var progressPercent = safeGoal > 0 ? (safeTotal * 100) / safeGoal : 0;
      var clampedPercent = Math.max(0, Math.min(100, progressPercent));
      var track;
      var fill;
      var meta;

      if (!progressRoot) {
        return;
      }

      track = progressRoot.querySelector('[data-registry-progress-track]');
      fill = progressRoot.querySelector('[data-registry-progress-fill]');
      meta = progressRoot.querySelector('[data-registry-progress-meta]');

      if (fill) {
        fill.style.width = clampedPercent.toFixed(2) + '%';
      }

      if (track) {
        track.setAttribute('aria-valuenow', Math.round(clampedPercent).toString());
      }

      if (meta) {
        meta.textContent = formatUsd(safeTotal) + ' raised of ' + formatUsd(safeGoal) + ' goal (' + safeCount + ' contributions)';
      }
    }

    function buildSummaryUrl(endpoint, callbackName) {
      var separator = endpoint.indexOf('?') === -1 ? '?' : '&';

      return endpoint +
        separator +
        'action=contribution_summary&callback=' +
        encodeURIComponent(callbackName);
    }

    function fetchContributionSummary(endpoint) {
      return new Promise(function (resolve, reject) {
        var callbackName = 'registrySummary_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
        var script = document.createElement('script');
        var timeoutId;

        function cleanup() {
          if (timeoutId) {
            window.clearTimeout(timeoutId);
          }

          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }

          try {
            delete window[callbackName];
          } catch (error) {
            window[callbackName] = undefined;
          }
        }

        window[callbackName] = function (payload) {
          cleanup();
          resolve(payload || {});
        };

        script.onerror = function () {
          cleanup();
          reject(new Error('summary_request_failed'));
        };

        timeoutId = window.setTimeout(function () {
          cleanup();
          reject(new Error('summary_timeout'));
        }, 10000);

        script.src = buildSummaryUrl(endpoint, callbackName);
        document.body.appendChild(script);
      });
    }

    if (form && submitButton) {
      form.addEventListener('submit', function () {
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        if (processingMessage) {
          processingMessage.hidden = false;
        }
      });
    }

    if (progressRoot) {
      var endpoint = progressRoot.getAttribute('data-summary-endpoint');
      var goalAmount = Number(progressRoot.getAttribute('data-goal-amount') || 0);

      if (endpoint && goalAmount > 0) {
        fetchContributionSummary(endpoint)
          .then(function (payload) {
            if (!payload || payload.ok !== true || !payload.summary) {
              return;
            }

            updateProgress(
              payload.summary.total_raised,
              goalAmount,
              payload.summary.contribution_count
            );
          })
          .catch(function () {
            // Keep server-rendered fallback values if summary fetch fails.
          });
      }
    }
  });
</script>
{% endif %}
