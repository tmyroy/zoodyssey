# Zoodyssey Game Design

## Core Goal
Zoodyssey is a single-player roguelite zoo management game about building a zoo, discovering animals and balancing the needs of the zoo against limited resources.

The player should feel like they are building a unique zoo through a series of meaningful choices, rather than simply constructing the most efficient zoo possible.

The core gameplay should combine:

- Zoo management and habitat building
- Animal welfare and conservation
- Resource management
- Roguelite discovery and progression
- Meaningful trade-offs and emergent combinations

The prototype's primary goal is to determine whether this core loop is fun.

## Core Gameplay Loop

A run is divided into years.

Each year follows this general loop:

Discover → Build → Manage → Open Zoo → Simulate → Evaluate → Repeat

### 1. Discover

At the beginning of a year, the player receives a selection of cards representing potential discoveries.

Cards can contain things such as:

- Animals
- Habitat features
- Buildings
- Research
- Other zoo improvements

The player chooses a limited number of cards, creating a different set of possibilities for each run.

### 2. Build

The player uses their available resources and discoveries to build and expand their zoo.

The player decides:

- Which animals to keep
- Where to place them
- How to construct their habitats
- Which improvements to invest in
- What to prioritise with limited space and resources

### 3. Manage

Animals have different needs and habitat requirements.

The player optimises habitats to keep animals healthy and happy.

Better habitats should require meaningful decisions and trade-offs rather than simply satisfying a fixed checklist.

Animal welfare affects the performance and success of the zoo.

### 4. Open Zoo

The zoo is opened to visitors and the year's simulation begins.

During the simulation:

Visitors attend the zoo
The zoo generates income
Animals experience their habitats
Welfare is evaluated
Research and conservation progress
Other events may occur

The player should be able to see the consequences of their previous decisions.

### 5. Evaluate

At the end of the year, the player receives feedback about the zoo.

Important outcomes include:

- Visitor numbers
- Income
- Animal welfare
- Research
- Conservation

The results should make it clear what went well and what could be improved.

### 6. Repeat

The player advances to the next year and receives new discoveries.

The zoo gradually becomes more complex, while the player faces increasingly interesting choices.

A run eventually ends, resulting in a final evaluation.

## Roguelite Structure

Each run should create a different zoo and progression path.

The player does not have access to every possible animal, building or improvement from the beginning.

Instead, the player discovers new possibilities during the run.

This creates:

- Variety between runs
- Unpredictable combinations
- Strategic adaptation
- Meaningful choices about what to take and what to leave behind

The player should frequently encounter situations where they think:

> "I could build around this."

The goal is for the zoo to emerge from the player's choices rather than from following a predetermined optimal build order.

## Animals

Animals are the central objects around which the zoo is built.

Each species has different requirements and preferences.

Animal welfare is influenced by characteristics of its habitat, potentially including:

- Space
- Vegetation
- Water
- Shelter
- Enrichment
- Other species-specific requirements

Different animals should encourage different habitat designs.

The important player decision is not simply:

> "Can I afford this animal?"

but:

> "Can I build a good home for this animal with what I currently have?"

Animals should also differ in visitor appeal and conservation value.

## Resources

The prototype uses a small number of core resources.

### Money

Used for building and operating the zoo.

Money creates short-term economic constraints and trade-offs.

### Research

Represents scientific knowledge gained from operating the zoo.

Research can unlock new possibilities during a run.

### Conservation

Represents the zoo's contribution to animal conservation.

Conservation is both a progression resource and an important measure of success.

The resource system should remain simple during prototyping. Each resource should exist because it creates an interesting decision.

## Cards

Cards are the primary roguelite discovery mechanism.

A card represents something the player can add to their zoo or progression.

Examples include:

- Animals
- Habitat elements
- Buildings
- Research opportunities
- Conservation opportunities

At the beginning of a year, the player receives a selection of cards and chooses a limited number.

Cards should create interesting combinations and force the player to adapt their zoo to what they discover.

The card system should not become a generic deckbuilder. The zoo and its physical layout remain the primary focus.

### Progression

Progression happens primarily within a run.

As years pass:

- The zoo becomes larger and more complex.
- The player gains access to new discoveries.
- Animal requirements become more demanding.
- The player's available resources increase.
- Decisions become more consequential.

The prototype does not require permanent progression between runs.

## Core Design Principles
### Meaningful choices

The player should regularly have to choose between multiple desirable options.

### Trade-offs

Resources, space and opportunities should be limited enough that the player cannot simply take everything.

### Adaptation

The player should adapt their zoo to the animals, cards and circumstances they discover.

### Visible consequences

Player decisions should produce understandable consequences.

### Emergent zoos

Different runs should naturally result in different zoo layouts, animal collections and strategies.

### Simple rules, interesting interactions

Individual mechanics should be easy to understand, while their interactions create depth.

### Prototype over completeness

The game should prioritise discovering whether the core gameplay is fun over building a complete zoo-management simulation.

Do not introduce complexity unless it creates an interesting decision for the player.

## Current Prototype Focus

The prototype should answer one fundamental question:

> Is it fun to discover an animal and figure out how to build the best possible habitat for it within the constraints of the zoo?

Everything else is secondary until this is proven.

The prototype should therefore focus on:

- A small number of interesting animals
- Habitat construction
- Animal welfare
- Limited resources
- Yearly progression
- Discovery cards
- Meaningful choices
- A complete playable run

Complex simulation, large amounts of content and production-level systems are not goals of the prototype.