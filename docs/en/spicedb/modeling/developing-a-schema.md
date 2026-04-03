::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/modeling/developing-a-schema)
中文版: [查看中文版](/zh/spicedb/modeling/developing-a-schema)
:::

# Developing a Schema

This document walks through the overarching process of developing a new schema from scratch.

A useful companion to this document is the [schema language reference](../concepts/schema).

## Defining Object Types

The first step in developing a new schema is to write one or more Object Type definitions.

For this example, let's imagine a basic system consisting of a resource to be protected, such as a `document`, and `users` that can potentially access them.

We begin by defining each of the object types via the `definition` keyword:

```txt
definition user {}

definition document {}
```

So far, our schema and object definitions don't do much; they define the two types of objects for our system, but as they don't have any relations or permissions defined, the objects cannot be related to one another in any form, nor can we check any permissions on them.

## Defining Relations

Our next step is to decide how our objects can relate to one another, thus defining the kind of relationships we can store in SpiceDB.

For this example, we've chosen a simple RBAC-style permissions model, where `users` can be granted a *role*, such as `reader`, on our resource, `document`.

This choice of model means that the relations between our resource, `document`, and our `users` will be defined by the roles we want. We can therefore start by defining a relation on our `document` type to represent one of these roles: `reader` in the following example.

```txt
definition user {}

definition document {
  relation reader: user
}
```

Note the inclusion of `user` on the right hand side of the `reader` relation: only objects of type `user` can relate via a `reader` relationship to a `document`.

If we wanted more than a single allowed object type, the `|` character can be used:

```txt
definition user {}
definition bot {}

definition document {
  relation reader: user | bot
}
```

## Validating our schema

To validate that our schema is correct, both `zed` and the Playground support the writing of *test relationships* as data writing tests against our schema. Once we've created test relationships, we can define tests in three ways:

- **Check Watches**: live checks performed as we edit the schema
- **Assertions**: positive or negative assertions to be verified when validation is run
- **Expected Relations**: exhaustive listing of all expected permissions and relations for a schema when validation is run

### Check Watches

Check Watches provide live validation that updates as you edit the schema in the Playground.

### Assertions

After you have a basic schema and some data to validate, you can write *assertions* to ensure that the schema meets expectations.

Assertions are written as two YAML lists containing zero or more relationships to verify: `assertTrue` and `assertFalse`.

For this example, we wish to verify that the specific user given the `reader` role has said role, so we can write an assertion to validate it:

```yaml
assertTrue:
  - "document:specificdocument#reader@user:specificuser"
assertFalse: []
```

Similarly, if we wanted to validate that *another* user does not have that role, we can add that unexpected relationship to the `assertFalse` branch:

```yaml
assertTrue:
  - "document:specificdocument#reader@user:specificuser"
assertFalse:
  - "document:specificdocument#reader@user:anotheruser"
```

Validations can be run by clicking the `Validate` button in the Playground or by using the `zed validate` command.

### Expected Relations

In addition to Check Watches and Assertions, there's also the concept of *Expected Relations*, which can be used to **exhaustively** check the membership of relations or permissions.

The Expected Relations consists of a YAML-formatted map, with each key representing a relation, and the values being a list of strings holding the full set of expected relations.

For example, we can write an empty first entry in our Expected Relations:

```yaml
document:specificdocument#reader: []
```

After hitting the `Update` button in the Playground, we are given the fully expanded form:

```yaml
document:specificdocument#reader:
  - "[user:specificuser] is <document:specificdocument#reader>"
```

While this example fails to demonstrate much more power than basic assertions, Expected Relations are far more powerful once we add additional relations and permissions to our schema.

## Expanding our schema

While being able to ask whether a user is a reader of a document is super useful, it is expected that the majority of permissions systems will consist of more than a single role.

In this example we'd like to have a second role, that of `writer`, which will allow us to check if a user is a writer on the document.

### Adding the writer relation

To begin, we once again start by adding another relation, in this case `writer`:

```txt
definition user {}

definition document {
  relation reader: user
  relation writer: user
}
```

Next, we'd like to be able to test our new relation, so we add another test relationship for a different user:

```
document:specificdocument#reader@user:specificuser
document:specificdocument#writer@user:differentuser
```

To verify our test relationships worked, we can add another assertion, and also assert that the original user (`specificuser`) is *not* a writer:

```yaml
assertTrue:
  - "document:specificdocument#reader@user:specificuser"
  - "document:specificdocument#writer@user:differentuser"
assertFalse:
  - "document:specificdocument#reader@user:anotheruser"
  - "document:specificdocument#writer@user:specificuser"
```

Finally, we can add an expected relation for the new relation, to validate it:

```yaml
document:specificdocument#reader:
  - "[user:specificuser] is <document:specificdocument#reader>"
document:specificdocument#writer:
  - "[user:differentuser] is <document:specificdocument#writer>"
```

## Defining permissions

The above configuration and validation exposes one issue, however: users are assigned to a single relation `writer` or `reader`, but what if we wanted all users who could write a document to also be able to read a document?

As a naive solution, we could create a `reader` relationship for every user whenever we create a `writer` relationship, but that would get difficult to maintain very quickly.

Instead, we'd ideally like a user with role `writer` to be **implicitly** allowed to read a document, such that we only ever need to write *one* relationship representing the user's **actual** relation/role to the document.

The solution to this problem is the second concept available within the Schema Language: **permissions**. A permission in a schema defines a permission *computed* from one or more other relations or permissions.

Let's take our schema again from above:

```txt
definition user {}

definition document {
  relation reader: user
  relation writer: user
}
```

Previously, we were checking if a specific user had a specific **role** (such as `reader`) on the document. Now, however, we want to check if a specific user has a specific **permission** on the document, such as the ability to view the document.

To support this use case, we can define a `permission`:

```txt
definition user {}

definition document {
  relation reader: user
  relation writer: user
  permission view = reader + writer
}
```

A `permission`, unlike a `relation`, cannot be explicitly written in the database: it is *computed* at query time based on the expression found after the `=`. Here, we compute the `view` permission to include any users found to have either the `reader` OR `writer` role, thus allowing users with either (or both) roles to view the document.

### Updating our expected relations

Now that we've updated our schema with our new permission, we can update our assertions and expected relations to ensure it functions as we expect.

To start, we add an assertion that checks if the users can `view` the document:

```yaml
assertTrue:
  - "document:specificdocument#reader@user:specificuser"
  - "document:specificdocument#writer@user:differentuser"
  - "document:specificdocument#view@user:specificuser"
  - "document:specificdocument#view@user:differentuser"
assertFalse:
  - "document:specificdocument#reader@user:anotheruser"
  - "document:specificdocument#writer@user:specificuser"
```

Next, we can update the expected relations to add the `view` permission, and ensure that both users have that permission on the document:

```yaml
document:specificdocument#reader:
  - "[user:specificuser] is <document:specificdocument#reader>"
document:specificdocument#view:
  - "[user:differentuser] is <document:specificdocument#writer>"
  - "[user:specificuser] is <document:specificdocument#reader>"
document:specificdocument#writer:
  - "[user:differentuser] is <document:specificdocument#writer>"
```

Note that the contents of the angled brackets for `differentuser` and `specificuser` are **different**: they indicate the *relation* by which the permission was transitively granted.

::: info
Expected Relations includes the relation by which a subject was found for a permission to ensure that not only is the permission valid, but also that the *way* a permission was validated matches that expected.

If there are multiple ways that a subject can be found for a permission, Expected Relations will require *all* of them to be listed to be valid.
:::

### Preparing to inherit permissions

As we've seen above, we can use `permission` to define *implicit* permissions, such as a `view` permission consisting of users with either the `reader` or `writer` role. Implicit permissions on a specific object type, however, are often insufficient: sometimes permissions need to be **inherited** between object types.

As an example: imagine that we add the concept of an `organization` to our permissions system, where any user that is an administrator of an organization automatically gains the ability to `view` any `document` within that organization; how would we define such a permissions schema?

### Defining the organization type

To begin, we must first define the object type that represents our organization, including the `administrator` relation, to represent the administrator role for users:

```txt
definition user {}

definition document {
  relation reader: user
  relation writer: user
  permission view = reader + writer
}

/** organization represents an organization that contains documents */
definition organization {
  relation administrator: user
}
```

### Connecting organizations and documents

In order for our inheritance to function, we must define a way to indicate that a document "lives" under an organization. Fortunately, this is just another relation (between a `document` and its parent `organization`), so we can use another relation within the `document` type:

```txt
definition user {}

/** organization represents an organization that contains documents */
definition organization {
  relation administrator: user
}

definition document {
  /** docorg indicates that the organization owns this document */
  relation docorg: organization

  relation reader: user
  relation writer: user
  permission view = reader + writer
}
```

Here we've chosen to call this relation `docorg`, but it could be called anything: it is generally recommended to use either a contraction of the two namespaces being connected or, alternatively, a term representing the actual relationship between the object types (such as `parent`).

### Adding the relationship

Now that we've defined the `relation` to hold our new relationship, we can add a test relationship:

```
document:specificdocument#docorg@organization:someorg
```

::: info
Note the use of the organization as the **subject** in this relationship.
:::

### Inheriting permissions

Now that we have a means of stating that a document is owned by an organization, and a relation to define the administrator role on the organization itself, our final steps are to add a `view_all_documents` permission to the organization and to edit the `view` permission to take this permission into account.

To do so, we make use of the arrow operator (`->`), which allows for referencing permissions *across* another relation or permission:

```txt
/** user represents a registered user's account in our application */
definition user {}

/** organization represents an organization that contains documents */
definition organization {
  /** administrator indicates that the user is an admin of the org */
  relation administrator: user

  /** view_all_documents indicates whether a user can view all documents in the org */
  permission view_all_documents = administrator
}

/** document represents a document with access control */
definition document {
  /** docorg indicates that the organization owns this document */
  relation docorg: organization

  /** reader indicates that the user is a reader on the document */
  relation reader: user

  /** writer indicates that the user is a writer on the document */
  relation writer: user

  /** view indicates whether the user can view the document */
  permission view = reader + writer + docorg->view_all_documents
}
```

The expression `docorg->view_all_documents` indicates to SpiceDB to follow the `docorg` relation to any organizations found for the document, and then check for the user against the `view_all_documents` permission.

By use of this expression, any user defined as an administrator of the organization that owns the document will also be able to view the document!

::: info
It is *recommended* that the right side of all arrows refer to **permissions**, instead of relations. This allows for easy nested computation, and is more readable.
:::

### Adding an administrator user

Now that we've declared that all users in `administrator` on the organization are also granted the `view` permission, let's define at least one user in our test data to be an administrator:

```
organization:someorg#administrator@user:someadminuser
```

### Testing inherited permissions

Finally, we can add the user to the declarations in Assertions and Expected Relations and verify that the inheritance works:

```yaml
assertTrue:
  - "document:specificdocument#reader@user:specificuser"
  - "document:specificdocument#writer@user:differentuser"
  - "document:specificdocument#view@user:specificuser"
  - "document:specificdocument#view@user:differentuser"
  - "document:specificdocument#view@user:someadminuser"
assertFalse:
  - "document:specificdocument#reader@user:anotheruser"
  - "document:specificdocument#writer@user:specificuser"
```

```yaml
document:specificdocument#reader:
  - "[user:specificuser] is <document:specificdocument#reader>"
document:specificdocument#view:
  - "[user:differentuser] is <document:specificdocument#writer>"
  - "[user:someadminuser] is <organization:someorg#administrator>"
  - "[user:specificuser] is <document:specificdocument#reader>"
document:specificdocument#writer:
  - "[user:differentuser] is <document:specificdocument#writer>"
```

::: info
Note the expectation of `<organization:someorg#administrator>` for `someadminuser`, instead of `reader` or `writer` on the document: the permission is being granted by virtue of the user being an administrator of the organization.
:::
