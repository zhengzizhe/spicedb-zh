::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/modeling/composable-schemas)
中文版: [查看中文版](/zh/spicedb/modeling/composable-schemas)
:::

# Composable Schemas

To facilitate schema organization and cross-team collaboration, `zed` version v0.27.0 introduced a schema compilation command enabling schema modularization:

```bash
zed schema compile root.zed
```

This command combines schemas spread across multiple files into a single unified schema.

## Example Structure

### root.zed

```txt
use import
use partial

import "./subjects.zed"

partial view_partial {
 relation user: user
 permission view = user
}

definition resource {
 ...view_partial

 relation organization: organization
 permission manage = organization
}
```

### subjects.zed

```txt
definition user {}
definition organization {}
```

### Compiled Output

```txt
definition user {}

definition organization {}

definition resource {
 relation user: user
 permission view = user

 relation organization: organization
 permission manage = organization
}
```

The compiled output can be understood by SpiceDB's `WriteSchema` API.

## Core Concepts

Three new syntax elements are introduced: import statements, partial declarations, and partial references.

## Breaking Changes

### `use import` and `use partial`

_`zed` version v0.36.0_

As of v0.36.0, enabling `import` and `partial` syntax requires corresponding `use` flags:

```txt
use import
use partial

import "foo.zed"
partial something {}
```

The `use` flags are required only in files using those keywords. Imported files without their own `import` or `partial` syntax don't need flags, though their presence causes no error.

### New Keywords

_`zed` version v0.27.0 to v0.35.0_

::: info
This is superseded by `use import` and `use partial` above.
:::

The composable schema compiler introduces breaking changes relative to SpiceDB's internal `WriteSchema` compiler. While new SpiceDB versions shouldn't break existing schemas, the compiler introduces new keywords, potentially causing compilation failures for previously valid schemas.

`import` and `partial` became keywords, so permissions or relations with those names cannot be compiled. Reserved keywords include `use`, `and`, `or`, and `not`. Unexpected `TokenTypeKeyword` errors likely stem from this issue. Reserved keywords are documented in the [lexer definition](https://github.com/authzed/spicedb/blob/main/pkg/composableschemadsl/lexer/lex_def.go#L74).

## Import Statements

Import statements decompose schemas along top-level declaration boundaries.

### root.zed

```txt
use import

// An import keyword followed by a quoted relative filepath
import "./one.zed"

// Note that a bare filename works as a relative path
import "two.zed"

// The imports are included by the compilation process, which means that
// they can be referenced by other definitions
definition resource {
 relation user: user
 relation organization: organization

 permission view = user + organization
}
```

### one.zed

```txt
definition user {}
```

### two.zed

```txt
definition organization {}
```

### Good to Know

- Import references must be within the folder where `zed` is invoked.
- Import cycles are treated as errors.
- All definitions in all imported files are pulled in. Any duplicate definitions will cause an error.

## Partials

Partial declarations and references provide schema decomposition across definition boundaries.

### Partial Declarations

A partial declaration is a top-level block declared using the `partial` keyword. It can contain relations, permissions, and partial references like a `definition` block, but contents must be referenced by a partial reference to appear in the compiled schema.

```txt
use partial

partial view_partial {
 ...some_other_partial

 relation user: user
 permission view = user
}
```

#### Good to Know

- Any unreferenced partial is ignored during compilation.
- Partial declarations can contain partial references, enabling partial composition.

### Partial References

A partial reference includes relations and permissions from a partial, functioning similarly to JavaScript spread syntax or Python dictionary unpacking.

This syntax:

```txt
use partial

partial view_partial {
 relation viewer: user
 permission view = viewer
}

partial edit_partial {
 relation editor: user
 permission edit = editor
}

definition resource {
 ...view_partial
 ...edit_partial
}
```

is equivalent to:

```txt
definition resource {
 relation user: user
 permission view = user

 relation editor: user
 permission edit = editor
}
```

#### Good to Know

- Duplicate relations and permissions from partial references are treated as errors.
- Circular references between partials are treated as errors.
- Only partial declarations can be referenced. Attempting to reference other declaration types (definitions, caveats) with partial references results in an error.
- A partial can be referenced multiple times, and partials or definitions can contain any number of partial references.

## An Example Workflow

1. Make a change to your multi-file schema
2. Run `zed validate` to ensure changes are valid
3. Make a PR to your schema repository
4. CI runs `zed validate` again

Then on merge:

1. CI runs `zed schema compile`
2. CI calls SpiceDB's WriteSchema API with the compiled schema
