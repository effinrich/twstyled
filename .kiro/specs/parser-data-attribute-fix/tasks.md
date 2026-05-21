# Implementation Plan

- [-] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Standalone Arbitrary Variant Selectors Rejected
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases: standalone arbitrary variant selectors (`data-[state=checked]`, `aria-[selected=true]`, `group-[.is-active]`, `peer-[.is-disabled]`) with no colon separator
  - Write a property-based test in `packages/vite-plugin/src/__tests__/parse-template-bugfix.test.ts` using `fast-check`
  - Generate tokens matching pattern `word-[content]` where word is from `[data, aria, group, peer]` and content is arbitrary non-`]` characters
  - Assert that `parseTemplate([token])` does NOT emit a `console.warn` call (expected behavior from design)
  - Assert that the token appears in `result.normalizedClasses`
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists because `console.warn` IS called for these tokens)
  - Document counterexamples found (e.g., `data-[state=checked]` triggers warning instead of being silently accepted)
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

- [~] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Variant Tokens Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: `parseTemplate(['flex items-center gap-4'])` produces `['flex', 'items-center', 'gap-4']` without warnings on unfixed code
  - Observe: `parseTemplate(['hover:bg-red-500 dark:md:text-lg'])` produces recognized classes without warnings on unfixed code
  - Observe: `parseTemplate(['??? 123abc'])` emits warnings for invalid tokens on unfixed code
  - Observe: `parseTemplate(['bg-[#ff0000] w-[200px] bg-[--primary]'])` produces recognized classes without warnings on unfixed code
  - Write property-based test in `packages/vite-plugin/src/__tests__/parse-template-bugfix.test.ts` using `fast-check`:
    - Generate random standard utility tokens matching `[a-z][a-z0-9-]*` and verify no warning is emitted
    - Generate random modifier-prefixed tokens matching `word:word` patterns and verify no warning is emitted
    - Generate random invalid tokens (starting with digits, containing `???`) and verify warning IS emitted
    - For all generated tokens that do NOT match `isBugCondition` pattern, verify the current regex behavior is preserved
  - Verify tests pass on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 3. Fix for standalone data-attribute variant selector regex

  - [~] 3.1 Implement the regex fix
    - In `packages/vite-plugin/src/parse-template.ts`, update `TAILWIND_CLASS_RE` to add alternation branch `|[\w-]+\[[^\]]*\]` after the base utility pattern
    - New regex: `/^!?(?:(?:[\w-]+(?:\[[^\]]*\])?):)*(?:-?[a-zA-Z][\w-]*(?:\[[^\]]*\])?(?:\/[\w.[\]-]+)?|[\w-]+\[[^\]]*\])$/`
    - Update the JSDoc comment to include "standalone arbitrary variant selectors (data-[state=checked], aria-[selected=true])" in the list of covered patterns
    - No changes to `parseTemplate` function logic — only the regex constant changes
    - _Bug_Condition: isBugCondition(input) where input matches `word-[content]` with no colon_
    - _Expected_Behavior: standalone arbitrary variant selectors recognized without warning_
    - _Preservation: All non-bug-condition tokens produce identical match/no-match results_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [~] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Standalone Arbitrary Variant Selectors Recognized
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (no warnings for standalone variant selectors)
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [~] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Variant Tokens Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [~] 4. Checkpoint - Ensure all tests pass
  - Run the full test suite for the vite-plugin package: `npx vitest --run` in `packages/vite-plugin`
  - Verify all existing tests in `packages/vite-plugin/src/__tests__/` continue to pass
  - Verify the new bugfix tests pass
  - Verify no regressions in other packages by running `npx turbo test` from root
  - Ensure all tests pass, ask the user if questions arise.
