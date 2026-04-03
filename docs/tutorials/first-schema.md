# 编写第一个 Schema

本教程将带你从零开始设计一个博客系统的权限模型。

## 需求分析

一个简单的博客系统，需要以下权限控制：

- 博客文章有**作者**和**读者**
- 作者可以编辑和删除自己的文章
- 读者只能查看文章
- 文章属于某个博客空间，空间管理员可以管理所有文章

## 第一步：定义用户

```zed
definition user {}
```

## 第二步：定义博客空间

```zed
definition blog {
    relation admin: user
    relation writer: user
    relation reader: user

    permission manage = admin
    permission write = admin + writer
    permission read = admin + writer + reader
}
```

## 第三步：定义文章

```zed
definition post {
    relation blog: blog
    relation author: user

    // 作者和空间管理员可以编辑
    permission edit = author + blog->manage

    // 作者和空间管理员可以删除
    permission delete = author + blog->manage

    // 所有能读空间的人 + 作者都能查看
    permission view = author + blog->read
}
```

## 第四步：写入 Schema

将上面的内容合并到一个文件 `blog.zed`：

```zed
definition user {}

definition blog {
    relation admin: user
    relation writer: user
    relation reader: user

    permission manage = admin
    permission write = admin + writer
    permission read = admin + writer + reader
}

definition post {
    relation blog: blog
    relation author: user

    permission edit = author + blog->manage
    permission delete = author + blog->manage
    permission view = author + blog->read
}
```

写入 SpiceDB：

```bash
zed schema write blog.zed
```

## 第五步：创建测试数据

```bash
# 创建博客空间的管理员和读者
zed relationship create blog:tech-blog admin user:admin-wang
zed relationship create blog:tech-blog writer user:writer-li
zed relationship create blog:tech-blog reader user:reader-zhang

# 创建文章，指定作者和所属博客
zed relationship create post:hello-spicedb author user:writer-li
zed relationship create post:hello-spicedb blog blog:tech-blog
```

## 第六步：验证权限

```bash
# writer-li 是文章作者，可以编辑 ✅
zed permission check post:hello-spicedb edit user:writer-li

# admin-wang 是空间管理员，也可以编辑 ✅
zed permission check post:hello-spicedb edit user:admin-wang

# reader-zhang 不能编辑 ❌
zed permission check post:hello-spicedb edit user:reader-zhang

# reader-zhang 可以查看 ✅
zed permission check post:hello-spicedb view user:reader-zhang
```

## 总结

通过这个教程你学会了：

1. 用 `definition` 定义资源类型
2. 用 `relation` 定义关系
3. 用 `permission` 组合关系来计算权限
4. 用 `->` 箭头操作符实现跨类型权限继承

## 下一步

- [RBAC 权限模型](/tutorials/rbac) — 更复杂的角色模型
- [Google Docs 权限模型](/tutorials/google-docs) — 经典案例
