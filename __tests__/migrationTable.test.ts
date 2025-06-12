import { describe, it, expect } from "vitest";
import {
  airtableToGristTable,
  airtableToGristFieldType,
  airtableToGristRecord
} from "../src/lib/migrationTable";
import { GristFieldType } from "../src/lib/grist";

describe("Migration Table Functions", () => {
  describe("airtableToGristFieldType", () => {
    it("devrait convertir les types de champs Airtable en types Grist", () => {
      const testCases = [
        {
          input: { type: "singleLineText" },
          expected: [GristFieldType.TEXT, null]
        },
        {
          input: { type: "number" },
          expected: [GristFieldType.NUMERIC, null]
        },
        {
          input: {
            type: "singleSelect",
            options: {
              choices: [{ name: "Option 1" }, { name: "Option 2" }]
            }
          },
          expected: [
            GristFieldType.CHOICE,
            { choices: ["Option 1", "Option 2"] }
          ]
        },
        {
          input: {
            type: "multipleSelects",
            options: {
              choices: [{ name: "Option A" }, { name: "Option B" }]
            }
          },
          expected: [
            GristFieldType.CHOICE_LIST,
            { choices: ["Option A", "Option B"] }
          ]
        },
        {
          input: { type: "unknownType" },
          expected: [GristFieldType.TEXT, null]
        }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(airtableToGristFieldType(input)).toEqual(expected);
      });
    });
  });

  describe("airtableToGristTable", () => {
    it("devrait convertir un schéma de table Airtable en format Grist", () => {
      const airtableTable = {
        name: "Test Table",
        fields: [
          {
            id: "fld1",
            name: "Name",
            type: "singleLineText"
          },
          {
            id: "fld2",
            name: "Age",
            type: "number"
          },
          {
            id: "fld3",
            name: "Status",
            type: "singleSelect",
            options: {
              choices: [{ name: "Active" }, { name: "Inactive" }]
            }
          }
        ]
      };

      const [gristTable, mapping] = airtableToGristTable(airtableTable);

      // Vérifier la structure de la table
      expect(gristTable).toEqual({
        id: "Test Table",
        columns: expect.arrayContaining([
          expect.objectContaining({
            id: "fld1",
            fields: expect.objectContaining({
              label: "Name",
              type: GristFieldType.TEXT
            })
          }),
          expect.objectContaining({
            id: "fld2",
            fields: expect.objectContaining({
              label: "Age",
              type: GristFieldType.NUMERIC
            })
          }),
          expect.objectContaining({
            id: "fld3",
            fields: expect.objectContaining({
              label: "Status",
              type: GristFieldType.CHOICE,
              widgetOptions: JSON.stringify({ choices: ["Active", "Inactive"] })
            })
          })
        ])
      });

      // Vérifier le mapping
      expect(mapping).toEqual({
        Name: "fld1",
        Age: "fld2",
        Status: "fld3"
      });
    });
  });

  describe("airtableToGristRecord", () => {
    it("devrait convertir un enregistrement Airtable en format Grist", () => {
      const airtableRecord = {
        fields: {
          Name: "John Doe",
          Age: 30,
          Status: "Active",
          Tags: ["Tag1", "Tag2"],
          Empty: null
        }
      };

      const mapping = {
        Name: "fldName",
        Age: "fldAge",
        Status: "fldStatus",
        Tags: "fldTags",
        Empty: "fldEmpty"
      };

      const result = airtableToGristRecord(airtableRecord, mapping);

      expect(result).toEqual({
        fldName: "John Doe",
        fldAge: 30,
        fldStatus: "Active",
        fldTags: ["L", "Tag1", "Tag2"],
        fldEmpty: null
      });
    });

    it("devrait gérer les tableaux avec un seul élément", () => {
      const airtableRecord = {
        fields: {
          Tags: ["SingleTag"]
        }
      };

      const mapping = {
        Tags: "fldTags"
      };

      const result = airtableToGristRecord(airtableRecord, mapping);

      expect(result).toEqual({
        fldTags: "SingleTag"
      });
    });

    it("devrait ignorer les champs non mappés", () => {
      const airtableRecord = {
        fields: {
          Name: "John Doe",
          Unmapped: "Value"
        }
      };

      const mapping = {
        Name: "fldName"
      };

      const result = airtableToGristRecord(airtableRecord, mapping);

      expect(result).toEqual({
        fldName: "John Doe"
      });
    });
  });
});
