<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All database access goes through server functions in `src/lib/civic.functions.ts` using the service-role client; tables have RLS with no public policies, so the browser can never read `secreto_hash` or link data to people.
- Secret words are hashed with SHA-256 inside server handlers and never stored or logged in plain text; the browser keeps them only in sessionStorage.
- AI calls (classification, insights) live in `src/lib/ai.server.ts` and must fail soft with computed fallbacks.
- Proposal reaction history is recorded by a database trigger, including preference changes but excluding duplicate same-action submissions; unknown legacy timestamps remain null to avoid invented history.
- The proposal activity helper owns cumulative positive support counting and public-author formatting; the detailed-view component uses Recharts and consumes only explicitly projected anonymous metadata.
