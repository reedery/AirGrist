/**
 * Airtable API Service
 * Handles all communications with the Airtable API
 */

export interface AirtableBase {
  id: string;
  name: string;
  permissionLevel: string;
}

export interface AirtableTable {
  id: string;
  name: string;
  description?: string;
  primaryFieldId: string;
  recordCount: number;
  fields?: AirtableField[];
}

export interface AirtableField {
  id: string;
  name: string;
  type: string;
  description?: string;
  options?: Record<string, any>;
}

class AirtableApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string
  ) {
    super(message);
    this.name = "AirtableApiError";
  }
}

export class AirtableService {
  private baseUrl = "https://api.airtable.com/v0";
  private token: string;

  constructor(token: string) {
    if (!token || !token.trim()) {
      throw new Error("Airtable API token is required");
    }
    this.token = token.trim();
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json"
    };
  }

  private async handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      const errorMessage = `Airtable API error: ${response.status} ${response.statusText}`;
      throw new AirtableApiError(
        response.status,
        response.statusText,
        errorMessage
      );
    }
    return response.json();
  }

  /**
   * Fetch all accessible Airtable bases for the authenticated user
   */
  async getBases(): Promise<AirtableBase[]> {
    try {
      const response = await fetch(`${this.baseUrl}/meta/bases`, {
        method: "GET",
        headers: this.getHeaders()
      });

      const data = await this.handleResponse(response);

      return data.bases.map((base: any) => ({
        id: base.id,
        name: base.name,
        permissionLevel: base.permissionLevel
      }));
    } catch (error) {
      console.error("Error fetching Airtable bases:", error);
      throw error;
    }
  }

  /**
   * Fetch all tables in a specific Airtable base
   */
  async getTables(baseId: string): Promise<AirtableTable[]> {
    if (!baseId || !baseId.trim()) {
      throw new Error("Base ID is required");
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/meta/bases/${baseId}/tables`,
        {
          method: "GET",
          headers: this.getHeaders()
        }
      );

      const data = await this.handleResponse(response);

      return data.tables.map((table: any) => ({
        id: table.id,
        name: table.name,
        description: table.description || "",
        primaryFieldId: table.primaryFieldId,
        recordCount: 0 // Note: The tables API doesn't provide record count
      }));
    } catch (error) {
      console.error("Error fetching Airtable tables:", error);
      throw error;
    }
  }

  /**
   * Fetch detailed information about a specific table including its fields
   */
  async getTableDetails(
    baseId: string,
    tableId: string
  ): Promise<{
    table: AirtableTable;
    fields: AirtableField[];
  }> {
    if (!baseId || !tableId) {
      throw new Error("Base ID and Table ID are required");
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/meta/bases/${baseId}/tables`,
        {
          method: "GET",
          headers: this.getHeaders()
        }
      );

      const data = await this.handleResponse(response);
      const table = data.tables.find((t: any) => t.id === tableId);

      if (!table) {
        throw new Error(`Table with ID ${tableId} not found`);
      }

      return {
        table: {
          id: table.id,
          name: table.name,
          description: table.description || "",
          primaryFieldId: table.primaryFieldId,
          recordCount: 0
        },
        fields: table.fields.map((field: any) => ({
          id: field.id,
          name: field.name,
          type: field.type,
          description: field.description,
          options: field.options
        }))
      };
    } catch (error) {
      console.error("Error fetching table details:", error);
      throw error;
    }
  }

  /**
   * Get full tables schema with fields for migration purposes
   */
  // todo: this endpoint return all tables in the base, not just the specified table
  async getTablesSchema(baseId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/meta/bases/${baseId}/tables`,
        {
          method: "GET",
          headers: this.getHeaders()
        }
      );

      const data = await this.handleResponse(response);
      //return  un objet
      const tables = data.tables.reduce(
        (acc: Record<string, AirtableTable>, table: AirtableTable) => {
          acc[table.id] = table;
          return acc;
        },
        {}
      );

      if (!tables) {
        throw new Error(`Tables not found`);
      }

      return tables;
    } catch (error) {
      console.error("Error fetching table schema:", error);
      throw error;
    }
  }

  /**
   * Validate the API token by attempting to fetch bases
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.getBases();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get records from a table (with pagination support)
   */
  async getRecords(
    baseId: string,
    tableId: string,
    options?: {
      pageSize?: number;
      offset?: string;
      view?: string;
      filterByFormula?: string;
    }
  ): Promise<{
    records: any[];
    offset?: string;
  }> {
    if (!baseId || !tableId) {
      throw new Error("Base ID and Table ID are required");
    }

    try {
      const params = new URLSearchParams();

      if (options?.pageSize) {
        params.append("pageSize", options.pageSize.toString());
      }
      if (options?.offset) {
        params.append("offset", options.offset);
      }
      if (options?.view) {
        params.append("view", options.view);
      }
      if (options?.filterByFormula) {
        params.append("filterByFormula", options.filterByFormula);
      }

      const url = `${this.baseUrl}/${baseId}/${tableId}${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders()
      });

      const data = await this.handleResponse(response);

      return {
        records: data.records || [],
        offset: data.offset
      };
    } catch (error) {
      console.error("Error fetching records:", error);
      throw error;
    }
  }

  /**
   * Get all records from a table (handles pagination automatically)
   */
  async getAllRecords(baseId: string, tableId: string): Promise<any[]> {
    const allRecords: any[] = [];
    let offset: string | undefined;

    do {
      const result = await this.getRecords(baseId, tableId, {
        pageSize: 100,
        offset
      });

      allRecords.push(...result.records);
      offset = result.offset;
    } while (offset);

    return allRecords;
  }
}

// Utility functions for easy use
export const createAirtableService = (token: string): AirtableService => {
  return new AirtableService(token);
};

export const validateAirtableToken = async (
  token: string
): Promise<boolean> => {
  try {
    const service = new AirtableService(token);
    return await service.validateToken();
  } catch {
    return false;
  }
};
