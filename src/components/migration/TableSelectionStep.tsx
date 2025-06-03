import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Rocket } from "lucide-react";
import { type AirtableTable } from "@/lib/airtable";

interface TableSelectionStepProps {
  airtableTables: AirtableTable[];
  selectedTables: string[];
  isLoadingTables: boolean;
  isImporting: boolean;
  gristUrl: string;
  onTableToggle: (tableId: string) => void;
  onStartMigration: () => void;
  onGoBack: () => void;
}

export const TableSelectionStep = ({
  airtableTables,
  selectedTables,
  isLoadingTables,
  isImporting,
  gristUrl,
  onTableToggle,
  onStartMigration,
  onGoBack,
}: TableSelectionStepProps) => {
  return (
    <Card className="border-2 border-blue-100 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          <CheckCircle className="h-6 w-6 text-green-600" />
          Select Tables to Import
        </CardTitle>
        <CardDescription className="text-lg">
          Choose which tables you want to migrate to Grist
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoadingTables ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              Loading tables from selected base...
            </p>
          </div>
        ) : airtableTables.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              No tables found in the selected base.
            </p>
            <Button onClick={onGoBack} variant="outline">
              Go Back and Select Different Base
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {airtableTables.map((table) => (
                <Card
                  key={table.id}
                  className={`cursor-pointer border-2 transition-all ${
                    selectedTables.includes(table.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                  onClick={() => onTableToggle(table.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={`table-${table.id}`}
                        checked={selectedTables.includes(table.id)}
                        aria-labelledby={`table-${table.id}-label`}
                        onChange={() => onTableToggle(table.id)}
                      />
                      <div className="flex-1">
                        <p
                          className="font-semibold text-lg"
                          id={`table-${table.id}-label`}
                        >
                          {table.name}
                        </p>
                        {table.description && (
                          <p className="text-sm text-gray-600 mb-1">
                            {table.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Table ID: {table.id}
                        </p>
                      </div>
                      <Badge variant="outline">Table</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedTables.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>{selectedTables.length}</strong> table(s) selected for
                  import
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedTables.map((tableId) => {
                    const table = airtableTables.find((t) => t.id === tableId);
                    return (
                      <Badge key={tableId} variant="secondary">
                        {table?.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">
                Migration Destination:
              </h3>
              <p className="text-sm text-green-800">
                Tables will be migrated to:{" "}
                <span className="font-mono bg-white px-2 py-1 rounded">
                  {gristUrl}
                </span>
              </p>
            </div>

            <Button
              onClick={onStartMigration}
              disabled={isImporting || selectedTables.length === 0}
              className="w-full text-xl py-8 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
            >
              {isImporting ? (
                "Migrating Data..."
              ) : (
                <>
                  <Rocket className="mr-3 h-6 w-6" />
                  Continue to Grist Setup
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
