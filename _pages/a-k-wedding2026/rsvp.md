---
layout: wedding
permalink: /a-k-wedding2026/rsvp/
title: RSVP
hide_hero: true
show_side_decor: false
---

<section class="wedding-card">
  <h2>RSVP</h2>
  <p class="rsvp-instructions">Please begin with the phone number associated with your invitation. Once we find your party, we will show the guests listed and the number of seats reserved for the ceremony and reception. If your plans change, you can submit again with the same phone number to update your RSVP.</p>

  <form class="rsvp-form" id="rsvp-form" action="https://script.google.com/macros/s/AKfycbwoHRQt-aUzwZ3sgYHkTklanwrY7_3hkHQBMXIPeNcVM0kzdL1_2l7Yutr5-IvUXNZA/exec" method="POST">
    <div class="rsvp-step">
      <div class="form-group">
        <label for="lookup-phone">Phone number</label>
        <input type="tel" id="lookup-phone" name="lookup_phone_display" placeholder="Enter your phone number" inputmode="tel" autocomplete="tel" required>
        <p class="rsvp-help">Use the phone number we have on file for your invitation, and please leave off the country code.</p>
        <p class="rsvp-help">If your phone number does not work, please reach out to Katelyn.</p>
      </div>

      <div class="rsvp-actions">
        <button type="button" id="lookup-button">Next</button>
      </div>

      <p class="rsvp-error" id="lookup-error" hidden>We could not find that phone number. Please try again or reach out to Katelyn if you need help with your RSVP.</p>
    </div>

    <div class="rsvp-step" id="rsvp-details" hidden>
      <input type="hidden" id="lookup-phone-hidden" name="lookup_phone" value="">
      <input type="hidden" id="invited-party-hidden" name="invited_party" value="">
      <input type="hidden" id="ceremony-allowed-hidden" name="ceremony_allowed" value="">
      <input type="hidden" id="reception-allowed-hidden" name="reception_allowed" value="">
      <input type="hidden" id="attendance-status" name="attendance_status" value="">

      <div class="rsvp-summary" aria-live="polite">
        <p class="rsvp-summary-label">Invitation</p>
        <p class="rsvp-summary-names" id="invited-names">Your invited party will appear here.</p>
        <p class="rsvp-summary-seats" id="ceremony-seats">We have reserved your ceremony seats in your honor.</p>
        <p class="rsvp-summary-seats" id="reception-seats">We have reserved your reception seats in your honor.</p>
      </div>

      <div class="rsvp-grid">
        <div class="form-group">
          <label for="ceremony-count">__ of __ attending the ceremony</label>
          <select id="ceremony-count" name="ceremony_attending" required disabled>
            <option value="" selected disabled>Select ceremony attendance</option>
          </select>
          <p class="rsvp-help">Please confirm only the number of seats reserved for the ceremony.</p>
        </div>

        <div class="form-group">
          <label for="reception-count">__ of __ attending the reception</label>
          <select id="reception-count" name="reception_attending" required disabled>
            <option value="" selected disabled>Select reception attendance</option>
          </select>
          <p class="rsvp-help">Please confirm only the number of seats reserved for the reception.</p>
        </div>
      </div>

      <div class="form-group">
        <label for="message">Message / dietary needs</label>
        <textarea id="message" name="message" placeholder="Optional notes for the couple, including dietary needs"></textarea>
      </div>

      <div class="rsvp-actions">
        <button type="button" class="secondary" id="start-over">Back</button>
        <button type="submit" id="submit-rsvp">Submit RSVP</button>
      </div>
      <p class="rsvp-processing" id="rsvp-processing" hidden>Submitting your RSVP. Please wait...</p>
    </div>
  </form>
</section>

<script>
  document.addEventListener('DOMContentLoaded', function () {
    var rsvpForm = document.getElementById('rsvp-form');
    var rsvpEndpoint = rsvpForm.getAttribute('action');
    var phoneInput = document.getElementById('lookup-phone');
    var lookupButton = document.getElementById('lookup-button');
    var defaultLookupButtonText = lookupButton.textContent;
    var lookupError = document.getElementById('lookup-error');
    var defaultLookupErrorMessage = lookupError.textContent;
    var startOverButton = document.getElementById('start-over');
    var submitButton = document.getElementById('submit-rsvp');
    var processingMessage = document.getElementById('rsvp-processing');
    var detailsStep = document.getElementById('rsvp-details');
    var invitedNames = document.getElementById('invited-names');
    var ceremonySeats = document.getElementById('ceremony-seats');
    var receptionSeats = document.getElementById('reception-seats');
    var ceremonyCount = document.getElementById('ceremony-count');
    var receptionCount = document.getElementById('reception-count');
    var hiddenPhone = document.getElementById('lookup-phone-hidden');
    var hiddenParty = document.getElementById('invited-party-hidden');
    var hiddenCeremonyAllowed = document.getElementById('ceremony-allowed-hidden');
    var hiddenReceptionAllowed = document.getElementById('reception-allowed-hidden');
    var attendanceStatus = document.getElementById('attendance-status');
    var isSubmitting = false;

    function normalizePhone(value) {
      var digits = value.replace(/\D/g, '');

      if (digits.length === 11 && digits.charAt(0) === '1') {
        digits = digits.slice(1);
      }

      return digits;
    }

    function buildLookupUrl(normalizedPhone, callbackName) {
      var separator = rsvpEndpoint.indexOf('?') === -1 ? '?' : '&';

      return rsvpEndpoint +
        separator +
        'action=lookup&phone=' +
        encodeURIComponent(normalizedPhone) +
        '&callback=' +
        encodeURIComponent(callbackName);
    }

    function lookupPartyByPhone(normalizedPhone) {
      return new Promise(function (resolve, reject) {
        var callbackName = 'rsvpLookup_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
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
          reject(new Error('lookup_request_failed'));
        };

        timeoutId = window.setTimeout(function () {
          cleanup();
          reject(new Error('lookup_timeout'));
        }, 10000);

        script.src = buildLookupUrl(normalizedPhone, callbackName);
        document.body.appendChild(script);
      });
    }

    function renderAttendanceOptions(select, count, label) {
      var placeholder = '<option value="" selected disabled>Select ' + label + ' attendance</option>';
      var options = [placeholder];
      var i;

      for (i = 0; i <= count; i += 1) {
        options.push('<option value="' + i + '">' + i + ' of ' + count + ' attending ' + label + '</option>');
      }

      select.innerHTML = options.join('');
      select.disabled = false;
    }

    function resetDetails() {
      invitedNames.textContent = 'Your invited party will appear here.';
      ceremonySeats.textContent = 'We have reserved your ceremony seats in your honor.';
      receptionSeats.textContent = 'We have reserved your reception seats in your honor.';
      ceremonyCount.innerHTML = '<option value="" selected disabled>Select ceremony attendance</option>';
      receptionCount.innerHTML = '<option value="" selected disabled>Select reception attendance</option>';
      ceremonyCount.disabled = true;
      receptionCount.disabled = true;
      hiddenPhone.value = '';
      hiddenParty.value = '';
      hiddenCeremonyAllowed.value = '';
      hiddenReceptionAllowed.value = '';
      attendanceStatus.value = '';
    }

    function updateAttendanceStatus() {
      var ceremonyAllowed = parseInt(hiddenCeremonyAllowed.value, 10);
      var receptionAllowed = parseInt(hiddenReceptionAllowed.value, 10);
      var ceremonyAttending = parseInt(ceremonyCount.value, 10);
      var receptionAttending = parseInt(receptionCount.value, 10);

      if (
        isNaN(ceremonyAllowed) ||
        isNaN(receptionAllowed) ||
        isNaN(ceremonyAttending) ||
        isNaN(receptionAttending)
      ) {
        attendanceStatus.value = '';
      } else if (ceremonyAttending === 0 && receptionAttending === 0) {
        attendanceStatus.value = 'declines';
      } else if (
        ceremonyAttending === ceremonyAllowed &&
        receptionAttending === receptionAllowed
      ) {
        attendanceStatus.value = 'accepts';
      } else {
        attendanceStatus.value = 'partial';
      }
    }

    function renderParty(party, normalizedPhone) {
      var ceremonyAllowed = Number(party.ceremony_allowed || 0);
      var receptionAllowed = Number(party.reception_allowed || 0);

      if (isNaN(ceremonyAllowed) || ceremonyAllowed < 0) {
        ceremonyAllowed = 0;
      }

      if (isNaN(receptionAllowed) || receptionAllowed < 0) {
        receptionAllowed = 0;
      }

      hiddenPhone.value = normalizedPhone;
      hiddenParty.value = party.invited_party;
      hiddenCeremonyAllowed.value = String(ceremonyAllowed);
      hiddenReceptionAllowed.value = String(receptionAllowed);

      invitedNames.textContent = 'Please indicate attendance for: ' + party.invited_party;
      ceremonySeats.textContent = 'We have reserved ' + ceremonyAllowed + ' seat' + (ceremonyAllowed === 1 ? '' : 's') + ' at the ceremony in your honor.';
      receptionSeats.textContent = 'We have reserved ' + receptionAllowed + ' seat' + (receptionAllowed === 1 ? '' : 's') + ' at the reception in your honor.';

      renderAttendanceOptions(ceremonyCount, ceremonyAllowed, 'the ceremony');
      renderAttendanceOptions(receptionCount, receptionAllowed, 'the reception');

      detailsStep.hidden = false;
      lookupError.hidden = true;
      updateAttendanceStatus();
    }

    async function handleLookup() {
      var normalizedPhone;
      var lookupResult;
      var party;

      if (!phoneInput.value.trim()) {
        phoneInput.reportValidity();
        return;
      }

      normalizedPhone = normalizePhone(phoneInput.value);
      lookupError.textContent = defaultLookupErrorMessage;
      lookupError.hidden = true;

      if (!normalizedPhone) {
        lookupError.hidden = false;
        detailsStep.hidden = true;
        resetDetails();
        return;
      }

      lookupButton.disabled = true;
      lookupButton.textContent = 'Looking up...';

      try {
        lookupResult = await lookupPartyByPhone(normalizedPhone);
      } catch (error) {
        lookupError.textContent = 'We could not check that phone number right now. Please try again or reach out to Katelyn.';
        lookupError.hidden = false;
        detailsStep.hidden = true;
        resetDetails();
        return;
      } finally {
        if (!isSubmitting) {
          lookupButton.disabled = false;
          lookupButton.textContent = defaultLookupButtonText;
        }
      }

      party = lookupResult && lookupResult.found ? lookupResult.party : null;

      if (lookupResult && lookupResult.ok === false) {
        lookupError.textContent = 'We could not check that phone number right now. Please try again or reach out to Katelyn.';
        lookupError.hidden = false;
        detailsStep.hidden = true;
        resetDetails();
        return;
      }

      if (!party) {
        lookupError.textContent = defaultLookupErrorMessage;
        lookupError.hidden = false;
        detailsStep.hidden = true;
        resetDetails();
        return;
      }

      renderParty(party, normalizedPhone);
    }

    lookupButton.addEventListener('click', handleLookup);
    startOverButton.addEventListener('click', function () {
      phoneInput.value = '';
      lookupError.hidden = true;
      lookupError.textContent = defaultLookupErrorMessage;
      detailsStep.hidden = true;
      resetDetails();
      phoneInput.focus();
    });
    phoneInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleLookup();
      }
    });
    ceremonyCount.addEventListener('change', updateAttendanceStatus);
    receptionCount.addEventListener('change', updateAttendanceStatus);
    rsvpForm.addEventListener('submit', function (event) {
      if (isSubmitting) {
        event.preventDefault();
        return;
      }

      isSubmitting = true;
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';
      startOverButton.disabled = true;
      lookupButton.disabled = true;
      phoneInput.readOnly = true;
      processingMessage.hidden = false;
    });

    resetDetails();
  });
</script>
