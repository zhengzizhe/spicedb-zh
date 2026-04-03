::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/modeling/attributes)
中文版: [查看中文版](/zh/spicedb/modeling/attributes)
:::

# Attributes

If you are migrating to SpiceDB from a pre-existing authorization system, it's likely that attributes play a part in your authorization evaluations.

SpiceDB can evaluate attributes alongside complex access control logic like roles and relationships. This guide provides practical schema language examples for implementing various attribute types.

## Boolean Attributes

Boolean or binary attributes function as toggles affecting authorization decisions, such as feature flag authorization.

### Loop Relationships

Loop relationships implement boolean attributes by relating an object to itself. For example, a user can only view a document if:

- The user relates to the document as an editor
- Editing is enabled for the document

To enable editing, write a loop relationship where the document relates to itself using the `edit_enabled` relation (e.g., `document:1#edit_enabled@document:1`). This allows the relation to reference itself to determine editor access.

::: warning
There is no mechanism in the SpiceDB schema language that enforces that a relation be used as a loop relation. Implement client-side logic to prevent misuse like `document:1#edit_enabled@document:2`.
:::

### Wildcards

Wildcards allow relationships to all objects of a resource type without individual object relationships. In this pattern, a user gains `edit` permission when both conditions are met:

- Related to the document as an `editor`
- Related through `edit_enabled`

Establish relationships like: `document:somedocument#edit_enabled@user:*`

::: info
Wildcards are not currently supported by Authzed Materialize. Use loop relationships for binary attributes if planning Materialize integration.
:::

## Attribute Matching

Attribute matching occurs when users need specific attributes required by resources to perform actions.

### Match at Least One Attribute of a Single Type

Users must match **at least one** of a document's country attributes to view it. Country attributes are represented as objects, with users related as members and documents related to required countries.

### Match All Attributes of a Single Type

Using intersection arrows requires users to match **all** of a document's country attributes for access, rather than at least one.

### Match at Least One Attribute from Each Type

When multiple attribute types exist (e.g., country and status), create object definitions for each type and use subject relations to connect resources to required attributes. Users need to match at least one attribute from each type.

### Match All Attributes from Each Type

With intersection arrows, users must match **all** country **and** status attributes for document access, versus matching at least one attribute of each type.

## Caveats vs Schema Modeling

Caveats should only be used when data required to evaluate a `CheckPermission` request is only available at the time of the request (e.g., user's current location or time of day).

Using caveats for static data (e.g., a document's status) can have negative performance impacts. Static attribute data should always be modeled in the schema using the patterns described above.
