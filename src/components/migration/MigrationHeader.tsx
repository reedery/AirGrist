import { ArrowRight, Database } from "lucide-react";

export const MigrationHeader = () => {
  return (
    <header className="text-center mb-12">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="p-3 bg-blue-600 rounded-xl">
          <Database className="h-8 w-8 text-white" aria-hidden={true} />
        </div>
        <ArrowRight className="h-6 w-6 text-gray-400" aria-hidden={true} />
        <div className="p-3 bg-green-600 rounded-xl">
          <Database className="h-8 w-8 text-white" aria-hidden={true} />
        </div>
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Airtable to Grist Migration Tool
      </h1>
      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
        Seamlessly migrate your data from Airtable to Grist with our intuitive
        step-by-step wizard
      </p>
    </header>
  );
};
