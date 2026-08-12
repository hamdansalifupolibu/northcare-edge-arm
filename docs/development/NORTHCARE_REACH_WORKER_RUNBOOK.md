# NorthCare Reach — Worker Community Requests Runbook (R4)

**Last updated:** 2026-08-03  

## Prerequisites

1. API running with Reach demo gate enabled (development only):

```env
NORTHCARE_ENV=development
NORTHCARE_REACH_DEMO_ENABLED=true
NORTHCARE_REACH_DEMO_ORGANISATION_ID=org-dev-001
NORTHCARE_REACH_DEMO_FACILITY_ID=fac-dev-001
```

2. Development dual-role account in Worker workspace  
3. Profession `communityHealthOfficer` with community + emergency flags enabled  
4. Facility `fac-dev-001`

## Create a synthetic request

Open `http://127.0.0.1:8000/reach-simulator` (R3) and submit a pathway, **or** `POST /v1/reach/requests` with synthetic data.

## Worker walkthrough

1. Sign in and unlock  
2. Enter Worker workspace  
3. Open **Community Requests**  
4. Refresh / select filter  
5. Open detail  
6. Acknowledge → Record contact attempt → Mark handled  
7. Confirm public status in the simulator (generic label only)  
8. Switch to Administration — Community Requests routes must be inaccessible  

## Offline

Community Requests requires connectivity. Clinical offline workflows remain unaffected.

## Do not

- Expect remote push delivery  
- Queue mutations offline  
- Auto-create or auto-link client records  
- Treat handled as clinical care completion  
