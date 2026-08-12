# Offline AI Privacy Boundary — Stage 1

## Rules

- Neutral technical prompts only
- No patient data in prompts
- Do not log prompt text
- Do not log generated text except controlled local development evidence
- Do not persist completion history
- Do not add analytics or external crash services for model traffic
- Do not transmit model inputs
- Do not send timing metrics externally
- Production UI must not expose raw native stack traces

## Storage

Model weights live in application-private file storage only. They are not stored in SQLite, SecureStore, AsyncStorage, or public media folders.
