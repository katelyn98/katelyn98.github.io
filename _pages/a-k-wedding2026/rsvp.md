---
layout: wedding
permalink: /a-k-wedding2026/rsvp/
title: RSVP
hide_hero: true
show_side_decor: true
---

<section class="wedding-card">
  <h2>RSVP</h2>
  <p class="rsvp-instructions">Please begin with the phone number associated with your invitation. Once we find your party, we will show the guests listed and the number of seats reserved for the ceremony and reception. If your plans change, you can submit again with the same phone number to update your RSVP.</p>

  <form class="rsvp-form" action="https://script.google.com/macros/s/AKfycbwFeOHQZpZ07IN41hvGBsZ-lyD2u10A55CAB3yetB4orXByyVKTG5UzwU13m_Qrdvuz/exec" method="POST">
    <div class="rsvp-step">
      <div class="form-group">
        <label for="lookup-phone">Phone number</label>
        <input type="tel" id="lookup-phone" name="lookup_phone_display" placeholder="Enter your phone number" inputmode="tel" autocomplete="tel" required>
        <p class="rsvp-help">Use the phone number we have on file for your invitation, and please leave off the country code.</p>
      </div>

      <div class="rsvp-actions">
        <button type="button" id="lookup-button">Next</button>
      </div>

      <p class="rsvp-error" id="lookup-error" hidden>We could not find that phone number. Please try again or reach out to us if you need help with your RSVP.</p>
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
        <button type="submit">Submit RSVP</button>
      </div>
    </div>
  </form>

  <p class="rsvp-notice">Replace the form action with your Google Apps Script web app URL so responses are written to your Google Sheet.</p>
</section>

<script>
  document.addEventListener('DOMContentLoaded', function () {
    var parties = {{ site.data.wedding_rsvp_parties | jsonify }};
    var phoneInput = document.getElementById('lookup-phone');
    var lookupButton = document.getElementById('lookup-button');
    var lookupError = document.getElementById('lookup-error');
    var startOverButton = document.getElementById('start-over');
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

    function normalizePhone(value) {
      var digits = value.replace(/\D/g, '');

      if (digits.length === 11 && digits.charAt(0) === '1') {
        digits = digits.slice(1);
      }

      return digits;
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
      hiddenPhone.value = normalizedPhone;
      hiddenParty.value = party.invited_party;
      hiddenCeremonyAllowed.value = String(party.ceremony_allowed);
      hiddenReceptionAllowed.value = String(party.reception_allowed);

      invitedNames.textContent = 'Please indicate attendance for: ' + party.invited_party;
      ceremonySeats.textContent = 'We have reserved ' + party.ceremony_allowed + ' seat' + (party.ceremony_allowed === 1 ? '' : 's') + ' at the ceremony in your honor.';
      receptionSeats.textContent = 'We have reserved ' + party.reception_allowed + ' seat' + (party.reception_allowed === 1 ? '' : 's') + ' at the reception in your honor.';

      renderAttendanceOptions(ceremonyCount, party.ceremony_allowed, 'the ceremony');
      renderAttendanceOptions(receptionCount, party.reception_allowed, 'the reception');

      detailsStep.hidden = false;
      lookupError.hidden = true;
      updateAttendanceStatus();
    }

    function findPartyByPhone(normalizedPhone) {
      return parties.find(function (party) {
        return Array.isArray(party.phone_numbers) && party.phone_numbers.some(function (phone) {
          return normalizePhone(String(phone || '')) === normalizedPhone;
        });
      });
    }

    function handleLookup() {
      var normalizedPhone;
      var party;

      if (!phoneInput.value.trim()) {
        phoneInput.reportValidity();
        return;
      }

      normalizedPhone = normalizePhone(phoneInput.value);

      if (!normalizedPhone) {
        lookupError.hidden = false;
        detailsStep.hidden = true;
        resetDetails();
        return;
      }

      party = findPartyByPhone(normalizedPhone);

      if (!party) {
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

    resetDetails();
  });
</script>
