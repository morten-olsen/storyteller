# Storyteller: Adversarial Narrative Game — Design Document

## Core Concept

An adversarial storytelling game where a user and an AI each have secret narrative objectives. Both contribute to a shared story, turn by turn, each trying to steer it toward their own desired outcome. The game rewards compelling, coherent storytelling — not just "winning."

## Design Decisions

### 1. Turn Structure

Paragraph exchange. Each side writes a paragraph per turn with a **character limit** that scales with difficulty. The limit should allow vivid, descriptive writing but prevent narrative leapfrogging.

### 2. Objectives

Each side receives a **set of narrative checkpoints** — specific story conditions that must be fulfilled (e.g. "The knight must survive", "The kingdom must fall", "It must feel tragic").

- Easy: single goal
- Hard: multiple non-linear checkpoints the story must pass through

### 3. Objective Visibility

Scales with difficulty:

- **Easy**: full visibility of the AI's objectives
- **Medium**: hints about the AI's direction
- **Hard**: AI objectives fully hidden

### 4. Scoring

**Asymmetric scoring model.** Only the user is scored — the AI is not a competing player but an adversarial environment (closer to a dungeon master than an opponent). This avoids LLM self-bias, where a model scoring prose quality would inherently favor AI-generated text over human text.

**User scoring** — per-turn **+/- scorecard** across multiple dimensions:

- **Goal progress**: are you advancing toward your checkpoints?
- **Story coherence**: does your contribution follow logically from what came before?
- **Prose quality**: is the writing compelling, vivid, well-crafted?
- **Adaptation**: how gracefully did you respond to the AI's steering?

**AI constraints** — the AI earns no storytelling points. It is only penalized for rule-breaking (coherence violations, ignoring established narrative, etc.). The AI "wins" by fulfilling its checkpoints, not by out-scoring the user.

The user's final score is the cumulative total across all turns. A positive score means you told a good story regardless of whether you "won." This normalizes scores across different story lengths, making any two games directly comparable.

### 5. Coherence Enforcement

None. The game is fully permissive — players can write anything. Incoherent or nonsensical contributions are punished through **score penalties**, not rejection. Score impact is shown immediately so players learn fast.

### 6. Story Initialization

A single open text prompt. The user can:

- Provide a detailed world with characters and setting
- Give a simple theme ("pirates")
- Skip entirely, giving the AI a blank slate

The AI builds from whatever it receives.

### 7. End Conditions

The story ends when **all checkpoints from both sides have been fulfilled**. After that, one final "closing chapter" turn allows both sides to wrap up the narrative gracefully — a last chance to score storytelling points.

This means story length is emergent:

- Short games when objectives align or one side dominates
- Long games when objectives conflict and both sides block each other

### 8. AI Persona

The AI opponent has a configurable **storytelling personality** that shapes how it pursues its objectives. Implemented as a system prompt variation.

- **Presets**: e.g. "The Dramatist", "The Trickster", "The Poet"
- **Random**: AI picks a persona per session for surprise
- Persona visibility can scale with difficulty (visible on easy, hidden on hard)

### 9. Difficulty

A single difficulty setting controls multiple levers:

| Lever              | Easy              | Medium         | Hard                    |
|--------------------|-------------------|----------------|-------------------------|
| Character limit    | Generous          | Moderate       | Tight                   |
| Objectives         | Single goal       | Few checkpoints| Multiple non-linear     |
| AI visibility      | Full              | Hints          | Hidden                  |
| AI persona visible | Yes               | Partially      | No                      |
