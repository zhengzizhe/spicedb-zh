::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/modeling/representing-users)
中文版: [查看中文版](/zh/spicedb/modeling/representing-users)
:::

# Representing Users

Within a Permissions System, a CheckPermission call is always made between an object representing the *resource* and an object representing a *subject*: The API call returns whether the *subject* has the specified permission on the *resource*.

## Representing users as subjects

The most common kind of subjects found within a permissions system are some form of **user**.

Users in SpiceDB are modeled as object types, same as resources.

Typically, it is users that are accessing your application or service and, therefore, it is for them that the various permissions must be checked.

Choosing how to represent a user as a subject in SpiceDB is very important, as the wrong choice can cause permissions checks to be incomplete or, in some cases, wrong.

### Using a stable external identifier

The most common and recommended approach for representing a user as a subject is to use a **stable** identifier for the user as the subject's object ID.

For example, if the authentication system used is OIDC and provides a `sub` field, then the object IDs for the users might be the `sub` field:

```
check resource:someresource view user:goog|487306745603273
```

As the `sub` field is **guaranteed** to be stable for that particular user (if a compliant OIDC implementation), it is safe to use for checking permissions, as there is no risk that the `sub` will somehow represent a different user later.

If you have *multiple* authentication providers, then the recommendation is to define a subject type for *each* provider, to ensure a clean namespace:

```txt
/** githubuser represents a user from GitHub */
definition githubuser {}

/** gitlabuser represents a user from GitLab */
definition gitlabuser {}
```

### Using a primary key

The second most common approach is to have a representation of the subject in another backing data store, typically a relational database.

If such a database exists, and there exists a single row per user, then using the row's primary ID (typically an integer or a UUID) represents another safe ID to use for user:

```
check resource:someresource view user:1337
```

If using an auto-generated or auto-incrementing integer, make sure it cannot be reused. Some databases allow various sequences to reuse IDs.

### What about e-mail addresses?

It is typically **not recommended** to use an e-mail address to represent a user as a subject in SpiceDB.

This is for a number of reasons:

- E-mail addresses are not universally stable and, often times, services allow them to be reused
- E-mail addresses are not universally verified and, often times, a caller of the CheckPermission may not be *certain* that the user has that e-mail address
- SpiceDB does not allow for `@` characters within object IDs

If you know for **certain** that the e-mail address for a user is both stable and verified, and still wish to use it as the subject ID, then we recommend base64 encoding (with padding removed) the e-mail address to use it within SpiceDB.

## Representing anonymous visitors as subjects

Some applications allow for *anonymous* access to view (and occasionally, edit) various resources.

Representing an anonymous visitor in SpiceDB can be done via simply defining another subject type to represent the unauthenticated users:

```txt
/** user represents a specific authenticated user */
definition user {}

/** anonymoususer represents an unauthenticated user */
definition anonymoususer {}
```

To grant access to anonymous users to a resource, either a single **static** object ID can be used to represent *all* anonymous users (such as `all`) or wildcards can be used:

```txt
definition document {
    relation reader: user | anonymoususer:*
}
```

It is recommended to use *wildcard* with an anonymous user definition if there is ever a need to differentiate between anonymous users based on their object IDs.

As an example, an anonymous user of a commenting system might be assigned a unique ID that is stored in their browser's cookies, enabling permission for editing a previously posted comment.

## Representing services as subjects

If your permissions checks are between machines or services and other services, it is recommended that the subject type be a representation of that service or its means of providing its identity.

For example, you might represent a service directly:

```txt
definition service {}

definition resource {
    relation viewer: service
}
```

Or via a token it was granted, by use of a reference to a *subject relation*:

```txt
definition token {}

definition service {
    relation token: token
}

definition resource {
    relation viewer: service#token
}
```
