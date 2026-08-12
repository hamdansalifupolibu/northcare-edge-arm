# Expo Runtime Strategy

**Last updated:** 2026-08-02  
**Stage:** 11  

## Expo Go may initially support

- Foundation UI
- Basic navigation (once added)
- Forms
- Network status checks
- Supported Expo storage APIs (when introduced)
- Approved Expo modules compatible with Expo Go
- **Stage 11:** `expo-audio` recording/playback and `expo-file-system` app-private voice file management

## A development build will likely be required later for

- Some biometric workflows
- Advanced audio processing
- Certain QR scanning configurations
- Native model libraries
- Local LLM runtimes
- Custom native modules
- Production notification configuration

## Stage 2 policy

- Do **not** build a custom development client during Stage 2 unless required by the current Expo project.
- Do **not** install local-model libraries.
- Expo Go / Metro + Android emulator is sufficient for the foundation screen.

## Stage 11 note (voice capture)

- Recording, playback, and managed local audio files work in **Expo Go** via `expo-audio` + `expo-file-system`.
- **Future local ASR or on-device LLM modules** will likely require a **development build** (native binaries, larger models, custom native code).
- Do not install unapproved ML/ASR libraries during Stage 11.
- Revisit this document when the **first Go-incompatible ASR module is approved** for production implementation.

## Review trigger

Revisit this document when the first native module incompatible with Expo Go is approved for implementation.
