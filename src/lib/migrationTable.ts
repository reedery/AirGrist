import { GristFieldType, GristTable, GristColumn } from "./grist";

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

interface AirtableField {
  id: string;
  name: string;
  type: string;
  options?: {
    choices?: Array<{ name: string }>;
  };
}

interface AirtableTable {
  name: string;
  fields: AirtableField[];
}

/**
 * Convert Airtable table schema to Grist table schema
 */
export function airtableToGristTable(
  airtableTable: AirtableTable
): [GristTable, Record<string, string>] {
  const mapping: Record<string, string> = {};
  const columns: GristColumn[] = airtableTable.fields.map(
    (airtableField: AirtableField) => {
      mapping[airtableField.name] = airtableField.id;

      const [gristType, widgetOptions] =
        airtableToGristFieldType(airtableField);

      return {
        id: airtableField.id,
        fields: {
          label: airtableField.name,
          type: gristType,
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
  airtableField: AirtableField
): [GristFieldType, Record<string, unknown> | null] {
  const typeMapping: Record<string, GristFieldType> = {
    singleLineText: GristFieldType.TEXT,
    multilineText: GristFieldType.TEXT,
    richText: GristFieldType.TEXT,
    email: GristFieldType.TEXT,
    url: GristFieldType.TEXT,
    phoneNumber: GristFieldType.TEXT,
    number: GristFieldType.NUMERIC,
    currency: GristFieldType.NUMERIC,
    percent: GristFieldType.NUMERIC,
    date: GristFieldType.DATE,
    dateTime: GristFieldType.DATETIME,
    checkbox: GristFieldType.BOOL,
    singleSelect: GristFieldType.CHOICE,
    multipleSelects: GristFieldType.CHOICE_LIST,
    formula: GristFieldType.TEXT, // Will need special handling
    attachment: GristFieldType.TEXT, // Store as URLs/text
    autoNumber: GristFieldType.INT,
    barcode: GristFieldType.TEXT,
    button: GristFieldType.TEXT,
    collaborator: GristFieldType.TEXT,
    count: GristFieldType.INT,
    createdBy: GristFieldType.TEXT,
    createdTime: GristFieldType.DATETIME,
    duration: GristFieldType.NUMERIC,
    lastModifiedBy: GristFieldType.TEXT,
    lastModifiedTime: GristFieldType.DATETIME,
    lookup: GristFieldType.TEXT,
    rating: GristFieldType.INT,
    rollup: GristFieldType.TEXT,
    multipleRecordLinks: GristFieldType.TEXT,
    singleRecordLink: GristFieldType.TEXT
  };

  const gristType = typeMapping[airtableField.type] || GristFieldType.TEXT;

  if (gristType === GristFieldType.CHOICE && airtableField.options?.choices) {
    return [
      gristType,
      { choices: airtableField.options.choices.map((choice) => choice.name) }
    ];
  }
  if (
    gristType === GristFieldType.CHOICE_LIST &&
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
  gristTableMapping: Record<string, string>
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
