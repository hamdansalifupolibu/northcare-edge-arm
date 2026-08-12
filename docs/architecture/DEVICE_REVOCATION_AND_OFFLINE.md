# Device revocation and offline limitations

## Revocation effect

- Marks the registered installation `revoked`
- Rejects future protected backend requests from that installation when it next contacts the API
- May revoke related remote sessions where the provider supports it
- Preserves device history

## Honest limitations

- Revocation is **not** a remote wipe
- Local clinical records are not deleted by revocation
- A device that remains offline may retain locally cached data until it reconnects or local policy expires
- Full mobile-device management is not implemented

## Current-device revocation

Requires strong confirmation. After server acknowledgement, clear remote tokens and end the administration session according to auth policy.
