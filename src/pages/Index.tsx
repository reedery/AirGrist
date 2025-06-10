import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  createAirtableService,
  type AirtableBase,
  type AirtableTable,
} from "@/lib/airtable";
import {
  createGristService,
  airtableToGristTable,
  validateGristCredentials,
  GristService,
  type GristOrganization,
  type GristWorkspace,
} from "@/lib/grist";
import {
  MigrationHeader,
  MigrationProgress,
  ConnectionStep,
  BaseSelectionStep,
  TableSelectionStep,
  OrganizationSelectionStep,
  CompletionStep,
  MigrationFooter,
} from "@/components/migration";
import { migrateTables } from "@/lib/migration";

// Configuration - in a real app, these would come from environment variables
const GRIST_API_URL = "https://docs.getgrist.com";
const GRIST_WORKSPACE_ID = 147018; // You may need to update this to your workspace ID

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [airtableToken, setAirtableToken] = useState("");
  const [selectedBase, setSelectedBase] = useState("");
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [gristToken, setGristToken] = useState("");
  const [gristUrl, setGristUrl] = useState(GRIST_API_URL);
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [airtableBases, setAirtableBases] = useState<AirtableBase[]>([]);
  const [airtableTables, setAirtableTables] = useState<AirtableTable[]>([]);
  const [isLoadingBases, setIsLoadingBases] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [createdDocumentId, setCreatedDocumentId] = useState<string>("");
  const [gristOrgs, setGristOrgs] = useState<GristOrganization[]>([]);
  const [gristWorkspaces, setGristWorkspaces] = useState<GristWorkspace[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<number | null>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<number | null>(
    null
  );
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const { toast } = useToast();

  const handleTokenValidation = async () => {
    if (!airtableToken.trim()) {
      toast({
        title: "Airtable Token Required",
        description: "Please enter your Airtable API token",
        variant: "destructive",
      });
      return;
    }

    if (!gristToken.trim() || !gristUrl.trim()) {
      toast({
        title: "Grist Details Required",
        description: "Please provide both Grist token and URL",
        variant: "destructive",
      });
      return;
    }

    setIsValidatingToken(true);
    setIsLoadingBases(true);

    try {
      // Show validation progress
      toast({
        title: "Validating Credentials",
        description: "Checking Airtable and Grist API access...",
      });

      // Validate Grist credentials first
      const isGristValid = await validateGristCredentials(
        GRIST_API_URL,
        gristToken
      );

      if (!isGristValid) {
        setIsValidatingToken(false);
        setIsLoadingBases(false);

        toast({
          title: "Grist Connection Failed",
          description:
            "Failed to connect to Grist. Please check your token and try again.",
          variant: "destructive",
        });
        return;
      }

      // If Grist is valid, validate Airtable and fetch bases
      const airtableService = createAirtableService(airtableToken);
      const bases = await airtableService.getBases();

      // Both validations successful
      setAirtableBases(bases);
      setIsValidatingToken(false);
      setIsLoadingBases(false);
      setCurrentStep(2);

      toast({
        title: "Connection Successful",
        description: `Connected to both services! Found ${bases.length} accessible base(s).`,
      });
    } catch (error) {
      setIsValidatingToken(false);
      setIsLoadingBases(false);

      toast({
        title: "Connection Failed",
        description:
          "Failed to connect to one or both services. Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  };

  const handleBaseSelection = async (baseId: string) => {
    setSelectedBase(baseId);
    setIsLoadingTables(true);

    try {
      const airtableService = createAirtableService(airtableToken);
      const tables = await airtableService.getTables(baseId);
      setAirtableTables(tables);
      setIsLoadingTables(false);
      setCurrentStep(3);

      toast({
        title: "Base Selected",
        description: `Loaded ${tables.length} table(s) from ${
          airtableBases.find((b) => b.id === baseId)?.name
        }`,
      });
    } catch (error) {
      setIsLoadingTables(false);

      toast({
        title: "Failed to Load Tables",
        description:
          "Failed to fetch tables from the selected base. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTableToggle = (tableId: string) => {
    setSelectedTables((prev) =>
      prev.includes(tableId)
        ? prev.filter((id) => id !== tableId)
        : [...prev, tableId]
    );
  };

  const handleContinueToOrgSelection = async () => {
    if (selectedTables.length === 0) {
      toast({
        title: "No Tables Selected",
        description: "Please select at least one table to import",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingOrgs(true);
    setCurrentStep(4);

    try {
      const gristService = createGristService(GRIST_API_URL, gristToken);
      const orgs = await gristService.getOrgs();
      setGristOrgs(orgs);
      setIsLoadingOrgs(false);

      toast({
        title: "Organizations Loaded",
        description: `Found ${orgs.length} organization(s) in your Grist account`,
      });
    } catch (error) {
      setIsLoadingOrgs(false);
      toast({
        title: "Failed to Load Organizations",
        description:
          "Failed to fetch organizations from Grist. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOrgSelection = async (orgId: number) => {
    setSelectedOrg(orgId);
    setSelectedWorkspace(null);
    setIsLoadingWorkspaces(true);

    try {
      const gristService = createGristService(GRIST_API_URL, gristToken);
      const workspaces = await gristService.getWorkspaces(orgId);
      setGristWorkspaces(workspaces);
      setIsLoadingWorkspaces(false);

      const orgName = gristOrgs.find((org) => org.id === orgId)?.name;
      toast({
        title: "Workspaces Loaded",
        description: `Found ${workspaces.length} workspace(s) in ${orgName}`,
      });
    } catch (error) {
      setIsLoadingWorkspaces(false);
      toast({
        title: "Failed to Load Workspaces",
        description:
          "Failed to fetch workspaces from the selected organization. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleWorkspaceSelection = (workspaceId: number) => {
    setSelectedWorkspace(workspaceId);
  };

  const handleStartMigration = async () => {
    if (selectedTables.length === 0) {
      toast({
        title: "No Tables Selected",
        description: "Please select at least one table to import",
        variant: "destructive",
      });
      return;
    }

    if (!selectedWorkspace) {
      toast({
        title: "No Workspace Selected",
        description: "Please select a workspace for the migration",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      // Initialize services
      const airtableService = createAirtableService(airtableToken);
      const gristService = createGristService(GRIST_API_URL, gristToken);

      // Create document name
      const baseName = airtableBases.find((b) => b.id === selectedBase)?.name || "Unknown Base";
      const documentName = `Imported from ${baseName} - ${new Date().toLocaleDateString()}`;

      const result = await migrateTables({
        airtableService,
        gristService,
        source: {
          baseId: selectedBase,
          tableIds: selectedTables
        },
        destination: {
          workspaceId: selectedWorkspace,
          documentName
        },
        onProgress: (progress) => {
          switch (progress.status) {
            case 'creating':
              toast({
                title: "Creating Grist Document",
                description: "Setting up your new Grist document...",
              });
              break;
            case 'fetching':
              toast({
                title: "Fetching Table Schemas",
                description: "Getting table structures from Airtable...",
              });
              break;
            case 'migrating':
              toast({
                title: `Migrating Table: ${progress.tableName}`,
                description: `Processing table ${progress.currentTable} of ${progress.totalTables}`,
              });
              break;
            case 'error':
              toast({
                title: "Migration Error",
                description: progress.error?.message || "An error occurred during migration",
                variant: "destructive",
              });
              break;
            case 'complete':
              toast({
                title: "Migration Complete! 🎉",
                description: `Successfully imported ${selectedTables.length} tables to Grist`,
              });
              break;
          }
        }
      });

      setCreatedDocumentId(result.documentId);
      setIsImporting(false);
      setCurrentStep(5);

    } catch (error) {
      setIsImporting(false);
      console.error("Migration failed:", error);

      toast({
        title: "Migration Failed",
        description: error instanceof Error ? error.message : "An error occurred during migration. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOpenGrist = () => {
    if (createdDocumentId) {
      // Open the specific document that was created
      window.open(`${GRIST_API_URL}/doc/${createdDocumentId}`, "_blank");
    } else {
      // Fallback to the original URL
      window.open(gristUrl, "_blank");
    }
  };

  const handleRestart = () => {
    setCurrentStep(1);
    setAirtableToken("");
    setSelectedBase("");
    setSelectedTables([]);
    setGristToken("");
    setGristUrl(GRIST_API_URL);
    setAirtableBases([]);
    setAirtableTables([]);
    setIsLoadingBases(false);
    setIsLoadingTables(false);
    setGristOrgs([]);
    setGristWorkspaces([]);
    setSelectedOrg(null);
    setSelectedWorkspace(null);
    setIsLoadingOrgs(false);
    setIsLoadingWorkspaces(false);
    setCreatedDocumentId("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <MigrationHeader />

        <MigrationProgress currentStep={currentStep} totalSteps={5} />

        <div className="max-w-4xl mx-auto">
          {currentStep === 1 && (
            <ConnectionStep
              airtableToken={airtableToken}
              setAirtableToken={setAirtableToken}
              gristToken={gristToken}
              setGristToken={setGristToken}
              gristUrl={gristUrl}
              setGristUrl={setGristUrl}
              isValidatingToken={isValidatingToken}
              onConnect={handleTokenValidation}
            />
          )}

          {currentStep === 2 && (
            <BaseSelectionStep
              airtableBases={airtableBases}
              isLoadingBases={isLoadingBases}
              isLoadingTables={isLoadingTables}
              onBaseSelect={handleBaseSelection}
              onGoBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <TableSelectionStep
              airtableTables={airtableTables}
              selectedTables={selectedTables}
              isLoadingTables={isLoadingTables}
              isImporting={false}
              gristUrl={gristUrl}
              onTableToggle={handleTableToggle}
              onStartMigration={handleContinueToOrgSelection}
              onGoBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <OrganizationSelectionStep
              gristOrgs={gristOrgs}
              gristWorkspaces={gristWorkspaces}
              selectedOrg={selectedOrg}
              selectedWorkspace={selectedWorkspace}
              isLoadingOrgs={isLoadingOrgs}
              isLoadingWorkspaces={isLoadingWorkspaces}
              onOrgSelect={handleOrgSelection}
              onWorkspaceSelect={handleWorkspaceSelection}
              onGoBack={() => setCurrentStep(3)}
              onContinue={handleStartMigration}
            />
          )}

          {currentStep === 5 && (
            <CompletionStep
              selectedTables={selectedTables}
              airtableTables={airtableTables}
              gristUrl={gristUrl}
              onOpenGrist={handleOpenGrist}
              onRestart={handleRestart}
            />
          )}
        </div>

        <MigrationFooter />
      </div>
    </div>
  );
};

export default Index;
