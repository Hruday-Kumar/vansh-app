# ADR-0005: No video

Date: 2026-08-31 · Status: Accepted

## Context

A video recorder and player exist in the codebase. Storage is 10 GB on the R2
free tier; a single minute of video costs more than a hundred photos.

## Decision

Photos and voice only. Delete the video recorder and player.

## Consequences

- 10 GB serves roughly 150 families instead of roughly 5
- Voice is the better fit anyway — elders speak far more readily than they film

* Families will ask for video. The answer is "not yet", revisited at Phase 5
