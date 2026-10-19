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

- Public directory data (oficios, sectores, trabajadores, resenas) is read client-side via the browser client + React Query (src/lib/data.ts); writes rely on RLS, so keep authorization in policies.
- Admin access comes only from public.user_roles (has_role); the signup trigger checks the owner's designated email, never user-editable metadata, to prevent privilege escalation.
- Worker photos live in the private "fotos" bucket under <user_id>/ and are shown with signed URLs (public buckets are blocked in this workspace).
