import {
  GristFieldTypeEnum,
  GristTable,
  GristColumn,
  GristFieldType
} from "./grist";
import { GristService } from "./grist";
import { AirtableTable, AirtableField, AirtableService } from "./airtable";
import { capitalizeFirstLetter } from "./utils";

type AirtableFieldValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | boolean[]
  | null;

interface AirtableRecord {
  fields: Record<string, AirtableFieldValue>;
}

interface GristRecord {
  [key: string]:
    | string
    | number
    | boolean
    | (string | number | boolean)[]
    | null;
}

/*interface AirtableField {
  id: string;
  name: string;
  type: string;
  options?: {
    linkedTableId: unknown;
    choices?: Array<{ name: string }>;
  };
}*/

/*nterface AirtableTable {
  name: string;
  id: string;
  fields: AirtableField[];
}*/
interface MigrationConfig {
  airtableService: AirtableService;
  gristService: GristService;
  source: {
    baseId: string;
    tableId: string;
  };
  destination: {
    documentId: string;
    tableId: string;
  };
  mapping: Record<string, string>;
}

/**
 * Migrate a single Airtable table to Grist
 * @param config - Migration configuration containing services and identifiers
 */
export async function migrateTable(config: MigrationConfig): Promise<void> {
  const { airtableService, gristService, source, destination, mapping } =
    config;

  // Fetch all records from Airtable
  const airtableRecords = await airtableService.getAllRecords(
    source.baseId,
    source.tableId
  );

  if (airtableRecords.length === 0) return;

  const gristRecords = airtableRecords.map((record, index) =>
    // Convert Airtable record to Grist record using the provided mapping
    airtableToGristRecord(record, mapping, index)
  );

  // Add records to Grist in batches
  const batchSize = 100;
  for (let i = 0; i < gristRecords.length; i += batchSize) {
    const batch = gristRecords.slice(i, i + batchSize);
    await gristService.addRecordsToTable(
      destination.documentId,
      destination.tableId,
      batch
    );
  }
}

/**
 * Convert Airtable table schema to Grist table schema
 */
export function airtableToGristTable(
  tablesSchema: Record<string, AirtableTable>,
  tableId: string
): [GristTable, Record<string, string>] {
  console.log(tablesSchema);
  console.log(tableId);
  // Validate tableId exists in the schema
  const airtableTable = tablesSchema[tableId];

  if (!airtableTable) {
    throw new Error(`Table with ID ${tableId} not found in Airtable schema`);
  }

  const mapping: Record<string, string> = {};
  const columns: GristColumn[] = airtableTable.fields.map(
    (airtableField: AirtableField) => {
      mapping[airtableField.name] = airtableField.id;

      const [gristType, widgetOptions] = airtableToGristFieldType(
        airtableField,
        tablesSchema
      );

      let relation,
        visibleCol = null;
      if (
        gristType === GristFieldTypeEnum.LINK &&
        airtableField.options &&
        airtableField.options.linkedTableId
      ) {
        relation = ("Ref:" +
          capitalizeFirstLetter(
            tablesSchema[airtableField.options.linkedTableId].name
          )) as GristFieldType;
        const referencedFieldID = tablesSchema[
          airtableField.options.linkedTableId
        ].fields.find((t) => t.id === airtableField.options.inverseLinkFieldId);
        // find the index of the referenced field in the linked table
        visibleCol = tablesSchema[
          airtableField.options.linkedTableId
        ].fields.findIndex(
          (t) => t.id === airtableField.options.inverseLinkFieldId
        );
      }

      return {
        id: airtableField.id,
        fields: {
          label: airtableField.name,
          type: relation || gristType,
          visibleCol,
          widgetOptions:
            widgetOptions == null ? undefined : JSON.stringify(widgetOptions)
        }
      };
    }
  );

  return [
    {
      id: airtableTable.name,
      columns
    },
    mapping
  ];
}

/**
 * Convert Airtable field type to Grist field type
 */
export function airtableToGristFieldType(
  airtableField: AirtableField,
  tablesSchema: Record<string, AirtableTable>
): [GristFieldType, Record<string, unknown> | null] {
  const typeMapping: Record<string, GristFieldTypeEnum> = {
    singleLineText: GristFieldTypeEnum.TEXT,
    multilineText: GristFieldTypeEnum.TEXT,
    richText: GristFieldTypeEnum.TEXT,
    email: GristFieldTypeEnum.TEXT,
    url: GristFieldTypeEnum.TEXT,
    phoneNumber: GristFieldTypeEnum.TEXT,
    number: GristFieldTypeEnum.NUMERIC,
    currency: GristFieldTypeEnum.NUMERIC,
    percent: GristFieldTypeEnum.NUMERIC,
    date: GristFieldTypeEnum.DATE,
    dateTime: GristFieldTypeEnum.DATETIME,
    checkbox: GristFieldTypeEnum.BOOL,
    singleSelect: GristFieldTypeEnum.CHOICE,
    multipleSelects: GristFieldTypeEnum.CHOICE_LIST,
    formula: GristFieldTypeEnum.TEXT,
    attachment: GristFieldTypeEnum.TEXT,
    autoNumber: GristFieldTypeEnum.INT,
    barcode: GristFieldTypeEnum.TEXT,
    button: GristFieldTypeEnum.TEXT,
    collaborator: GristFieldTypeEnum.TEXT,
    count: GristFieldTypeEnum.INT,
    createdBy: GristFieldTypeEnum.TEXT,
    createdTime: GristFieldTypeEnum.DATETIME,
    duration: GristFieldTypeEnum.NUMERIC,
    lastModifiedBy: GristFieldTypeEnum.TEXT,
    lastModifiedTime: GristFieldTypeEnum.DATETIME,
    lookup: GristFieldTypeEnum.TEXT,
    rating: GristFieldTypeEnum.INT,
    rollup: GristFieldTypeEnum.TEXT,
    multipleRecordLinks: GristFieldTypeEnum.LINK,
    singleRecordLink: GristFieldTypeEnum.LINK
  };

  const gristType = typeMapping[airtableField.type] || GristFieldTypeEnum.TEXT;

  if (
    gristType === GristFieldTypeEnum.CHOICE &&
    airtableField.options?.choices
  ) {
    return [
      gristType,
      { choices: airtableField.options.choices.map((choice) => choice.name) }
    ];
  }
  if (
    gristType === GristFieldTypeEnum.CHOICE_LIST &&
    airtableField.options?.choices
  ) {
    return [
      gristType,
      { choices: airtableField.options.choices.map((choice) => choice.name) }
    ];
  }

  return [gristType, null];
}

export function airtableToGristRecord(
  airtableRecord: AirtableRecord,
  gristTableMapping: Record<string, string>,
  index: number
): GristRecord {
  const gristFields: GristRecord = {};

  for (const field in airtableRecord.fields) {
    const value = airtableRecord.fields[field];

    let result:
      | string
      | number
      | boolean
      | (string | number | boolean)[]
      | null;
    if (typeof value === "string") result = value;
    else if (typeof value === "number") result = value;
    else if (typeof value === "boolean") result = value;
    else if (Array.isArray(value)) {
      if (value.length === 1) {
        result = value[0];
      } else {
        result = ["L", ...value];
      }
    } else result = null;

    if (gristTableMapping[field]) {
      gristFields[gristTableMapping[field]] = result;
    }
  }

  return gristFields;
}
