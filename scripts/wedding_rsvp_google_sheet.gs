const SHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
const WEBSITE_HOME_URL = 'https://YOUR_DOMAIN/a-k-wedding2026/';
const SHEET_ID_PROPERTY = 'WEDDING_RSVP_SHEET_ID';
const INVITES_SHEET = 'Invites';
const RESPONSES_SHEET = 'Responses';
const SUMMARY_SHEET = 'Summary';
const DIETARY_SHEET = 'Dietary';

function setupWeddingRsvpSheet() {
  const spreadsheet = getSpreadsheetForSetup_();
  const invites = getOrCreateSheet_(spreadsheet, INVITES_SHEET);
  const responses = getOrCreateSheet_(spreadsheet, RESPONSES_SHEET);
  const summary = getOrCreateSheet_(spreadsheet, SUMMARY_SHEET);
  const dietary = getOrCreateSheet_(spreadsheet, DIETARY_SHEET);

  PropertiesService.getScriptProperties().setProperty(SHEET_ID_PROPERTY, spreadsheet.getId());
  ensureInvitesSheet_(invites);
  ensureResponsesSheet_(responses);
  const latestResponses = getLatestResponses_(responses);
  refreshSummarySheet_(summary, latestResponses);
  refreshDietarySheet_(dietary, latestResponses);
}

function doGet(e) {
  const data = e && e.parameter ? e.parameter : {};
  const action = String(data.action || '').toLowerCase();

  if (action !== 'lookup') {
    return ContentService.createTextOutput('Wedding RSVP web app is running.');
  }

  try {
    const spreadsheet = getSpreadsheetForWebApp_();
    const invites = getOrCreateSheet_(spreadsheet, INVITES_SHEET);
    const normalizedPhone = normalizePhone_(data.phone || '');
    let invite = null;

    ensureInvitesSheet_(invites);

    if (normalizedPhone) {
      invite = findInviteByPhone_(invites, normalizedPhone);
    }

    if (!invite) {
      return buildLookupResponse_(
        {
          ok: true,
          found: false
        },
        data.callback
      );
    }

    return buildLookupResponse_(
      {
        ok: true,
        found: true,
        party: invite
      },
      data.callback
    );
  } catch (error) {
    return buildLookupResponse_(
      {
        ok: false,
        found: false,
        error: error && error.message ? error.message : 'Lookup failed.'
      },
      data.callback
    );
  }
}

function doPost(e) {
  try {
    const spreadsheet = getSpreadsheetForWebApp_();
    const invites = getOrCreateSheet_(spreadsheet, INVITES_SHEET);
    const responses = getOrCreateSheet_(spreadsheet, RESPONSES_SHEET);
    const summary = getOrCreateSheet_(spreadsheet, SUMMARY_SHEET);
    const dietary = getOrCreateSheet_(spreadsheet, DIETARY_SHEET);
    ensureInvitesSheet_(invites);
    ensureResponsesSheet_(responses);

    const data = e && e.parameter ? e.parameter : {};
    const lookupPhone = normalizePhone_(data.lookup_phone || data.lookup_phone_display || '');
    const invite = lookupPhone ? findInviteByPhone_(invites, lookupPhone) : null;
    const invitedParty = invite ? invite.invited_party : (data.invited_party || '');
    const ceremonyAllowed = invite ? invite.ceremony_allowed : Number(data.ceremony_allowed || 0);
    const receptionAllowed = invite ? invite.reception_allowed : Number(data.reception_allowed || 0);
    const ceremonyAttending = clampCount_(Number(data.ceremony_attending || 0), ceremonyAllowed);
    const receptionAttending = clampCount_(Number(data.reception_attending || 0), receptionAllowed);
    const existingRow = findExistingResponseRow_(responses, lookupPhone, invitedParty);
    const now = new Date();
    let submittedAt = now;
    let confirmationMessage = 'Your response has been recorded.';

    if (existingRow) {
      submittedAt = responses.getRange(existingRow, 1).getValue() || now;
      confirmationMessage = 'Your RSVP has been updated.';
    }

    const rowValues = [[
      submittedAt,
      now,
      lookupPhone,
      invitedParty,
      ceremonyAllowed,
      ceremonyAttending,
      receptionAllowed,
      receptionAttending,
      data.attendance_status || '',
      data.message || '',
      'Wedding website'
    ]];

    if (existingRow) {
      responses.getRange(existingRow, 1, 1, rowValues[0].length).setValues(rowValues);
    } else {
      responses.appendRow(rowValues[0]);
    }

    const latestResponses = getLatestResponses_(responses);
    refreshSummarySheet_(summary, latestResponses);
    refreshDietarySheet_(dietary, latestResponses);

    return buildRsvpResponsePage_(
      confirmationMessage,
      'You can close this page and return to the wedding website.'
    );
  } catch (error) {
    return buildRsvpResponsePage_(
      'There was a problem saving your RSVP.',
      error && error.message
        ? error.message
        : 'Please try again or contact the couple if the issue continues.'
    );
  }
}

function getOrCreateSheet_(spreadsheet, name) {
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

function getSpreadsheetForSetup_() {
  const configuredSheetId = getConfiguredSheetId_();

  if (configuredSheetId) {
    return SpreadsheetApp.openById(configuredSheetId);
  }

  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  if (activeSpreadsheet) {
    return activeSpreadsheet;
  }

  throw new Error(
    'No Google Sheet found. Either paste your Sheet ID into SHEET_ID or open the script from inside the target Google Sheet and run setupWeddingRsvpSheet again.'
  );
}

function getSpreadsheetForWebApp_() {
  const configuredSheetId = getConfiguredSheetId_();
  const storedSheetId = PropertiesService.getScriptProperties().getProperty(SHEET_ID_PROPERTY);

  if (configuredSheetId) {
    return SpreadsheetApp.openById(configuredSheetId);
  }

  if (storedSheetId) {
    return SpreadsheetApp.openById(storedSheetId);
  }

  throw new Error(
    'The RSVP sheet has not been configured yet. Run setupWeddingRsvpSheet once from Apps Script before submitting RSVPs.'
  );
}

function getConfiguredSheetId_() {
  const trimmed = String(SHEET_ID || '').trim();

  if (!trimmed || trimmed === 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE') {
    return '';
  }

  return trimmed;
}

function buildRsvpResponsePage_(message, details) {
  return HtmlService.createHtmlOutput(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>RSVP received</title><style>body{margin:0;font-family:Georgia,serif;background:#f9f5f0;color:#2b2720;display:grid;place-items:center;min-height:100vh;padding:2rem}main{max-width:40rem;background:#fff;border:1px solid rgba(205,194,178,.8);border-radius:24px;padding:2.5rem;box-shadow:0 26px 60px rgba(43,36,27,.08)}h1{margin:0 0 1rem;font-size:2.2rem;line-height:1.1}p{margin:.75rem 0 0;line-height:1.7;color:#51463f}.actions{margin-top:2rem}.button{display:inline-flex;align-items:center;justify-content:center;padding:.95rem 1.65rem;border-radius:999px;background:#8c6f59;color:#fff;text-decoration:none;font-size:1rem;border:none}</style></head><body><main><h1>Thank you for your RSVP</h1><p>' + message + '</p><p>' + details + '</p><div class="actions"><a class="button" href="' + WEBSITE_HOME_URL + '">Go to home page</a></div></main></body></html>'
  );
}

function buildLookupResponse_(payload, callbackName) {
  const body = JSON.stringify(payload || {});
  const callback = String(callbackName || '').trim();

  if (isSafeCallbackName_(callback)) {
    return ContentService.createTextOutput(callback + '(' + body + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(body)
    .setMimeType(ContentService.MimeType.JSON);
}

function isSafeCallbackName_(value) {
  return /^[A-Za-z_$][A-Za-z0-9_$]{0,64}$/.test(String(value || ''));
}

function ensureInvitesSheet_(sheet) {
  const headers = [[
    'Invited Party',
    'Phone Numbers',
    'Ceremony Allowed',
    'Reception Allowed'
  ]];

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  } else {
    sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  }

  sheet.setFrozenRows(1);
}

function ensureResponsesSheet_(sheet) {
  const headers = [[
    'Submitted At',
    'Last Updated',
    'Lookup Phone',
    'Invited Party',
    'Ceremony Allowed',
    'Ceremony Attending',
    'Reception Allowed',
    'Reception Attending',
    'Attendance Status',
    'Dietary Notes / Message',
    'Source'
  ]];
  const currentHeaders = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0]
    : [];

  if (currentHeaders[0] === 'Timestamp' && currentHeaders[1] === 'Lookup Phone') {
    migrateOldResponsesSheet_(sheet);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  } else {
    sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  }
  sheet.setFrozenRows(1);
}

function refreshSummarySheet_(sheet, latestResponses) {
  const ceremonyTotal = latestResponses.reduce(function (sum, row) {
    return sum + toCount_(row[5]);
  }, 0);
  const receptionTotal = latestResponses.reduce(function (sum, row) {
    return sum + toCount_(row[7]);
  }, 0);
  const fullAccepts = latestResponses.filter(function (row) {
    return row[8] === 'accepts';
  }).length;
  const partialResponses = latestResponses.filter(function (row) {
    return row[8] === 'partial';
  }).length;
  const declines = latestResponses.filter(function (row) {
    return row[8] === 'declines';
  }).length;
  const dietaryNotes = latestResponses.filter(function (row) {
    return String(row[9] || '').trim() !== '';
  }).length;

  sheet.clear();
  sheet.getRange('A1:B1').setValues([['Metric', 'Value']]);
  sheet.getRange('A2:B7').setValues([
    ['Ceremony total attending', ceremonyTotal],
    ['Reception total attending', receptionTotal],
    ['Full accepts', fullAccepts],
    ['Partial responses', partialResponses],
    ['Declines', declines],
    ['Dietary notes entered', dietaryNotes]
  ]);
  sheet.setFrozenRows(1);
}

function refreshDietarySheet_(sheet, latestResponses) {
  const dietaryRows = latestResponses.filter(function (row) {
    return String(row[9] || '').trim() !== '';
  });

  sheet.clear();
  sheet.getRange('A1:K1').setValues([[
    'Submitted At',
    'Last Updated',
    'Lookup Phone',
    'Invited Party',
    'Ceremony Allowed',
    'Ceremony Attending',
    'Reception Allowed',
    'Reception Attending',
    'Attendance Status',
    'Dietary Notes / Message',
    'Source'
  ]]);

  if (dietaryRows.length > 0) {
    sheet.getRange(2, 1, dietaryRows.length, 11).setValues(dietaryRows);
  }

  sheet.setFrozenRows(1);
}

function normalizePhone_(value) {
  let digits = String(value || '').replace(/\D/g, '');

  if (digits.length === 11 && digits.charAt(0) === '1') {
    digits = digits.slice(1);
  }

  return digits;
}

function findInviteByPhone_(sheet, normalizedPhone) {
  const lastRow = sheet.getLastRow();
  const rows = lastRow > 1
    ? sheet.getRange(2, 1, lastRow - 1, 4).getValues()
    : [];
  let i;

  if (!normalizedPhone) {
    return null;
  }

  for (i = 0; i < rows.length; i += 1) {
    const invitedParty = String(rows[i][0] || '').trim();
    const phones = parsePhoneList_(rows[i][1]);
    const ceremonyAllowed = Number(rows[i][2] || 0);
    const receptionAllowed = Number(rows[i][3] || 0);
    const hasPhoneMatch = phones.some(function (phone) {
      return phone === normalizedPhone;
    });

    if (invitedParty && hasPhoneMatch) {
      return {
        invited_party: invitedParty,
        ceremony_allowed: isNaN(ceremonyAllowed) ? 0 : ceremonyAllowed,
        reception_allowed: isNaN(receptionAllowed) ? 0 : receptionAllowed
      };
    }
  }

  return null;
}

function parsePhoneList_(value) {
  return String(value || '')
    .split(/[\n,;]+/)
    .map(function (part) {
      return normalizePhone_(part);
    })
    .filter(function (phone) {
      return phone !== '';
    });
}

function clampCount_(value, maxAllowed) {
  const normalizedMax = Number(maxAllowed || 0);
  const normalizedValue = Number(value || 0);
  const safeMax = isNaN(normalizedMax) || normalizedMax < 0 ? 0 : normalizedMax;
  const safeValue = isNaN(normalizedValue) || normalizedValue < 0 ? 0 : normalizedValue;

  return Math.min(safeValue, safeMax);
}

function findExistingResponseRow_(sheet, lookupPhone, invitedParty) {
  const lastRow = sheet.getLastRow();
  let values;
  let i;
  let rowPhone;
  let rowParty;

  if (!lookupPhone || lastRow < 2) {
    return null;
  }

  values = sheet.getRange(2, 1, lastRow - 1, Math.max(sheet.getLastColumn(), 11)).getValues();

  for (i = 0; i < values.length; i += 1) {
    rowPhone = normalizePhone_(values[i][2]);
    rowParty = String(values[i][3] || '');

    if (rowPhone === lookupPhone && (!invitedParty || rowParty === invitedParty)) {
      return i + 2;
    }
  }

  return null;
}

function getLatestResponses_(sheet) {
  const lastRow = sheet.getLastRow();
  const latestByKey = {};
  const values = lastRow > 1
    ? sheet.getRange(2, 1, lastRow - 1, 11).getValues()
    : [];

  values.forEach(function (row, index) {
    const submittedAt = row[0];
    const lastUpdated = row[1];
    const lookupPhone = normalizePhone_(row[2]);
    const invitedParty = String(row[3] || '').trim();
    const normalizedParty = invitedParty.toLowerCase();
    // Keep the latest response per invitation identity.
    // This avoids undercounting when two different parties share one phone number.
    const key = lookupPhone
      ? (normalizedParty ? (lookupPhone + '|' + normalizedParty) : lookupPhone)
      : (normalizedParty ? ('party-' + normalizedParty) : ('row-' + index));
    const candidateTime = (lastUpdated instanceof Date ? lastUpdated : submittedAt instanceof Date ? submittedAt : new Date(0)).getTime();
    const existing = latestByKey[key];
    const existingTime = existing
      ? ((existing[1] instanceof Date ? existing[1] : existing[0] instanceof Date ? existing[0] : new Date(0)).getTime())
      : -1;

    if (!existing || candidateTime >= existingTime) {
      latestByKey[key] = row;
    }
  });

  return Object.keys(latestByKey).map(function (key) {
    return latestByKey[key];
  });
}

function toCount_(value) {
  const parsed = Number(value);

  if (isNaN(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function migrateOldResponsesSheet_(sheet) {
  const lastRow = sheet.getLastRow();

  sheet.insertColumnAfter(1);
  sheet.getRange(1, 1).setValue('Submitted At');
  sheet.getRange(1, 2).setValue('Last Updated');

  if (lastRow > 1) {
    sheet.getRange(2, 2, lastRow - 1, 1).setFormulaR1C1('=RC[-1]');
    SpreadsheetApp.flush();
    sheet.getRange(2, 2, lastRow - 1, 1).copyTo(
      sheet.getRange(2, 2, lastRow - 1, 1),
      SpreadsheetApp.CopyPasteType.PASTE_VALUES,
      false
    );
  }
}
