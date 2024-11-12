---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "monolayer-pg"
  text: "Database schema management for PostgreSQL"
  tagline: Built for Kysely, integrates with Prisma.
  actions:
    - theme: brand
      text: What is monolayer-pg?
      link: /guide/introduction/what-is-monolayer
    - theme: alt
      text: Quickstart
      link: /guide/introduction/installation
    - theme: alt
      text: API Reference
      link: /reference/api/modules

features:
  - title: Declarative, type-safe schema definition
    details: Easy to write, read, and reason about it.
  - title: Get rid of schema migrations
    details: Just push your schema changes.
  - title: Decoupled data migrations
    details: Manage your data migrations independently.
  - title: Type-safe database client
    details: Type-safe database client(s) for Kysely or generated Prisma client.
---

