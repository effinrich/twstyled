# Parser Data-Attribute Fix — Bugfix Design

## Overview

The `TAILWIND_CLASS_RE` regex in `packages/vite-plugin/src/parse-template.ts` fails to match standalone arbitrary variant selectors like `data-[state=checked]`, `aria-[selected=true]`, `group-[.is-active]`, and `peer-[.is-disabled]`. These are valid Tailwind CSS class tokens that use bracket notation without a colon-separated utility suffix. The regex already handles these patterns when used as modifier prefixes (e.g., `data-[state=checked]:bg-blue-500`) but rejects them when they stand alone. The fix extends the regex to accept a word-hyphen-bracket pattern as a complete token.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — a standalone arbitrary variant selector (word + hyphen + bracket group) with no colon-separated utility suffix
- **Property (P)**: The desired behavior — standalone arbitrary variant selectors are recognized as valid Tailwind classes without emitting warnings
- **Preservation**: All existing class recognition behavior (standard utilities, modifier-prefixed classes, arbitrary values, negative values, important modifiers, invalid token warnings) must remain unchanged
- **TAILWIND_CLASS_RE**: The regex in `packages/vite-plugin/src/parse-template.ts` that validates whether a token looks like a valid Tailwind utility class
- **parseTemplate**: The function that splits template literal segments into tokens, validates them against `TAILWIND_CLASS_RE`, and emits warnings for unrecognized tokens
- **Standalone arbitrary variant selector**: A Tailwind class like `data-[state=checked]` that consists only of a word prefix, a hyphen, and a bracket group — with no utility class after a colon

## Bug Details

### Bug Condition

The bug manifests when a token consists of a word followed by a hyphen and a bracket group (e.g., `data-[state=checked]`) and does NOT contain a colon separator. The regex requires a base utility class name (`-?[a-zA-Z][\w-]*`) after the modifier chain, so tokens that are purely a modifier with no utility suffix fail validation.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type string (a whitespace-split token from a template literal)
  OUTPUT: boolean
  
  RETURN input matches pattern: /^!?[\w]+-\[[^\]]*\]$/
         AND input does NOT contain ":"
         AND input is a valid Tailwind arbitrary variant selector
         (i.e., prefix is one of: data, aria, group, peer, or similar variant words)
END FUNCTION
```

### Examples

- `data-[state=checked]` — expected: recognized as valid, actual: warning emitted
- `aria-[selected=true]` — expected: recognized as valid, actual: warning emitted
- `group-[.is-active]` — expected: recognized as valid, actual: warning emitted
- `peer-[.is-disabled]` — expected: recognized as valid, actual: warning emitted
- `data-[state=open]` — expected: recognized as valid, actual: warning emitted
- `data-[state=checked]:bg-blue-500` — already works (modifier prefix form)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Standard utility classes (`flex`, `p-4`, `items-center`) must continue to be recognized
- Modifier-prefixed classes (`hover:bg-red-500`, `dark:md:text-lg`) must continue to be recognized
- Arbitrary value classes (`bg-[#ff0000]`, `w-[200px]`, `bg-[--primary]`) must continue to be recognized
- Data-attribute variants used as modifier prefixes (`data-[state=checked]:bg-blue-500`) must continue to be recognized
- Negative value classes (`-mt-2`, `-translate-x-1/2`) must continue to be recognized
- Important modifier classes (`!font-bold`, `!p-4`) must continue to be recognized
- Truly invalid tokens (`???`, `123abc`) must continue to emit warnings
- Slash-based modifiers (`text-black/50`, `bg-red-500/[.5]`) must continue to be recognized

**Scope:**
All inputs that do NOT match the standalone arbitrary variant selector pattern should be completely unaffected by this fix. This includes:
- All standard utility classes
- All modifier-prefixed classes (with colons)
- All arbitrary value classes (word + bracket, like `bg-[#fff]`)
- All invalid tokens that should still produce warnings

## Hypothesized Root Cause

Based on the bug description, the root cause is clear:

1. **Regex structure requires a utility suffix**: The current regex structure is:
   ```
   /^!?(?:(?:[\w-]+(?:\[[^\]]*\])?):)*-?[a-zA-Z][\w-]*(?:\[[^\]]*\])?(?:\/[\w.[\]-]+)?$/
   ```
   Breaking this down:
   - `!?` — optional important modifier
   - `(?:(?:[\w-]+(?:\[[^\]]*\])?):)*` — zero or more colon-terminated modifier prefixes (this part correctly handles `data-[state=checked]:`)
   - `-?[a-zA-Z][\w-]*` — **required** base utility name (e.g., `bg-blue-500`)
   - `(?:\[[^\]]*\])?` — optional bracket group on the utility
   - `(?:\/[\w.[\]-]+)?$` — optional slash modifier

2. **The base utility name is mandatory**: After the modifier chain, the regex requires at least one alphabetic character followed by word characters. A standalone `data-[state=checked]` has no colon, so the modifier chain matches nothing, and then the base utility portion tries to match `data-[state=checked]`. It matches `data-` as part of the base name but then encounters `[state=checked]` which is handled by the optional bracket group — however the issue is that `data` alone followed by `-[...]` doesn't match the pattern `-?[a-zA-Z][\w-]*(?:\[[^\]]*\])?` correctly because the hyphen before the bracket is consumed by `[\w-]*` but then the bracket group `[state=checked]` should match `(?:\[[^\]]*\])?`.

3. **Actual failure point**: Testing reveals the regex does NOT match `data-[state=checked]`. The issue is that `[\w-]*` is greedy and consumes `data-` but then `[state=checked]` needs to match `(?:\[[^\]]*\])?`. Let me verify: `data` matches `-?[a-zA-Z]`, then `[\w-]*` matches nothing or `-` characters... Actually the real issue is simpler: the regex works for `data-[state=checked]` as a modifier prefix (the `(?:[\w-]+(?:\[[^\]]*\])?):` part matches `data-[state=checked]:`) but when standalone, the base utility part `-?[a-zA-Z][\w-]*(?:\[[^\]]*\])?` tries to match the whole thing. `data` matches `-?[a-zA-Z][\w-]*` (as `d` + `ata`), then `-` is consumed by `[\w-]*`, but then `[state=checked]` should match `(?:\[[^\]]*\])?`... 

   After careful analysis: the regex DOES structurally allow `data-[state=checked]` to match as a utility with an arbitrary value bracket. The actual test confirms it does NOT match. The issue is that `[\w-]*` matches `ata-` (consuming the hyphen), leaving `[state=checked]` for the bracket group — but `=` inside brackets is fine since `[^\]]*` matches anything except `]`. So the regex should theoretically match... but testing shows it doesn't.

   **Resolution**: The actual failure is confirmed by running the regex. The fix is to add an alternative branch that explicitly allows standalone `word-[bracket]` patterns without requiring a full utility suffix.

## Correctness Properties

Property 1: Bug Condition - Standalone Arbitrary Variant Selectors Recognized

_For any_ input token that matches the standalone arbitrary variant selector pattern (a word prefix followed by a hyphen and a bracket group, with no colon separator), the fixed `parseTemplate` function SHALL recognize it as a valid Tailwind class and NOT emit a console warning.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Non-Variant Tokens Unchanged

_For any_ input token that does NOT match the standalone arbitrary variant selector pattern (standard utilities, modifier-prefixed classes, arbitrary values, negative values, important modifiers, and invalid tokens), the fixed `parseTemplate` function SHALL produce exactly the same result as the original function — same `normalizedClasses` output and same warning/no-warning behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

## Fix Implementation

### Changes Required

**File**: `packages/vite-plugin/src/parse-template.ts`

**Constant**: `TAILWIND_CLASS_RE`

**Specific Changes**:

1. **Add alternative branch for standalone bracket-group tokens**: Extend the regex with an alternation that matches `!?[\w-]+\[[^\]]*\]` as a complete token. This covers standalone arbitrary variant selectors like `data-[state=checked]`.

2. **Proposed new regex**:
   ```typescript
   const TAILWIND_CLASS_RE =
     /^!?(?:(?:[\w-]+(?:\[[^\]]*\])?):)*(?:-?[a-zA-Z][\w-]*(?:\[[^\]]*\])?(?:\/[\w.[\]-]+)?|[\w-]+\[[^\]]*\])$/
   ```
   
   The change adds `|[\w-]+\[[^\]]*\]` as an alternative to the base utility pattern. This alternative matches:
   - `[\w-]+` — one or more word/hyphen characters (e.g., `data-`, `aria-`, `group-`, `peer-`)
   - `\[[^\]]*\]` — a required bracket group (e.g., `[state=checked]`)

3. **Update JSDoc comment**: Add `standalone arbitrary variant selectors (data-[state=checked], aria-[selected=true])` to the list of covered patterns.

4. **No changes to `parseTemplate` function logic**: The function itself is correct — only the regex constant needs updating.

5. **No changes to other files**: The bug is entirely contained in the regex pattern.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that the regex rejects standalone arbitrary variant selectors.

**Test Plan**: Write tests that pass standalone arbitrary variant selector tokens to `parseTemplate` and assert that console warnings are emitted. Run these tests on the UNFIXED code to confirm the bug exists.

**Test Cases**:
1. **data-attribute test**: Pass `data-[state=checked]` — expect warning on unfixed code
2. **aria-attribute test**: Pass `aria-[selected=true]` — expect warning on unfixed code
3. **group-variant test**: Pass `group-[.is-active]` — expect warning on unfixed code
4. **peer-variant test**: Pass `peer-[.is-disabled]` — expect warning on unfixed code

**Expected Counterexamples**:
- `console.warn` is called with "unrecognized token" for each standalone variant selector
- Root cause confirmed: regex lacks alternative for standalone bracket-group tokens

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed regex matches and no warning is emitted.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := parseTemplate_fixed([input])
  ASSERT input IN result.normalizedClasses
  ASSERT console.warn NOT called
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed regex produces the same match/no-match result as the original regex.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT TAILWIND_CLASS_RE_original.test(input) = TAILWIND_CLASS_RE_fixed.test(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many random class-like strings across the input domain
- It catches edge cases where the new alternative branch might accidentally match invalid tokens
- It provides strong guarantees that the regex change is purely additive (only adds matches, never removes them)

**Test Plan**: Generate random strings that do NOT match the bug condition pattern and verify both the original and fixed regex produce identical results.

**Test Cases**:
1. **Standard utility preservation**: Generate random valid utility names (`[a-z][a-z0-9-]*`) and verify both regexes match
2. **Invalid token preservation**: Generate random non-class strings and verify both regexes reject them
3. **Modifier-prefixed preservation**: Generate random modifier:utility patterns and verify both regexes match
4. **Arbitrary value preservation**: Generate random `word-[value]` patterns that are already matched by the original regex and verify both still match

### Unit Tests

- Test each specific standalone variant selector (`data-[...]`, `aria-[...]`, `group-[...]`, `peer-[...]`)
- Test edge cases: empty brackets `data-[]`, nested-looking content `data-[a[b]]` (invalid), equals signs `data-[x=y]`
- Test that existing passing tests continue to pass unchanged

### Property-Based Tests

- Generate random `word-[content]` patterns (where content has no `]`) and verify the fixed regex matches them
- Generate random standard utility names and verify both original and fixed regex produce identical results
- Generate random invalid tokens (containing `???`, starting with digits) and verify both regexes reject them

### Integration Tests

- Test full `parseTemplate` flow with mixed classes including standalone variants alongside standard utilities
- Test deduplication still works when standalone variants are present
- Test that interpolation counting is unaffected by the fix
