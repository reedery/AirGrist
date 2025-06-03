import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ExternalLink } from "lucide-react";
import { type AirtableTable } from "@/lib/airtable";
import { Confetti } from "@/components/ui/confetti";

interface CompletionStepProps {
  selectedTables: string[];
  airtableTables: AirtableTable[];
  gristUrl: string;
  onOpenGrist: () => void;
  onRestart: () => void;
}

export const CompletionStep = ({
  selectedTables,
  airtableTables,
  gristUrl,
  onOpenGrist,
  onRestart,
}: CompletionStepProps) => {
  return (
    <>
      <Confetti duration={4000} intensity={200} />
      <Card className="border-2 border-green-100 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl flex items-center justify-center gap-2 text-green-700">
            <CheckCircle className="h-8 w-8" />
            Migration Complete! 🎉
          </CardTitle>
          <CardDescription className="text-lg">
            Your data has been successfully migrated from Airtable to Grist
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="bg-green-50 p-6 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-4">Successfully Migrated:</h4>
            <div className="grid gap-2">
              {selectedTables.map(tableId => {
                const table = airtableTables.find(t => t.id === tableId);
                return (
                  <div key={tableId} className="flex items-center justify-between bg-white p-3 rounded border">
                    <span className="font-medium">{table?.name}</span>
                    <Badge variant="default">
                      Table
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button 
              onClick={onOpenGrist}
              className="bg-green-600 hover:bg-green-700"
            >
              Open in Grist
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              onClick={onRestart}
              variant="outline"
            >
              Start New Migration
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}; 