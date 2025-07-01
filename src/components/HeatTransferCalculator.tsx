
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, Save } from "lucide-react";
import CalculatorInputs from "./CalculatorInputs";
import CalculatorResults from "./CalculatorResults";
import CalculatorCharts from "./CalculatorCharts";
import CSVImporter from "./CSVImporter";

export interface GlazingElement {
  id: string;
  name: string;
  northArea: number;
  southArea: number;
  eastArea: number;
  westArea: number;
  perimeter: number;
  uValue: number; // Changed from rValue to uValue
  shgc: number;
}

export interface BuildingElement {
  id: string;
  name: string;
  area: number;
  rValue: number;
}

export interface BuildingData {
  glazingElements: GlazingElement[];
  buildingElements: BuildingElement[];
}

export interface ClimateData {
  heatingDegreeDays: number;
  coolingDegreeDays: number;
  northSolarRadiation: number;
  southSolarRadiation: number;
  eastSolarRadiation: number;
  westSolarRadiation: number;
  isManualInput: boolean;
  epwFileName?: string;
}

export interface CalculatorInputs {
  // Climate data
  climateData: ClimateData;
  
  // Current building data
  currentBuilding: BuildingData;
  
  // Proposed building data
  proposedBuilding: BuildingData;
  
  // Legacy fields for backward compatibility
  heatingDegreeDays: number;
  coolingDegreeDays: number;
  currentEnergyLoad: number;
  northGlazingArea: number;
  southGlazingArea: number;
  eastGlazingArea: number;
  westGlazingArea: number;
  northSolarRadiation: number;
  southSolarRadiation: number;
  eastSolarRadiation: number;
  westSolarRadiation: number;
  glazingPerimeter: number;
  glazingRValue: number;
  solarHeatGainCoeff: number;
  soffitArea: number;
  soffitRValue: number;
  basementArea: number;
  basementRValue: number;
  roofArea: number;
  roofRValue: number;
  floorArea: number;
  floorRValue: number;
  opaqueWallArea: number;
  opaqueWallRValue: number;
}

export interface CalculatorResults {
  totalGlazingArea: number;
  envelopeHeatLoss: number;
  envelopeHeatGain: number;
  infiltrationHeatLoss: number;
  infiltrationHeatGain: number;
  solarHeatGain: number;
  currentBuildingEnergy: number;
  proposedBuildingEnergy: number;
}

interface SavedState {
  id: string;
  name: string;
  inputs: CalculatorInputs;
  results: CalculatorResults;
  timestamp: number;
}

const getEmptyInputs = (): CalculatorInputs => ({
  climateData: {
    heatingDegreeDays: 0,
    coolingDegreeDays: 0,
    northSolarRadiation: 0,
    southSolarRadiation: 0,
    eastSolarRadiation: 0,
    westSolarRadiation: 0,
    isManualInput: true,
  },
  currentBuilding: {
    glazingElements: [{
      id: '1',
      name: 'Main Glazing',
      northArea: 0,
      southArea: 0,
      eastArea: 0,
      westArea: 0,
      perimeter: 0,
      uValue: 0.3, // Default U-value
      shgc: 0
    }],
    buildingElements: [
      { id: '1', name: 'Soffit', area: 0, rValue: 0 },
      { id: '2', name: 'Basement Walls', area: 0, rValue: 0 },
      { id: '3', name: 'Roof', area: 0, rValue: 0 },
      { id: '4', name: 'Floor', area: 0, rValue: 0 },
      { id: '5', name: 'Opaque Walls', area: 0, rValue: 0 }
    ]
  },
  proposedBuilding: {
    glazingElements: [{
      id: '1',
      name: 'Improved Glazing',
      northArea: 0,
      southArea: 0,
      eastArea: 0,
      westArea: 0,
      perimeter: 0,
      uValue: 0.2, // Better U-value
      shgc: 0
    }],
    buildingElements: [
      { id: '1', name: 'Soffit', area: 0, rValue: 0 },
      { id: '2', name: 'Basement Walls', area: 0, rValue: 0 },
      { id: '3', name: 'Roof', area: 0, rValue: 0 },
      { id: '4', name: 'Floor', area: 0, rValue: 0 },
      { id: '5', name: 'Opaque Walls', area: 0, rValue: 0 }
    ]
  },
  // Legacy fields
  heatingDegreeDays: 0,
  coolingDegreeDays: 0,
  currentEnergyLoad: 0,
  northGlazingArea: 0,
  southGlazingArea: 0,
  eastGlazingArea: 0,
  westGlazingArea: 0,
  northSolarRadiation: 0,
  southSolarRadiation: 0,
  eastSolarRadiation: 0,
  westSolarRadiation: 0,
  glazingPerimeter: 0,
  glazingRValue: 3.0,
  solarHeatGainCoeff: 0,
  soffitArea: 0,
  soffitRValue: 0,
  basementArea: 0,
  basementRValue: 0,
  roofArea: 0,
  roofRValue: 0,
  floorArea: 0,
  floorRValue: 0,
  opaqueWallArea: 0,
  opaqueWallRValue: 0,
});

const HeatTransferCalculator = () => {
  const [inputs, setInputs] = useState<CalculatorInputs>(getEmptyInputs());
  const [savedStates, setSavedStates] = useState<SavedState[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<string>('');

  // Load saved states from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('calculator-saved-states');
    if (saved) {
      try {
        const parsedStates = JSON.parse(saved);
        setSavedStates(parsedStates);
      } catch (error) {
        console.error('Error loading saved states:', error);
      }
    }
  }, []);

  const calculateBuildingEnergy = (building: BuildingData, climateData: ClimateData) => {
    // Calculate total UA value for building elements
    const buildingUAValue = building.buildingElements.reduce((sum, element) => 
      sum + (element.area / (element.rValue || 1)), 0);
    
    // Calculate total UA value for glazing elements (convert U-value to R-value)
    const glazingUAValue = building.glazingElements.reduce((sum, glazing) => {
      const totalGlazingArea = glazing.northArea + glazing.southArea + glazing.eastArea + glazing.westArea;
      return sum + (totalGlazingArea * (glazing.uValue || 0.3));
    }, 0);
    
    const totalUAValue = buildingUAValue + glazingUAValue;
    
    // Calculate envelope heat transfer
    const envelopeHeatLoss = totalUAValue * climateData.heatingDegreeDays;
    const envelopeHeatGain = totalUAValue * climateData.coolingDegreeDays;
    
    // Calculate infiltration
    const totalPerimeter = building.glazingElements.reduce((sum, glazing) => sum + glazing.perimeter, 0);
    const infiltrationHeatLoss = totalPerimeter * climateData.heatingDegreeDays;
    const infiltrationHeatGain = totalPerimeter * climateData.coolingDegreeDays;
    
    // Calculate solar heat gain
    const solarHeatGain = building.glazingElements.reduce((sum, glazing) => {
      return sum + (
        glazing.northArea * climateData.northSolarRadiation +
        glazing.southArea * climateData.southSolarRadiation +
        glazing.eastArea * climateData.eastSolarRadiation +
        glazing.westArea * climateData.westSolarRadiation
      ) * glazing.shgc;
    }, 0);
    
    return envelopeHeatLoss + envelopeHeatGain + infiltrationHeatLoss + infiltrationHeatGain + solarHeatGain;
  };

  const results = useMemo((): CalculatorResults => {
    // Legacy calculations for backward compatibility
    const totalGlazingArea = inputs.northGlazingArea + inputs.southGlazingArea + 
                            inputs.eastGlazingArea + inputs.westGlazingArea;
    
    const totalUAValue = (totalGlazingArea / inputs.glazingRValue) +
                        (inputs.soffitArea / (inputs.soffitRValue || 1)) +
                        (inputs.basementArea / (inputs.basementRValue || 1)) +
                        (inputs.roofArea / (inputs.roofRValue || 1)) +
                        (inputs.floorArea / (inputs.floorRValue || 1)) +
                        (inputs.opaqueWallArea / (inputs.opaqueWallRValue || 1));
    
    const envelopeHeatLoss = totalUAValue * inputs.heatingDegreeDays;
    const envelopeHeatGain = totalUAValue * inputs.coolingDegreeDays;
    
    const infiltrationHeatLoss = inputs.glazingPerimeter * inputs.heatingDegreeDays;
    const infiltrationHeatGain = inputs.glazingPerimeter * inputs.coolingDegreeDays;
    
    const solarHeatGain = (inputs.northGlazingArea * inputs.northSolarRadiation +
                          inputs.southGlazingArea * inputs.southSolarRadiation +
                          inputs.eastGlazingArea * inputs.eastSolarRadiation +
                          inputs.westGlazingArea * inputs.westSolarRadiation) * inputs.solarHeatGainCoeff;
    
    // New building calculations
    const currentBuildingEnergy = calculateBuildingEnergy(inputs.currentBuilding, inputs.climateData);
    const proposedBuildingEnergy = calculateBuildingEnergy(inputs.proposedBuilding, inputs.climateData);
    
    return {
      totalGlazingArea,
      envelopeHeatLoss,
      envelopeHeatGain,
      infiltrationHeatLoss,
      infiltrationHeatGain,
      solarHeatGain,
      currentBuildingEnergy,
      proposedBuildingEnergy,
    };
  }, [inputs]);

  const handleCSVImport = (importedData: CalculatorInputs) => {
    setInputs(importedData);
  };

  const saveCurrentState = () => {
    const newState: SavedState = {
      id: Date.now().toString(),
      name: `Calculation ${new Date().toLocaleString()}`,
      inputs: { ...inputs },
      results: { ...results },
      timestamp: Date.now()
    };

    const newStates = [newState, ...savedStates.slice(0, 2)]; // Keep only 3 states
    setSavedStates(newStates);
    localStorage.setItem('calculator-saved-states', JSON.stringify(newStates));
    alert('Current state saved successfully!');
  };

  const loadSavedState = (stateId: string) => {
    const state = savedStates.find(s => s.id === stateId);
    if (state) {
      setInputs(state.inputs);
      setSelectedStateId(stateId);
    }
  };

  const resetToZero = () => {
    setInputs(getEmptyInputs());
    setSelectedStateId('');
  };

  return (
    <div className="space-y-6">
      <CSVImporter onDataImported={handleCSVImport} />
      
      {/* State Management Controls */}
      <Card>
        <CardHeader>
          <CardTitle>State Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <Button
              onClick={saveCurrentState}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Current State
            </Button>
            <Button
              onClick={resetToZero}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Zero
            </Button>
            {savedStates.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm">Load Previous:</span>
                <Select value={selectedStateId} onValueChange={loadSavedState}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select previous calculation" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedStates.map((state) => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="inputs" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inputs">Inputs</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inputs">
          <CalculatorInputs inputs={inputs} setInputs={setInputs} />
        </TabsContent>
        
        <TabsContent value="results">
          <CalculatorResults inputs={inputs} results={results} />
        </TabsContent>
        
        <TabsContent value="charts">
          <CalculatorCharts inputs={inputs} results={results} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HeatTransferCalculator;
