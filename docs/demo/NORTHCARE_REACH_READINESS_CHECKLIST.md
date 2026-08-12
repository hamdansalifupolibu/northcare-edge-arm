# NorthCare Reach — Demo Readiness Checklist

**Last updated:** 2026-08-03  

Mark each item before a live demonstration.

## Environment

- [ ] PostgreSQL running  
- [ ] Alembic head current (`0005`)  
- [ ] `NORTHCARE_ENV=development`  
- [ ] `NORTHCARE_REACH_DEMO_ENABLED=true`  
- [ ] FastAPI running  
- [ ] `/reach-simulator` reachable  
- [ ] Expo mobile application running against the same API  
- [ ] Development dual-role account ready (password not written here)  

## Data

- [ ] Synthetic data only  
- [ ] No real phone numbers  
- [ ] No real client records used in Reach demo  
- [ ] Demo reset completed (or fresh seed applied)  
- [ ] Worker profile: `communityHealthOfficer`, community + emergency enabled  
- [ ] Facility `fac-dev-001` / organisation `org-dev-001`  

## Routine journey

- [ ] Request created in simulator  
- [ ] Request assigned (or visible in queue)  
- [ ] Worker sees it in Community Requests  
- [ ] Worker acknowledges  
- [ ] Contact attempt works  
- [ ] Handled works  
- [ ] Public status shows generic handled wording  

## Emergency journey

- [ ] Call-112 wording appears immediately  
- [ ] Simulation / live-integration-pending wording present  
- [ ] Worker sees emergency request  
- [ ] Escalation confirmation states no ambulance contact/dispatch  
- [ ] Public status shows “Escalated for further support”  
- [ ] No ambulance claim anywhere in the path  

## Safety stop

- [ ] No passwords, tokens, or reusable PINs in slides or chat  
- [ ] Limitations register reviewed aloud or on a slide  
