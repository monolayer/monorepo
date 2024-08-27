---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "monolayer"
  text: "Database schema management for PostgreSQL"
  tagline: Built with Kysely, integrates with Prisma.
  actions:
    - theme: brand
      text: What is monolayer?
      link: /guide/introduction/what-is-monolayer
    - theme: alt
      text: Features
      link: /guide/introduction/features
    - theme: alt
      text: Quickstart
      link: /guide/introduction/installation
    - theme: alt
      text: Github
      link: https://github.com/dunkelbraun/monolayer

features:
  - title: Declarative, type-safe schema definition
    details: Easy to write, read, and reason about it.
  - title: Type-safe database clients without codegen
    details: Types are inferred from your schema definition.
  - title: Advanced Migration System
    details: Non-blocking migrations by default, migrations by phases, and detailed warnings.
  - title: Comprehensive Zod validations
    details: Validate incoming data before inserting it to the database.
---

