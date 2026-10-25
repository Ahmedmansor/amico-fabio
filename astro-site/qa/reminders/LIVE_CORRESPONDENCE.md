# Authorized correspondence activation — 2026-10-25

User approved the prepared database changes and disposable rollback tests, then
explicitly approved the preference Edge upgrade and local UI activation.

Applied migrations on fabioEgypt:
- explicit_wishlist_correspondence_policy
- wishlist_correspondence_capabilities
- wishlist_correspondence_ingress_budget

All three prepared role-test scripts completed successfully with ROLLBACK.
Real assertions cover consent language/time snapshot, preserved re-enable,
same-ID retries, token account isolation, revoked/expired capabilities, no
resubscription by language save, private/browser RPC denial and ingress limits.
Post-test verification: preferences=0, events=0, tokens=0, ingress=0;
private RLS=true and browser RPC denied=true. No test data remained.
Native overlapping-session/load behavior is not verified by these scripts.

Preference Edge function is ACTIVE v3, digest
`1cb737b113477e84e79ea4438e148479acac8908ea8093fa83ed0c81682e18a7`.
It now uses the successor consent/audit RPC. Auth/locale and opt-in UI are enabled
only in ignored local environment on 4322. Browser/hosting defaults remain off.
Real signed-in UI saving is the user's next check, not agent-verified.
Final minimal smoke: anonymous service request returned 401; IT/EN localhost
wishlist pages returned 200 with consent UI and language selector present.

Management Edge remains disabled/undeployed: global policy and token lifetime
are not chosen. No real capability was issued. Automatic reminder delivery and
the expired QA email sender were not activated or renewed; no email was sent.
