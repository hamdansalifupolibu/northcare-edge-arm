# Definition of Done

**Purpose:** Project-wide completion criteria for every implementation stage.  
**Status:** Active  
**Last reviewed:** 2026-08-02  

A stage is complete only when **all** applicable items are true:

1. Approved scope is implemented  
2. Out-of-scope work was avoided  
3. The application remains runnable after Stage 2 begins  
4. Type checking passes (when TS project exists)  
5. Linting passes (when configured)  
6. Relevant tests pass  
7. Loading states exist for async work introduced  
8. Empty states exist where lists are introduced  
9. Error states exist for failure paths introduced  
10. Offline behaviour is documented and implemented for the stage’s flows  
11. Accessibility basics are included (labels, 48dp targets)  
12. No secrets are committed  
13. No real patient data is used  
14. Logs contain no health information  
15. Documentation is updated  
16. Stitch alignment is reviewed for UI touched  
17. Security / privacy impact is reviewed  
18. Known limitations are recorded  
19. Manual verification is completed  
20. Stage checkpoint report is produced  
21. User approval is received before continuing  

See also: `docs/testing/TEST_STRATEGY.md`, `AGENTS.md`.
