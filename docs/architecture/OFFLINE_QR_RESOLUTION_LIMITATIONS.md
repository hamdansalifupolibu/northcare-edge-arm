# Offline QR Resolution Limitations

**Stage:** 10

## What works

On the **same device** that issued (or re-stored) a passport, scanning or entering the opaque token resolves via local `token_hash` lookup and shows a receipt.

## What does not work

- Cross-device resolution without a future trusted exchange service
- Claiming the destination facility was notified
- Claiming the passport is globally verified or synced
- Auto-updating status from scan alone

## User-facing message

When the hash is unknown locally:

> This referral passport is not available on this device.

## Future

See `FUTURE_TRUSTED_REFERRAL_EXCHANGE.md` (deferred).
