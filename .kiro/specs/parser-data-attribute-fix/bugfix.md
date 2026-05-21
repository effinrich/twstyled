# Bugfix Requirements Document

## Introduction

The template parser regex (`TAILWIND_CLASS_RE`) in the vite-plugin's `parse-template.ts` does not recognize standalone data-attribute variant selectors like `data-[state=checked]`. This causes spurious console warnings ("unrecognized token") even though these are valid Tailwind CSS classes. The bug is cosmetic (no functionality is broken) but produces noisy output that can mask real issues and confuse developers.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a standalone data-attribute class such as `data-[state=checked]` is parsed THEN the system emits a console warning "unrecognized token" because the regex does not match the pattern

1.2 WHEN a standalone aria-attribute class such as `aria-[selected=true]` is parsed THEN the system emits a console warning "unrecognized token" because the regex does not match the pattern

1.3 WHEN a standalone group/peer arbitrary variant class such as `group-[.is-active]` is parsed without a colon-separated utility suffix THEN the system emits a console warning "unrecognized token" because the regex does not match the pattern

### Expected Behavior (Correct)

2.1 WHEN a standalone data-attribute class such as `data-[state=checked]` is parsed THEN the system SHALL recognize it as a valid Tailwind class and NOT emit a warning

2.2 WHEN a standalone aria-attribute class such as `aria-[selected=true]` is parsed THEN the system SHALL recognize it as a valid Tailwind class and NOT emit a warning

2.3 WHEN a standalone group/peer arbitrary variant class such as `group-[.is-active]` is parsed without a colon-separated utility suffix THEN the system SHALL recognize it as a valid Tailwind class and NOT emit a warning

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a standard utility class like `flex`, `p-4`, or `items-center` is parsed THEN the system SHALL CONTINUE TO recognize it without warnings

3.2 WHEN a modifier-prefixed class like `hover:bg-red-500` or `dark:md:text-lg` is parsed THEN the system SHALL CONTINUE TO recognize it without warnings

3.3 WHEN an arbitrary value class like `bg-[#ff0000]` or `w-[200px]` is parsed THEN the system SHALL CONTINUE TO recognize it without warnings

3.4 WHEN a data-attribute variant used as a modifier prefix like `data-[state=checked]:bg-blue-500` is parsed THEN the system SHALL CONTINUE TO recognize it without warnings

3.5 WHEN a truly invalid token like `???` or `123abc` is parsed THEN the system SHALL CONTINUE TO emit a warning for unrecognized tokens

3.6 WHEN a negative value class like `-mt-2` or an important modifier class like `!font-bold` is parsed THEN the system SHALL CONTINUE TO recognize it without warnings

3.7 WHEN a CSS custom property reference like `bg-[--primary]` is parsed THEN the system SHALL CONTINUE TO recognize it without warnings

---

## Bug Condition (Formal)

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type TailwindClassToken
  OUTPUT: boolean
  
  // Returns true when the token is a valid Tailwind arbitrary variant selector
  // used as a standalone class (ending with a bracket group, where the prefix
  // is a word like "data", "aria", "group", "peer" followed by a hyphen and bracket)
  RETURN X matches pattern: word-[arbitrary_content] 
         AND X does NOT contain a colon (i.e., not used as a modifier prefix)
         AND X is a valid Tailwind arbitrary variant selector
END FUNCTION
```

Example buggy inputs:
- `data-[state=checked]`
- `data-[state=open]`
- `aria-[selected=true]`
- `group-[.is-active]`
- `peer-[.is-disabled]`

```pascal
// Property: Fix Checking - Standalone arbitrary variant selectors
FOR ALL X WHERE isBugCondition(X) DO
  result ← parseTemplate'([X])
  ASSERT no_console_warning(result) AND X IN result.normalizedClasses
END FOR
```

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT parseTemplate([X]) = parseTemplate'([X])
END FOR
```

This ensures that for all non-buggy inputs (standard utilities, modifier-prefixed classes, arbitrary values, invalid tokens), the fixed regex behaves identically to the original.
