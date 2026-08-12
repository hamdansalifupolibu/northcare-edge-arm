# Offline referral passport — judge demo (one phone)

1. Worker workspace → **Clients** → open a client → **Prepare referral**.  
2. Choose destination (e.g. **Tamale Teaching Hospital**).  
3. Confirm and save → **Show referral passport (QR)**.  
4. Tap **Share caregiver slip** (optional) or leave the QR on screen.  
5. Copy / note the QR payload, or keep the share text.  
6. Log out (when login is enabled) or switch demo account.  
7. Log in as Worker 2 → **Referrals** → **Verify passport (offline)**.  
8. Scan the QR or paste the `northcare://referral-passport/v2/...` code.  
9. Confirm **Valid NorthCare referral** + destination / reason summary.  
10. Say: *“Facility inbox sync is next; today the signed QR proves the handoff offline.”*

Algorithm: **Ed25519** signed minimal claims. Not a full medical record. Not blockchain.
