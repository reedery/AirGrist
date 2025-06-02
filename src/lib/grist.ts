/**
 * Grist API Service
 * Handles all communications with the Grist API
 */
export enum GristFieldType {
  TEXT = "Text",
  NUMERIC = "Numeric",
  INT = "Int"
  // Add other types if needed
}

export interface GristField {
  label: string;
  type: GristFieldType;
}

export interface GristColumn {
  id: string;
  fields: GristField; // The name "fields" comes from the Grist API, but it's not a list
}

export interface GristTable {
  id: string; // Table name
  columns: GristColumn[];
}

export class GristApiError extends Error {
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
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    if (!apiUrl || !apiKey) {
      throw new Error("Grist API URL and API key are required");
    }
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    };
  }

  private async handleResponse(response: Response): Promise<any> {
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
   * Creates a document in a Grist workspace
   */
  async createDocument(
    workspaceId: number,
    documentName: string
  ): Promise<string> {
    const response = await fetch(
      `${this.apiUrl}/api/workspaces/${workspaceId}/docs`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ name: documentName })
      }
    );
    const data = await this.handleResponse(response);
    // The API returns the document ID (adapt depending on actual response)
    return typeof data === "string" ? data : data.id;
  }

  /**
   * Adds tables to a Grist document
   */
  async addTablesToDocument(
    documentId: string,
    tables: GristTable[]
  ): Promise<string[]> {
    const response = await fetch(
      `${this.apiUrl}/api/docs/${documentId}/tables`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ tables })
      }
    );
    const data = await this.handleResponse(response);
    return data.tables.map((tab: any) => tab.id);
  }

  /**
   * Adds records to a Grist table
   */
  async addRecordsToTable(
    documentId: string,
    tableId: string,
    records: Record<string, any>[]
  ): Promise<void> {
    const gristRecords = records.map((record) => ({ fields: record }));
    const response = await fetch(
      `${this.apiUrl}/api/docs/${documentId}/tables/${tableId}/records`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ records: gristRecords })
      }
    );
    await this.handleResponse(response);
  }
}

// Utility function
export const createGristService = (
  apiUrl: string,
  apiKey: string
): GristService => {
  return new GristService(apiUrl, apiKey);
};
