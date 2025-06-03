import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Database, ExternalLink } from "lucide-react";

interface ConnectionStepProps {
  airtableToken: string;
  setAirtableToken: (token: string) => void;
  gristToken: string;
  setGristToken: (token: string) => void;
  gristUrl: string;
  setGristUrl: (url: string) => void;
  isValidatingToken: boolean;
  onConnect: () => void;
}

export const ConnectionStep = ({
  airtableToken,
  setAirtableToken,
  gristToken,
  setGristToken,
  gristUrl,
  setGristUrl,
  isValidatingToken,
  onConnect,
}: ConnectionStepProps) => {
  return (
    <Card className="border-2 border-blue-100 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database className="h-6 w-6 text-blue-600" aria-hidden={true} />
          </div>
          Connect to Airtable & Grist
        </CardTitle>
        <CardDescription className="text-lg">
          Enter your API tokens for both Airtable and Grist to get started
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Airtable Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
              <div className="p-1 bg-blue-600 rounded">
                <Database className="h-4 w-4 text-white" />
              </div>
              Airtable Source
            </h3>
            <div className="space-y-2">
              <Label htmlFor="airtable-token" className="text-sm font-medium">
                Airtable API Token
              </Label>
              <Input
                id="airtable-token"
                type="password"
                aria-describedby="airtable-token-description"
                placeholder="pat****************************"
                value={airtableToken}
                onChange={(e) => setAirtableToken(e.target.value)}
                className="text-lg p-3"
              />
              <p
                className="text-sm text-gray-600"
                id="airtable-token-description"
              >
                Find your token at{" "}
                <a
                  href="https://airtable.com/create/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  airtable.com/create/tokens
                  <ExternalLink
                    className="h-3 w-3"
                    role="img"
                    aria-label="New window"
                  />
                </a>
              </p>
            </div>
          </div>

          {/* Grist Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-green-50">
            <h3 className="text-lg font-semibold text-green-900 flex items-center gap-2">
              <div className="p-1 bg-green-600 rounded">
                <Database className="h-4 w-4 text-white" aria-hidden={true} />
              </div>
              Grist Destination
            </h3>
            <div className="space-y-2">
              <Label htmlFor="grist-url" className="text-sm font-medium">
                Grist Base URL
              </Label>
              <Input
                id="grist-url"
                aria-describedby="grist-url-description"
                placeholder="https://docs.getgrist.com"
                value={gristUrl}
                onChange={(e) => setGristUrl(e.target.value)}
                className="text-lg p-3"
              />
              <p className="text-sm text-gray-600" id="grist-url-description">
                The base URL of your Grist instance (usually docs.getgrist.com)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grist-token" className="text-sm font-medium">
                Grist API Token
              </Label>
              <Input
                aria-describedby="grist-token-description"
                id="grist-token"
                type="password"
                placeholder="Your Grist API token"
                value={gristToken}
                onChange={(e) => setGristToken(e.target.value)}
                className="text-lg p-3"
              />
              <p className="text-sm text-gray-600" id="grist-token-description">
                Generate a token in your Grist account settings
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => {
            if (!isValidatingToken) {
              onConnect();
            }
          }}
          aria-disabled={isValidatingToken}
          className="w-full text-lg py-6 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
        >
          {isValidatingToken
            ? "Validating Connections..."
            : "Connect to Both Services"}
          <ArrowRight className="ml-2 h-5 w-5" aria-hidden={true} />
        </Button>
      </CardContent>
    </Card>
  );
};
