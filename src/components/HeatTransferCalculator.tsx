import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import CalculatorInputsComponent from "./CalculatorInputs";
import CalculatorResults from "./CalculatorResults";
import CalculatorChartsComponent from "./CalculatorCharts";
import InteractiveChartsManager from "./InteractiveChartsManager";
import CSVImporter from "./CSVImporter";

export interface ClimateData {
  isManualInput: boolean;
  heatingDegreeDays: number;
  coolingDegreeDays: number;
  northSolarRadiation: number;
  southSolarRadiation: number;
  eastSolarRadiation: number;
  westSolarRadiation: number;
  epwFileName?: string;
}

export interface GlazingElement {
  id: string;
  name: string;
  northArea: number;
  southArea: number;
  eastArea: number;
  westArea: number;
  perimeter: number;
  uValue: number;
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

export interface CalculatorInputs {
  climateData: ClimateData;
  currentEnergyLoad: number;
  currentBuilding: BuildingData;
  proposedBuilding: BuildingData;
  heatingDegreeDays: number; // Legacy field
  coolingDegreeDays: number; // Legacy field
  northGlazingArea: number; // Legacy field
  southGlazingArea: number; // Legacy field
  eastGlazingArea: number; // Legacy field
  westGlazingArea: number; // Legacy field
  northSolarRadiation: number; // Legacy field
  southSolarRadiation: number; // Legacy field
  eastSolarRadiation: number; // Legacy field
  westSolarRadiation: number; // Legacy field
  glazingPerimeter: number; // Legacy field
  glazingRValue: number; // Legacy field
  solarHeatGainCoeff: number; // Legacy field
  soffitArea: number; // Legacy field
  soffitRValue: number; // Legacy field
  basementArea: number; // Legacy field
  basementRValue: number; // Legacy field
  roofArea: number; // Legacy field
  roofRValue: number; // Legacy field
  floorArea: number; // Legacy field
  floorRValue: number; // Legacy field
  opaqueWallArea: number; // Legacy field
  opaqueWallRValue: number; // Legacy field
}

export interface CalculatorResults {
  envelopeHeatGain: number;
  infiltrationHeatGain: number;
  solarHeatGain: number;
  envelopeHeatLoss: number;
  infiltrationHeatLoss: number;
  totalGlazingArea: number;
  currentBuildingEnergy: number;
  proposedBuildingEnergy: number;
}

interface SavedState {
  id: string;
  name: string;
  timestamp: string;
  inputs: CalculatorInputs;
  results: CalculatorResults;
}

const HeatTransferCalculator = () => {
  const getDefaultInputs = (): CalculatorInputs => ({
    climateData: {
      isManualInput: false,
      heatingDegreeDays: 5000,
      coolingDegreeDays: 1000,
      northSolarRadiation: 300,
      southSolarRadiation: 500,
      eastSolarRadiation: 400,
      westSolarRadiation: 400,
    },
    currentEnergyLoad: 50000000,
    currentBuilding: {
      glazingElements: [
        {
          id: Date.now().toString(),
          name: "Glazing 1",
          northArea: 100,
          southArea: 100,
          eastArea: 50,
          westArea: 50,
          perimeter: 100,
          uValue: 0.5,
          shgc: 0.5,
        },
      ],
      buildingElements: [
        {
          id: Date.now().toString(),
          name: "Wall 1",
          area: 400,
          rValue: 15,
        },
      ],
    },
    proposedBuilding: {
      glazingElements: [
        {
          id: Date.now().toString(),
          name: "Glazing 1",
          northArea: 120,
          southArea: 120,
          eastArea: 60,
          westArea: 60,
          perimeter: 120,
          uValue: 0.4,
          shgc: 0.6,
        },
      ],
      buildingElements: [
        {
          id: Date.now().toString(),
          name: "Wall 1",
          area: 450,
          rValue: 20,
        },
      ],
    },
    heatingDegreeDays: 5000, // Legacy field
    coolingDegreeDays: 1000, // Legacy field
    northGlazingArea: 100, // Legacy field
    southGlazingArea: 100, // Legacy field
    eastGlazingArea: 50, // Legacy field
    westGlazingArea: 50, // Legacy field
    northSolarRadiation: 300, // Legacy field
    southSolarRadiation: 500, // Legacy field
    eastSolarRadiation: 400, // Legacy field
    westSolarRadiation: 400, // Legacy field
    glazingPerimeter: 100, // Legacy field
    glazingRValue: 2, // Legacy field
    solarHeatGainCoeff: 0.5, // Legacy field
    soffitArea: 100, // Legacy field
    soffitRValue: 30, // Legacy field
    basementArea: 500, // Legacy field
    basementRValue: 10, // Legacy field
    roofArea: 300, // Legacy field
    roofRValue: 40, // Legacy field
    floorArea: 400, // Legacy field
    floorRValue: 12, // Legacy field
    opaqueWallArea: 1000, // Legacy field
    opaqueWallRValue: 15, // Legacy field
  });

  const [inputs, setInputs] = useState<CalculatorInputs>(() => {
    const saved = localStorage.getItem('heatTransferInputs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved inputs:', e);
      }
    }
    return getDefaultInputs();
  });

  const [savedStates, setSavedStates] = useState<SavedState[]>(() => {
    const saved = localStorage.getItem('heatTransferSavedStates');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved states:', e);
      }
    }
    return [];
  });

  const [selectedStateId, setSelectedStateId] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('heatTransferInputs', JSON.stringify(inputs));
  }, [inputs]);

  useEffect(() => {
    localStorage.setItem('heatTransferSavedStates', JSON.stringify(savedStates));
  }, [savedStates]);

  const calculateHeatLoss = (
    area: number,
    rValue: number,
    degreeDays: number
  ): number => {
    if (rValue === 0) return 0;
    return (area / rValue) * degreeDays * 24;
  };

  const calculateHeatGain = (
    area: number,
    uValue: number,
    degreeDays: number
  ): number => {
    return area * uValue * degreeDays * 24;
  };

  const calculateSolarHeatGain = (
    area: number,
    shgc: number,
    solarRadiation: number
  ): number => {
    return area * shgc * solarRadiation;
  };

  const calculateInfiltrationHeatLoss = (
    volume: number,
    ach: number,
    degreeDays: number
  ): number => {
    const airDensity = 0.0765; // lb/ft^3
    const specificHeat = 0.24; // BTU/lb*F
    return volume * ach * airDensity * specificHeat * degreeDays * 24;
  };

  const calculateResults = (inputs: CalculatorInputs): CalculatorResults => {
    let envelopeHeatLoss = 0;
    let envelopeHeatGain = 0;
    let solarHeatGain = 0;
    let totalGlazingArea = 0;

    // Current Building Calculations
    let currentEnvelopeHeatLoss = 0;
    let currentEnvelopeHeatGain = 0;
    let currentSolarHeatGain = 0;

    // Heat Loss through Building Elements
    inputs.currentBuilding.buildingElements.forEach((element) => {
      currentEnvelopeHeatLoss += calculateHeatLoss(
        element.area,
        element.rValue,
        inputs.climateData.heatingDegreeDays
      );
    });

    // Heat Gain through Building Elements
    inputs.currentBuilding.buildingElements.forEach((element) => {
      currentEnvelopeHeatGain += calculateHeatGain(
        element.area,
        1 / element.rValue,
        inputs.climateData.coolingDegreeDays
      );
    });

    // Glazing Calculations for Current Building
    inputs.currentBuilding.glazingElements.forEach((glazing) => {
      const glazingArea =
        glazing.northArea +
        glazing.southArea +
        glazing.eastArea +
        glazing.westArea;
      totalGlazingArea += glazingArea;

      currentEnvelopeHeatLoss += calculateHeatLoss(
        glazingArea,
        1 / glazing.uValue,
        inputs.climateData.heatingDegreeDays
      );
      currentEnvelopeHeatGain += calculateHeatGain(
        glazingArea,
        glazing.uValue,
        inputs.climateData.coolingDegreeDays
      );

      currentSolarHeatGain +=
        calculateSolarHeatGain(
          glazing.northArea,
          glazing.shgc,
          inputs.climateData.northSolarRadiation
        ) +
        calculateSolarHeatGain(
          glazing.southArea,
          glazing.shgc,
          inputs.climateData.southSolarRadiation
        ) +
        calculateSolarHeatGain(
          glazing.eastArea,
          glazing.shgc,
          inputs.climateData.eastSolarRadiation
        ) +
        calculateSolarHeatGain(
          glazing.westArea,
          glazing.shgc,
          inputs.climateData.westSolarRadiation
        );
    });

    // Proposed Building Calculations
    let proposedEnvelopeHeatLoss = 0;
    let proposedEnvelopeHeatGain = 0;
    let proposedSolarHeatGain = 0;

    // Heat Loss through Building Elements
    inputs.proposedBuilding.buildingElements.forEach((element) => {
      proposedEnvelopeHeatLoss += calculateHeatLoss(
        element.area,
        element.rValue,
        inputs.climateData.heatingDegreeDays
      );
    });

    // Heat Gain through Building Elements
    inputs.proposedBuilding.buildingElements.forEach((element) => {
      proposedEnvelopeHeatGain += calculateHeatGain(
        element.area,
        1 / element.rValue,
        inputs.climateData.coolingDegreeDays
      );
    });

    // Glazing Calculations for Proposed Building
    inputs.proposedBuilding.glazingElements.forEach((glazing) => {
      const glazingArea =
        glazing.northArea +
        glazing.southArea +
        glazing.eastArea +
        glazing.westArea;

      proposedEnvelopeHeatLoss += calculateHeatLoss(
        glazingArea,
        1 / glazing.uValue,
        inputs.climateData.heatingDegreeDays
      );
      proposedEnvelopeHeatGain += calculateHeatGain(
        glazingArea,
        glazing.uValue,
        inputs.climateData.coolingDegreeDays
      );

      proposedSolarHeatGain +=
        calculateSolarHeatGain(
          glazing.northArea,
          glazing.shgc,
          inputs.climateData.northSolarRadiation
        ) +
        calculateSolarHeatGain(
          glazing.southArea,
          glazing.shgc,
          inputs.climateData.southSolarRadiation
        ) +
        calculateSolarHeatGain(
          glazing.eastArea,
          glazing.shgc,
          inputs.climateData.westSolarRadiation
        );
    });

    const infiltrationHeatLoss = calculateInfiltrationHeatLoss(
      10000, // Example volume
      0.5, // Example ACH
      inputs.climateData.heatingDegreeDays
    );

    const infiltrationHeatGain = calculateInfiltrationHeatLoss(
      10000, // Example volume
      0.5, // Example ACH
      inputs.climateData.coolingDegreeDays
    );

    // Use current building values for legacy results
    envelopeHeatLoss = currentEnvelopeHeatLoss;
    envelopeHeatGain = currentEnvelopeHeatGain;
    solarHeatGain = currentSolarHeatGain;

    const currentBuildingEnergy = Math.round(
      currentEnvelopeHeatLoss + currentEnvelopeHeatGain + currentSolarHeatGain + infiltrationHeatLoss + infiltrationHeatGain
    );

    const proposedBuildingEnergy = Math.round(
      proposedEnvelopeHeatLoss + proposedEnvelopeHeatGain + proposedSolarHeatGain + infiltrationHeatLoss + infiltrationHeatGain
    );

    return {
      envelopeHeatGain: Math.round(envelopeHeatGain),
      infiltrationHeatGain: Math.round(infiltrationHeatGain),
      solarHeatGain: Math.round(solarHeatGain),
      envelopeHeatLoss: Math.round(envelopeHeatLoss),
      infiltrationHeatLoss: Math.round(infiltrationHeatLoss),
      totalGlazingArea: Math.round(totalGlazingArea),
      currentBuildingEnergy,
      proposedBuildingEnergy,
    };
  };

  const results = useMemo(() => calculateResults(inputs), [inputs]);

  const resetToDefaults = () => {
    setInputs(getDefaultInputs());
    setSelectedStateId('');
    toast("All values reset to defaults");
  };

  const saveCurrentState = () => {
    const newState: SavedState = {
      id: Date.now().toString(),
      name: `State ${savedStates.length + 1}`,
      timestamp: new Date().toISOString(),
      inputs: { ...inputs },
      results: { ...results }
    };

    const newStates = [newState, ...savedStates.slice(0, 2)];
    setSavedStates(newStates);
    setSelectedStateId(newState.id);
    toast(`State saved as "${newState.name}"`);
  };

  const loadState = (stateId: string) => {
    const state = savedStates.find(s => s.id === stateId);
    if (state) {
      setInputs(state.inputs);
      setSelectedStateId(stateId);
      toast(`Loaded "${state.name}"`);
    }
  };

  const handleCSVImport = (importedInputs: CalculatorInputs) => {
    setInputs(prev => ({ ...prev, ...importedInputs }));
    toast("CSV data imported successfully");
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <CSVImporter onDataImported={handleCSVImport} />
          
          <div className="flex gap-2">
            <Button
              onClick={resetToDefaults}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset All
            </Button>
            
            <Button
              onClick={saveCurrentState}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save State
            </Button>
          </div>
        </div>

        {savedStates.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Load previous:</span>
            <Select value={selectedStateId} onValueChange={loadState}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select saved state" />
              </SelectTrigger>
              <SelectContent>
                {savedStates.map(state => (
                  <SelectItem key={state.id} value={state.id}>
                    {state.name} ({new Date(state.timestamp).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Tabs defaultValue="inputs" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inputs">Inputs</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="interactive">Interactive Charts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inputs" className="space-y-4">
          <CalculatorInputsComponent inputs={inputs} setInputs={setInputs} />
        </TabsContent>
        
        <TabsContent value="results" className="space-y-4">
          <CalculatorResults inputs={inputs} results={results} />
        </TabsContent>
        
        <TabsContent value="charts" className="space-y-4">
          <CalculatorChartsComponent inputs={inputs} results={results} />
        </TabsContent>

        <TabsContent value="interactive" className="space-y-4">
          <InteractiveChartsManager inputs={inputs} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HeatTransferCalculator;
