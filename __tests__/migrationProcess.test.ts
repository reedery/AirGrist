import { describe, it, expect, vi, beforeEach } from "vitest";
import { migrateTable, migrateTables } from "../src/lib/migrationProcess";
import { AirtableService } from "../src/lib/airtable";
import { GristService } from "../src/lib/grist";

describe("Migration Process", () => {
  const mockAirtableService = {
    getAllRecords: vi.fn(),
    getTableSchema: vi.fn()
  };

  const mockGristService = {
    createDocument: vi.fn(),
    addTablesToDocument: vi.fn(),
    addRecordsToTable: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("migrateTable", () => {
    it("devrait migrer une table simple", async () => {
      const config = {
        airtableService: mockAirtableService as unknown as AirtableService,
        gristService: mockGristService as unknown as GristService,
        source: {
          baseId: "base123",
          tableId: "tbl123"
        },
        destination: {
          documentId: "doc123",
          tableId: "table1"
        },
        mapping: {
          Name: "fldName",
          Age: "fldAge"
        }
      };

      // Mock des données Airtable
      mockAirtableService.getAllRecords.mockResolvedValue([
        {
          fields: {
            Name: "John Doe",
            Age: 30
          }
        },
        {
          fields: {
            Name: "Jane Smith",
            Age: 25
          }
        }
      ]);

      await migrateTable(config);

      // Vérifier que les enregistrements ont été ajoutés
      expect(mockGristService.addRecordsToTable).toHaveBeenCalledWith(
        "doc123",
        "table1",
        expect.arrayContaining([
          {
            fldName: "John Doe",
            fldAge: 30
          },
          {
            fldName: "Jane Smith",
            fldAge: 25
          }
        ])
      );
    });

    it("devrait gérer une table vide", async () => {
      const config = {
        airtableService: mockAirtableService as unknown as AirtableService,
        gristService: mockGristService as unknown as GristService,
        source: {
          baseId: "base123",
          tableId: "tbl123"
        },
        destination: {
          documentId: "doc123",
          tableId: "table1"
        },
        mapping: {}
      };

      mockAirtableService.getAllRecords.mockResolvedValue([]);

      await migrateTable(config);

      expect(mockGristService.addRecordsToTable).not.toHaveBeenCalled();
    });

    it("devrait gérer les erreurs de l'API Airtable", async () => {
      const config = {
        airtableService: mockAirtableService as unknown as AirtableService,
        gristService: mockGristService as unknown as GristService,
        source: {
          baseId: "base123",
          tableId: "tbl123"
        },
        destination: {
          documentId: "doc123",
          tableId: "table1"
        },
        mapping: {}
      };

      mockAirtableService.getAllRecords.mockRejectedValue(
        new Error("Erreur Airtable")
      );

      await expect(migrateTable(config)).rejects.toThrow("Erreur Airtable");
    });
  });

  describe("migrateTables", () => {
    it("devrait migrer plusieurs tables", async () => {
      const config = {
        airtableService: mockAirtableService as unknown as AirtableService,
        gristService: mockGristService as unknown as GristService,
        source: {
          baseId: "base123",
          tableIds: ["tbl1", "tbl2"]
        },
        destination: {
          workspaceId: 123,
          documentName: "Test Document"
        },
        onProgress: vi.fn()
      };

      // Mock de la création du document
      mockGristService.createDocument.mockResolvedValue("doc123");

      // Mock des schémas de tables
      mockAirtableService.getTableSchema.mockImplementation(
        (baseId, tableId) => {
          if (tableId === "tbl1") {
            return {
              name: "Users",
              fields: [{ id: "fld1", name: "Name", type: "singleLineText" }]
            };
          }
          return {
            name: "Projects",
            fields: [{ id: "fld1", name: "Title", type: "singleLineText" }]
          };
        }
      );

      // Mock de l'ajout des tables
      mockGristService.addTablesToDocument.mockResolvedValue([
        "table1",
        "table2"
      ]);

      // Mock des enregistrements
      mockAirtableService.getAllRecords.mockResolvedValue([
        { fields: { Name: "John Doe" } }
      ]);

      const result = await migrateTables(config);

      // Vérifier le résultat
      expect(result).toEqual({
        documentId: "doc123",
        tableIds: ["table1", "table2"],
        errors: []
      });

      // Vérifier les appels de progression
      expect(config.onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          currentTable: 0,
          totalTables: 2,
          status: "creating"
        })
      );

      expect(config.onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          currentTable: 0,
          totalTables: 2,
          status: "fetching"
        })
      );

      expect(config.onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          currentTable: 2,
          totalTables: 2,
          status: "complete"
        })
      );
    });

    it("devrait gérer les erreurs de création de document", async () => {
      const config = {
        airtableService: mockAirtableService as unknown as AirtableService,
        gristService: mockGristService as unknown as GristService,
        source: {
          baseId: "base123",
          tableIds: ["tbl1"]
        },
        destination: {
          workspaceId: 123,
          documentName: "Test Document"
        },
        onProgress: vi.fn()
      };

      mockGristService.createDocument.mockRejectedValue(
        new Error("Erreur création document")
      );

      await expect(migrateTables(config)).rejects.toThrow(
        "Erreur création document"
      );

      expect(config.onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          error: expect.any(Error)
        })
      );
    });

    it("devrait gérer les erreurs de migration de table individuelle", async () => {
      const config = {
        airtableService: mockAirtableService as unknown as AirtableService,
        gristService: mockGristService as unknown as GristService,
        source: {
          baseId: "base123",
          tableIds: ["tbl1", "tbl2"]
        },
        destination: {
          workspaceId: 123,
          documentName: "Test Document"
        },
        onProgress: vi.fn()
      };

      // Mock de la création du document
      mockGristService.createDocument.mockResolvedValue("doc123");

      // Mock des schémas de tables
      mockAirtableService.getTableSchema.mockResolvedValue({
        name: "Test",
        fields: [{ id: "fld1", name: "Name", type: "singleLineText" }]
      });

      // Mock de l'ajout des tables
      mockGristService.addTablesToDocument.mockResolvedValue([
        "table1",
        "table2"
      ]);

      // Mock des enregistrements avec erreur pour la deuxième table
      mockAirtableService.getAllRecords
        .mockResolvedValueOnce([{ fields: { Name: "John Doe" } }])
        .mockRejectedValueOnce(new Error("Erreur migration table"));

      const result = await migrateTables(config);

      // Vérifier que la migration a continué malgré l'erreur
      expect(result).toEqual({
        documentId: "doc123",
        tableIds: ["table1"],
        errors: [expect.any(Error)]
      });

      // Vérifier que l'erreur a été signalée
      expect(config.onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          error: expect.any(Error)
        })
      );
    });
  });
});
