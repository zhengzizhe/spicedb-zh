::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/modeling/migrating-schema)
English: [View English version](/en/spicedb/modeling/migrating-schema)
:::

# 迁移 Schema

SpiceDB 以**安全**的方式处理所有对 WriteSchema API 的调用：不可能破坏 Schema 的类型安全性。

本页专门介绍 SpiceDB Schema 迁移。不涉及数据存储 Schema 迁移（Postgres、CockroachDB 等）或 SpiceDB 实例之间的迁移。

## 安全迁移（始终允许）

### 添加新关系

可以添加新关系，而不影响现有类型或计算：

```txt
definition resource {
  relation existing: user
  relation newrelation: user
  permission view = existing
}
```

### 更改权限

只要表达式引用了已定义的权限或关系，就可以修改权限的计算方式：

```txt
definition resource {
  relation viewer: user
  relation editor: user
  permission view = viewer + editor
}
```

### 向关系添加主体类型

可以向现有关系添加新的允许主体类型：

```txt
definition resource {
  relation viewer: user | group#member
  permission view = viewer
}
```

### 删除权限

如果权限未被其他权限或关系引用，则可以删除。但是，必须通过 CI 系统验证外部 API 调用者，确保他们没有仍在使用已删除的权限。

## 有条件的迁移（需要额外步骤）

### 删除关系

只有在以下条件满足时才能删除关系：
- 引用该关系的所有关系数据（relationships）已被删除
- 该关系未被其他关系或权限引用

**流程：**

1. 更新 Schema 以从权限中移除该关系，调用 WriteSchema
2. 执行 `DeleteRelationships` API 调用以删除该关系的所有关系数据
3. 更新 Schema 以完全移除该关系，调用 WriteSchema

**示例：** 删除 `relation editor`：

起始 Schema：

```txt
definition resource {
  relation viewer: user
  relation editor: user
  permission view = viewer + editor
}
```

步骤 1 -- 从权限中移除：

```txt
definition resource {
  relation viewer: user
  relation editor: user
  permission view = viewer
}
```

步骤 2 -- 通过 API 删除所有 editor 关系数据。

步骤 3 -- 移除该关系：

```txt
definition resource {
  relation viewer: user
  permission view = viewer
}
```

### 删除允许的主体类型

只有在删除了使用该类型的所有关系数据后，才能删除主体类型。

**流程：**

1. 执行 `DeleteRelationships` API 调用以删除该主体类型的所有关系数据
2. 更新 Schema 以移除该主体类型，调用 WriteSchema

**示例：** 从 viewer 中移除 `group#member`：

之前：

```txt
definition resource {
  relation viewer: user | group#member
  permission view = viewer
}
```

之后：

```txt
definition resource {
  relation viewer: user
  permission view = viewer
}
```

## 在关系之间迁移数据

要将关系数据从一个关系迁移到另一个关系，请遵循以下结构化的多步骤方法：

**示例：** 从 `relation viewer` 迁移到 `relation new_viewer`。

起始 Schema：

```txt
definition resource {
  relation viewer: user
  permission view = viewer
}
```

**步骤：**

1. **添加新关系**并将其包含在相关权限中：

```txt
definition resource {
  relation viewer: user
  relation new_viewer: user2
  permission view = viewer + new_viewer
}
```

2. **更新应用程序**以同时写入两个关系，确保数据完整覆盖。

3. **回填关系数据**，将所有相关数据复制到新关系。

4. **从权限中删除旧关系：**

```txt
definition resource {
  relation viewer: user
  relation new_viewer: user2
  permission view = new_viewer
}
```

5. **更新应用程序**以停止写入旧关系。

6. **删除旧关系**，按照上述关系删除流程操作。
