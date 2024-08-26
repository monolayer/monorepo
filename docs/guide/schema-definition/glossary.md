---
prev: false
next: false
---

# Glossary

## Check constraint

Type of [constraint](#constraint) It allows you to specify that the value in a certain [column](#column) or a group of columns must satisfy a Boolean (truth-value) expression.

## Column

An attribute with a certain name and data type in a [table](#table) or view.

## Constraint

> A restriction on the values of data allowed within a [table](#table), or in attributes of a domain.

*Source*: [PostgreSQL glossary](https://www.postgresql.org/docs/current/glossary.html#GLOSSARY-CONSTRAINT)

## Database

A database is a structure used to organize and store data. Specifically in PostgreSQL, a database is named collection of [local SQL objects](#sql-object).

## Data type

A data type is the kind of data that can be stored in a table column or returned by a function. It specifies the format and limitations of the data, such as whether it’s a number, text, date, or something more complex like a JSON object. For example, the data type `ìnteger` is used for whole, and `character varying` is used for variable-length character strings.

## Extension

> A software add-on package that can be installed on an instance to get extra features.

*Source*: [PostgreSQL glossary](https://www.postgresql.org/docs/current/glossary.html#GLOSSARY-DATABASE)

## Foreign Key

> A type of constraint defined on one or more [columns](#column) in a [table](#table) which requires the value(s) in those columns to identify zero or one row in another (or, infrequently, the same) table.

*Source*: [PostgreSQL glossary](https://www.postgresql.org/docs/current/glossary.html#GLOSSARY-FOREIGN-KEY)

## Function:

Code that you can run within a database query. It can take inputs, return outputs, and always runs within one transaction. You can call a function as a part of a query, for example via SELECT. Some functions can return multiple rows of data, and these are known as *set-returning* functions.

Functions can also be used for [triggers](#triggers) to invoke.

## Index

A [SQL object](#sql-object) that contains data derived from a table or materialized view, allowing for fast retrieval and access of the original data.

## Primary Key

A [constraint](#constraint) that enforces values to be unique and `NOT NULL`.
A primary key is used to reliably identify and distinguish between each individual record in a [table](#table) and there can be only one primary key per table.

## Schema

> A schema is a namespace for [SQL objects](#sql-object), which all reside in the same database. Each SQL object must reside in exactly one schema.
>
> ...
>
> More generically, the term schema is used to mean all data descriptions (table definitions, constraints, comments, etc.) for a given database or subset thereof.

*Source*: [PostgreSQL glossary](https://www.postgresql.org/docs/current/glossary.html#GLOSSARY-SCHEMA)

## Session

> A state that allows a client and a backend to interact, communicating over a connection.

*Source*: [PostgreSQL glossary](https://www.postgresql.org/docs/current/glossary.html#GLOSSARY-SESSION)

## SQL Object

In PostgreSQL, an “sql object” refers to anything you can create using a CREATE command, like [tables](#table), [functions](#function), or [data types](#function). Most of these objects are tied to a specific [database](#database) and live within [schemas](#schemas), which are like folders that help organize them. For example, tables and functions in the same schema must have unique names. Some objects, like [extensions](#extensions), don’t live in schemas but still need unique names within their database. Additionally, there are global objects like roles, tablespaces, and databases that exist outside any single database and must have unique names across the entire database instance.

## Table

A collection of rows that share the same structure, where each row has the same set of columns in the same order and has the same name and data type across all rows.

## Transaction

A combination of commands that all succeed or all fail as a single unit. If a system failure occurs during the execution of a transaction, no partial results are visible after recovery. Transaction effects are not visible to other [sessions](#session) until the transaction is complete, and possibly even later, depending on the isolation level.

## Unique constraint

Type of [constraint](#constraint) that ensures that the data contained in a [column](#column), or a group of columns, is unique among all the rows in the [table](#table).

## Trigger

> A function which can be defined to execute whenever a certain operation (INSERT, UPDATE, DELETE, TRUNCATE) is applied to a relation. A trigger executes within the same transaction as the statement which invoked it, and if the function fails, then the invoking statement also fails.

*Source*: [PostgreSQL glossary](https://www.postgresql.org/docs/current/glossary.html#GLOSSARY-TRIGGER)

