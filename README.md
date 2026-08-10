# Zoodyssey
Zoodyssey is a prototype single-player roguelite zoo management game.  

It is inspired by the classic zoo management games like **Zoo Tycoon** and **Planet Zoo**, 
modern card based board games such as **Ark Nova** or **Terraforming Mars** 
and roguelites such as **Slay the Spire** and **Against the Storm**.

## Tech stack
- TypeScript
- Phaser
- Vite
- Vitest

## Project

Development is managed through **GitHub Issues**.

Each issue should describe:
- Goal of the change
- Relevant requirements
- Acceptance criteria
- Anything explicitly out of scope

Issues should be small enough to implement and verify independently.


## Git convention

Use **trunk-based development** with `main` as the trunk and short-lived feature branch.

Use **rebase** as merge strategy. Keep commits small, focused, and logically coherent.

Use **conventional commits**.

The commit description must start with a lowercase verb and every commit must reference its GitHub Issue on a separate line:
```
<type>(<scope>): <description> 

refs #123
```

### Examples
```
feat(simulation): add yearly game clock

refs #12
```
```
fix(economy): prevent negative cash balance

refs #18
```
### Types
Use the following `types`:
- `feat` adds, changes or removes user-visible functionality
- `fix` fixes incorrect or broken user-visible behaviour
- `refactor` restructures code without changing behaviour
- `test` adds or changes tests without changing production behaviour
- `docs` changes documentation only
- `chore` maintenance work such as build tooling, dependencies, configuration, or code style

### Scopes
The `scope` provides additional contextual information:
- Scopes are optional
- Use a scope when the change is clearly limited to a specific area or feature.
- Keep scopes short and consistent.
- Do not use GitHub issue numbers as scopes.


## Development Philosophy

During prototype development, we prioritise like this:

1. Playability
2. Game feel
3. Fast iteration
4. Simple implementations
5. Clear code

Avoid premature architecture and overengineering.

Do not build systems "for the future" unless they are needed by
the current gameplay.

Prefer the simplest implementation that solves the current problem.


## Architecture

Keep game logic independent from Phaser rendering where practical.

Game simulation/state should not depend unnecessarily on Phaser objects.

Phaser is responsible primarily for:

- Rendering
- Input
- Scenes
- Animation
- Audio

Game logic should contain:

- Animals
- Economy
- Time
- Events
- Simulation
- Game rules

## TypeScript

- Use strict TypeScript.
- Avoid `any`.
- Prefer simple types/interfaces.
- Keep functions small.
- Prefer explicit names over clever abstractions.
- Do not introduce unnecessary dependencies.

## Phaser

- Use Phaser's normal scene lifecycle.
- Avoid creating a custom engine/framework.
- Keep Phaser-specific code at the edges of game systems where practical.

## Testing

When adding or changing non-trivial game logic:

- Add or update unit tests.
- Test observable game behaviour rather than implementation details.
- Avoid tests that only verify mocks or internal implementation.
- Run the relevant tests during development.
- Run the full test suite before completing the task.
- Do not write tests purely for implementation details or to test only mocks or 
- Test observable game behaviour.

Not every trivial change requires a new test. Use judgement based on the behaviour being changed.


## Scope

Only implement what the issue asks for.

If the issue exposes a larger architectural problem:
- Prefer the smallest solution that solves the issue.
- Mention larger improvements separately.
- Do not implement speculative improvements without approval.

## Game Design

The prototype should optimize for discovering whether the game is fun,
not for production-scale architecture.

When choosing between:

A) a flexible architecture that takes 3 days

B) a simple implementation that takes 2 hours

choose B unless the architecture is required for the current gameplay.

## Definition of Done

A task is complete when:

- The requested behaviour works.
- TypeScript compiles.
- Tests pass.
- The game can still start.
- No unrelated functionality was changed.