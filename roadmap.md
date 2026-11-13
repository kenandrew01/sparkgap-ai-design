# Roadmap

## Open tasks

- [ ] Build "FootprintGen" per uploaded spec (Build_a_web_app_called_FootprintGen_that_pasted.md): part-number lookup → datasheet extraction → deterministic IPC-7351B footprint builder → review screen with editable data + SVG preview → KiCad/JSON/SVG downloads, history page, auth + RLS, rate limit 20/day.
  - Blockers: needs Nexar/Octopart API key (part lookup) and decision on AI provider for datasheet extraction (spec says Claude API key; Lovable AI Gateway is available with no key). Spec also requires email sign-in — site currently has none.

## Done

- Stripe key question answered: value cannot be shown; user re-enters via secure form or Stripe dashboard.

- [ ] Custom domain / TXT record question: user was told to add a TXT record for sparkgap-ai-design.lovable.app — clarify that Lovable hosts that domain; needs a custom domain to add DNS records.
