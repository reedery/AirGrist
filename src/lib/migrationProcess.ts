import { AirtableService } from "./airtable";
import { GristService } from "./grist";
import { AirtableTable } from "./airtable";
import {
  airtableToGristTable,
  migrateTable,
  airtableToGristRecord
} from "./migrationTable";

export interface RelationConfig {
  sourceTableId: string;
  sourceFieldId: string;
  targetTableId: string;
  targetFieldId: string;
  isActive: boolean;
}

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
  relations?: RelationConfig[];
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
  const {
    airtableService,
    gristService,
    source,
    destination,
    relations = [],
    onProgress
  } = config;
  const errors: Error[] = [];
  const tableIds: string[] = [];
  const recordMappings: Record<string, Record<string, number>> = {};

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
    //const tableSchemas: Record<string, AirtableTable> = {};

    onProgress?.({
      currentTable: 0,
      totalTables: source.tableIds.length,
      tableName: "",
      status: "fetching"
    });

    const tablesSchema = (await airtableService.getTablesSchema(
      source.baseId
    )) as Record<string, AirtableTable>;
    // tableSchemas[tableId] = tableSchema;

    // Fetch schemas for all selected tables
    for (const tableId of source.tableIds) {
      // Convert Airtable table to Grist format
      const [gristTable, gristTableMapping] = airtableToGristTable(
        tablesSchema,
        tableId,
        relations
      );
      gristTables.push(gristTable);
      gristTableMappings.push(gristTableMapping);
    }
    console.log("Grist Tables:", gristTables);
    console.log("Grist Table Mappings:", gristTableMappings);
    console.log("Table Schemas:", tablesSchema);
    //reverse the gristTables array
    gristTables.reverse();

    /*gristTables.forEach((gristTable) => {
      gristTable.columns.forEach((column) => {
        if (column.fields.type === GristFieldTypeEnum.LINK) {
          column.fields.type = `Ref:${column.fields.widgetOptions.refTlinkedTableId}`;
        }
      });
    });*/

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
    console.log("Created Table IDs:", createdTableIds);

    createdTableIds.reverse();
    //source.tableIds.reverse();
    // Migrate data for each table
    for (let i = 0; i < source.tableIds.length; i++) {
      const airtableTableId = source.tableIds[i];
      const gristTableId = createdTableIds[i];
      const tableName = tablesSchema[airtableTableId].name;
      const gristTableMapping = gristTableMappings[i];

      console.log("Airtable Table ID:", airtableTableId);
      console.log("Grist Table ID:", gristTableId);
      console.log("Migrating Table:", tableName);
      console.log("Grist Table Mapping:", gristTableMapping);
      onProgress?.({
        currentTable: i + 1,
        totalTables: source.tableIds.length,
        tableName,
        status: "migrating"
      });

      try {
        // Récupérer les enregistrements Airtable
        const airtableRecords = await airtableService.getAllRecords(
          source.baseId,
          airtableTableId
        );

        // Créer un mapping des IDs Airtable vers les IDs Grist
        const tableRecordMapping: Record<string, number> = {};
        const gristRecords = airtableRecords.map((record, index) => {
          const gristRecord = airtableToGristRecord(
            record,
            gristTableMapping,
            index
          );
          // Stocker le mapping pour les relations
          tableRecordMapping[record.id] = index + 1; // Grist utilise des IDs 1-based
          return gristRecord;
        });

        // Ajouter les enregistrements à Grist
        await gristService.addRecordsToTable(
          documentId,
          gristTableId,
          gristRecords
        );

        // Stocker le mapping pour cette table
        recordMappings[airtableTableId] = tableRecordMapping;
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

    // Mettre à jour les relations après avoir migré toutes les tables
    for (const relation of relations) {
      try {
        const sourceTableId =
          createdTableIds[source.tableIds.indexOf(relation.sourceTableId)];
        const targetTableId =
          createdTableIds[source.tableIds.indexOf(relation.targetTableId)];

        if (!sourceTableId || !targetTableId) {
          throw new Error(`Table source ou cible non trouvée pour la relation`);
        }

        // Mettre à jour la colonne de référence dans Grist (côté source)
        await gristService.updateColumnReference(
          documentId,
          sourceTableId,
          relation.sourceFieldId,
          targetTableId,
          recordMappings[relation.targetTableId]
        );

        // Mettre à jour la colonne de référence inverse si elle existe (côté cible)
        const targetTable = tablesSchema[relation.targetTableId];
        const sourceTable = tablesSchema[relation.sourceTableId];
        const targetField = targetTable?.fields?.find(
          (f) => f.id === relation.targetFieldId
        );
        if (targetField) {
          // On prend le champ principal de la table source pour l'affichage
          const sourcePrimaryFieldId = sourceTable.primaryFieldId;
          // Construction de la formule
          const formula = `${sourceTableId}.lookupRecords(${relation.sourceFieldId}=$id).${sourcePrimaryFieldId}`;
          console.log("Appel updateColumnFormula", {
            documentId,
            targetTableId,
            relation,
            targetField,
            formula
          });
          // PUT sur la colonne cible
          await gristService.updateColumnFormula(
            documentId,
            targetTableId,
            relation.targetFieldId,
            {
              isFormula: true,
              formula,
              label: `${sourceTable.name}_Name`
            }
          );
        }
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
        onProgress?.({
          currentTable: source.tableIds.length,
          totalTables: source.tableIds.length,
          tableName: "Relations",
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
