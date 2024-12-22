# Welcome to monolayer

monolayer makes it possible to go from local code to production in one step, 100% automated.

## Vision

Developing web applications depends on fast feedback loops and quick iteration.

We want to enable developers to focus on code to create user experiences. To write applications and delight users. Build and ship features without dealing with infrastructure implementation details.

When you're ready, monolayer brings your app live with a single command.

## Why?

All the required infrastructure to run a web application should come directly from its code, without developers having to think about the infrastructure they need.

Developers must rely on "devOps" to launch and evolve web applications:

- Set up initial infrastructure (unmanaged, managed, or sass) and change it over time.
- Manage database schema changes.
- Configure infrastructure and applications properly.
- Ensure deployments without downtime.

## Where do we start?

The combination of React, PostgreSQL, and Cloud is becoming the de-facto standard for web application development.

While React frameworks handle the HTTP request/response cycle, web applications often need more than just this:

- Stateful Components: Databases, caches, object storage, message queues, etc.
- Stateless Components: Scheduled tasks, batch jobs, real-time browser-server communication, database schema management, and data migrations.

monolayer aims to integrate seamlessly into the existing rich ecosystem of frameworks and offer modern backend development primitives, just as React has done for the UI.

To deliver our vision, we are building the following:

### Sidecar framework

A companion framework that operates alongside your web application framework, providing:

- Support for diverse workloads without manual configuration.
- Local development environment with backing resources.
- Framework defined infrastructure.

### PostgreSQL Schema Management library

Declarative, migration-less schema management that works with existing ORMs and query builders.

## Built as open source

monolayer is being developed as open-source, building foundational tools, libraries, and reference architectures.

We plan to build an integrated cloud where you can deploy and monitor your web applications with a single command.

## Our journey has started

We have already launched:

- [`monolayer-pg`](https://monolayer.github.io/pg-docs/), a declarative schema management toolkit for PostgreSQL without schema migrations. It saves time and effort to get your database schema to a desired state, using native PostgreSQL operations to perform online changes and to avoid locking and downtime wherever possible.

- [`workloads`](https://monolayer.github.io/workloads-docs/), a sidecar framework for full-stack React web development to define web development workloads outside the HTTPs request/response cycle.

- [`dw`](https://monolayer.github.io/dw-docs/), a tiny library to write and validate Dockerfiles in TypeScript.

- [`dsdk`](https://monolayer.github.io/dsdk-docs/), a type-safe SDK you can use to access the Docker Engine API.
