/**
 * Grist API Service
 * Handles all communications with the Grist API
 * Translated from grist_main.py
 */

export enum GristFieldType {
  TEXT = "Text",
  NUMERIC = "Numeric",
  INT = "Int",
  DATE = "Date",
  DATETIME = "DateTime",
  BOOL = "Bool",
  CHOICE = "Choice",
  // Add more types as needed
}

export interface GristField {
  label: string;
  type: GristFieldType;
}

export interface GristColumn {
  id: string;
  fields: GristField; // Note: "fields" mirrors the Grist API but it's actually not a list
}

export interface GristTable {
  id: string; // The name of the table
  columns: GristColumn[];
}

export interface GristRecord {
  fields: Record<string, any>;
}

export interface GristOrganization {
  id: number;
  name: string;
  domain?: string;
}

export interface GristWorkspace {
  id: number;
  name: string;
  docs?: any[];
}

class GristApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string
  ) {
    super(message);
    this.name = "GristApiError";
  }
}

export class GristService {
  private baseUrl: string;
  private token: string;

  constructor(apiUrl: string, token: string) {
    if (!token || !token.trim()) {
      throw new Error("Grist API token is required");
    }
    if (!apiUrl || !apiUrl.trim()) {
      throw new Error("Grist API URL is required");
    }
    this.baseUrl = `/grist/`;
    this.token = token.trim();
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
      //"X-Requested-With": "idunno",
    };
  }

  private async handleResponse(response: Response): Promise<any> {
    console.log("handleResponse", response);
    if (!response.ok) {
      const errorMessage = `Grist API error: ${response.status} ${response.statusText}`;
      throw new GristApiError(
        response.status,
        response.statusText,
        errorMessage
      );
    }
    return response.json();
  }

  /**
   * Create a new document in a workspace
   */
  async createDocument(
    workspaceId: number,
    documentName: string
  ): Promise<string> {
    try {
      const url = `${this.baseUrl}/api/workspaces/${workspaceId}/docs`;
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ name: documentName }),
        credentials: "include",
      });

      const data = await this.handleResponse(response);
      return data.id || data; // Handle different response formats
    } catch (error) {
      console.error("Error creating Grist document:", error);
      throw error;
    }
  }

  /**
   * Add tables to a document
   */
  async addTablesToDocument(
    documentId: string,
    tables: GristTable[]
  ): Promise<string[]> {
    try {
      const url = `${this.baseUrl}/api/docs/${documentId}/tables`;
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ tables }),
      });

      const data = await this.handleResponse(response);
      return data.tables.map((table: any) => table.id);
    } catch (error) {
      console.error("Error adding tables to Grist document:", error);
      throw error;
    }
  }

  /**
   * Add records to a table
   */
  async addRecordsToTable(
    documentId: string,
    tableId: string,
    records: Record<string, any>[]
  ): Promise<void> {
    try {
      const gristFormattedRecords = records.map((record) => ({
        fields: record,
      }));

      const url = `${this.baseUrl}/api/docs/${documentId}/tables/${tableId}/records`;
      const response = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ records: gristFormattedRecords }),
      });

      await this.handleResponse(response);
    } catch (error) {
      console.error("Error adding records to Grist table:", error);
      throw error;
    }
  }

  /**
   * Extract document ID from Grist URL
   */
  static extractDocumentId(url: string): string {
    const match = url.match(/\/doc\/([^\/\?]+)/);
    if (!match) {
      throw new Error(
        "Invalid Grist document URL. Expected format: https://docs.getgrist.com/doc/DOC_ID"
      );
    }
    return match[1];
  }

  /**
   * Validate the API token and URL by attempting to fetch organizations
   */
  async validateToken(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/api/orgs`;
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });

      await this.handleResponse(response);
      return true;
    } catch (error) {
      console.error("Error validating Grist token:", error);
      return false;
    }
  }

  /**
   * Get organizations to verify API access
   */
  // async getOrganizations(): Promise<any[]> {
  //   try {
  //     const url = `${this.baseUrl}/api/orgs`;
  //     const response = await fetch(url, {
  //       method: "GET",
  //       headers: this.getHeaders(),
  //     });

  //     const data = await this.handleResponse(response);
  //     return data.orgs || [];
  //   } catch (error) {
  //     console.error("Error fetching Grist organizations:", error);
  //     throw error;
  //   }
  // }

  /**
   * Get organizations for selection
   */
  async getOrgs(): Promise<GristOrganization[]> {
    try {
      const url = `${this.baseUrl}/api/orgs`;
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse(response);
      console.log("data", data);
      return data || [];
    } catch (error) {
      console.error("Error fetching Grist organizations:", error);
      throw error;
    }
  }

  /**
   * Get workspaces for a specific organization
   */
  async getWorkspaces(orgId: number): Promise<GristWorkspace[]> {
    try {
      const url = `${this.baseUrl}/api/orgs/${orgId}/workspaces`;
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });

      const data = await this.handleResponse(response);
      return data || [];
    } catch (error) {
      console.error("Error fetching Grist workspaces:", error);
      throw error;
    }
  }
}

/**
 * Convert Airtable field type to Grist field type
 */
export function airtableToGristFieldType(airtableType: string): GristFieldType {
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
    multipleSelects: GristFieldType.TEXT, // Grist doesn't have multi-choice, use text
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
  };

  return typeMapping[airtableType] || GristFieldType.TEXT;
}

/**
 * Convert Airtable table schema to Grist table schema
 */
export function airtableToGristTable(airtableTable: any): GristTable {
  const columns: GristColumn[] = airtableTable.fields.map((field: any) => ({
    id: field.id,
    fields: {
      label: field.name,
      type: airtableToGristFieldType(field.type),
    },
  }));

  return {
    id: airtableTable.name,
    columns,
  };
}

/**
 * Create a Grist service instance
 */
export const createGristService = (
  apiUrl: string,
  token: string
): GristService => {
  return new GristService(apiUrl, token);
};

/**
 * Validate Grist API token and URL
 */
export const validateGristCredentials = async (
  apiUrl: string,
  token: string
): Promise<boolean> => {
  try {
    const service = new GristService(apiUrl, token);
    return await service.validateToken();
  } catch {
    return false;
  }
};
