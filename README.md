# Riftbound Mobile

A rules-enforced mobile implementation of the Riftbound TCG with an AI opponent.

---

## Project Overview

| | |
|---|---|
| **Platform** | Mobile (React Native / Flutter) |
| **Mode** | 1v1 vs. AI Opponent |
| **Rules Enforcement** | Full — no illegal moves permitted |
| **Game Rules Version** | Core Rules 2025-06-02 |

---

## Tech Stack

> Update this section as the stack is finalized.

- **Frontend:** TBD (React Native or Flutter)
- **Game Engine:** TypeScript / Dart (platform-dependent)
- **AI:** Rule-based with heuristic evaluation
- **State:** Fully serializable game state (save/resume support)

---

## Architecture

```
/src
  /engine
    gameState.ts         # Core state types
    actions.ts           # Legal action generation
    phases.ts            # Turn phase logic
    combat.ts            # Combat and damage assignment
    chain.ts             # Chain and priority logic
    showdown.ts          # Showdown logic
    cleanup.ts           # Cleanup step logic
    scoring.ts           # Point scoring logic
    keywords.ts          # Keyword implementations
    layers.ts            # Layer-based effect ordering
    ai.ts                # AI decision logic
  /data
    cards.ts             # Card definitions
    runes.ts             # Rune definitions
    legends.ts           # Legend definitions
    battlefields.ts      # Battlefield definitions
  /ui
    ...                  # Mobile UI components (separate from engine)
```

**Core Principles:**

- Game logic is fully decoupled from the UI
- The engine exposes a legal actions interface; the UI and AI call into it
- Game state is serializable at all times
- All rule enforcement lives in the engine, not the UI

---

## Getting Started

```bash
# Clone the repo
git clone <repo-url>
cd riftbound-mobile

# Install dependencies
npm install

# Run (development)
npm run start
```

---

## Game Rules Reference

### Golden Rule

Card text supersedes rules text. If a card directly contradicts a rule, the card wins.

### Silver Rule

Card text uses different terminology than rules text. Interpret card text through the lens of the rules, not literally as rules text.

> When a card says "card" in its effects, it means **Main Deck card**. Runes, Legends, and Battlefields are not "cards" in that context (though they are for deck building purposes).

---

### Deck Construction

Each player provides:

| Component | Requirement |
|---|---|
| Champion Legend | 1. Defines Domain Identity. Placed in Legend Zone at game start. |
| Main Deck | Minimum 40 cards (Units, Gear, Spells). Includes exactly 1 Chosen Champion. |
| Rune Deck | Exactly 12 Rune cards matching Domain Identity. |
| Battlefields | 3 provided; 1 randomly selected per game. |

**Domain Identity:** All Main Deck cards must match the Champion Legend's Domain Identity. Cards with multiple Domains are only permitted in decks whose identity contains ALL of those Domains.

**Copy Limits:**

- Max 3 copies of any named card (including Chosen Champion).
- Max 3 total Signature cards; all must share the Champion Legend's tag.
- Cards with different names representing the same character are treated as different cards.

**Chosen Champion:**

- Must be a Champion-type unit with a tag matching the Champion Legend's tag.
- Placed in the Champion Zone at game start (not shuffled into the Main Deck).
- Up to 2 additional copies may still be in the Main Deck.

---

### Zones

| Zone | Privacy | Notes |
|---|---|---|
| Main Deck Zone | Secret | Not viewable unless an effect instructs. |
| Rune Deck Zone | Secret | Not viewable unless an effect instructs. |
| Hand | Private | Owner only. Count is public. |
| Board (Base, Battlefields) | Public | All face-up permanents and runes. |
| Facedown Zone | Private | Controller only. Max 1 card per Battlefield. |
| Legend Zone | Public | Cannot be removed or moved. |
| Champion Zone | Public | Chosen Champion placed here at start. |
| Trash | Public | Face-up, unordered. Per player. |
| Banishment | Public | Unordered. Per player. |

**Zone Change Rule:** When a Game Object moves to or from a Non-Board Zone, all temporary modifications (damage, buffs, keywords) are cleared.

---

### Domains

| Domain | Color |
|---|---|
| Fury | Red |
| Calm | Green |
| Mind | Blue |
| Body | Orange |
| Chaos | Purple |
| Order | Yellow |

---

### Card Types

#### Units

- Permanent. Remain on board after played.
- Have Tags, Might (combat stat), and track damage.
- Enter the board **exhausted** (unless Accelerate is paid).
- Can perform a **Standard Move** action.
- Killed when damage marked ≥ Might.

#### Gear

- Permanent. Remain on board after played.
- Can only be played to the controller's **Base**.
- Enter the board **Ready**.
- Recalled to Base during next Cleanup if found at a Battlefield.

#### Spells

- Non-permanent. Resolve then go to Trash.
- Playable during Open States on the controller's turn (unless modified by Action/Reaction).
- Resolve top-to-bottom. Nothing may intercede mid-resolution.

#### Runes

- Not Main Deck cards; not Permanents.
- Exactly 12 in the Rune Deck.
- Channeled (not played) during the Channel Phase.
- Produce Energy and/or Power.
- Recycled back to Rune Deck (not Main Deck).

**Basic Rune Abilities:**

1. `[T]: Add [1]` — Add 1 Energy.
2. `Recycle this: Add [C]` — Add 1 Power of the Rune's Domain.

#### Battlefields

- Set up at game start. Not played during the game.
- Are Locations. Can have Passive and Triggered Abilities.
- Cannot be Killed or Moved during regular play.
- Control established by unit presence.

#### Legends

- Set up at game start in the Legend Zone. Cannot leave it.
- Cannot be Killed or Moved.
- Can have Passive, Triggered, and Activated Abilities.
- Define the deck's Domain Identity.

#### Tokens

- Created by spells/abilities during play.
- Have a type, Might, and optional tags. No cost, no domain.
- Cease to exist immediately if they would move to a Non-Board Zone.

---

### Resources

**Energy:** Numeric, no domain. Pays numeric costs.

**Power:** Domain-specific. Pays domain-associated costs. Some Power is Universal.

**Rune Pool:** Conceptual pool of available Energy and Power.

- Empties at the end of the Draw Phase.
- Empties at the end of each turn's Expiration Step.
- Unspent resources are lost.

---

### Turn Structure

```
1. Awaken Phase
   └─ Ready all Game Objects the Turn Player controls.

2. Beginning Phase
   ├─ Beginning Step     "At start of Beginning Phase" effects trigger.
   └─ Scoring Step       Holding (controlling a Battlefield) is scored here.

3. Channel Phase
   └─ Turn Player channels 2 Runes from the Rune Deck.

4. Draw Phase
   ├─ Turn Player draws 1 card. Burn Out if deck is empty.
   └─ Rune Pool empties.

5. Action Phase
   ├─ Turn Player takes any number of Discretionary Actions.
   ├─ Combats and Showdowns occur here as triggered by actions.
   └─ Turn Player declares end of turn when done.

6. End of Turn Phase
   ├─ Ending Step        "At end of turn" effects trigger.
   ├─ Expiration Step    Clear damage. Expire "this turn" effects. Empty Rune Pools.
   └─ Cleanup Step       Perform a Cleanup.
```

---

### States of the Turn

| State | Chain Exists? | Showdown Active? |
|---|---|---|
| Neutral Open | No | No |
| Neutral Closed | Yes | No |
| Showdown Open | No | Yes |
| Showdown Closed | Yes | Yes |

- **Neutral Open:** Only Turn Player may play cards/abilities.
- **Closed State (any):** Only cards/abilities with **Reaction** may be played.
- **Showdown State (open):** Only cards/abilities with **Action** or **Reaction** may be played.

---

### Priority and Focus

**Priority:** Permission to take Discretionary Actions.

- Held by the Turn Player during Neutral Open.
- Passes to the next Relevant Player in Turn Order when passed.

**Focus:** Permission to act during a Showdown Open State.

- Gained by the player who caused the Contested status when a Showdown begins.
- Passing Priority in a Showdown retains Focus.
- Passes to the next Relevant Player when the last Chain item resolves.

---

### Cleanup

Performed after: Chain item resolves, Move completes, Showdown completes, Combat completes.

1. Kill units with damage ≥ Might; place in owner's Trash.
2. Remove Attacker/Defender status from units no longer at a combat Battlefield.
3. Evaluate all "While" / "As long as" state-based effects.
4. Remove Hidden cards from Battlefields the controlling player no longer has units at.
5. Mark Combat as **Pending** at any Battlefield with units from two opposing players.
6. If Neutral Open and a Battlefield is Contested with no controller → begin a Showdown.
7. If Neutral Open and Combat is Pending → Turn Player chooses one; begin Combat.

---

### The Chain

The Chain is a temporary zone created whenever a card is played or ability activated.

- Exists as long as a card or ability is on it. Only one Chain at a time.
- Chain existing = **Closed State**.
- Items resolve last-in, first-out.
- Permanents resolve immediately with no priority window.
- Spells linger; opponents may play Reactions before resolution.

**Resolving:**

1. All Relevant Players must pass in sequence before the Chain resolves.
2. Resolve the last item; place in appropriate zone.
3. Trigger "when played" triggered abilities.
4. Perform a Cleanup.
5. Repeat until Chain is empty.

---

### Showdowns

A structured window where Relevant Players alternate playing Action/Reaction cards.

**Opens when:**

- Units move to a Battlefield causing it to become Contested (as part of Combat, or standalone if the Battlefield is uncontrolled).

**Flow:**

1. Player who caused Contested status gains Focus.
2. Define Relevant Players.
3. If part of Combat, create an Initial Chain from "When I attack" / "When I defend" triggers.
4. Players alternate: play a spell, activate an ability, Invite a player, or Pass.
5. When all Relevant Players pass in sequence → Showdown ends. Perform Cleanup.

---

### Combat

Occurs during Cleanup when a Battlefield has units from exactly two opposing players and no Chain exists.

#### Step 1: Showdown Step

- Determine **Attacker** (applied Contested status) and **Defender**.
- Modulate Might: Assaulting attackers get +Assault Value; Shielded defenders get +Shield Value.
- Create Initial Chain if "When I attack" / "When I defend" triggers exist.
- Showdown proceeds.

#### Step 2: Combat Damage Step

- Only if both Attackers and Defenders remain after the Showdown.
- Sum Attacker Might → distributed to Defenders.
- Sum Defender Might → distributed to Attackers.
- Starting with the Attacker, distribute damage:
  - **Tank** units must receive Lethal Damage before non-Tank units.
  - A unit must receive Lethal Damage before damage moves to the next unit.
  - **Stunned** units don't contribute Might to damage but still need Lethal Damage to die.

#### Step 3: Resolution Step

1. Remove units with Lethal Damage → Trash.
2. If both sides survive → Attacking units Recalled to Base.
3. If no Defenders remain but Attackers do → **Conquer**. Control changes.
4. Clear Contested status and all marked damage.
5. Perform a Cleanup.

---

### Scoring

**Two methods:**

- **Hold:** Control a Battlefield during your Beginning Phase Scoring Step.
- **Conquer:** Gain control of a Battlefield you haven't scored this turn.

A player may only score each Battlefield once per turn.

**The Final Point (at 7 points, Victory Score 8):**

- Score via **Hold** → earn the Final Point.
- Score via **Conquer** AND scored ALL Battlefields this turn → earn the Final Point.
- Score via **Conquer** but NOT all Battlefields → draw a card instead.

A player wins immediately upon reaching the Victory Score.

---

### Movement

- Only Units can Move.
- Moving is instantaneous. No in-between state.
- Does not use the Chain. Cannot be Reacted to.
- Perform a Cleanup after every Move.

**Standard Move (Discretionary):**

- Cost: Exhaust the unit(s).
- Legal destinations:
  - Base → Battlefield (if not already occupied by units from 2 other players).
  - Battlefield → Base.
  - Battlefield → Battlefield (only with **Ganking**).

**Recalls:**

- Not a Move. Cannot be prevented by Movement-blocking effects.
- Do not trigger Move-triggered abilities.

---

### Playing a Card — Process

1. Remove card from its zone; place on the Chain.
2. Make all choices (targets, locations, "As I am played" decisions). Locked in after this step.
3. Determine Total Cost (apply ignores, additional costs, increases, discounts in order).
4. Pay costs (Energy, Power, non-standard costs). Add Reactions may be used here.
5. Check legality of all choices and resulting game state.
6. Resolve by type:
   - **Permanent:** Enters Board immediately. No priority window.
   - **Spell:** Lingers on Chain. Opponents may play Reactions.

**Targeting:** If a target becomes invalid before the spell resolves (changes zones, no longer meets requirements), that instruction is skipped. The spell still resolves for remaining valid instructions.

---

### Burn Out

Triggered when a player attempts to draw, look at, or access an empty Main Deck.

1. Shuffle Trash into Main Deck.
2. Choose an opponent to gain 1 Point.
3. Complete the original action.

---

### Buffs

- Each Buff counter = +1 Might to the unit.
- A unit can only have one Buff counter at a time.
- Removed when the unit leaves the Board.

---

### Mighty

- A unit **is Mighty** when its current Might ≥ 5.
- On the board: use current Might. In Non-Board Zones: use printed Might.

---

### Keywords

| Keyword | Type | Summary |
|---|---|---|
| **Accelerate** | Optional Cost | Pay 1[C] (matching unit's Domain) when playing this unit to enter Ready instead of Exhausted. |
| **Action** | Permission | Can be played/activated during Showdowns on any player's turn. |
| **Assault [X]** | Passive | While attacking, this unit has +X Might. Multiple sources stack. |
| **Deathknell** | Triggered | When this permanent is killed and sent to Trash, [Effect] triggers. |
| **Deflect [X]** | Passive | Opponent spells/abilities that choose this permanent cost X more Power (any Domain). Multiple sources stack. |
| **Ganking** | Passive | This unit may move from one Battlefield to another with its Standard Move. |
| **Hidden** | Discretionary Action | Pay [C] (deck's Domain Identity) to hide this facedown at a Battlefield you control. Next turn: gains Reaction, may be played free from that Battlefield only. |
| **Legion** | Conditional | If you have played another Main Deck card earlier this turn, apply [Text]. All Legion conditions satisfied by a single prior play. |
| **Reaction** | Permission | All Action permissions, plus: can be played/activated during Closed States on any player's turn. |
| **Shield [X]** | Passive | While defending, this unit has +X Might. Multiple sources stack. |
| **Tank** | Passive | Must be assigned Lethal Damage before non-Tank units with the same controller in combat. |
| **Temporary** | Triggered | At the start of this permanent's controller's Beginning Phase (before scoring), kill this. |
| **Vision** | Triggered | When played, look at the top card of your Main Deck. You may recycle it. |

---

### Layers (Effect Application Order)

When multiple effects modify the same Game Object, apply in this order:

1. **Trait-Altering** — Name, Type, Tags, Controller, Cost, Domain, Might assignment.
2. **Ability-Altering** — Keywords, Passive Abilities, appended/removed rules text.
3. **Arithmetic** — Increases and decreases to Might, Energy Cost, Power Cost.

Within a layer: apply in **dependency order** if effects depend on each other; otherwise apply in **timestamp order** (oldest first).

---

### 1v1 Duel Mode (Sanctioned)

| Setting | Value |
|---|---|
| Players | 2 |
| Victory Score | 8 Points |
| Battlefields | 2 (each player provides 3; 1 randomly selected; others removed) |
| Format | Best of 1 |
| First Turn Adjustment | Player going second channels 1 extra Rune during their first Channel Phase |

**Setup:**

1. Each player places their Champion Legend in the Legend Zone.
2. Each player places their Chosen Champion in the Champion Zone.
3. Each player randomly selects 1 of their 3 Battlefields for the Battlefield Zone.
4. Shuffle Main Decks and Rune Decks; place in their zones.
5. Determine Turn Order (any fair random method).
6. Each player draws 4 cards.
7. Mulligan (in Turn Order): choose up to 2 cards to set aside → draw that many → recycle the set-aside cards.
8. First Player begins.

---

### AI Opponent

The AI uses only the legal actions interface — no access to hidden information unless an in-game effect grants it.

**Decision flow:**

1. Query engine for all legal actions.
2. Evaluate board state with a scoring heuristic.
3. Select the highest expected-value action.

**Difficulty levels:**

| Level | Behavior |
|---|---|
| Easy | Random legal moves, no lookahead. |
| Medium | Greedy evaluation of immediate board advantage. |
| Hard | Multi-turn planning with light simulation. |

---

### Engine Interface (Contract)

```typescript
interface GameState {
  turnPlayer: PlayerId;
  phase: Phase;
  chainState: "Open" | "Closed";
  showdownState: "Neutral" | "Showdown";
  priorityHolder: PlayerId | null;
  focusHolder: PlayerId | null;
  players: Map<PlayerId, PlayerState>;
  board: BoardState;
  chain: ChainItem[];
  pendingCombats: BattlefieldId[];
}

interface PlayerState {
  hand: Card[];           // Private
  mainDeck: Card[];       // Secret
  runeDeck: Rune[];       // Secret
  trash: Card[];          // Public
  banishment: Card[];     // Public
  runePool: {
    energy: number;
    power: Map<Domain, number>;
  };
  points: number;
  legend: Legend;
  chosenChampion: Unit;
}

function getLegalActions(state: GameState, playerId: PlayerId): Action[];
function applyAction(state: GameState, action: Action): GameState;
function isGameOver(state: GameState): { over: boolean; winner: PlayerId | null };
```

---

## Contributing

> Add contribution guidelines here as the project develops.

---

## License

> Add license here.
