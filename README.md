# Kos Bahagia

Boarding-house discovery platform for Indonesia. Every listing has been visited
and scored by our own survey team. Read `CLAUDE.md` first — it is the permanent
project context. Task prompts live in `prompts/` and are run one at a time.

## Develop

```bash
npm install
npm run dev
```

- Design-system preview (dev only): http://localhost:3000/kitchensink
- Tokens: `app/globals.css` (`@theme`) — the only file allowed to contain a hex colour or a px font size.
- Primitives: `components/ui/`
- Formatting helpers: `lib/format.ts`

## Check

```bash
npm run build      # must pass with zero TypeScript errors
npm run lint
npm run typecheck
```

## Surfaces

| Surface | Route group | Host |
|---|---|---|
| Renter | `app/(user)/` | kosbahagia.com |
| Owner (mitra) | `app/(mitra)/` | mitra.kosbahagia.com (`NEXT_PUBLIC_MITRA_URL`) |
