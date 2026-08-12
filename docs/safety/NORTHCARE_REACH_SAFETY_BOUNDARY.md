# NorthCare Reach — Safety Boundary

**Status:** Frozen by Reach Stage R0; enforced through R5 UI/API and audited in R6  
**Last updated:** 2026-08-03  

## Hard prohibitions

NorthCare Reach must **not**:

- Diagnose  
- Prescribe treatment  
- Recommend medication or dosage  
- Calculate clinical risk from USSD input  
- Decide whether an ambulance is required  
- Tell a caller it is safe to wait  
- Confirm that an emergency service has accepted a request  
- Automatically create a patient / client record  
- Automatically complete care  
- Expose sensitive health information publicly  
- Use generative AI in the emergency flow  
- Use an unrestricted public chatbot  

Human review remains required.

## Emergency wording (required)

Always direct immediate danger to **call 112**. Worker R5 banner copy:

```text
Emergency coordination simulation
If someone is in immediate danger, the requester should call 112.
Live emergency-service integration is pending.
```

Escalation confirmation must state that NorthCare will **not** contact or dispatch an ambulance.

**Forbidden:** ambulance dispatched/called/assigned/on the way; emergency medically confirmed; severe/major/moderate emergency; RED PRIORITY from Reach; user-selected medical grading of the emergency.

## Clinical priority separation

An emergency-assistance community request is **not** automatically a clinical RED priority. Reach must not create risk assessments, screenings, referrals, or diagnoses from request category alone.

## Information content

Pregnancy, child-health, and nutrition information options in the MVP are **unapproved demonstration placeholders** only. They must be labelled as such. Future health messages require content packs and professional review.

## Request types vs severity

`routine`, `urgentContact`, and `emergencyAssistance` are pathway labels — not clinical severity. Do not introduce mild / moderate / severe / critical as automated medical classifications.

## Handled status meaning

`handled` means the worker closed the request workflow for Reach demo purposes. It does **not** mean clinical care was completed.

## Language

English only for implemented simulator UI. Do not fabricate Dagbanli/Hausa/Dagaare translations or use AI translation for public health information.

## Relation to core NorthCare AI safety

Reach inherits AGENTS.md / responsible-AI rules: no diagnose/prescribe/dosage; deterministic safety over generative output; synthetic data only; no AI save without worker confirmation (Reach MVP does not use generative extraction).
