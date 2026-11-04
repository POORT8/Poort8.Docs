# 9: Database Migrations

This project uses Entity Framework Core with three database providers: SQLite (local development), PostgreSQL, and SQL Server. Each provider has its own migrations project.

## 9.1 Creating Migrations

The `--Provider` argument allows you to create migrations for any database provider with a single command. Run these from the `Poort8.Dataspace.CoreManager` directory, because CoreManager is the startup project that contains the DbContext registration logic required by the EF tooling.

### Organization Registry

```bash
# SQLite
dotnet ef migrations add YourMigrationName -c OrganizationContext --project ../Poort8.Dataspace.OrganizationRegistry.SqliteMigrations --namespace Poort8.Dataspace.OrganizationRegistry.SqliteMigrations.Migrations -- --Provider Sqlite

# PostgreSQL
dotnet ef migrations add YourMigrationName -c OrganizationContext --project ../Poort8.Dataspace.OrganizationRegistry.PostgreSqlMigrations --namespace Poort8.Dataspace.OrganizationRegistry.PostgreSqlMigrations.Migrations -- --Provider PostgreSql

# SQL Server
dotnet ef migrations add YourMigrationName -c OrganizationContext --project ../Poort8.Dataspace.OrganizationRegistry.SqlServerMigrations --namespace Poort8.Dataspace.OrganizationRegistry.SqlServerMigrations.Migrations -- --Provider SqlServer
```

### Authorization Registry

```bash
# SQLite
dotnet ef migrations add YourMigrationName -c AuthorizationContext --project ../Poort8.Dataspace.AuthorizationRegistry.SqliteMigrations --namespace Poort8.Dataspace.AuthorizationRegistry.SqliteMigrations.Migrations -- --Provider Sqlite

# PostgreSQL
dotnet ef migrations add YourMigrationName -c AuthorizationContext --project ../Poort8.Dataspace.AuthorizationRegistry.PostgreSqlMigrations --namespace Poort8.Dataspace.AuthorizationRegistry.PostgreSqlMigrations.Migrations -- --Provider PostgreSql

# SQL Server
dotnet ef migrations add YourMigrationName -c AuthorizationContext --project ../Poort8.Dataspace.AuthorizationRegistry.SqlServerMigrations --namespace Poort8.Dataspace.AuthorizationRegistry.SqlServerMigrations.Migrations -- --Provider SqlServer
```

### How It Works

The `-- --Provider X` syntax passes the provider argument to the application's configuration system. The `DatabaseExtension.cs` reads this and configures the correct database provider, so migrations are generated directly into the target project.

**Accepted provider values:**
- SQLite: `Sqlite`
- PostgreSQL: `PostgreSql`
- SQL Server: `SqlServer`

## 9.2 PostgreSQL with Microsoft Entra Authentication

NoodleBar connects to Azure Database for PostgreSQL using Microsoft Entra access tokens, not database passwords. Select PostgreSQL with `Provider=PostgreSql`. The existing `DataspaceConfig:<instance>:UsePostgreSql=true` setting selects the same authentication behavior when neither `Provider` nor `UseSqlite=true` overrides it.

Before starting the application:

- Enable Microsoft Entra authentication on the PostgreSQL server and configure an Entra administrator.
- Assign the intended user-assigned managed identity to App Service and set `AZURE_CLIENT_ID` to its client ID in the App Service application settings, not just in the deployment runner's environment.
- Have the Entra administrator create a PostgreSQL principal mapped to that identity. Microsoft documents `pgaadauth_create_principal` for this purpose; run it from the `postgres` database. Grant the principal access to each application database it needs.
- Supply both registry connection strings, including the PostgreSQL principal name as `Username`. Do not include a `Password` or `Passfile`.

For example, replace the placeholders below with values supplied by the database administrator:

```json
{
	"Provider": "PostgreSql",
	"OrganizationRegistry": {
		"ConnectionString": "Host=<host>;Port=<port>;Database=<database>;Username=<principal-name>;SSL Mode=VerifyFull"
	},
	"AuthorizationRegistry": {
		"ConnectionString": "Host=<host>;Port=<port>;Database=<database>;Username=<principal-name>;SSL Mode=VerifyFull"
	}
}
```

Both connection strings can point to the same database. Confirm the host, port and TLS requirements with the administrator, including whether the endpoint uses PgBouncer. For environment-variable configuration, use `OrganizationRegistry__ConnectionString` and `AuthorizationRegistry__ConnectionString`.

The application uses `ManagedIdentityCredential` with the user-assigned managed identity selected by the required `AZURE_CLIENT_ID` setting, and automatically obtains and refreshes tokens for `https://ossrdbms-aad.database.windows.net/.default`. PostgreSQL authentication does not fall back to a system-assigned identity, Azure CLI sign-ins or client-secret credentials. Local development uses SQLite. Any EF tooling operation that connects to PostgreSQL must run in an environment where the configured user-assigned managed identity is available and has the required database permissions.

NoodleBar applies migrations for both registries at application startup. The database must already exist. In addition to runtime permissions (`CONNECT`, schema `USAGE`, table CRUD and any required sequence permissions), the application's principal needs schema `CREATE` and ownership or effective owner-role permissions to alter existing application objects. The migrations create and alter tables, indexes, constraints and an ICU collation; include access to the EF migration history table. Limit these permissions to the application database and schema; server administrator privileges are not required. Granting both runtime and migration roles to the same identity means the running application retains migration permissions.

See [Microsoft's managed identity connection guide ➚](https://learn.microsoft.com/en-us/azure/postgresql/security/security-connect-with-managed-identity) for principal provisioning details.