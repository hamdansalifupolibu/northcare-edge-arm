# Offline Model Lifecycle — Stage 1

## States

`unsupported` → `missing` → `downloading` → `verifying` → `ready` → `loading` → `loaded` → `generating` → `releasing` → `error`

## Operations

| Operation | Behaviour |
|---|---|
| `inspectRuntime` | Detects Android + `llama.rn` availability |
| `inspectModel` | Checks private storage for the GGUF file |
| `provisionModel` | Dev-only download or import; never auto at launch |
| `verifyModel` | Size + SHA-256; deletes corrupt files |
| `loadModel` | Creates one llama context (`n_gpu_layers: 0`) |
| `generate` | One completion at a time |
| `cancelGeneration` | Stops active completion |
| `releaseModel` | Releases the single live context |

## Guards

- One provision / download at a time
- One load at a time
- One generation at a time
- No generation before load
- No delete while loaded
- One live context only
