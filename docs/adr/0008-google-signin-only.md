# ADR-0008: Google Sign-In only

Date: 2026-08-31 · Status: Accepted

## Context

Phone OTP is the Indian default, but every SMS costs money and there is no
budget. Elders are the hardest users to authenticate.

## Decision

Google Sign-In only for v1.

## Consequences

- Free, one tap, no OTP to read out to a grandparent
- Almost every Android phone in India is already signed in to Google

* Excludes the small number of users without a Google account
* Revisit phone auth when revenue can fund SMS
