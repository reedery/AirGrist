import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AirtableTable } from "@/lib/airtable";

interface RelationConfig {
  sourceTableId: string;
  sourceFieldId: string;
  targetTableId: string;
  targetFieldId: string;
  isActive: boolean; // Pour indiquer si cette relation doit être créée
}

interface RelationSelectionStepProps {
  tables: AirtableTable[];
  selectedTables: string[];
  onContinue: (relations: RelationConfig[]) => void;
  onGoBack: () => void;
}

export function RelationSelectionStep({
  tables,
  selectedTables,
  onContinue,
  onGoBack
}: RelationSelectionStepProps) {
  const [relations, setRelations] = useState<RelationConfig[]>([]);

  const findRelations = () => {
    const newRelations: RelationConfig[] = [];
    const processedRelations = new Set<string>();

    // Parcourir toutes les tables sélectionnées
    for (const tableId of selectedTables) {
      const table = tables.find(t => t.id === tableId);
      if (!table?.fields) continue;

      // Chercher les champs de type lien
      const linkFields = table.fields.filter(field => 
        field.type === "multipleRecordLinks" || field.type === "singleRecordLink"
      );

      for (const field of linkFields) {
        if (!field.options?.linkedTableId) continue;

        // Créer une clé unique pour cette relation (dans les deux sens)
        const relationKey = [tableId, field.options.linkedTableId].sort().join('-');
        
        // Si cette relation a déjà été traitée, on l'ignore
        if (processedRelations.has(relationKey)) continue;
        processedRelations.add(relationKey);

        // Trouver le champ de lien correspondant dans la table liée
        const linkedTable = tables.find(t => t.id === field.options.linkedTableId);
        const inverseField = linkedTable?.fields?.find(f => 
          f.id === field.options.inverseLinkFieldId
        );

        if (inverseField) {
          newRelations.push({
            sourceTableId: tableId,
            sourceFieldId: field.id,
            targetTableId: field.options.linkedTableId,
            targetFieldId: inverseField.id,
            isActive: false
          });
        }
      }
    }

    setRelations(newRelations);
  };

  const handleSourceChange = (index: number, sourceTableId: string) => {
    const newRelations = [...relations];
    const relation = newRelations[index];
    
    // Si la nouvelle source était la cible, on échange les rôles
    if (sourceTableId === relation.targetTableId) {
      newRelations[index] = {
        ...relation,
        sourceTableId: relation.targetTableId,
        sourceFieldId: relation.targetFieldId,
        targetTableId: relation.sourceTableId,
        targetFieldId: relation.sourceFieldId
      };
    } else {
      newRelations[index] = {
        ...relation,
        sourceTableId,
        sourceFieldId: tables
          .find(t => t.id === sourceTableId)
          ?.fields?.find(f => f.type === "multipleRecordLinks" || f.type === "singleRecordLink")?.id || relation.sourceFieldId
      };
    }
    
    setRelations(newRelations);
  };

  const handleTargetChange = (index: number, targetTableId: string) => {
    const newRelations = [...relations];
    const relation = newRelations[index];
    
    // Si la nouvelle cible était la source, on échange les rôles
    if (targetTableId === relation.sourceTableId) {
      newRelations[index] = {
        ...relation,
        sourceTableId: relation.targetTableId,
        sourceFieldId: relation.targetFieldId,
        targetTableId: relation.sourceTableId,
        targetFieldId: relation.sourceFieldId
      };
    } else {
      newRelations[index] = {
        ...relation,
        targetTableId,
        targetFieldId: tables
          .find(t => t.id === targetTableId)
          ?.fields?.find(f => f.type === "multipleRecordLinks" || f.type === "singleRecordLink")?.id || relation.targetFieldId
      };
    }
    
    setRelations(newRelations);
  };

  const handleActiveChange = (index: number) => {
    const newRelations = [...relations];
    newRelations[index] = {
      ...newRelations[index],
      isActive: !newRelations[index].isActive
    };
    setRelations(newRelations);
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Configuration des Relations</h2>
      <p className="text-gray-600 mb-6">
        Pour chaque relation, sélectionnez la direction souhaitée (source vers cible) et activez-la si nécessaire.
        Une relation ne doit être active que dans un seul sens.
      </p>

      <Button onClick={findRelations} className="mb-6">
        Détecter les Relations
      </Button>

      {relations.length > 0 && (
        <div className="space-y-4">
          {relations.map((relation, index) => {
            const sourceTable = tables.find(t => t.id === relation.sourceTableId);
            const targetTable = tables.find(t => t.id === relation.targetTableId);
            const sourceField = sourceTable?.fields?.find(f => f.id === relation.sourceFieldId);
            const targetField = targetTable?.fields?.find(f => f.id === relation.targetFieldId);

            return (
              <div key={index} className="border p-4 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <select
                        className="flex-1 p-2 border rounded"
                        value={`${relation.sourceTableId}-${relation.targetTableId}`}
                        onChange={(e) => {
                          const [newSourceId, newTargetId] = e.target.value.split('-');
                          const newRelations = [...relations];
                          newRelations[index] = {
                            ...relation,
                            sourceTableId: newSourceId,
                            targetTableId: newTargetId
                          };
                          setRelations(newRelations);
                        }}
                      >
                        <option value={`${relation.sourceTableId}-${relation.targetTableId}`}>
                          {sourceTable?.name} → {targetTable?.name}
                        </option>
                        <option value={`${relation.targetTableId}-${relation.sourceTableId}`}>
                          {targetTable?.name} → {sourceTable?.name}
                        </option>
                      </select>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`active-${index}`}
                          checked={relation.isActive}
                          onChange={() => handleActiveChange(index)}
                          className="h-4 w-4"
                        />
                        <label htmlFor={`active-${index}`} className="text-sm text-gray-600">
                          Activer
                        </label>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mt-2">
                      Champs : {sourceField?.name} ↔ {targetField?.name}
                    </p>

                    {!relation.isActive && (
                      <p className="text-sm text-yellow-600 mt-1">
                        Cette relation sera ignorée lors de la migration
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onGoBack}>
          Retour
        </Button>
        <Button 
          onClick={() => onContinue(relations.filter(r => r.isActive))}
          disabled={relations.filter(r => r.isActive).length === 0}
        >
          Continuer
        </Button>
      </div>
    </Card>
  );
} 