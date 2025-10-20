## AGENTS guide for this workspace

This repository is a Bun-powered monorepo managed with Turbo. The primary app today is a Vite + React admin SPA that uses Tailwind CSS v4 (via @tailwindcss/postcss), shadcn v4 tokens, and an HSL-based design system.

### Project layout

- Root workspace managed by Turbo and Bun
- App: `apps/admin` (Vite + React 19 + TypeScript)
- Shared packages: `packages/*` (none committed yet)

Nearest AGENTS.md wins. If you need app-specific conventions, place another `AGENTS.md` under `apps/admin/`.

### Tooling and versions

- Bun: specified via `packageManager` `bun@1.1.30`
- Turbo: ^2.5.6 (orchestrates monorepo tasks)
- Vite: ^6.3.5 with `@vitejs/plugin-react-swc`
- TypeScript: ~5.8.3
- React: ^19.1.0
- Tailwind CSS: ^4.1.9 via `@tailwindcss/postcss` and PostCSS ^8.5.6
- UI kit: `@ui8kit/core` (scanned via Tailwind `@source`)

### Monorepo tasks (run at repository root)

- Dev: `bunx turbo run dev`
- Build: `bunx turbo run build`
- Test: `bunx turbo run test` (no tests configured yet; will no-op unless added)
- Lint: `bunx turbo run lint` (no linter config present yet)

Turbo behavior (`turbo.json`):
- `dev` is persistent and not cached
- `build` depends on parent `^build` and outputs to `dist/**`
- `test` depends on `build`

### Admin app commands (run in apps/admin)

- Dev server: `bun run dev` (equivalent to `vite`)
- Build: `bun run build` (runs `tsc && vite build`)
- Preview: `bun run preview` (vite preview)

Vite config:
- Aliases `@` -> `apps/admin/src`
- React SWC plugin enabled

### Styling: Tailwind v4 + PostCSS + shadcn v4 + HSL

- PostCSS pipeline: `apps/admin/postcss.config.mjs` uses `@tailwindcss/postcss`
- Tailwind entry: `apps/admin/src/assets/css/index.css`
  - `@import "tailwindcss" source(none);`
  - Includes `./shadcn.css`
  - Sources:
    - `@source "../../../node_modules/@ui8kit/core/dist/**/*.{js}"`
    - `@source "../../**/*.{ts,tsx}"`
  - Base layer adds `.prose` font-size and `button{cursor:pointer}`

- Theme tokens: `apps/admin/src/assets/css/shadcn.css`
  - Defines CSS custom properties for light/dark on `:root` and `.dark`
  - Exposes tokens via `@theme inline` mapping to Tailwind theme variables (e.g., `--color-primary`, `--radius-*`, and `--shadow-*`)
  - Colors are HSL values; prefer using the semantic variables instead of hard-coded colors

Dark mode:
- Set `.dark` on `html` or `body` to enable the dark palette. See `public/js/darkmode.js` if present or manage mode toggling in app logic.

### Code style guidelines

- Language: TypeScript for app code; React 19 with hooks
- Imports: Prefer alias `@/...` for paths under `apps/admin/src`
- CSS utilities: Use Tailwind classes. For colors/spacing/radius, prefer semantic tokens (e.g., `bg-primary`, `text-foreground`, `rounded-lg`)
- Comments in code should be in English
- Keep code readable: descriptive names, early returns, minimal nesting, avoid unnecessary try/catch

### Testing

- No test runner is configured. If adding tests, wire a task under each package/app (`"test"` script) so Turbo can orchestrate `bunx turbo run test`.

### Security considerations

- Dependencies are modern (React 19, Vite 6). Be mindful of DOM injection; prefer React sanitization and avoid `dangerouslySetInnerHTML` unless sanitized.
- Tailwind `@source` includes `@ui8kit/core` dist and local `src`. If you add new packages or server code, ensure sources are correctly scoped to avoid leaking unintended classnames or slow scans.
- Keep secrets out of the repo and `.env` files out of VCS. For Vite, variables must be prefixed with `VITE_` to reach the client.

### Commit and PR guidelines

- Small, focused commits with clear messages
- Reference scope: `admin:` for changes under `apps/admin`, `repo:` for root tooling
- Include: what changed, why, and any follow-ups
- For PRs: describe build/test status and manual verification steps

### Common tasks for agents

- Start dev server (root): `bunx turbo run dev`
- Start dev server (admin app only): `cd apps/admin && bun run dev`
- Add a dependency to admin: `cd apps/admin && bun add <pkg>`
- Update UI theme: edit `apps/admin/src/assets/css/shadcn.css`
- Add new pages/components: place under `apps/admin/src` and use `@` alias in imports

### Adding subproject AGENTS.md files

- For tailored guidance, add `apps/<name>/AGENTS.md` with app-specific commands and conventions. Agents read the closest `AGENTS.md` to the edited file.

### Package development (`packages/@ui8kit/flow`)

- Create package skeleton:
  - `packages/@ui8kit/flow/src/{types,schemas,registry,importers/n8n,validation,compiler,adapters}`
  - Public API in `packages/@ui8kit/flow/src/index.ts`
- Add workspace dependency to admin: `cd apps/admin && bun add -D @ui8kit/flow@workspace:*`
- Build at root: `bunx turbo run build`
- App usage: import APIs from `@ui8kit/flow` for parse/validate/support/compile

### FAQ

- Conflicting instructions: the closest `AGENTS.md` wins; explicit user prompts override
- Programmatic checks: if you list build/test commands above, agents may run them automatically
- Living doc: Update this file as the stack evolves


