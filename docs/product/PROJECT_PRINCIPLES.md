# Project Principles

These principles are permanent and apply to every implementation stage.

## 1. Offline-First

The application must function for all core clinical workflows without internet connectivity. Connectivity is a bonus — not a requirement. Local data is the source of truth. Synchronisation happens when connectivity returns.

## 2. Human Review of AI Output

No AI-extracted, AI-generated or AI-structured information may become part of the official clinical record without explicit worker review and confirmation. The health worker is always the decision-maker.

## 3. Deterministic Emergency Rules

Urgent danger-sign detection must use approved deterministic rules — not unconstrained generative AI. Rule-based screening ensures reproducible, auditable and explainable results.

## 4. No Diagnosis

NorthCare AI must never claim to diagnose a medical condition. It identifies approved danger-sign patterns and recommends the worker take appropriate action (referral, follow-up, supervisor contact).

## 5. No Prescription

NorthCare AI must never prescribe medication, calculate medication dosages or advise users to stop prescribed treatment.

## 6. Local Relevance

Content, guidance, food recommendations, language support and imagery must be appropriate for Northern Ghana. Generic global health content is not sufficient. Dagbanli language support is a core feature, not an afterthought.

## 7. Privacy by Design

- No patient data in AsyncStorage
- Sensitive credentials in Expo SecureStore
- Privacy-safe lock-screen notifications (no clinical details)
- No health information in development logs
- Role-based access controls
- Soft deletion with audit trails
- Encrypted local database where supported

## 8. Accessible Android UX

- 48dp minimum touch targets
- High-contrast text (Material 3 compliance)
- Accessibility labels on all interactive elements
- Plus Jakarta Sans for field legibility
- Designed for mid-range Android devices
- Optimised for Samsung Galaxy S20 Ultra

## 9. Reusable Components

UI components must be built as reusable atoms and molecules following the approved design tokens. No hardcoded hex values. No inline styling that cannot be changed from the theme.

## 10. Synthetic Development Data

All development and demonstration data must be synthetic. No real patient information may appear in the codebase, screenshots, recordings or repository at any time.

## 11. No Secrets Committed

- API keys, tokens and credentials must never be committed to the repository
- Use environment variables and .env files excluded via .gitignore
- The Stitch API key must not appear in the final repository

## 12. Clear Documentation

Every significant component, service, hook, screen and data model must have clear inline documentation. The repository README must explain how to set up, run and test the application.

## 13. Stage-by-Stage Implementation

Development proceeds through defined stages with clear scope, acceptance criteria and checkpoints. Each stage must leave the repository in a runnable state. No stage should produce a broken build.

## 14. Logic-First, Design-Aware

Core functionality may initially use simple working interfaces. However, navigation identities, design tokens and data contracts must follow the approved Stitch flows from the start. The application must not be built in a way that makes later UX integration difficult.

## 15. No Fabrication

Do not invent health protocols, fabricate Dagbanli medical translations, generate fake institutional logos or claim AI features are safe without verification. Uncertainty must be acknowledged, not hidden.

## 16. Dignity and Respect

All imagery, language and interaction patterns must treat health workers, caregivers and patients with dignity. The nutrition planner must not shame caregivers. Guidance must be supportive, not punitive.
