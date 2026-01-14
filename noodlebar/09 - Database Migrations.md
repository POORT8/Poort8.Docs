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