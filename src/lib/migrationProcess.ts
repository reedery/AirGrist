import { AirtableService } from "./airtable";
import { GristService } from "./grist";
import { AirtableTable } from "./airtable";
import { airtableToGristTable, migrateTable } from "./migrationTable";

interface MigrationTablesConfig {
  airtableService: AirtableService;
  gristService: GristService;
  source: {
    baseId: string;
    tableIds: string[];
  };
  destination: {
    workspaceId: number;
    documentName: string;
  };
  onProgress?: (progress: {
    currentTable: number;
    totalTables: number;
    tableName: string;
    status: "fetching" | "creating" | "migrating" | "complete" | "error";
    error?: Error;
  }) => void;
}

interface MigrationResult {
  documentId: string;
  tableIds: string[];
  errors: Error[];
}

export async function migrateTables(
  config: MigrationTablesConfig
): Promise<MigrationResult> {
  const { airtableService, gristService, source, destination, onProgress } =
    config;
  const errors: Error[] = [];
  const tableIds: string[] = [];

  try {
    // Create a new Grist document
    onProgress?.({
      currentTable: 0,
      totalTables: source.tableIds.length,
      tableName: "",
      status: "creating"
    });

    const documentId = await gristService.createDocument(
      destination.workspaceId,
      destination.documentName
    );

    // Fetch schemas and prepare tables
    const gristTables = [];
    const gristTableMappings = [];
    const tableSchemas: Record<string, AirtableTable> = {};

    onProgress?.({
      currentTable: 0,
      totalTables: source.tableIds.length,
      tableName: "",
      status: "fetching"
    });

    // Fetch schemas for all selected tables
    for (const tableId of source.tableIds) {
      const tableSchema = await airtableService.getTableSchema(
        source.baseId,
        tableId
      );
      tableSchemas[tableId] = tableSchema;

      // Convert Airtable table to Grist format
      const [gristTable, gristTableMapping] = airtableToGristTable(tableSchema);
      gristTables.push(gristTable);
      gristTableMappings.push(gristTableMapping);
    }

    // Create tables in Grist
    onProgress?.({
      currentTable: 0,
      totalTables: source.tableIds.length,
      tableName: "",
      status: "creating"
    });

    const createdTableIds = await gristService.addTablesToDocument(
      documentId,
      gristTables
    );

    // Migrate data for each table
    for (let i = 0; i < source.tableIds.length; i++) {
      const airtableTableId = source.tableIds[i];
      const gristTableId = createdTableIds[i];
      const tableName = tableSchemas[airtableTableId].name;
      const gristTableMapping = gristTableMappings[i];

      onProgress?.({
        currentTable: i + 1,
        totalTables: source.tableIds.length,
        tableName,
        status: "migrating"
      });

      try {
        await migrateTable({
          airtableService,
          gristService,
          source: {
            baseId: source.baseId,
            tableId: airtableTableId
          },
          destination: {
            documentId,
            tableId: gristTableId
          },
          mapping: gristTableMapping
        });
        tableIds.push(gristTableId);
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
        onProgress?.({
          currentTable: i + 1,
          totalTables: source.tableIds.length,
          tableName,
          status: "error",
          error: error instanceof Error ? error : new Error(String(error))
        });
      }
    }

    onProgress?.({
      currentTable: source.tableIds.length,
      totalTables: source.tableIds.length,
      tableName: "",
      status: "complete"
    });

    return { documentId, tableIds, errors };
  } catch (error) {
    const finalError =
      error instanceof Error ? error : new Error(String(error));
    errors.push(finalError);
    onProgress?.({
      currentTable: 0,
      totalTables: source.tableIds.length,
      tableName: "",
      status: "error",
      error: finalError
    });
    throw finalError;
  }
}
