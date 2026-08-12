# NorthCare Reach — Demo Limitations Register

**Last updated:** 2026-08-04  
**Status:** Honest prototype limitations for judges and operators  

| Limitation | Status |
|---|---|
| R3 browser USSD simulator still available (static UI) | Active demo path |
| AT sandbox USSD (T1 webhook) available via AT web simulator | Sandbox only — awaiting T1 checkpoint approval; not a national live shortcode |
| Live / paid dedicated USSD shortcode | Not implemented — do not rush for hackathon demo day |
| Temporary Cloudflare/ngrok tunnels can die mid-demo | Demo risk — prefer stable HTTPS host + fixed AT callback |
| SMS not implemented | Not implemented |
| Remote push not implemented | Not implemented |
| Worker must open/refresh the app to see new requests | By design for MVP |
| Emergency escalation is internal simulation only | Active limitation |
| No ambulance is contacted or dispatched | Explicit non-feature |
| No clinical emergency classification | Explicit non-feature |
| Community “Ask NorthCare” on USSD | **FAQ-only** menu 7 (approved community templates + worker handoff). Not generative clinical AI; not on-device Qwen. See `REACH_USSD_ASK_NORTHCARE_CHECKPOINT.md` |
| English only in Reach MVP | Active limitation |
| Approved public health content packs pending | Not in Reach scope |
| Physical Android validation | Pending if path-length blocker remains |
| Production public hosting absent | Not claimed (stable demo host is optional ops, not national prod) |
| Not for clinical use | Mandatory disclaimer |

## Related non-claims

- Not UNICEF approved  
- Not Ghana Health Service approved  
- Not production ready  
- Not a live emergency service  
- Sandbox ≠ national live shortcode  
- Cloudflare quick tunnel is not part of Africa's Talking  

See `docs/development/REACH_AT_USSD_SANDBOX_RUNBOOK.md` for the demo-day playbook.
