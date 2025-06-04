import { describe, it, expect } from "vitest";
import { airtableToGristRecord } from "../src/lib/grist.ts";

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
