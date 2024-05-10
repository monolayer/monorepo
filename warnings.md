# Warnings

## Types

### Backward incompatible changes

Backward-incompatible changes, also known as breaking changes, are schema changes that have the potential to break the contract with applications that rely on the old schema. For instance, renaming a column from email_address to email can cause errors during deployment (migration) phase if applications running the previous version of the schema reference the old column name in their queries.

By default, detected breaking changes are reported but do not cause migration linting to fail. Users can change this by configuring the incompatible analyzer in the atlas.hcl file:

- Renaming a table
- Renaming a column

### Destructive changes

Destructive changes are changes to a database schema that result in loss of data. For instance, consider a statement such as:

ALTER TABLE `users` DROP COLUMN `email_address`;

This statement is considered destructive because whatever data is stored in the email_address column will be deleted from disk, with no way to recover it. There are definitely situations where this type of change is desired, but they are relatively rare. Using the destructive (GoDoc) Analyzer, teams can detect this type of change and design workflows that prevent it from happening accidentally.

Running migration linting locally on in CI fails with exit code 1 in case destructive changes are detected. However, users can disable this by configuring the destructive analyzer in the atlas.hcl file:

- Schema was dropped                                                                                      |
- Table was dropped                                                                                       |
- Column was dropped

## Data dependent changes

Data-dependent changes are changes to a database schema that may succeed or fail, depending on the data that is stored in the database. For instance, consider a statement such as:

ALTER TABLE `example`.`orders` ADD UNIQUE INDEX `idx_name` (`name`);

This statement is considered data-dependent because if the orders table contains duplicate values on the name column we will not be able to add a uniqueness constraint. Consider we added two records with the name atlas to the table:

- Add unique index to existing column
- Modifying non-unique index to unique
- Adding a non-nullable column to an existing table
- Modifying a nullable column to non-nullable
- Creating table with non-optimal data alignment
| **PG**          | PostgreSQL specific checks                                                                              |
| [PG110](#PG110) | Creating table with non-optimal data alignment                                                          |

## Blocking changes

PG104	PRIMARY KEY constraint creation that acquires an ACCESS EXCLUSIVE lock on the table
PG105	UNIQUE constraint creation that acquires an ACCESS EXCLUSIVE lock on the table
PG301	Column type change that requires table and indexes rewrite
PG302	Adding a column with a volatile DEFAULT value requires a rewrite of the table
PG303	Modifying a nullable column to non-nullable requires a full table scan
PG304	Adding a PRIMARY KEY on nullable columns implicitly set them to NOT NULL requires a full table scan
PG305	Adding a CHECK constraint that requires a full table scan
PG306	Adding a FOREIGN KEY constraint that requires a full table scan and blocks write operations

## Checks

The following schema change checks are provided by Atlas:

| **Check**       | **Short Description**                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| **BC**          | **[Backward incompatible changes](#backward-incompatible-changes)**                                     |
| [BC101](#BC101) | Renaming a table                                                                                        |
| [BC102](#BC102) | Renaming a column                                                                                       |
| **CD**          | Constraint deletion changes                                                                             |
| [CD101](#CD101) | Foreign-key constraint was dropped                                                                      |
| **DS**          | **[Destructive changes](#destructive-changes)**                                                         |
| [DS101](#DS101) | Schema was dropped                                                                                      |
| [DS102](#DS102) | Table was dropped                                                                                       |
| [DS103](#DS103) | Non-virtual column was dropped                                                                          |
| **MF**          | **[Data-dependent changes](#data-dependent-changes)** (changes that might fail)                         |
| [MF101](#MF101) | Add unique index to existing column                                                                     |
| [MF102](#MF102) | Modifying non-unique index to unique                                                                    |
| [MF103](#MF103) | Adding a non-nullable column to an existing table                                                       |
| [MF104](#MF104) | Modifying a nullable column to non-nullable                                                             |
| **PG**          | PostgreSQL specific checks                                                                              |
| [PG110](#PG110) | Creating table with non-optimal data alignment                                                          |
| **PG1**         | **[Concurrent Indexes](#concurrent-index-policy-postgresql)** &nbsp <LoginRequired/>                    |
| [PG101](#PG101) | Missing the `CONCURRENTLY` in index creation                                                            |
| [PG102](#PG102) | Missing the `CONCURRENTLY` in index deletion                                                            |
| [PG103](#PG103) | Missing `atlas:txmode none` directive in file header                                                    |
| [PG104](#PG104) | `PRIMARY KEY` constraint creation that acquires an `ACCESS EXCLUSIVE` lock on the table                 |
| [PG105](#PG105) | `UNIQUE` constraint creation that acquires an `ACCESS EXCLUSIVE` lock on the table                      |
| **PG3**         | PostgreSQL-specific blocking table changes &nbsp <LoginRequired/>                                       |
| [PG301](#PG301) | Column type change that requires table and indexes rewrite                                              |
| [PG302](#PG302) | Adding a column with a volatile `DEFAULT` value requires a rewrite of the table                         |
| [PG303](#PG303) | Modifying a nullable column to non-nullable requires a full table scan                                  |
| [PG304](#PG304) | Adding a `PRIMARY KEY` on nullable columns implicitly set them to `NOT NULL` requires a full table scan |
| [PG305](#PG305) | Adding a `CHECK` constraint that requires a full table scan                                             |
| [PG306](#PG306) | Adding a `FOREIGN KEY` constraint that requires a full table scan and blocks write operations           |
| **MY**          | MySQL and MariaDB specific checks                                                                       |
| [MY101](#MY101) | Adding a non-nullable column without a `DEFAULT` value to an existing table                             |
| [MY102](#MY102) | Adding a column with an inline `REFERENCES` clause has no actual effect                                 |
| [MY110](#MY110) | Removing enum values from a column requires a table copy                                                |
| [MY111](#MY111) | Reordering enum values of a colum requires a table copy                                                 |
| [MY112](#MY112) | Inserting new enum values not at the end requires a table copy                                          |
| [MY113](#MY113) | Exceeding 256 enum values changes storage size and requires a table copy                                |
| [MY120](#MY120) | Removing set values from a column requires a table copy                                                 |
| [MY121](#MY121) | Reordering set values of a colum requires a table copy                                                  |
| [MY122](#MY122) | Inserting new set values not at the end requires a table copy                                           |
| [MY123](#MY123) | Exceeding 8, 16, 24, 32 or 64 set values changes the storage size and requires a table copy             |
| **NM**          | **[Naming Conventions](#naming-conventions-policy)**                                                    |
| [NM101](#NM101) | Schema name violates the naming convention                                                              |
| [NM102](#NM102) | Table name violates the naming convention                                                               |
| [NM103](#NM103) | Column name violates the naming convention                                                              |
| [NM104](#NM104) | Index name violates the naming convention                                                               |
| [NM105](#NM105) | Foreign-key constraint name violates the naming convention                                              |
| [NM106](#NM106) | Check constraint name violates the naming convention                                                    |
| **LT**          | SQLite specific checks                                                                                  |
| [LT101](#LT101) | Modifying a nullable column to non-nullable without a `DEFAULT` value                                   |
