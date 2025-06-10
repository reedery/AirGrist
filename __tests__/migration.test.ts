import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  airtableToGristRecord,
  migrateTable,
  migrateTables
} from "../src/lib/migration";
import { AirtableService } from "../src/lib/airtable";
import { GristService } from "../src/lib/grist";

describe("Migration Functions", () => {
  describe("airtableToGristRecord", () => {
    it("should map Airtable fields to Grist fields using mapping", () => {
      const airtableRecord = {
        id: "rec123",
        fields: {
          Name: "Alice",
          Age: 30,
          Email: "alice@example.com"
        }
      };
      const mapping = {
        Name: "full_name",
        Age: "user_age",
        Email: "contact_email"
      };

      const gristRecord = airtableToGristRecord(airtableRecord, mapping);

      expect(gristRecord).toEqual({
        full_name: "Alice",
        user_age: 30,
        contact_email: "alice@example.com"
      });
    });

    it("should handle different field types correctly", () => {
      const airtableRecord = {
        id: "rec123",
        fields: {
          Text: "Hello",
          Number: 42,
          Boolean: true,
          Array: ["item1", "item2"],
          SingleItemArray: ["single"],
          Missing: null as unknown as string // Simuler un champ manquant
        }
      };
      const mapping = {
        Text: "text_field",
        Number: "number_field",
        Boolean: "bool_field",
        Array: "array_field",
        SingleItemArray: "single_array_field",
        Missing: "missing_field"
      };

      const gristRecord = airtableToGristRecord(airtableRecord, mapping);

      expect(gristRecord).toEqual({
        text_field: "Hello",
        number_field: 42,
        bool_field: true,
        array_field: ["L", "item1", "item2"],
        single_array_field: "single",
        missing_field: null
      });
    });

    it("should ignore fields not in mapping", () => {
      const airtableRecord = {
        id: "rec456",
        fields: {
          Name: "Bob",
          Age: 25,
          Extra: "should be ignored"
        }
      };
      const mapping = {
        Name: "full_name",
        Age: "user_age"
      };

      const gristRecord = airtableToGristRecord(airtableRecord, mapping);

      expect(gristRecord).toEqual({
        full_name: "Bob",
        user_age: 25
      });
    });

    it("should return empty object if mapping is empty", () => {
      const airtableRecord = {
        id: "rec789",
        fields: {
          Name: "Charlie"
        }
      };
      const mapping = {};

      const gristRecord = airtableToGristRecord(airtableRecord, mapping);

      expect(gristRecord).toEqual({});
    });
  });

  describe("migrateTable", () => {
    let mockAirtableService: AirtableService;
    let mockGristService: GristService;

    beforeEach(() => {
      mockAirtableService = {
        getAllRecords: vi.fn()
      } as unknown as AirtableService;

      mockGristService = {
        addRecordsToTable: vi.fn()
      } as unknown as GristService;
    });

    it("should migrate records successfully", async () => {
      const mockRecords = [
        {
          id: "rec1",
          fields: { Name: "Alice", Age: 30 }
        },
        {
          id: "rec2",
          fields: { Name: "Bob", Age: 25 }
        }
      ];

      mockAirtableService.getAllRecords = vi
        .fn()
        .mockResolvedValue(mockRecords);
      mockGristService.addRecordsToTable = vi.fn().mockResolvedValue(undefined);

      await migrateTable({
        airtableService: mockAirtableService,
        gristService: mockGristService,
        source: {
          baseId: "base123",
          tableId: "table123"
        },
        destination: {
          documentId: "doc123",
          tableId: "gristTable123"
        },
        mapping: {
          Name: "name",
          Age: "age"
        }
      });

      expect(mockAirtableService.getAllRecords).toHaveBeenCalledWith(
        "base123",
        "table123"
      );
      expect(mockGristService.addRecordsToTable).toHaveBeenCalledWith(
        "doc123",
        "gristTable123",
        [
          { name: "Alice", age: 30 },
          { name: "Bob", age: 25 }
        ]
      );
    });

    it("should handle empty records", async () => {
      mockAirtableService.getAllRecords = vi.fn().mockResolvedValue([]);

      await migrateTable({
        airtableService: mockAirtableService,
        gristService: mockGristService,
        source: {
          baseId: "base123",
          tableId: "table123"
        },
        destination: {
          documentId: "doc123",
          tableId: "gristTable123"
        },
        mapping: {}
      });

      expect(mockGristService.addRecordsToTable).not.toHaveBeenCalled();
    });
  });

  describe("migrateTables", () => {
    let mockAirtableService: AirtableService;
    let mockGristService: GristService;
    let onProgressCallback: vi.Mock;

    beforeEach(() => {
      mockAirtableService = {
        getTableSchema: vi.fn(),
        getAllRecords: vi.fn()
      } as unknown as AirtableService;

      mockGristService = {
        createDocument: vi.fn(),
        addTablesToDocument: vi.fn(),
        addRecordsToTable: vi.fn()
      } as unknown as GristService;

      onProgressCallback = vi.fn();
    });

    it("should migrate multiple tables successfully", async () => {
      // Mock table schemas
      const mockTableSchemas = [
        {
          name: "Table1",
          fields: [
            { name: "Name", type: "singleLineText" },
            { name: "Age", type: "number" }
          ]
        },
        {
          name: "Table2",
          fields: [
            { name: "Email", type: "email" },
            { name: "Active", type: "checkbox" }
          ]
        }
      ];

      // Mock records for each table
      const mockRecords = [
        [
          { id: "rec1", fields: { Name: "Alice", Age: 30 } },
          { id: "rec2", fields: { Name: "Bob", Age: 25 } }
        ],
        [
          { id: "rec3", fields: { Email: "alice@example.com", Active: true } },
          { id: "rec4", fields: { Email: "bob@example.com", Active: false } }
        ]
      ];

      // Setup mocks
      mockAirtableService.getTableSchema = vi
        .fn()
        .mockResolvedValueOnce(mockTableSchemas[0])
        .mockResolvedValueOnce(mockTableSchemas[1]);

      mockAirtableService.getAllRecords = vi
        .fn()
        .mockResolvedValueOnce(mockRecords[0])
        .mockResolvedValueOnce(mockRecords[1]);

      mockGristService.createDocument = vi.fn().mockResolvedValue("doc123");
      mockGristService.addTablesToDocument = vi
        .fn()
        .mockResolvedValue(["table1", "table2"]);
      mockGristService.addRecordsToTable = vi.fn().mockResolvedValue(undefined);

      const result = await migrateTables({
        airtableService: mockAirtableService,
        gristService: mockGristService,
        source: {
          baseId: "base123",
          tableIds: ["table1", "table2"]
        },
        destination: {
          workspaceId: 123,
          documentName: "Test Document"
        },
        onProgress: onProgressCallback
      });

      // Verify results
      expect(result.documentId).toBe("doc123");
      expect(result.tableIds).toEqual(["table1", "table2"]);
      expect(result.errors).toHaveLength(0);

      // Verify progress callbacks
      expect(onProgressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "creating",
          currentTable: 0,
          totalTables: 2
        })
      );

      expect(onProgressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "fetching",
          currentTable: 0,
          totalTables: 2
        })
      );

      expect(onProgressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "migrating",
          tableName: "Table1",
          currentTable: 1,
          totalTables: 2
        })
      );

      expect(onProgressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "complete",
          currentTable: 2,
          totalTables: 2
        })
      );
    });

    it("should handle errors during migration", async () => {
      mockAirtableService.getTableSchema = vi
        .fn()
        .mockRejectedValue(new Error("Schema error"));
      mockGristService.createDocument = vi.fn().mockResolvedValue("doc123");

      await expect(
        migrateTables({
          airtableService: mockAirtableService,
          gristService: mockGristService,
          source: {
            baseId: "base123",
            tableIds: ["table1"]
          },
          destination: {
            workspaceId: 123,
            documentName: "Test Document"
          },
          onProgress: onProgressCallback
        })
      ).rejects.toThrow("Schema error");

      expect(onProgressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          error: expect.any(Error)
        })
      );
    });
  });
});
