const fs = require('fs');
const path = require('path');

const locales = ['en', 'vi', 'zh-CN', 'ja', 'fr'];

const keysToCheck = [
  // extraSpa
  'extraSpa.title',
  'extraSpa.subtitle',
  'extraSpa.step1Title',
  'extraSpa.selectCustomerPrompt',
  'extraSpa.noCheckedIn',
  'extraSpa.step2Title',
  'extraSpa.selectTreatmentPrompt',
  'extraSpa.step3Title',
  'extraSpa.selectSlotPrompt',
  'extraSpa.noSlots',
  'extraSpa.step4Title',
  'extraSpa.atomicResourcesLocked',
  'extraSpa.step4DisabledHint',
  'extraSpa.therapist',
  'extraSpa.licensedSpecialist',
  'extraSpa.room',
  'extraSpa.sanitizedSuite',
  'extraSpa.resourcesPlaceholder',
  'extraSpa.step5Title',
  'extraSpa.readyToPost',
  'extraSpa.completeStepsPrompt',
  'extraSpa.atomicCheckPassed',
  'extraSpa.atomicCheckPassedDesc',
  'extraSpa.validationPending',
  'extraSpa.missingFields',
  'extraSpa.bookingSummary',
  'extraSpa.customer',
  'extraSpa.bookingRef',
  'extraSpa.treatment',
  'extraSpa.duration',
  'extraSpa.schedule',
  'extraSpa.folioCharge',
  'extraSpa.folioStatusNote',
  'extraSpa.readyToConfirm',
  'extraSpa.incompletePill',
  'extraSpa.processing',
  'extraSpa.booked',
  'extraSpa.confirmAction',

  // therapist
  'therapist.dailySchedule',
  'therapist.today',
  'therapist.sessionsScheduled',
  'therapist.viewAgenda',
  'therapist.viewTimeline',
  'therapist.colTime',
  'therapist.colCustomer',
  'therapist.colTreatment',
  'therapist.colRoom',
  'therapist.colStatus',
  'therapist.colAction',
  'therapist.confirmed',
  'therapist.inProgress',
  'therapist.done',
  'therapist.viewDetails',
  'therapist.startSession',
  'therapist.start',
  'therapist.noSessionsDay',
  'therapist.freeDay',
  'therapist.availableSlot',
  'therapist.sessionNotFound',
  'therapist.backToSchedule',
  'therapist.back',
  'therapist.noShow'
];

locales.forEach(loc => {
  const filePath = path.join(__dirname, '..', 'src', 'i18n', 'locales', loc, 'operations.json');
  if (!fs.existsSync(filePath)) {
    console.log('MISSING FILE:', filePath);
    return;
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const missing = [];
  keysToCheck.forEach(k => {
    const parts = k.split('.');
    let val = data;
    for (const p of parts) {
      if (val && typeof val === 'object' && p in val) {
        val = val[p];
      } else {
        val = undefined;
        break;
      }
    }
    if (val === undefined) {
      missing.push(k);
    }
  });
  console.log(`Locale ${loc}: ${missing.length} missing keys:`, missing);
});
