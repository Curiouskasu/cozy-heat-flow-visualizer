import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { CalculatorInputs, GlazingElement, BuildingElement, ClimateData } from "./HeatTransferCalculator";
import EPWFileHandler from "./EPWFileHandler";

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
            uValue: 0.3, // Default U-value
            shgc: 0
          }
        ]
      }
    }));
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
      <CardContent className="space-y-6">
        {inputs[buildingType].glazingElements.map((glazing, index) => (
          <div key={glazing.id} className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Input
                value={glazing.name}
                onChange={(e) => updateGlazingElement(buildingType, glazing.id, 'name', e.target.value)}
                className="font-semibold"
              />
              {inputs[buildingType].glazingElements.length > 1 && (
                <Button
                  onClick={() => removeGlazingElement(buildingType, glazing.id)}
                  size="sm"
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="North Area (Agn)"
                field={`${buildingType}-${glazing.id}-northArea`}
                unit="ft²"
                value={glazing.northArea}
                onChange={(value) => updateGlazingElement(buildingType, glazing.id, 'northArea', value)}
              />
              <InputField
                label="South Area (Ags)"
                field={`${buildingType}-${glazing.id}-southArea`}
                unit="ft²"
                value={glazing.southArea}
                onChange={(value) => updateGlazingElement(buildingType, glazing.id, 'southArea', value)}
              />
              <InputField
                label="East Area (Age)"
                field={`${buildingType}-${glazing.id}-eastArea`}
                unit="ft²"
                value={glazing.eastArea}
                onChange={(value) => updateGlazingElement(buildingType, glazing.id, 'eastArea', value)}
              />
              <InputField
                label="West Area (Agw)"
                field={`${buildingType}-${glazing.id}-westArea`}
                unit="ft²"
                value={glazing.westArea}
                onChange={(value) => updateGlazingElement(buildingType, glazing.id, 'westArea', value)}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <InputField
                label="Total Perimeter (Lg)"
                field={`${buildingType}-${glazing.id}-perimeter`}
                unit="ft"
                value={glazing.perimeter}
                onChange={(value) => updateGlazingElement(buildingType, glazing.id, 'perimeter', value)}
              />
              <InputField
                label="U-Value (Ug)"
                field={`${buildingType}-${glazing.id}-uValue`}
                unit="Btu/ft²·°F·h"
                step="0.01"
                value={glazing.uValue}
                onChange={(value) => updateGlazingElement(buildingType, glazing.id, 'uValue', value)}
              />
              <InputField
                label="SHGC"
                field={`${buildingType}-${glazing.id}-shgc`}
                value={glazing.shgc}
                onChange={(value) => updateGlazingElement(buildingType, glazing.id, 'shgc', value)}
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
          </div>
        ))}
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
      <CardContent className="space-y-4">
        {inputs[buildingType].buildingElements.map((element) => (
          <div key={element.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <Input
                value={element.name}
                onChange={(e) => updateBuildingElement(buildingType, element.id, 'name', e.target.value)}
                className="font-semibold max-w-xs"
              />
              {inputs[buildingType].buildingElements.length > 1 && (
                <Button
                  onClick={() => removeBuildingElement(buildingType, element.id)}
                  size="sm"
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Area (A)"
                field={`${buildingType}-${element.id}-area`}
                unit="ft²"
                value={element.area}
                onChange={(value) => updateBuildingElement(buildingType, element.id, 'area', value)}
              />
              <InputField
                label="R-Value (R)"
                field={`${buildingType}-${element.id}-rValue`}
                unit="ft²·°F·h/Btu"
                value={element.rValue}
                onChange={(value) => updateBuildingElement(buildingType, element.id, 'rValue', value)}
              />
            </div>
          </div>
        ))}
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
