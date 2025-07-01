
import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CalculatorInputs, GlazingElement, BuildingElement, ClimateData } from "./HeatTransferCalculator";
import EPWFileHandler from "./EPWFileHandler";
import DragDropList from "./DragDropList";

interface Props {
  inputs: CalculatorInputs;
  setInputs: React.Dispatch<React.SetStateAction<CalculatorInputs>>;
}

const InputField = ({ 
  label, 
  field, 
  unit = "",
  step = "0.1",
  value,
  onChange,
  disabled = false
}: { 
  label: string; 
  field: string; 
  unit?: string;
  step?: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) => (
  <div className="space-y-2">
    <Label htmlFor={field}>{label} {unit && `(${unit})`}</Label>
    <Input
      id={field}
      type="number"
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-full"
      disabled={disabled}
    />
  </div>
);

const CalculatorInputsComponent = ({ inputs, setInputs }: Props) => {
  const updateClimateData = useCallback((climateData: ClimateData) => {
    setInputs(prev => ({ 
      ...prev, 
      climateData,
      // Update legacy fields for backward compatibility
      heatingDegreeDays: climateData.heatingDegreeDays,
      coolingDegreeDays: climateData.coolingDegreeDays,
      northSolarRadiation: climateData.northSolarRadiation,
      southSolarRadiation: climateData.southSolarRadiation,
      eastSolarRadiation: climateData.eastSolarRadiation,
      westSolarRadiation: climateData.westSolarRadiation,
    }));
  }, [setInputs]);

  const updateClimateField = useCallback((field: keyof ClimateData, value: number) => {
    setInputs(prev => ({
      ...prev,
      climateData: { ...prev.climateData, [field]: value },
      // Update legacy fields
      [field]: value
    }));
  }, [setInputs]);

  // Glazing element handlers
  const addGlazingElement = useCallback((buildingType: 'currentBuilding' | 'proposedBuilding') => {
    setInputs(prev => ({
      ...prev,
      [buildingType]: {
        ...prev[buildingType],
        glazingElements: [
          ...prev[buildingType].glazingElements,
          {
            id: Date.now().toString(),
            name: `Glazing ${prev[buildingType].glazingElements.length + 1}`,
            northArea: 0,
            southArea: 0,
            eastArea: 0,
            westArea: 0,
            perimeter: 0,
            uValue: 0.3,
            shgc: 0
          }
        ]
      }
    }));
  }, [setInputs]);

  const reorderGlazingElements = useCallback((buildingType: 'currentBuilding' | 'proposedBuilding', newOrder: GlazingElement[]) => {
    setInputs(prev => ({
      ...prev,
      [buildingType]: {
        ...prev[buildingType],
        glazingElements: newOrder
      }
    }));
  }, [setInputs]);

  const duplicateGlazingElement = useCallback((buildingType: 'currentBuilding' | 'proposedBuilding', id: string) => {
    setInputs(prev => {
      const elementToDuplicate = prev[buildingType].glazingElements.find(el => el.id === id);
      if (!elementToDuplicate) return prev;
      
      const duplicatedElement = {
        ...elementToDuplicate,
        id: Date.now().toString(),
        name: `${elementToDuplicate.name} (Copy)`
      };
      
      return {
        ...prev,
        [buildingType]: {
          ...prev[buildingType],
          glazingElements: [...prev[buildingType].glazingElements, duplicatedElement]
        }
      };
    });
  }, [setInputs]);

  const copyGlazingElementToOtherSide = useCallback((fromBuilding: 'currentBuilding' | 'proposedBuilding', id: string) => {
    const toBuilding = fromBuilding === 'currentBuilding' ? 'proposedBuilding' : 'currentBuilding';
    setInputs(prev => {
      const elementToCopy = prev[fromBuilding].glazingElements.find(el => el.id === id);
      if (!elementToCopy) return prev;
      
      const copiedElement = {
        ...elementToCopy,
        id: Date.now().toString(),
        name: elementToCopy.name.replace(/current|proposed/gi, toBuilding === 'currentBuilding' ? 'Current' : 'Proposed')
      };
      
      return {
        ...prev,
        [toBuilding]: {
          ...prev[toBuilding],
          glazingElements: [...prev[toBuilding].glazingElements, copiedElement]
        }
      };
    });
  }, [setInputs]);

  const removeGlazingElement = useCallback((buildingType: 'currentBuilding' | 'proposedBuilding', id: string) => {
    setInputs(prev => ({
      ...prev,
      [buildingType]: {
        ...prev[buildingType],
        glazingElements: prev[buildingType].glazingElements.filter(element => element.id !== id)
      }
    }));
  }, [setInputs]);

  const updateGlazingElement = useCallback((buildingType: 'currentBuilding' | 'proposedBuilding', id: string, field: keyof GlazingElement, value: any) => {
    setInputs(prev => ({
      ...prev,
      [buildingType]: {
        ...prev[buildingType],
        glazingElements: prev[buildingType].glazingElements.map(element =>
          element.id === id ? { ...element, [field]: value } : element
        )
      }
    }));
  }, [setInputs]);

  // Building element handlers
  const addBuildingElement = useCallback((buildingType: 'currentBuilding' | 'proposedBuilding') => {
    setInputs(prev => ({
      ...prev,
      [buildingType]: {
        ...prev[buildingType],
        buildingElements: [
          ...prev[buildingType].buildingElements,
          {
            id: Date.now().toString(),
            name: `Element ${prev[buildingType].buildingElements.length + 1}`,
            area: 0,
            rValue: 10
          }
        ]
      }
    }));
  }, [setInputs]);

  const reorderBuildingElements = useCallback((buildingType: 'currentBuilding' | 'proposedBuilding', newOrder: BuildingElement[]) => {
    setInputs(prev => ({
      ...prev,
      [buildingType]: {
        ...prev[buildingType],
        buildingElements: newOrder
      }
    }));
  }, [setInputs]);

  const duplicateBuildingElement = useCallback((buildingType: 'currentBuilding' | 'proposedBuilding', id: string) => {
    setInputs(prev => {
      const elementToDuplicate = prev[buildingType].buildingElements.find(el => el.id === id);
      if (!elementToDuplicate) return prev;
      
      const duplicatedElement = {
        ...elementToDuplicate,
        id: Date.now().toString(),
        name: `${elementToDuplicate.name} (Copy)`
      };
      
      return {
        ...prev,
        [buildingType]: {
          ...prev[buildingType],
          buildingElements: [...prev[buildingType].buildingElements, duplicatedElement]
        }
      };
    });
  }, [setInputs]);

  const copyBuildingElementToOtherSide = useCallback((fromBuilding: 'currentBuilding' | 'proposedBuilding', id: string) => {
    const toBuilding = fromBuilding === 'currentBuilding' ? 'proposedBuilding' : 'currentBuilding';
    setInputs(prev => {
      const elementToCopy = prev[fromBuilding].buildingElements.find(el => el.id === id);
      if (!elementToCopy) return prev;
      
      const copiedElement = {
        ...elementToCopy,
        id: Date.now().toString(),
        name: elementToCopy.name.replace(/current|proposed/gi, toBuilding === 'currentBuilding' ? 'Current' : 'Proposed')
      };
      
      return {
        ...prev,
        [toBuilding]: {
          ...prev[toBuilding],
          buildingElements: [...prev[toBuilding].buildingElements, copiedElement]
        }
      };
    });
  }, [setInputs]);

  const removeBuildingElement = useCallback((buildingType: 'currentBuilding' | 'proposedBuilding', id: string) => {
    setInputs(prev => ({
      ...prev,
      [buildingType]: {
        ...prev[buildingType],
        buildingElements: prev[buildingType].buildingElements.filter(element => element.id !== id)
      }
    }));
  }, [setInputs]);

  const updateBuildingElement = useCallback((buildingType: 'currentBuilding' | 'proposedBuilding', id: string, field: keyof BuildingElement, value: any) => {
    setInputs(prev => ({
      ...prev,
      [buildingType]: {
        ...prev[buildingType],
        buildingElements: prev[buildingType].buildingElements.map(element =>
          element.id === id ? { ...element, [field]: value } : element
        )
      }
    }));
  }, [setInputs]);

  const renderGlazingFields = (glazing: GlazingElement) => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <InputField
          label="North Area (Agn)"
          field={`northArea-${glazing.id}`}
          unit="ft²"
          value={glazing.northArea}
          onChange={(value) => updateGlazingElement('currentBuilding', glazing.id, 'northArea', value)}
        />
        <InputField
          label="South Area (Ags)"
          field={`southArea-${glazing.id}`}
          unit="ft²"
          value={glazing.southArea}
          onChange={(value) => updateGlazingElement('currentBuilding', glazing.id, 'southArea', value)}
        />
        <InputField
          label="East Area (Age)"
          field={`eastArea-${glazing.id}`}
          unit="ft²"
          value={glazing.eastArea}
          onChange={(value) => updateGlazingElement('currentBuilding', glazing.id, 'eastArea', value)}
        />
        <InputField
          label="West Area (Agw)"
          field={`westArea-${glazing.id}`}
          unit="ft²"
          value={glazing.westArea}
          onChange={(value) => updateGlazingElement('currentBuilding', glazing.id, 'westArea', value)}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <InputField
          label="Total Perimeter (Lg)"
          field={`perimeter-${glazing.id}`}
          unit="ft"
          value={glazing.perimeter}
          onChange={(value) => updateGlazingElement('currentBuilding', glazing.id, 'perimeter', value)}
        />
        <InputField
          label="U-Value (Ug)"
          field={`uValue-${glazing.id}`}
          unit="Btu/ft²·°F·h"
          step="0.01"
          value={glazing.uValue}
          onChange={(value) => updateGlazingElement('currentBuilding', glazing.id, 'uValue', value)}
        />
        <InputField
          label="SHGC"
          field={`shgc-${glazing.id}`}
          value={glazing.shgc}
          onChange={(value) => updateGlazingElement('currentBuilding', glazing.id, 'shgc', value)}
        />
      </div>
      
      <div className="text-sm text-muted-foreground">
        Total Glazing Area: {(glazing.northArea + glazing.southArea + glazing.eastArea + glazing.westArea).toFixed(1)} ft²
        {glazing.uValue > 0 && (
          <span className="ml-4">
            R-Value Equivalent: {(1 / glazing.uValue).toFixed(2)} ft²·°F·h/Btu
          </span>
        )}
      </div>
    </>
  );

  const renderBuildingFields = (element: BuildingElement) => (
    <div className="grid grid-cols-2 gap-4">
      <InputField
        label="Area (A)"
        field={`area-${element.id}`}
        unit="ft²"
        value={element.area}
        onChange={(value) => updateBuildingElement('currentBuilding', element.id, 'area', value)}
      />
      <InputField
        label="R-Value (R)"
        field={`rValue-${element.id}`}
        unit="ft²·°F·h/Btu"
        value={element.rValue}
        onChange={(value) => updateBuildingElement('currentBuilding', element.id, 'rValue', value)}
      />
    </div>
  );

  const GlazingSection = ({ buildingType, title }: { buildingType: 'currentBuilding' | 'proposedBuilding', title: string }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title} - Glazing</CardTitle>
        <Button
          onClick={() => addGlazingElement(buildingType)}
          size="sm"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Glazing
        </Button>
      </CardHeader>
      <CardContent>
        <DragDropList
          items={inputs[buildingType].glazingElements}
          onReorder={(newOrder) => reorderGlazingElements(buildingType, newOrder)}
          onDuplicate={(id) => duplicateGlazingElement(buildingType, id)}
          onCopyToOtherSide={(id) => copyGlazingElementToOtherSide(buildingType, id)}
          onRemove={(id) => removeGlazingElement(buildingType, id)}
          onUpdate={(id, field, value) => updateGlazingElement(buildingType, id, field as keyof GlazingElement, value)}
          renderFields={(glazing) => renderGlazingFields(glazing as GlazingElement)}
          allowRemove={inputs[buildingType].glazingElements.length > 1}
        />
      </CardContent>
    </Card>
  );

  const BuildingEnvelopeSection = ({ buildingType, title }: { buildingType: 'currentBuilding' | 'proposedBuilding', title: string }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title} - Building Envelope</CardTitle>
        <Button
          onClick={() => addBuildingElement(buildingType)}
          size="sm"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Element
        </Button>
      </CardHeader>
      <CardContent>
        <DragDropList
          items={inputs[buildingType].buildingElements}
          onReorder={(newOrder) => reorderBuildingElements(buildingType, newOrder)}
          onDuplicate={(id) => duplicateBuildingElement(buildingType, id)}
          onCopyToOtherSide={(id) => copyBuildingElementToOtherSide(buildingType, id)}
          onRemove={(id) => removeBuildingElement(buildingType, id)}
          onUpdate={(id, field, value) => updateBuildingElement(buildingType, id, field as keyof BuildingElement, value)}
          renderFields={(element) => renderBuildingFields(element as BuildingElement)}
          allowRemove={inputs[buildingType].buildingElements.length > 1}
        />
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Climate Data Section */}
      <Card>
        <CardHeader>
          <CardTitle>Climate Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <EPWFileHandler 
            climateData={inputs.climateData}
            onClimateDataChange={updateClimateData}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField 
              label="Heating Degree Days (Th)" 
              field="heatingDegreeDays" 
              unit="°F-days" 
              step="1"
              value={inputs.climateData.heatingDegreeDays}
              onChange={(value) => updateClimateField('heatingDegreeDays', value)}
              disabled={!inputs.climateData.isManualInput}
            />
            <InputField 
              label="Cooling Degree Days (Tc)" 
              field="coolingDegreeDays" 
              unit="°F-days" 
              step="1"
              value={inputs.climateData.coolingDegreeDays}
              onChange={(value) => updateClimateField('coolingDegreeDays', value)}
              disabled={!inputs.climateData.isManualInput}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InputField 
              label="North Solar Radiation (Edn)" 
              field="northSolarRadiation" 
              unit="Btu/ft²" 
              value={inputs.climateData.northSolarRadiation}
              onChange={(value) => updateClimateField('northSolarRadiation', value)}
              disabled={!inputs.climateData.isManualInput}
            />
            <InputField 
              label="South Solar Radiation (Eds)" 
              field="southSolarRadiation" 
              unit="Btu/ft²" 
              value={inputs.climateData.southSolarRadiation}
              onChange={(value) => updateClimateField('southSolarRadiation', value)}
              disabled={!inputs.climateData.isManualInput}
            />
            <InputField 
              label="East Solar Radiation (Ede)" 
              field="eastSolarRadiation" 
              unit="Btu/ft²" 
              value={inputs.climateData.eastSolarRadiation}
              onChange={(value) => updateClimateField('eastSolarRadiation', value)}
              disabled={!inputs.climateData.isManualInput}
            />
            <InputField 
              label="West Solar Radiation (Edw)" 
              field="westSolarRadiation" 
              unit="Btu/ft²" 
              value={inputs.climateData.westSolarRadiation}
              onChange={(value) => updateClimateField('westSolarRadiation', value)}
              disabled={!inputs.climateData.isManualInput}
            />
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout for Current vs Proposed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Building Column */}
        <div className="space-y-6">
          <GlazingSection buildingType="currentBuilding" title="Current Building" />
          <BuildingEnvelopeSection buildingType="currentBuilding" title="Current Building" />
        </div>

        {/* Proposed Building Column */}
        <div className="space-y-6">
          <GlazingSection buildingType="proposedBuilding" title="Proposed Building" />
          <BuildingEnvelopeSection buildingType="proposedBuilding" title="Proposed Building" />
        </div>
      </div>
    </div>
  );
};

export default CalculatorInputsComponent;
