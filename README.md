# Zoodyssey
Zoodyssey is a prototype single-player roguelite deckbuilder about building a zoo. Cards are drafted into a deck, drawn from each year in limited number, and played at a cost to place habitats, animals, staff and buildings.

It is inspired by the classic zoo management games like **Zoo Tycoon** and **Planet Zoo**,
modern card based board games such as **Ark Nova** or **Terraforming Mars**
and roguelites/deckbuilders such as **Slay the Spire** and **Against the Storm**.

See [`docs/game-design.md`](docs/game-design.md) for the full game design.

## Getting started

Requires Node.js.

```bash
npm install
npm run dev
```

This starts a local dev server (Vite) and prints a URL — open it in your browser to play.

### Other scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the local dev server |
| `npm test` | Run the test suite |
| `npm run typecheck` | Type-check without emitting output |
| `npm run build` | Type-check and produce a production build in `dist/` |
| `npm run preview` | Preview the production build locally |

## Tech stack
- TypeScript
- Phaser
- Vite
- Vitest

## Contributing

Development is managed through **GitHub Issues**. Each issue states a goal, requirements, acceptance criteria, and what's explicitly out of scope.
Each issue should be kept small enough to implement and verify independently.

For the detailed development conventions used in this repo (git/commit style, architecture rules, testing philosophy, definition of done), see [`CLAUDE.md`](CLAUDE.md).
