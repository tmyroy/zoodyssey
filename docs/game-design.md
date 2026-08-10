# Zoodyssey Game Design

## Core Goal

Zoodyssey is a single-player roguelite deckbuilder about building a zoo. Over a run, the player drafts cards into a deck, draws from that deck each year, and spends money to play cards that become animals, habitats and staff in their zoo.

The player should feel like they are building a unique zoo through a series of meaningful choices, rather than simply constructing the most efficient zoo possible.

The core gameplay should combine:

- Deckbuilding: drafting cards, managing a limited deck and a limited draw
- Zoo management and habitat building
- Animal welfare and conservation
- Resource management
- Meaningful trade-offs and emergent combinations

The prototype's primary goal is to determine whether this core loop is fun.

## Core Gameplay Loop

A run is divided into years.

Each year follows this general loop:

Discover → Draw → Build → Manage → Open Zoo → Simulate → Evaluate → Repeat

### 1. Discover

At the beginning of a year, the player is offered a small selection of cards, drawn from the wider card pool. The player chooses a limited number of cards to add to their deck.

Rarer cards appear less often than common ones (see [Rarity](#rarity)).

### 2. Draw

The player draws a limited number of cards from their deck into their hand for the year (see [The Deck and Draw](#the-deck-and-draw)). This is what the player actually has available to play this year — not their whole deck.

### 3. Build

The player spends money to play cards from their hand into the zoo:

- Habitat cards become a habitat of a given size (and possibly biome) in the zoo.
- Animal cards become an animal, placed into a habitat that satisfies its space and biome needs.
- Vegetation cards rework an existing habitat's biome.
- Building and Staff cards add lasting facilities and employees to the zoo.

Played cards are spent — see [One-Time vs. Deck Cards](#one-time-vs-deck-cards). The player decides what's worth playing now, what to save, and what to leave unplayed if they can't afford it or don't yet have a use for it.

### 4. Manage

Animals have space and biome needs, plus welfare that responds to how well their habitat and amenities suit them.

The player optimises habitats to keep animals healthy and happy. Better habitats should require meaningful decisions and trade-offs, not just satisfying a fixed checklist.

Animal welfare affects the performance and success of the zoo.

### 5. Open Zoo

The zoo is opened to visitors and the year's simulation begins.

During the simulation:

- Visitors attend the zoo
- The zoo generates income, driven by each animal's visitor appeal and welfare
- Animals experience their habitats
- Welfare is evaluated
- Research and conservation progress
- Other events may occur

The player should be able to see the consequences of their previous decisions.

### 6. Evaluate

At the end of the year, the player receives feedback about the zoo.

Important outcomes include:

- Visitor numbers
- Income
- Animal welfare
- Research
- Conservation

The results should make it clear what went well and what could be improved.

### 7. Repeat

The player advances to the next year, draws again, and receives new discoveries.

The zoo and the deck both gradually become larger and more complex, while the player faces increasingly interesting choices.

A run eventually ends, resulting in a final evaluation.

## Roguelite Structure

Each run should create a different zoo, a different deck, and a different progression path.

The player does not have access to every possible animal, building or improvement from the beginning. Instead, the player discovers new possibilities during the run and chooses which ones to add to their deck.

This creates:

- Variety between runs
- Unpredictable combinations
- Strategic adaptation
- Meaningful choices about what to take and what to leave behind

The player should frequently encounter situations where they think:

> "I could build around this."

The goal is for the zoo to emerge from the player's choices rather than from following a predetermined optimal build order.

## Cards

Cards are the primary roguelite discovery mechanism, and the deck they form is a real deckbuilding layer, not just a list of unlocks. Drafting a card adds it to the deck; playing a card from hand is what makes its effect real in the zoo.

### Card Types

- **Habitat** — an empty enclosure of a given size (1-5) and, optionally, a biome (e.g. Arctic, Savannah). Playing one places that habitat in the zoo, ready for an animal.
- **Vegetation** — reworks an existing habitat's biome (e.g. "Arctic Vegetation" converts a habitat to the Arctic biome). Cost scales with the size of the habitat being reworked.
- **Animal** — a species with a space requirement (1-5), a biome requirement, and stats for visitor appeal, conservation value and research value. Can only be played into a habitat that satisfies its space and biome needs.
- **Building** — zoo infrastructure (a research lab, a veterinary clinic, a gift shop) that provides an ongoing effect once built — boosting welfare, research, income or conservation, sometimes for specific animals or biomes.
- **Staff** — an employee who provides an ongoing bonus once hired (e.g. faster research, better animal care).

### Rarity

Every card has a rarity: **common**, **rare**, **epic** or **legendary**. Rarity determines how often a card shows up in the discovery offer — commons are frequent and cheap, legendaries are rare, powerful, and often build-defining. A run's deck should mostly be commons, punctuated by a handful of rares and, occasionally, something special.

### One-Time vs. Deck Cards

Most cards are **one-time**: playing one consumes the card and turns it into something real in the zoo — a placed habitat, a placed animal, a hired staff member, a built facility. Once played, that card is gone from the deck for the rest of the run.

A small number of cards are **persistent deck cards**: they are never played away and always remain in the deck, redrawn again and again. These represent recurring baseline overhead — small costs or nuisances that take up a draw slot and/or cost money every time they come up. They create deckbuilding tension: a lean, thinned deck draws better hands than a bloated one.

### The Deck and Draw

The deck is everything the player has drafted and not yet played. Each year, the player draws a limited hand from the deck — not the whole deck — which is what's actually available to spend money on and play that year.

This makes "how many cards you draw" and "how big and clean your deck is" a real resource the player manages across the run, alongside money, research and conservation.

## Habitats

Habitats are no longer built by hand-painting individual grid tiles. Instead, a Habitat card creates a discrete habitat with two properties:

### Size

Habitats come in five sizes: Tiny (1), Small (2), Medium (3), Large (4) and Huge (5). An "Empty Habitat" card of a given size costs that many money to play (e.g. Tiny costs 1, Huge costs 5).

An animal can only be placed into a habitat whose size satisfies the animal's own space requirement (also 1-5).

### Biome

A habitat may also have a biome (e.g. Arctic, Savannah, Wetland, Temperate Forest). Some Habitat cards come with a biome already set (e.g. "Arctic Habitat Medium (3)"); a plain "Empty Habitat" has none.

Vegetation cards rework an existing habitat's biome after the fact (e.g. "Arctic Vegetation" costs 1 money per point of the habitat's size, and sets its biome to Arctic).

An animal can only be placed into a habitat whose biome matches the animal's own biome requirement.

## Animals

Animals are the central objects around which the zoo is built, and should be the game's big dopamine moments — a great animal card should feel like a discovery worth planning a habitat around, not just another line item.

Each animal has:

- A **space requirement** (1-5), matched against the habitat it's placed in.
- A **biome requirement**, matched against the habitat's biome.
- **Visitor appeal**, **conservation value** and **research value** ratings.

Welfare, driven by how well the habitat and its amenities suit the animal, then modifies how much of that appeal/conservation/research value the animal actually delivers each year.

The important player decision is not simply:

> "Can I afford this animal?"

but:

> "Can I build a good home for this animal with what I currently have?"

## Resources

The prototype uses a small number of core resources.

### Money

Used to play cards — building habitats, placing animals, reworking biomes, hiring staff, constructing buildings.

Costs are small, stylised numbers (e.g. "3 money for a Medium habitat"), not a simulation of a real zoo budget. Money creates short-term constraints and trade-offs.

### Research

Represents scientific knowledge gained from operating the zoo. Research can unlock new possibilities during a run.

### Conservation

Represents the zoo's contribution to animal conservation. Conservation is both a progression resource and an important measure of success.

### Cards

The deck itself is a resource: how many cards the player has drafted, how many they draw each year, and how much baseline overhead dilutes their draws. A player who thins their deck and drafts with focus should draw better hands than one who takes everything offered.

Each resource should exist because it creates an interesting decision.

## Core Design Principles

### Meaningful choices

The player should regularly have to choose between multiple desirable options — both in the discovery offer and in what to play from a limited hand.

### Trade-offs

Resources, deck space, draw size and opportunities should be limited enough that the player cannot simply take and play everything.

### Adaptation

The player should adapt their zoo to the animals, cards and circumstances they discover. A zoo built around wetland birds and a zoo built around great apes should feel like genuinely different runs.

### Visible consequences

Player decisions should produce understandable consequences.

### Emergent zoos

Different runs should naturally result in different decks, zoo layouts, animal collections and strategies.

### Simple rules, interesting interactions

Individual mechanics should be easy to understand, while their interactions create depth.

### Prototype over completeness

The game should prioritise discovering whether the core gameplay is fun over building a complete zoo-management simulation or a fully generalised deckbuilder.

Do not introduce complexity unless it creates an interesting decision for the player.

## Current Prototype Focus

The prototype should answer one fundamental question:

> Is it fun to draft and play cards to build a zoo, discovering an animal and figuring out how to build the best possible home for it within the constraints of a limited deck and hand?

Everything else is secondary until this is proven.

The prototype should therefore focus on:

- A small number of interesting animals, habitats, buildings and staff
- Card-driven habitat construction (size and biome, not manual tile painting)
- A real deck: drafting, a limited yearly draw, one-time vs. persistent cards
- Animal welfare
- Limited resources, including the deck itself
- Yearly progression
- Meaningful choices
- A complete playable run

Complex simulation, large amounts of content and production-level systems are not goals of the prototype.
