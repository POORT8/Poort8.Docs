# 9: Database Migrations

### 9.1 Running Migrations

1. Make sure the UseSqlite setting is set to true
2. Copy the migrations folder from Poort8.Dataspace.(_Organization/Authorization_)Registry.SqliteMigrations, depending on whether you changed Organization registry or Authorization registry data models.
3. In the AddOrganizationRegistrySqlite method in the Poort8.Dataspace.(_Organization/Authorization_)Registry.Extensions.DefaultExtension class, change the MigrationsAssembly from 'Poort8.Dataspace.(_Organization/Authorization_)Registry.SqliteMigrations' to 'Poort8.Dataspace.CoreManager'. This points the startup process to migration files of step 2.
4. Execute entity framework command to generate the migration script:
 * Package Manager Console:
```bash
Add-Migration SuitableNameForYourChange -Context (Organization/Authorization)Context
```
 * CLI:
```bash
dotnet ef migrations add SuitableNameForYourChange -c (Organization/Authorization)Context
```
5. Copy the new migration .cs and .Designer.cs files (named _SuitableNameForYourChange_) created in the folder from step 1 along with the (_Organization/Authorization_)ContextModelSnapshot.cs from that folder to the original migrations folder.
6. Revert the name change of step 3.
7. Make sure the UseSqlite setting is set to false and the "DataspaceConfig:NoodleBar:UsePostgreSql" is set to true (when NoodleBar is default Dataspace in appsettings.Development.json, else, use that dataspace name)
8. Repeat step 2 to 6 but now for the PostgreSqlMigrations project instead of the SqliteMigrations.
9. Make sure the UseSqlite setting and the "DataspaceConfig:NoodleBar:UsePostgreSql" are set to false now (when NoodleBar is default Dataspace in appsettings.Development.json, else, use that dataspace name)
10. Repeat step 2 to 6 but now for the SqlServerMigrations project instead of the SqliteMigrations.
11. Revert the changes from step 9, 7 and 1, in that order to end up with initial configuration.

Note: One could use bash script create-migration.sh for convenience by running 
```bash
./create-migration.sh SuitableNameForYourChange (Organization/Authorization)
```
It should create all migration files automatically, but the script could be very buggy, especially around changes in appsettings.Development.json and/or project name changes. On first use, make script runnable by executing chmod for setting correct permissions for the script file:
```bash
chmod +x create-migration.sh
```