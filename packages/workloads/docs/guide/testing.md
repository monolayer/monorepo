# Testing Helpers

The [test-helpers](./../reference/api//test-helpers/index.md#functions) module provides functions to make testing applications with workloads easier:

## PostgresDatabase

| Helper | Description|
| - | - |
| [`truncatePostgresTables`](./../reference/api/test-helpers/functions/truncatePostgresTables.md) | Empties all tables in a database. |

## MysqlDatabase

| Helper | Description |
| - | - |
| [`truncateMySqlTables`](./../reference/api/test-helpers/functions/truncateMySqlTables.md) | Empties all tables in a database. |

## Redis

| Helper | Description |
| - | - |
| [`flushRedis`](./../reference/api/test-helpers/functions/flushRedis.md) | deletes all the keys of the currently selected database. |

## Mailer

| Helper | Description |
| - | - |
| [`deleteMailerMessages`](./../reference/api/test-helpers/functions/deleteMailerMessages.md) | Deletes messages. |
| [`mailerMesages`](./../reference/api/test-helpers/functions/mailerMesages.md) | Get all messages. |
| [`mailerMessageText`](./../reference/api/test-helpers/functions/mailerMessageText.md) | Get the text part of a message. |
| [`mailerMessageHTML`](./../reference/api/test-helpers/functions/mailerMessageHTML.md) | Get the HTML part of a message. |
