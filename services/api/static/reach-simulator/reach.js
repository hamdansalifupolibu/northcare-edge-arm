/**
 * NorthCare Reach USSD simulator — client session state machine.
 * Calls real R2 public APIs on the same origin. No browser storage. No secrets.
 */
(function () {
  "use strict";

  var REQUEST_TIMEOUT_MS = 15000;
  var CREATE_PATH = "/v1/reach/requests";
  var STATUS_PATH = "/v1/reach/requests/status";
  var PREFERRED_LANGUAGE = "en";
  var CHANNEL = "ussdSimulator";
  var REF_PREFIX = "NCR-";
  var REF_BODY_LEN = 8;
  var REF_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  var CONTACT_PATTERN = /^\+?[0-9]{8,15}$/;
  var PIN_PATTERN = /^\d{6}$/;

  var DEMO_INFO =
    "Demonstration information only\n" +
    "Approved public health content pending\n\n" +
    "This topic will provide professionally reviewed information in a future version.\n" +
    "You may request a CHPS worker now.\n\n" +
    "1. Request a CHPS worker\n" +
    "9. Back";

  var INVALID_CHOICE = "Please choose one of the listed options.";
  var UNAVAILABLE =
    "NorthCare Reach is unavailable in this demonstration right now.\nPlease try again.";
  var GENERIC_LOOKUP_FAIL =
    "Request could not be checked.\nCheck the reference and PIN, then try again.";

  var ANSWER_DISCLAIMER =
    "Not a diagnosis. Emergencies: call 112.\n" +
    "For care, talk to a health worker.";

  var EMERGENCY_ESCALATION =
    "If someone is in immediate danger, end this session and dial 112 now.\n\n" +
    "NorthCare has not placed the call.\n\n" +
    ANSWER_DISCLAIMER;

  /** Approved Ask NorthCare FAQ pack (English). FAQ-only — no LLM. */
  var FAQ_ENTRIES = {
    what_is_reach: {
      key: "what_is_reach",
      choice: "1",
      answer:
        "NorthCare Reach is community information support.\n" +
        "You can request a CHPS worker follow-up and check " +
        "request status from the USSD menu.\n\n" +
        "It is not clinical advice and does not replace " +
        "a health worker.",
      keywords: [
        "what is northcare",
        "what is reach",
        "about northcare",
        "about reach",
        "northcare reach",
        "what does this do",
        "who is northcare",
      ],
      isEmergency: false,
    },
    request_chps: {
      key: "request_chps",
      choice: "2",
      answer:
        "From the main menu choose 4 Request a CHPS worker.\n" +
        "Select a reason, enter community or landmark, " +
        "a callback number, and consent.\n\n" +
        "Or choose Request worker follow-up below.",
      keywords: [
        "request chps",
        "chps visit",
        "request a worker",
        "request worker",
        "call a nurse",
        "health worker visit",
        "how do i request",
        "community visit",
      ],
      isEmergency: false,
    },
    status_pin: {
      key: "status_pin",
      choice: "3",
      answer:
        "After you send a request you get a reference and a " +
        "six-digit status PIN shown once.\n" +
        "Use main menu 5 to check status.\n" +
        "Keep the PIN private. Do not share it.",
      keywords: [
        "status pin",
        "pin work",
        "my pin",
        "reference",
        "check status",
        "follow-up pin",
        "six-digit",
        "6 digit",
      ],
      isEmergency: false,
    },
    hours: {
      key: "hours",
      choice: "4",
      answer:
        "Opening hours vary by community and facility.\n" +
        "Ask your local CHPS compound or health facility " +
        "for times.\n" +
        "You can also request a worker follow-up.",
      keywords: [
        "hours",
        "opening time",
        "open time",
        "when open",
        "clinic hours",
        "chps hours",
        "facility hours",
        "what time",
      ],
      isEmergency: false,
    },
    emergency_112: {
      key: "emergency_112",
      choice: "5",
      answer: EMERGENCY_ESCALATION,
      keywords: ["emergency", "call 112", "dial 112", "112", "urgent help"],
      isEmergency: true,
    },
  };

  var FAQ_BY_CHOICE = {
    "1": "what_is_reach",
    "2": "request_chps",
    "3": "status_pin",
    "4": "hours",
    "5": "emergency_112",
  };

  var ASK_MENU_SHORTCUTS =
    "ASK NORTHCARE\n" +
    "Information support - not clinical advice\n\n" +
    "1. What is NorthCare Reach?\n" +
    "2. How do I request a CHPS visit?\n" +
    "3. How does my status PIN work?\n" +
    "4. CHPS or clinic hours\n" +
    "5. Emergency - call 112\n" +
    "6. Request worker follow-up\n" +
    "Or type a short community question\n" +
    "0. Emergency help\n" +
    "9. Back";

  var NO_MATCH_MESSAGE =
    "ASK NORTHCARE\n" +
    "No matching approved answer found.\n\n" +
    "This service shares approved community information only.\n" +
    "It does not diagnose symptoms or give treatment advice.\n\n" +
    ANSWER_DISCLAIMER +
    "\n\n" +
    "1. Request worker follow-up\n" +
    "0. Emergency help\n" +
    "9. Back";

  var EMERGENCY_KEYWORDS = [
    "112",
    "emergency",
    "immediate danger",
    "in danger",
    "dying",
    "unconscious",
    "not breathing",
    "severe bleeding",
    "bleeding heavily",
    "ambulance",
  ];

  /** @type {object} */
  var session = createFreshSession();

  var elDisplay = document.getElementById("ussd-display");
  var elError = document.getElementById("ussd-error");
  var elInput = document.getElementById("ussd-input");
  var elHint = document.getElementById("ussd-hint");
  var elSend = document.getElementById("btn-send");
  var elBack = document.getElementById("btn-back");
  var elRestart = document.getElementById("btn-restart");
  var elLive = document.getElementById("sr-live");

  function createFreshSession() {
    return {
      screen: "mainMenu",
      stack: [],
      category: null,
      requestType: null,
      communityOrLandmark: null,
      contactNumber: null,
      consentToContact: false,
      consentToShareLocation: false,
      requireLocationConsent: false,
      referenceCode: null,
      statusPin: null,
      statusLabel: null,
      infoReturnScreen: null,
      askFaqKey: null,
      statusCheckReference: null,
      busy: false,
      error: null,
      announceSafe: "",
    };
  }

  function clearSensitiveMemory() {
    session.communityOrLandmark = null;
    session.contactNumber = null;
    session.statusPin = null;
    session.referenceCode = null;
    session.statusLabel = null;
    session.statusCheckReference = null;
    session.consentToContact = false;
    session.consentToShareLocation = false;
    session.askFaqKey = null;
  }

  function restartSession() {
    session = createFreshSession();
    if (elInput) {
      elInput.value = "";
    }
    render();
    announce("Session restarted. Main menu.");
  }

  function setError(message) {
    session.error = message || null;
  }

  function pushScreen(next) {
    session.stack.push(session.screen);
    session.screen = next;
    setError(null);
  }

  function goBack() {
    if (session.busy) {
      return;
    }
    if (session.stack.length === 0) {
      session.screen = "mainMenu";
      setError(null);
      render();
      return;
    }
    session.screen = session.stack.pop();
    setError(null);
    if (session.screen === "mainMenu") {
      session.category = null;
      session.requestType = null;
      session.requireLocationConsent = false;
    }
    render();
  }

  function goMainMenu() {
    session.stack = [];
    session.screen = "mainMenu";
    session.category = null;
    session.requestType = null;
    session.requireLocationConsent = false;
    session.infoReturnScreen = null;
    session.askFaqKey = null;
    setError(null);
    render();
  }

  function isValidReferenceFormat(value) {
    if (typeof value !== "string") {
      return false;
    }
    var trimmed = value.trim().toUpperCase();
    if (trimmed.indexOf(REF_PREFIX) !== 0) {
      return false;
    }
    var body = trimmed.slice(REF_PREFIX.length);
    if (body.length !== REF_BODY_LEN) {
      return false;
    }
    for (var i = 0; i < body.length; i += 1) {
      if (REF_ALPHABET.indexOf(body.charAt(i)) === -1) {
        return false;
      }
    }
    return true;
  }

  function formatFaqAnswerScreen(entry) {
    if (entry.isEmergency) {
      return (
        "ASK NORTHCARE\n\n" +
        entry.answer +
        "\n\n" +
        "1. End and call 112\n" +
        "2. Request urgent CHPS callback\n" +
        "6. Request worker follow-up\n" +
        "9. Back"
      );
    }
    return (
      "ASK NORTHCARE\n\n" +
      entry.answer +
      "\n\n" +
      ANSWER_DISCLAIMER +
      "\n\n" +
      "1. Request worker follow-up\n" +
      "0. Emergency help\n" +
      "9. Back"
    );
  }

  function looksLikeEmergencyQuestion(text) {
    var normalised = text.toLowerCase().replace(/\s+/g, " ").trim();
    if (!normalised) {
      return false;
    }
    for (var i = 0; i < EMERGENCY_KEYWORDS.length; i += 1) {
      if (normalised.indexOf(EMERGENCY_KEYWORDS[i]) !== -1) {
        return true;
      }
    }
    return false;
  }

  function matchFaq(text) {
    var normalised = text.toLowerCase().replace(/\s+/g, " ").trim();
    if (!normalised || normalised.length > 200) {
      return null;
    }
    if (looksLikeEmergencyQuestion(normalised)) {
      return FAQ_ENTRIES.emergency_112;
    }
    var best = null;
    var bestScore = 0;
    var keys = Object.keys(FAQ_ENTRIES);
    for (var i = 0; i < keys.length; i += 1) {
      var entry = FAQ_ENTRIES[keys[i]];
      if (entry.isEmergency) {
        continue;
      }
      var score = 0;
      for (var k = 0; k < entry.keywords.length; k += 1) {
        if (normalised.indexOf(entry.keywords[k]) !== -1) {
          score += entry.keywords[k].length;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    }
    if (!best || bestScore < 4) {
      return null;
    }
    return best;
  }

  function screenText() {
    switch (session.screen) {
      case "mainMenu":
        return (
          "NORTHCARE REACH\n\n" +
          "0. Emergency help now\n" +
          "1. Pregnancy and newborn care\n" +
          "2. Child health\n" +
          "3. Nutrition\n" +
          "4. Request a CHPS worker\n" +
          "5. Check a request or follow-up\n" +
          "6. Language\n" +
          "7. Ask NorthCare"
        );
      case "emergencyMenu":
        return (
          "EMERGENCY HELP\n\n" +
          "If someone is in immediate danger, call 112 now.\n\n" +
          "1. End and call 112\n" +
          "2. Send location for urgent human review\n" +
          "3. Request an urgent CHPS callback\n" +
          "9. Back"
        );
      case "call112End":
        return (
          "Please end this session and dial 112 now.\n\n" +
          "NorthCare has not placed the call.\n\n" +
          "9. Back"
        );
      case "pregnancyMenu":
        return (
          "PREGNANCY & NEWBORN CARE\n\n" +
          "1. Care during pregnancy\n" +
          "2. Labour and warning signs\n" +
          "3. Care after delivery\n" +
          "4. Newborn care\n" +
          "5. Breastfeeding\n" +
          "6. Request a CHPS worker\n" +
          "0. Emergency help\n" +
          "9. Back"
        );
      case "childHealthMenu":
        return (
          "CHILD HEALTH\n\n" +
          "1. Fever\n" +
          "2. Diarrhoea or vomiting\n" +
          "3. Cough or breathing concern\n" +
          "4. Poor feeding or weakness\n" +
          "5. Immunisation and routine care\n" +
          "6. Request a CHPS worker\n" +
          "0. Emergency help\n" +
          "9. Back"
        );
      case "nutritionMenu":
        return (
          "NUTRITION SUPPORT\n\n" +
          "1. Pregnant woman\n" +
          "2. Breastfeeding mother\n" +
          "3. Baby under 6 months\n" +
          "4. Child 6 to 24 months\n" +
          "5. Child 2 to 5 years\n" +
          "6. Request nutrition support\n" +
          "0. Emergency help\n" +
          "9. Back"
        );
      case "chpsReasonMenu":
        return (
          "REQUEST A CHPS WORKER\n\n" +
          "1. Pregnancy or newborn\n" +
          "2. Child health\n" +
          "3. Nutrition\n" +
          "4. Referral or follow-up\n" +
          "5. Other health concern\n" +
          "0. Emergency help\n" +
          "9. Back"
        );
      case "demonstrationInformation":
        return DEMO_INFO;
      case "locationInput":
        return (
          "Enter community, town or nearest landmark.\n\n" +
          "Example: Tolon Station\n\n" +
          "Use synthetic demonstration locations only.\n\n" +
          "9. Back"
        );
      case "phoneInput":
        return (
          "Enter or confirm a callback phone number.\n\n" +
          "Use synthetic demonstration numbers only.\n\n" +
          "9. Back"
        );
      case "consentInput":
        if (session.requireLocationConsent) {
          return (
            "NorthCare will share your contact and community or landmark\n" +
            "with an authorised health worker in this demonstration.\n\n" +
            "You also consent to share location details for urgent human review.\n\n" +
            "1. Agree and send\n" +
            "2. Cancel"
          );
        }
        return (
          "NorthCare will share your contact and community or landmark\n" +
          "with an authorised health worker in this demonstration.\n\n" +
          "1. Agree and send\n" +
          "2. Cancel"
        );
      case "requestSubmitting":
        return "Sending request…\nPlease wait.";
      case "requestCreated":
        if (session.category === "emergency") {
          return (
            "Emergency coordination simulation\n\n" +
            "Request received\n\n" +
            "Reference: " +
            (session.referenceCode || "") +
            "\n\n" +
            "Status PIN: " +
            (session.statusPin || "") +
            "\n\n" +
            "Save this PIN privately. It will not be shown again after this session.\n\n" +
            "If someone is in immediate danger, call 112 now.\n\n" +
            "Live emergency-service integration pending\n\n" +
            "0. Main menu\n" +
            "9. Back"
          );
        }
        return (
          "REQUEST RECEIVED\n\n" +
          "Reference: " +
          (session.referenceCode || "") +
          "\n\n" +
          "Status PIN: " +
          (session.statusPin || "") +
          "\n\n" +
          "Save this PIN privately. It will not be shown again after this session.\n\n" +
          "Keep these details private.\n\n" +
          "A health worker will review the request through the NorthCare\n" +
          "demonstration system.\n\n" +
          "Call 112 if someone is in immediate danger.\n\n" +
          "0. Main menu\n" +
          "9. Back"
        );
      case "statusReferenceInput":
        return (
          "CHECK REQUEST\n\n" +
          "Enter your NorthCare reference.\n\n" +
          "9. Back"
        );
      case "statusPinInput":
        return (
          "CHECK REQUEST\n\n" +
          "Enter your six-digit status PIN.\n\n" +
          "9. Back"
        );
      case "statusChecking":
        return "Checking request status…\nPlease wait.";
      case "statusResult":
        return (
          "CHECK REQUEST\n\n" +
          (session.statusLabel || "Request received") +
          "\n\n" +
          "0. Main menu\n" +
          "9. Back"
        );
      case "languageMenu":
        return (
          "CHOOSE LANGUAGE\n\n" +
          "1. English\n" +
          "2. Dagbanli — planned\n" +
          "3. Hausa — planned\n" +
          "4. Dagaare — planned\n" +
          "5. Request language assistance\n" +
          "9. Back"
        );
      case "languagePlanned":
        return (
          "This language is planned but is not yet professionally reviewed.\n\n" +
          "Continue in English.\n\n" +
          "0. Main menu\n" +
          "9. Back"
        );
      case "languageAssistance":
        return (
          "A future version may help connect you to an appropriate health worker\n" +
          "for language assistance.\n\n" +
          "No language-assistance request is created in this demonstration.\n\n" +
          "0. Main menu\n" +
          "9. Back"
        );
      case "askNorthCareMenu":
        return ASK_MENU_SHORTCUTS;
      case "askFaqAnswer": {
        var faq = FAQ_ENTRIES[session.askFaqKey];
        if (!faq) {
          return NO_MATCH_MESSAGE;
        }
        return formatFaqAnswerScreen(faq);
      }
      case "askNoMatch":
        return NO_MATCH_MESSAGE;
      default:
        return "NORTHCARE REACH\n\nSession error. Press Restart.";
    }
  }

  function announce(message) {
    session.announceSafe = message;
    if (elLive) {
      elLive.textContent = message;
    }
  }

  function render() {
    var text = screenText();
    if (elDisplay) {
      elDisplay.textContent = text;
    }
    if (elError) {
      if (session.error) {
        elError.hidden = false;
        elError.textContent = session.error;
      } else {
        elError.hidden = true;
        elError.textContent = "";
      }
    }
    var inputEnabled =
      !session.busy &&
      session.screen !== "requestSubmitting" &&
      session.screen !== "statusChecking";
    if (elInput) {
      elInput.disabled = !inputEnabled;
      if (
        session.screen === "locationInput" ||
        session.screen === "phoneInput" ||
        session.screen === "statusReferenceInput" ||
        session.screen === "statusPinInput" ||
        session.screen === "askNorthCareMenu"
      ) {
        elInput.setAttribute(
          "inputmode",
          session.screen === "phoneInput" || session.screen === "statusPinInput"
            ? "numeric"
            : "text"
        );
      } else {
        elInput.setAttribute("inputmode", "numeric");
      }
    }
    if (elSend) {
      elSend.disabled = !inputEnabled;
    }
    if (elBack) {
      elBack.disabled = session.busy;
    }
    if (elHint) {
      if (session.screen === "locationInput") {
        elHint.textContent = "Type a synthetic community or landmark, then Send.";
      } else if (session.screen === "phoneInput") {
        elHint.textContent = "Type a synthetic phone number (+ optional, 8–15 digits), then Send.";
      } else if (session.screen === "statusReferenceInput") {
        elHint.textContent = "Type your NorthCare reference (for example NCR-XXXXXXXX), then Send.";
      } else if (session.screen === "statusPinInput") {
        elHint.textContent = "Type your six-digit status PIN, then Send.";
      } else {
        elHint.textContent = "Enter a numbered option or the requested value, then press Send.";
      }
    }
  }

  function beginRequestFlow(category, requestType, requireLocationConsent) {
    session.category = category;
    session.requestType = requestType;
    session.requireLocationConsent = !!requireLocationConsent;
    session.communityOrLandmark = null;
    session.contactNumber = null;
    session.consentToContact = false;
    session.consentToShareLocation = false;
    pushScreen("locationInput");
    render();
    announce("Enter community or landmark.");
  }

  function openDemoInfo(returnScreen) {
    session.infoReturnScreen = returnScreen;
    pushScreen("demonstrationInformation");
    render();
    announce("Demonstration information only. Approved public health content pending.");
  }

  function handleMainMenu(choice) {
    switch (choice) {
      case "0":
        pushScreen("emergencyMenu");
        announce("Emergency help. If someone is in immediate danger, call 112 now.");
        break;
      case "1":
        pushScreen("pregnancyMenu");
        announce("Pregnancy and newborn care menu.");
        break;
      case "2":
        pushScreen("childHealthMenu");
        announce("Child health menu.");
        break;
      case "3":
        pushScreen("nutritionMenu");
        announce("Nutrition menu.");
        break;
      case "4":
        pushScreen("chpsReasonMenu");
        announce("Request a CHPS worker.");
        break;
      case "5":
        session.statusCheckReference = null;
        pushScreen("statusReferenceInput");
        announce("Enter your NorthCare reference.");
        break;
      case "6":
        pushScreen("languageMenu");
        announce("Language menu. English is implemented.");
        break;
      case "7":
        session.askFaqKey = null;
        pushScreen("askNorthCareMenu");
        announce(
          "Ask NorthCare. Information support only. Not clinical advice. Choose a topic or type a short community question."
        );
        break;
      default:
        setError(INVALID_CHOICE);
    }
    render();
  }

  function beginAskWorkerFollowup() {
    beginRequestFlow("generalChps", "routine", false);
  }

  function showFaqEntry(key) {
    session.askFaqKey = key;
    pushScreen("askFaqAnswer");
    render();
    announce("Approved information answer. Not a diagnosis. Emergencies call 112.");
  }

  function handleAskNorthCare(raw) {
    var choice = raw.trim();
    if (choice === "9") {
      goBack();
      return;
    }
    if (choice === "0") {
      pushScreen("emergencyMenu");
      announce("Emergency help. If someone is in immediate danger, call 112 now.");
      render();
      return;
    }
    if (choice === "6") {
      beginAskWorkerFollowup();
      return;
    }
    if (FAQ_BY_CHOICE[choice]) {
      showFaqEntry(FAQ_BY_CHOICE[choice]);
      return;
    }
    if (!choice || choice.length > 200) {
      setError("Type a short community question, or choose 1-6.");
      render();
      return;
    }
    var matched = matchFaq(choice);
    if (!matched) {
      pushScreen("askNoMatch");
      render();
      announce("No matching approved answer. You may request a worker follow-up.");
      return;
    }
    showFaqEntry(matched.key);
  }

  function handleAskFaqAnswer(choice) {
    var entry = FAQ_ENTRIES[session.askFaqKey];
    if (entry && entry.isEmergency) {
      if (choice === "1") {
        pushScreen("call112End");
        announce("Please end this session and dial 112 now. NorthCare has not placed the call.");
        render();
        return;
      }
      if (choice === "2") {
        beginRequestFlow("emergency", "urgentContact", false);
        return;
      }
      if (choice === "6") {
        beginAskWorkerFollowup();
        return;
      }
      if (choice === "9") {
        goBack();
        return;
      }
      setError(INVALID_CHOICE);
      render();
      return;
    }
    if (choice === "1") {
      beginAskWorkerFollowup();
      return;
    }
    if (choice === "0") {
      pushScreen("emergencyMenu");
      announce("Emergency help. If someone is in immediate danger, call 112 now.");
      render();
      return;
    }
    if (choice === "9") {
      goBack();
      return;
    }
    setError(INVALID_CHOICE);
    render();
  }

  function handleAskNoMatch(choice) {
    if (choice === "1") {
      beginAskWorkerFollowup();
      return;
    }
    if (choice === "0") {
      pushScreen("emergencyMenu");
      announce("Emergency help. If someone is in immediate danger, call 112 now.");
      render();
      return;
    }
    if (choice === "9") {
      goBack();
      return;
    }
    setError(INVALID_CHOICE);
    render();
  }

  function handleEmergencyMenu(choice) {
    switch (choice) {
      case "1":
        pushScreen("call112End");
        announce("Please end this session and dial 112 now. NorthCare has not placed the call.");
        break;
      case "2":
        beginRequestFlow("emergency", "emergencyAssistance", true);
        return;
      case "3":
        beginRequestFlow("emergency", "urgentContact", false);
        return;
      case "9":
        goBack();
        return;
      default:
        setError(INVALID_CHOICE);
    }
    render();
  }

  function handleTopicMenu(choice, returnScreen, requestCategory) {
    if (choice === "0") {
      pushScreen("emergencyMenu");
      announce("Emergency help. If someone is in immediate danger, call 112 now.");
      render();
      return;
    }
    if (choice === "9") {
      goBack();
      return;
    }
    if (choice === "6") {
      beginRequestFlow(requestCategory, "routine", false);
      return;
    }
    if (choice === "1" || choice === "2" || choice === "3" || choice === "4" || choice === "5") {
      openDemoInfo(returnScreen);
      return;
    }
    setError(INVALID_CHOICE);
    render();
  }

  function handleChpsReason(choice) {
    switch (choice) {
      case "0":
        pushScreen("emergencyMenu");
        announce("Emergency help. If someone is in immediate danger, call 112 now.");
        render();
        break;
      case "1":
        beginRequestFlow("pregnancyNewborn", "routine", false);
        break;
      case "2":
        beginRequestFlow("childHealth", "routine", false);
        break;
      case "3":
        beginRequestFlow("nutrition", "routine", false);
        break;
      case "4":
        beginRequestFlow("referralFollowUp", "routine", false);
        break;
      case "5":
        beginRequestFlow("generalChps", "routine", false);
        break;
      case "9":
        goBack();
        break;
      default:
        setError(INVALID_CHOICE);
        render();
    }
  }

  function handleDemoInfo(choice) {
    if (choice === "1") {
      var category = "generalChps";
      if (session.infoReturnScreen === "pregnancyMenu") {
        category = "pregnancyNewborn";
      } else if (session.infoReturnScreen === "childHealthMenu") {
        category = "childHealth";
      } else if (session.infoReturnScreen === "nutritionMenu") {
        category = "nutrition";
      }
      beginRequestFlow(category, "routine", false);
      return;
    }
    if (choice === "9") {
      goBack();
      return;
    }
    setError(INVALID_CHOICE);
    render();
  }

  function handleLocation(raw) {
    if (raw === "9") {
      goBack();
      return;
    }
    var value = raw.trim();
    if (!value || value.length > 200) {
      setError("Enter a community, town or nearest landmark.");
      render();
      return;
    }
    session.communityOrLandmark = value;
    pushScreen("phoneInput");
    render();
    announce("Enter a synthetic callback phone number.");
  }

  function handlePhone(raw) {
    if (raw === "9") {
      goBack();
      return;
    }
    var value = raw.trim();
    if (!CONTACT_PATTERN.test(value)) {
      setError("Enter a valid synthetic phone number.");
      render();
      return;
    }
    session.contactNumber = value;
    pushScreen("consentInput");
    render();
    announce("Consent required. Choose 1 to agree and send, or 2 to cancel.");
  }

  function handleConsent(choice) {
    if (choice === "2") {
      setError(null);
      session.consentToContact = false;
      session.consentToShareLocation = false;
      announce("Consent declined. Request not sent.");
      goMainMenu();
      return;
    }
    if (choice !== "1") {
      setError(INVALID_CHOICE);
      render();
      return;
    }
    session.consentToContact = true;
    session.consentToShareLocation = !!session.requireLocationConsent;
    submitCreateRequest();
  }

  function mapApiError(status, code) {
    if (status === 403 || code === "reachDemoDisabled") {
      return UNAVAILABLE;
    }
    if (status === 429 || code === "statusLookupTemporarilyUnavailable") {
      return "Status check is temporarily unavailable.\nPlease try again later.";
    }
    if (status === 404 || code === "statusLookupFailed") {
      return GENERIC_LOOKUP_FAIL;
    }
    if (status === 422 || code === "validationFailed") {
      return "Some details could not be accepted.\nPlease check your entries and try again.";
    }
    if (status === 503) {
      return UNAVAILABLE;
    }
    return UNAVAILABLE;
  }

  /**
   * @param {string} path
   * @param {object} body
   * @returns {Promise<{ok:boolean,status:number,data:object|null,code:string|null}>}
   */
  function postJson(path, body) {
    var controller = new AbortController();
    var timer = window.setTimeout(function () {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    return fetch(path, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      credentials: "same-origin",
    })
      .then(function (response) {
        return response
          .json()
          .catch(function () {
            return null;
          })
          .then(function (data) {
            var code = null;
            if (data && data.detail && typeof data.detail === "object" && data.detail.code) {
              code = String(data.detail.code);
            }
            return {
              ok: response.ok,
              status: response.status,
              data: data,
              code: code,
            };
          });
      })
      .catch(function () {
        return { ok: false, status: 0, data: null, code: "networkError" };
      })
      .finally(function () {
        window.clearTimeout(timer);
      });
  }

  function createReachRequest(payload) {
    return postJson(CREATE_PATH, payload);
  }

  function checkReachRequestStatus(payload) {
    return postJson(STATUS_PATH, payload);
  }

  function submitCreateRequest() {
    if (session.busy) {
      return;
    }
    session.busy = true;
    session.screen = "requestSubmitting";
    setError(null);
    render();
    announce("Sending request. Please wait.");

    var payload = {
      channel: CHANNEL,
      category: session.category,
      requestType: session.requestType,
      contactNumber: session.contactNumber,
      communityOrLandmark: session.communityOrLandmark,
      preferredLanguage: PREFERRED_LANGUAGE,
      consentToContact: true,
      consentToShareLocation: !!session.consentToShareLocation,
    };

    createReachRequest(payload).then(function (result) {
      session.busy = false;
      session.contactNumber = null;
      session.communityOrLandmark = null;

      if (!result.ok || !result.data) {
        session.screen = "consentInput";
        setError(mapApiError(result.status, result.code));
        render();
        announce("Request could not be sent. Please try again.");
        return;
      }

      var referenceCode =
        typeof result.data.referenceCode === "string" ? result.data.referenceCode : "";
      var statusPin = typeof result.data.statusPin === "string" ? result.data.statusPin : "";

      if (!referenceCode || !statusPin) {
        session.screen = "consentInput";
        setError(UNAVAILABLE);
        render();
        announce("Request could not be confirmed. Please try again.");
        return;
      }

      session.referenceCode = referenceCode;
      session.statusPin = statusPin;
      session.screen = "requestCreated";
      setError(null);
      render();
      announce(
        "Request received. Reference and status PIN are shown on the screen. " +
          "Save the PIN privately. It will not be shown again after this session."
      );
    });
  }

  function handleStatusReference(raw) {
    if (raw === "9") {
      goBack();
      return;
    }
    var value = raw.trim().toUpperCase();
    if (!isValidReferenceFormat(value)) {
      setError("Enter a valid NorthCare reference.");
      render();
      return;
    }
    session.statusCheckReference = value;
    pushScreen("statusPinInput");
    render();
    announce("Enter your six-digit status PIN.");
  }

  function handleStatusPin(raw) {
    if (raw === "9") {
      goBack();
      return;
    }
    var pin = raw.trim();
    if (!PIN_PATTERN.test(pin)) {
      setError("Enter a six-digit status PIN.");
      render();
      return;
    }
    if (session.busy) {
      return;
    }
    session.busy = true;
    session.screen = "statusChecking";
    setError(null);
    render();
    announce("Checking request status. Please wait.");

    checkReachRequestStatus({
      referenceCode: session.statusCheckReference,
      statusPin: pin,
    }).then(function (result) {
      session.busy = false;
      if (!result.ok || !result.data || typeof result.data.publicStatusLabel !== "string") {
        session.screen = "statusPinInput";
        setError(mapApiError(result.status, result.code));
        render();
        announce("Request could not be checked.");
        return;
      }
      session.statusLabel = result.data.publicStatusLabel;
      session.screen = "statusResult";
      setError(null);
      render();
      announce("Status result shown.");
    });
  }

  function handleLanguage(choice) {
    switch (choice) {
      case "1":
        goMainMenu();
        announce("English selected. Main menu.");
        break;
      case "2":
      case "3":
      case "4":
        pushScreen("languagePlanned");
        announce("This language is planned but is not yet professionally reviewed. Continue in English.");
        render();
        break;
      case "5":
        pushScreen("languageAssistance");
        announce("Language assistance is planned for a future version.");
        render();
        break;
      case "9":
        goBack();
        break;
      default:
        setError(INVALID_CHOICE);
        render();
    }
  }

  function handleSimpleNav(choice) {
    if (choice === "0") {
      goMainMenu();
      announce("Main menu.");
      return;
    }
    if (choice === "9") {
      goBack();
      return;
    }
    setError(INVALID_CHOICE);
    render();
  }

  function onSend() {
    if (session.busy) {
      return;
    }
    var raw = elInput ? elInput.value : "";
    if (elInput) {
      elInput.value = "";
    }
    setError(null);

    switch (session.screen) {
      case "mainMenu":
        handleMainMenu(raw.trim());
        break;
      case "emergencyMenu":
        handleEmergencyMenu(raw.trim());
        break;
      case "call112End":
        if (raw.trim() === "9") {
          goBack();
        } else {
          setError(INVALID_CHOICE);
          render();
        }
        break;
      case "pregnancyMenu":
        handleTopicMenu(raw.trim(), "pregnancyMenu", "pregnancyNewborn");
        break;
      case "childHealthMenu":
        handleTopicMenu(raw.trim(), "childHealthMenu", "childHealth");
        break;
      case "nutritionMenu":
        handleTopicMenu(raw.trim(), "nutritionMenu", "nutrition");
        break;
      case "chpsReasonMenu":
        handleChpsReason(raw.trim());
        break;
      case "demonstrationInformation":
        handleDemoInfo(raw.trim());
        break;
      case "locationInput":
        handleLocation(raw);
        break;
      case "phoneInput":
        handlePhone(raw);
        break;
      case "consentInput":
        handleConsent(raw.trim());
        break;
      case "requestCreated":
        handleSimpleNav(raw.trim());
        break;
      case "statusReferenceInput":
        handleStatusReference(raw);
        break;
      case "statusPinInput":
        handleStatusPin(raw);
        break;
      case "statusResult":
        handleSimpleNav(raw.trim());
        break;
      case "languageMenu":
        handleLanguage(raw.trim());
        break;
      case "languagePlanned":
      case "languageAssistance":
        handleSimpleNav(raw.trim());
        break;
      case "askNorthCareMenu":
        handleAskNorthCare(raw);
        break;
      case "askFaqAnswer":
        handleAskFaqAnswer(raw.trim());
        break;
      case "askNoMatch":
        handleAskNoMatch(raw.trim());
        break;
      default:
        setError(INVALID_CHOICE);
        render();
    }
  }

  function bind() {
    if (elSend) {
      elSend.addEventListener("click", onSend);
    }
    if (elBack) {
      elBack.addEventListener("click", function () {
        goBack();
      });
    }
    if (elRestart) {
      elRestart.addEventListener("click", function () {
        restartSession();
      });
    }
    if (elInput) {
      elInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          onSend();
        }
      });
    }
  }

  // Expose API helpers for integration tests that evaluate the script in Node-like harnesses.
  window.NorthCareReachSimulator = {
    createReachRequest: createReachRequest,
    checkReachRequestStatus: checkReachRequestStatus,
    restartSession: restartSession,
    getScreen: function () {
      return session.screen;
    },
  };

  bind();
  render();
  announce("NorthCare Reach USSD simulation. Main menu.");
})();
