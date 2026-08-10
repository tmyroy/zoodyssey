# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository currently contains only design/planning docs (`README.md`, `docs/game-design.md`) — no source code, `package.json`, or build tooling exists yet. When the first code is added, set up the toolchain described below (TypeScript + Phaser + Vite + Vitest) and add real build/lint/test commands here.

## What this is

Zoodyssey is a prototype single-player roguelite zoo management game, inspired by Zoo Tycoon/Planet Zoo, card-based board games (Ark Nova, Terraforming Mars), and roguelites (Slay the Spire, Against the Storm). See `docs/game-design.md` for the full game design (core loop, animals, resources, cards, progression). Read it before implementing gameplay systems — it defines what makes a change "in scope."

Tech stack (once code exists): TypeScript, Phaser, Vite, Vitest.

## Development philosophy

During prototype development, priorities in order: **Playability > Game feel > Fast iteration > Simple implementations > Clear code.**

- Avoid premature architecture and overengineering; don't build systems "for the future" unless the current gameplay needs them.
- When choosing between a flexible architecture (days) and a simple implementation (hours), choose simple unless the architecture is required for current gameplay.
- Only implement what the GitHub issue asks for. If it exposes a larger architectural problem, prefer the smallest fix and mention (don't implement) the larger improvement without approval.

## Architecture rule

Keep game logic independent from Phaser rendering where practical — simulation/state should not depend unnecessarily on Phaser objects.

- **Phaser owns:** rendering, input, scenes, animation, audio.
- **Game logic owns:** animals, economy, time, events, simulation, game rules.
- Use Phaser's normal scene lifecycle; don't build a custom engine/framework on top of it. Keep Phaser-specific code at the edges of game systems.

## TypeScript conventions

- Strict TypeScript; avoid `any`.
- Prefer simple types/interfaces over clever abstractions; keep functions small; use explicit names.
- Don't introduce unnecessary dependencies.

## Testing

- Add/update unit tests for non-trivial game logic changes; not every trivial change needs a new test — use judgement.
- Test observable game behaviour, not implementation details or mocks.
- Run relevant tests during development, and the full suite before completing a task.

## Definition of done

- Requested behaviour works.
- TypeScript compiles.
- Tests pass.
- The game can still start.
- No unrelated functionality was changed.

## Git / commit conventions

Trunk-based development on `main` with short-lived feature branches, merged via **rebase**. Keep commits small, focused, and logically coherent.

Use conventional commits. The description starts with a lowercase verb; every commit must reference its GitHub issue on its own line:

```
<type>(<scope>): <description>

refs #123
```

Example:
```
feat(simulation): add yearly game clock

refs #12
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.

Scopes are optional — use one only when the change is clearly limited to a specific area, keep it short/consistent, and never use a GitHub issue number as a scope.

## Issue tracking

Work is managed through GitHub Issues. Each issue should state: goal, requirements, acceptance criteria, and explicit out-of-scope items. Issues are meant to be small enough to implement and verify independently.