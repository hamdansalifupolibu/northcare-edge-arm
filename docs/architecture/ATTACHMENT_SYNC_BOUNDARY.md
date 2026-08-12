# Attachment Sync Boundary

**Stage:** 14  
**Status:** Binary transfer unavailable

## Decision

Stage 14 synchronises attachment **metadata** only (ids, hashes, mime type, size, linkage).  
`AttachmentTransferProvider` is **unavailable in production**.

## Allowed

- Push/pull of attachment metadata records through sync protocol v1
- Local file retention on device for offline clinical work
- Explicit “upload unavailable” UI copy when a worker expects binary sync

## Not allowed

- Production binary upload/download of clinical attachments or audio
- Silent marking of attachments as synced when bytes were not transferred
- Logging of file paths that embed health identifiers beyond stable ids

## Follow-up

A future approved stage may introduce constrained, authenticated binary transfer with size limits, virus scanning policy, and facility-scoped storage. Until then, treat binary sync as out of scope.
