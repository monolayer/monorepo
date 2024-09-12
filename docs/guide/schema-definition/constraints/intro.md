# Introduction

Besides limiting the kind of data that can be stored in a table with column data types,
we can apply **constraints** to have a greater control over the data in the tables.

With constraints you can require that values in a column or a group of columns:

- Must not assume the null value ([not-null constraints](./not-null.md))
- Can be used as a unique identifier for rows in the table. ([primary keys](./primary-key.md))
- Are unique among all the rows in the table. ([unique constraints](./unique.md))
- Match the values appearing in some row of another table. ([foreign keys](./foreign-key.md))
- Satisfy a Boolean expression. ([check constraints](./check.md))

When attempting to store data in a column that violates a constraint, the database raises an error.
