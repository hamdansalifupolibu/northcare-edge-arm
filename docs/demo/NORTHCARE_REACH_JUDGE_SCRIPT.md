# NorthCare Reach — Judge Demonstration Script (4–6 minutes)

**Audience:** Hackathon judges / partners  
**Mode:** Local development demonstration (synthetic data only)  
**Last updated:** 2026-08-03  

Do not speak passwords, status PINs, or real contact numbers aloud for recording. Show the one-time PIN briefly on screen only.

---

## 1. Problem (30–40s)

In Northern Ghana, many families still rely on basic phones. Frontline workers already use NorthCare AI offline to manage clients, visits, screening, referrals, and follow-up. But people without smartphones cannot start that journey themselves. When something feels urgent, they may have no clear path into the local health workforce.

## 2. Offline-first worker application (20–30s)

NorthCare AI is an Android-first worker application. It is built for low connectivity: workers keep serving when the network drops. Reach does not replace that core product — it extends access to the community.

## 3. Basic-phone exclusion (15–20s)

If the only entry point is a smartphone app, basic-phone users stay outside the system. That is the gap NorthCare Reach targets.

## 4. NorthCare Reach introduction (20–30s)

NorthCare Reach is a **USSD simulation** for demonstration. It shows how a community member on a basic phone could submit a synthetic request that routes to an authorised health worker. Live telecom integration is pending. This is not a live shortcode.

Open: `/reach-simulator`  
Point to the label: **NorthCare Reach USSD simulation** / **Live telecom integration pending**.

## 5. Routine USSD request (45–60s)

1. Choose **Child health**.  
2. Choose **Request a CHPS worker**.  
3. Enter a clearly synthetic landmark and phone number.  
4. Give consent and submit.  
5. Show the reference code and one-time status PIN.  
6. Emphasise: no worker name, facility, or clinical detail is shown publicly.

## 6. Profession-based routing (20–30s)

Explain briefly: requests are routed with a frozen profession matrix — for example child health prefers eligible community health roles at the development facility. No workload balancing. If nobody matches, the request stays unassigned in the facility queue.

## 7. Worker handling (60–75s)

1. Open the Worker workspace → **Community Requests**.  
2. Open the new request.  
3. Show contact details only on the detail screen.  
4. **Acknowledge**.  
5. Record a **contact attempt**.  
6. **Mark handled**.  
7. Return to the simulator and check status — only a generic handled label appears.  
8. Say clearly: handled means the request workflow was closed, not that clinical care was completed.

## 8. Emergency simulation (60–75s)

1. Restart the simulator and choose **Emergency help now**.  
2. Show **Call 112** immediately. Say NorthCare has not placed the call.  
3. Submit synthetic location information for urgent human review.  
4. In Worker → Community Requests → **Emergency**, open the request.  
5. Show the emergency coordination simulation banner.  
6. Acknowledge, then **Escalate for further human support**.  
7. Confirm the dialog: no ambulance is contacted or dispatched.  
8. Check public status: **Escalated for further support** only.

## 9. Privacy-safe status check (15–20s)

Public status never returns category, contact number, worker, facility, or clinical information — only a generic label.

## 10. Future telecom and ambulance integration (15–20s)

Future partner work can connect a real USSD gateway, SMS, and emergency-service partnerships. Those integrations are **not active** in this prototype.

## 11. Clear prototype limitations (15–20s)

USSD is simulated. No SMS. No remote push. Workers refresh the app. Emergency escalation is internal only. English only for this demo. Not for clinical use.

## 12. Final product value (15–20s)

NorthCare Reach shows one complete story: basic-phone access into a trusted worker workflow, with privacy and human review at the centre — built on an offline-first Northern Ghana health application.
