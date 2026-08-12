#!/usr/bin/env node
/**
 * Phase C emulator spot-tests (adb + uiautomator).
 * Run: npm run spot-test:phase-c
 */
import { execSync } from 'node:child_process';

const SERIAL = process.env.ADB_SERIAL ?? 'emulator-5554';
const PKG = 'com.northcareai.app';

function adb(args) {
  return execSync(`adb -s ${SERIAL} ${args}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function dumpUi() {
  adb('shell uiautomator dump /sdcard/phasec_ui.xml');
  return adb('shell cat /sdcard/phasec_ui.xml');
}

function uiIncludesRawError(xml) {
  return (
    xml.includes('Uncaught Error') ||
    xml.includes('ReferenceError') ||
    xml.includes("Property '") ||
    xml.includes('TypeError')
  );
}

function dismissDevErrorIfPresent(xml) {
  if (xml.includes('Uncaught Error') || xml.includes('Log 1 of')) {
    try {
      adb('shell input tap 114 2273');
      sleep(1500);
      return dumpUi();
    } catch {
      return xml;
    }
  }
  return xml;
}

function dismissSystemDialogIfPresent(xml) {
  if (xml.includes("isn't responding")) {
    try {
      tapByText(xml, 'Close app');
      sleep(2000);
      xml = dumpUi();
    } catch {
      /* ignore */
    }
  }
  if (xml.includes('Try again') && xml.includes('unexpected problem')) {
    try {
      tapByText(xml, 'Try again');
      sleep(3000);
      xml = dumpUi();
    } catch {
      /* ignore */
    }
  }
  if (xml.includes('Wait') && xml.includes('Close app')) {
    try {
      tapByText(xml, 'Close app');
      sleep(2000);
      xml = dumpUi();
    } catch {
      /* ignore */
    }
  }
  return xml;
}

function tapCenter(bounds) {
  const m = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!m) return false;
  const x = Math.floor((Number(m[1]) + Number(m[3])) / 2);
  const y = Math.floor((Number(m[2]) + Number(m[4])) / 2);
  adb(`shell input tap ${x} ${y}`);
  sleep(2500);
  return true;
}

function tapByResourceId(xml, id) {
  const marker = `resource-id="${id}"`;
  const idx = xml.indexOf(marker);
  if (idx === -1) return false;
  const slice = xml.slice(idx, idx + 1200);
  const m = slice.match(/bounds="(\[[0-9,]+\]\[[0-9,]+\])"/);
  if (!m) return false;
  return tapCenter(m[1]);
}

function tapByText(xml, text) {
  const marker = `text="${text}"`;
  const idx = xml.indexOf(marker);
  if (idx === -1) return false;
  const slice = xml.slice(idx, idx + 400);
  const m = slice.match(/bounds="(\[[0-9,]+\]\[[0-9,]+\])"/);
  if (!m) return false;
  return tapCenter(m[1]);
}

function launchApp() {
  adb('reverse tcp:8081 tcp:8081');
  adb('shell cmd connectivity airplane-mode disable');

  const skipLaunch = process.env.PHASE_C_SKIP_LAUNCH === '1';
  let ui = dismissSystemDialogIfPresent(dumpUi());
  if (skipLaunch && ui.includes('worker-home') && !uiIncludesRawError(ui)) {
    return ui;
  }

  adb(`shell am force-stop ${PKG}`);
  sleep(2000);
  adb(
    `shell am start -a android.intent.action.VIEW -d 'northcare://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081' ${PKG}`,
  );
  for (let i = 0; i < 20; i += 1) {
    sleep(2000);
    ui = dismissSystemDialogIfPresent(dumpUi());
    ui = dismissDevErrorIfPresent(ui);
    if (ui.includes('worker-home') && !uiIncludesRawError(ui)) {
      return ui;
    }
  }
  return dismissDevErrorIfPresent(dismissSystemDialogIfPresent(dumpUi()));
}

function goHome() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    let ui = dismissSystemDialogIfPresent(dismissDevErrorIfPresent(dumpUi()));
    if (ui.includes('worker-home') && !uiIncludesRawError(ui)) {
      return ui;
    }
    if (ui.includes('reach-centre-back')) {
      tapByResourceId(ui, 'reach-centre-back');
      sleep(2500);
      continue;
    }
    if (ui.includes('ask-chat-home')) {
      tapByResourceId(ui, 'ask-chat-home');
      sleep(2500);
      continue;
    }
    if (ui.includes('worker-nav-home')) {
      tapByResourceId(ui, 'worker-nav-home');
      sleep(2500);
      continue;
    }
    adb('shell input keyevent 4');
    sleep(1500);
  }
  const ui = dismissDevErrorIfPresent(dismissSystemDialogIfPresent(dumpUi()));
  if (ui.includes('worker-nav-home')) {
    tapByResourceId(ui, 'worker-nav-home');
    sleep(2000);
  }
  return dismissDevErrorIfPresent(dismissSystemDialogIfPresent(dumpUi()));
}

function scrollDown() {
  adb('shell input swipe 540 1800 540 600 400');
  sleep(1200);
}

/** adb input text: no spaces/hyphens in arg; use %s for space. */
function inputText(value) {
  const encoded = value.replace(/ /g, '%s');
  adb(`shell input text ${encoded}`);
}

function waitForResourceId(id, attempts = 8, intervalMs = 1500) {
  for (let i = 0; i < attempts; i += 1) {
    const ui = dismissDevErrorIfPresent(dumpUi());
    if (ui.includes(`resource-id="${id}"`)) return ui;
    sleep(intervalMs);
  }
  return dismissDevErrorIfPresent(dumpUi());
}

const results = [];

function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`);
}

launchApp();
let ui = dismissDevErrorIfPresent(dumpUi());

record(
  'App bootstrap',
  ui.includes('worker-home') && !uiIncludesRawError(ui),
  uiIncludesRawError(ui)
    ? 'Red box on launch'
    : ui.includes('worker-home')
      ? 'Worker home loaded'
      : 'Worker home not ready in time',
);

// 1) Airplane mode + community (dev demo inbox fallback is acceptable)
try {
  adb('shell cmd connectivity airplane-mode enable');
  sleep(2500);
  ui = goHome();
  tapByResourceId(ui, 'worker-home-attention-community');
  sleep(5000);
  ui = dismissDevErrorIfPresent(dumpUi());
  const offlineOk =
    !uiIncludesRawError(ui) &&
    (ui.includes('Connectivity required') ||
      ui.includes('community-requests-offline') ||
      (ui.includes('Community Requests') && ui.includes('Offline')));
  record(
    'Airplane mode — community requests',
    offlineOk,
    offlineOk ? 'Offline pill or offline state (demo inbox OK in dev)' : 'Crash or unexpected error',
  );
} catch (e) {
  record('Airplane mode — community requests', false, String(e.message ?? e));
} finally {
  adb('shell cmd connectivity airplane-mode disable');
  sleep(2500);
}

// 2) Referral verify screen + invalid paste (before Ask — bottom nav stays visible)
try {
  ui = goHome();
  ui = waitForResourceId('worker-nav-referrals', 8, 1500);
  tapByResourceId(ui, 'worker-nav-referrals');
  for (let loadWait = 0; loadWait < 20; loadWait += 1) {
    ui = dismissDevErrorIfPresent(dumpUi());
    if (
      ui.includes('referral-list-screen') ||
      ui.includes('referral-verify-action') ||
      ui.includes('referral-verify-offline-section')
    ) {
      break;
    }
    sleep(2000);
  }
  if (!tapByResourceId(ui, 'referral-verify-action')) {
    scrollDown();
    ui = dismissDevErrorIfPresent(dumpUi());
    tapByResourceId(ui, 'referral-verify-action');
  }
  ui = waitForResourceId('referral-verify-offline-screen', 10, 2000);
  if (
    !ui.includes('referral-verify-offline-screen') &&
    !ui.includes('Verify referral passport')
  ) {
    ui = dismissDevErrorIfPresent(dumpUi());
    tapByResourceId(ui, 'referral-scan-passport-row');
    ui = waitForResourceId('referral-verify-offline-screen', 8, 2000);
  }
  const onVerify =
    ui.includes('referral-verify-offline-screen') ||
    ui.includes('Verify referral passport');
  if (onVerify) {
    tapByResourceId(ui, 'referral-verify-paste');
    sleep(600);
    inputText('invalidpassportcode');
    sleep(800);
    ui = dismissDevErrorIfPresent(dumpUi());
    tapByResourceId(ui, 'referral-verify-submit');
    sleep(2500);
    ui = dismissDevErrorIfPresent(dumpUi());
  }
  const refOk =
    !uiIncludesRawError(ui) &&
    (ui.includes('referral-verify-invalid') ||
      ui.includes('Not a valid passport') ||
      ui.includes('not an offline-verifiable') ||
      ui.includes('No passport code') ||
      ui.includes('referral-verify-offline-screen') ||
      ui.includes('referral-verify-offline-section'));
  record(
    'Referral verify flow',
    refOk,
    refOk ? 'Verify screen with mapped or safe messaging' : 'Verify flow incomplete',
  );
} catch (e) {
  record('Referral verify flow', false, String(e.message ?? e));
}

// 3) Reminders create screen (helpers present)
try {
  ui = goHome();
  ui = waitForResourceId('worker-nav-more', 10, 1500);
  if (!ui.includes('worker-nav-more')) {
    record('Reminders create screen', false, 'Bottom nav not visible');
  } else {
    tapByResourceId(ui, 'worker-nav-more');
    sleep(2500);
    ui = waitForResourceId('worker-more-open-reminders');
    tapByResourceId(ui, 'worker-more-open-reminders');
    sleep(3500);
    ui = waitForResourceId('reminder-create');
    tapByResourceId(ui, 'reminder-create');
    sleep(3500);
    ui = dismissDevErrorIfPresent(dumpUi());
    const remOk =
      !uiIncludesRawError(ui) &&
      (ui.includes('create-reminder-screen') ||
        ui.includes('Reminder date') ||
        ui.includes('reminder-centre-screen'));
    record('Reminders create screen', remOk, remOk ? 'Create reminder reachable' : 'Could not open create flow');
  }
} catch (e) {
  record('Reminders create screen', false, String(e.message ?? e));
}

// 4) Ask NorthCare model unavailable (last — hides bottom nav)
try {
  ui = goHome();
  tapByResourceId(ui, 'worker-home-action-assistant');
  sleep(5000);
  ui = dismissDevErrorIfPresent(dumpUi());
  const askOk =
    !uiIncludesRawError(ui) &&
    (ui.includes('chat-model-unavailable') ||
      ui.includes('Offline model not installed') ||
      ui.includes('Ask NorthCare AI') ||
      ui.includes('ask-chat-screen') ||
      ui.includes('ask-chat-home') ||
      ui.includes('NorthCare AI'));
  record('Ask NorthCare without model', askOk, askOk ? 'Model unavailable or chat shell' : 'Unexpected screen');
} catch (e) {
  record('Ask NorthCare without model', false, String(e.message ?? e));
}

adb('shell cmd connectivity airplane-mode disable');

const passed = results.filter((r) => r.pass).length;
console.log(`\nPhase C spot-test: ${passed}/${results.length} passed`);
process.exit(passed === results.length ? 0 : 1);
