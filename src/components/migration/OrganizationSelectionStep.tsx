import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Building,
  Database,
  FolderOpen,
} from "lucide-react";
import { GristOrganization, GristWorkspace } from "@/lib/grist";

interface OrganizationSelectionStepProps {
  gristOrgs: GristOrganization[];
  gristWorkspaces: GristWorkspace[];
  selectedOrg: number | null;
  selectedWorkspace: number | null;
  isLoadingOrgs: boolean;
  isLoadingWorkspaces: boolean;
  onOrgSelect: (orgId: number) => void;
  onWorkspaceSelect: (workspaceId: number) => void;
  onGoBack: () => void;
  onContinue: () => void;
}

export const OrganizationSelectionStep = ({
  gristOrgs,
  gristWorkspaces,
  selectedOrg,
  selectedWorkspace,
  isLoadingOrgs,
  isLoadingWorkspaces,
  onOrgSelect,
  onWorkspaceSelect,
  onGoBack,
  onContinue,
}: OrganizationSelectionStepProps) => {
  return (
    <Card className="border-2 border-green-100 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <Building className="h-6 w-6 text-green-600" />
          </div>
          Select Grist Organization & Workspace
        </CardTitle>
        <CardDescription className="text-lg">
          Choose where to create your new Grist document
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Organizations Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-900 flex items-center gap-2">
            <Building className="h-5 w-5" />
            Select Organization
          </h3>

          {isLoadingOrgs ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <span className="ml-2 text-gray-600">
                Loading organizations...
              </span>
            </div>
          ) : (
            <div className="grid gap-3">
              {gristOrgs.map((org) => (
                <div
                  key={org.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-green-300 ${
                    selectedOrg === org.id
                      ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => onOrgSelect(org.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        selectedOrg === org.id ? "bg-green-600" : "bg-gray-400"
                      }`}
                    >
                      <Building className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium">{org.name}</div>
                      {org.domain && (
                        <div className="text-sm text-gray-600">
                          {org.domain}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workspaces Section */}
        {selectedOrg && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-900 flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Select Workspace
            </h3>

            {isLoadingWorkspaces ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                <span className="ml-2 text-gray-600">
                  Loading workspaces...
                </span>
              </div>
            ) : (
              <div className="grid gap-3">
                {gristWorkspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-green-300 ${
                      selectedWorkspace === workspace.id
                        ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => onWorkspaceSelect(workspace.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          selectedWorkspace === workspace.id
                            ? "bg-green-600"
                            : "bg-gray-400"
                        }`}
                      >
                        <FolderOpen className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">{workspace.name}</div>
                        {workspace.docs && (
                          <div className="text-sm text-gray-600">
                            {workspace.docs.length} document(s)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {gristWorkspaces.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No workspaces found in this organization
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onGoBack} className="flex-1">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tables
          </Button>

          <Button
            onClick={onContinue}
            disabled={!selectedOrg || !selectedWorkspace}
            className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            Continue to Migration
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
