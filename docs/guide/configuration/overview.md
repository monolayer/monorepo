
# Configuration
The Prisma schema file (short: schema file, Prisma schema or schema) is the main configuration file for your Prisma ORM setup. It is typically called schema.prisma and consists of the following parts:


Whenever a prisma command is invoked, the CLI typically reads some information from the schema file, e.g.:

prisma generate: Reads all above mentioned information from the Prisma schema to generate the correct data source client code (e.g. Prisma Client).
prisma migrate dev: Reads the data sources and data model definition to create a new migration.
You can also use environment variables inside the schema file to provide configuration options when a CLI command is invoked.
