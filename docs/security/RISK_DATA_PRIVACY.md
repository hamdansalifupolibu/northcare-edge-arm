# Risk Data Privacy

## Do not log

Answer values, measurement values, question wording with answers, client identity, free text, full engine input/result, facility-sensitive details, PINs/tokens.

## Permitted logs

Engine version, rule-pack id/version, duration, rule counts, matched-rule count, missing-input count, priority category, sanitised error category.

## Persistence

Factors reference question keys / measurement IDs — not client names or phones. Input digest uses canonical non-identifying structure; it is not encryption or authentication.

## Routes

UUIDs only — no priority, symptoms, names, or answers in paths/query strings.
