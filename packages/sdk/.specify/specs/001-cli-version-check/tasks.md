# Tasks: CLI Version Check

**Input**: Design documents from `../`
**Prerequisites**: plan.md, spec.md

## Phase 1: Setup

**Purpose**: Project initialization and basic structure

- [X] T001 [P] Create new files `src/cli/version-check.ts` and `src/cli/version-check.test.ts`

---

## Phase 2: User Story 1 - Inform User of Outdated CLI Version (Priority: P1) 🎯 MVP

**Goal**: Notify the user when their installed version of the CLI is outdated.

**Independent Test**: Can be tested by running a CLI command with an outdated version and verifying that a notification is displayed.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T002 [US1] Write unit tests in `src/cli/version-check.test.ts` for the following scenarios:
    - An outdated version is detected.
    - The current version is the latest.
    - The npm registry is unreachable.
    - The npm registry returns a malformed response.

### Implementation for User Story 1

- [X] T003 [US1] Implement the version check logic in `src/cli/version-check.ts`. This includes:
    - Fetching the latest version from `https://registry.npmjs.org/@monolayer/sdk/latest`.
    - Getting the current version from `package.json`.
    - Comparing the versions.
    - Formatting the notification message.
- [X] T004 [US1] Integrate the version check logic into the main CLI entry point in `src/bin/cli.ts` to be called before any command is executed.

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T005 [P] Review and refactor the code for clarity, performance, and adherence to the coding standards.
- [X] T006 [P] Validate the feature manually by following the steps in `quickstart.md`.

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: Can start immediately.
- **User Story 1 (Phase 2)**: Depends on Setup completion.
- **Polish (Phase 3)**: Depends on User Story 1 completion.

### Within User Story 1

- Tests (T002) MUST be written and FAIL before implementation (T003).
- Implementation (T003) must be complete before integration (T004).
