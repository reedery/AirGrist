import {
  Card,
  ClickableCard,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle } from "lucide-react";
import { type AirtableBase } from "@/lib/airtable";

interface BaseSelectionStepProps {
  airtableBases: AirtableBase[];
  isLoadingBases: boolean;
  isLoadingTables: boolean;
  onBaseSelect: (baseId: string) => void;
  onGoBack: () => void;
}

export const BaseSelectionStep = ({
  airtableBases,
  isLoadingBases,
  isLoadingTables,
  onBaseSelect,
  onGoBack,
}: BaseSelectionStepProps) => {
  return (
    <Card className="border-2 border-blue-100 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <h2>Select Airtable Base</h2>
        </CardTitle>
        <CardDescription className="text-lg">
          Choose the base containing the tables you want to migrate
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingBases || isLoadingTables ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {isLoadingBases
                ? "Loading your Airtable bases..."
                : "Loading tables from selected base..."}
            </p>
          </div>
        ) : airtableBases.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              No accessible bases found in your Airtable account.
            </p>
            <Button onClick={onGoBack} variant="outline">
              Go Back and Check Token
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {airtableBases.map((base) => (
              <ClickableCard
                key={base.id}
                className="cursor-pointer hover:bg-blue-50 border-2 hover:border-blue-200 transition-all"
                onClick={() => onBaseSelect(base.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{base.name}</h3>
                      {/* <p className="text-sm text-gray-500">
                        Base ID: {base.id}
                      </p> */}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          base.permissionLevel === "create"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {base.permissionLevel}
                      </Badge>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </ClickableCard>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
