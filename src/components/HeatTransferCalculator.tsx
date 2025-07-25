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

export type BuildingElementCategory = 'glazing' | 'aboveGrade' | 'slab' | 'basementWall';

export interface BuildingElement {
  id?: string;
  name: string;
  category: BuildingElementCategory;
  area: number;
  rValue?: number; // For Above Grade Element and Basement Walls
  uValue?: number; // For glazing
  fFactor?: number; // For On/Sub-grade Slab
  perimeter?: number; // For On/Sub-grade Slab
  cFactor?: number; // For Basement Walls
}

export interface BuildingData {
  glazingElements: GlazingElement[];
  buildingElements: BuildingElement[];
}

export interface BuildingColumn {
  id?: string;
  name: string;
  elements: BuildingElement[];
}

export interface CalculatorInputs {
  climateData: ClimateData;
  currentEnergyLoad: number;
  airflowRate: number;
  buildingColumns: BuildingColumn[];
  // Manual climate inputs
  heatingBaseTemp?: number;
  coolingBaseTemp?: number;
  edNorth?: number;
  edSouth?: number;
  edEast?: number;
  edWest?: number;
  // Legacy fields for backward compatibility
  currentBuilding: BuildingData;
  proposedBuilding: BuildingData;
  heatingDegreeDays: number;
  coolingDegreeDays: number;
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
    airflowRate: 0.01,
    buildingColumns: [
      {
        id: 'building1',
        name: 'Building 1',
        elements: [
          {
            id: Date.now().toString(),
            name: "Glazing 1",
            category: "glazing",
            area: 300,
            uValue: 0.5,
          },
          {
            id: Date.now().toString(),
            name: "Wall 1",
            category: "aboveGrade",
            area: 400,
            rValue: 15,
          },
        ]
      }
    ],
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
          category: "aboveGrade",
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
          category: "aboveGrade",
          area: 450,
          rValue: 20,
        },
      ],
    },
    heatingDegreeDays: 5000,
    coolingDegreeDays: 1000,
    northGlazingArea: 100,
    southGlazingArea: 100,
    eastGlazingArea: 50,
    westGlazingArea: 50,
    northSolarRadiation: 300,
    southSolarRadiation: 500,
    eastSolarRadiation: 400,
    westSolarRadiation: 400,
    glazingPerimeter: 100,
    glazingRValue: 2,
    solarHeatGainCoeff: 0.5,
    soffitArea: 100,
    soffitRValue: 30,
    basementArea: 500,
    basementRValue: 10,
    roofArea: 300,
    roofRValue: 40,
    floorArea: 400,
    floorRValue: 12,
    opaqueWallArea: 1000,
    opaqueWallRValue: 15,
  });

  const [inputs, setInputs] = useState<CalculatorInputs>(() => {
    const saved = localStorage.getItem('heatTransferInputs');
    if (saved) {
      try {
        const parsedInputs = JSON.parse(saved);
        // Ensure buildingColumns exists and is an array
        if (!parsedInputs.buildingColumns || !Array.isArray(parsedInputs.buildingColumns)) {
          console.log('buildingColumns missing or invalid, creating from legacy data');
          parsedInputs.buildingColumns = [
            {
              id: 'current',
              name: 'Current Building',
              elements: []
            },
            {
              id: 'proposed',
              name: 'Proposed Building',
              elements: []
            }
          ];
        }
        
        // Ensure each building column has proper structure and migrate legacy data
        parsedInputs.buildingColumns = parsedInputs.buildingColumns.map((col: any) => ({
          ...col,
          elements: Array.isArray(col.elements) ? col.elements : []
        }));
        
        // Migrate legacy currentBuilding and proposedBuilding data
        if (parsedInputs.currentBuilding?.buildingElements) {
          parsedInputs.currentBuilding.buildingElements = parsedInputs.currentBuilding.buildingElements.map((el: any) => ({
            ...el,
            category: el.category || 'aboveGrade'
          }));
        }
        if (parsedInputs.proposedBuilding?.buildingElements) {
          parsedInputs.proposedBuilding.buildingElements = parsedInputs.proposedBuilding.buildingElements.map((el: any) => ({
            ...el,
            category: el.category || 'aboveGrade'
          }));
        }
        
        return parsedInputs;
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
    totalPerimeter: number,
    airflowRate: number,
    degreeDays: number
  ): number => {
    return totalPerimeter * 1.08 * airflowRate * degreeDays * (24/1000);
  };

  const calculateResults = (inputs: CalculatorInputs): CalculatorResults => {
    // Ensure buildingColumns exists and has the required columns
    const buildingColumns = Array.isArray(inputs.buildingColumns) ? inputs.buildingColumns : [];
    
    // Use buildingColumns if available, otherwise fall back to legacy buildings
    const currentBuilding = inputs.currentBuilding;
    const proposedBuilding = inputs.proposedBuilding;

    // Ensure we have valid building data with proper array initialization
    if (!currentBuilding || !proposedBuilding) {
      console.error('Missing building data for calculations');
      return {
        envelopeHeatGain: 0,
        infiltrationHeatGain: 0,
        solarHeatGain: 0,
        envelopeHeatLoss: 0,
        infiltrationHeatLoss: 0,
        totalGlazingArea: 0,
        currentBuildingEnergy: 0,
        proposedBuildingEnergy: 0,
      };
    }

    let envelopeHeatLoss = 0;
    let envelopeHeatGain = 0;
    let solarHeatGain = 0;
    let totalGlazingArea = 0;

    // Current Building Calculations
    let currentEnvelopeHeatLoss = 0;
    let currentEnvelopeHeatGain = 0;
    let currentSolarHeatGain = 0;
    let currentTotalPerimeter = 0;

    // Heat Loss through Building Elements - ensure array exists
    const currentBuildingElements = Array.isArray(currentBuilding.buildingElements) ? currentBuilding.buildingElements : [];
    currentBuildingElements.forEach((element) => {
      switch (element.category) {
        case 'aboveGrade':
          if (element.rValue) {
            currentEnvelopeHeatLoss += calculateHeatLoss(
              element.area,
              element.rValue,
              inputs.climateData.heatingDegreeDays
            );
            currentEnvelopeHeatGain += calculateHeatGain(
              element.area,
              1 / element.rValue,
              inputs.climateData.coolingDegreeDays
            );
          }
          break;
        case 'slab':
          if (element.fFactor && element.perimeter) {
            // F*Ls = Qc, then Qc*(HDD+CDD)*24 = Qannual
            const qc = element.fFactor * element.perimeter;
            const qAnnual = qc * (inputs.climateData.heatingDegreeDays + inputs.climateData.coolingDegreeDays) * 24;
            currentEnvelopeHeatLoss += qAnnual * (inputs.climateData.heatingDegreeDays / (inputs.climateData.heatingDegreeDays + inputs.climateData.coolingDegreeDays));
            currentEnvelopeHeatGain += qAnnual * (inputs.climateData.coolingDegreeDays / (inputs.climateData.heatingDegreeDays + inputs.climateData.coolingDegreeDays));
          }
          break;
        case 'basementWall':
          if (element.cFactor) {
            // C-factor works like U-value in relationship to area
            currentEnvelopeHeatLoss += calculateHeatLoss(
              element.area,
              1 / element.cFactor,
              inputs.climateData.heatingDegreeDays
            );
            currentEnvelopeHeatGain += calculateHeatGain(
              element.area,
              element.cFactor,
              inputs.climateData.coolingDegreeDays
            );
          }
          break;
      }
    });

    // Glazing Calculations for Current Building - ensure array exists
    const currentGlazingElements = Array.isArray(currentBuilding.glazingElements) ? currentBuilding.glazingElements : [];
    currentGlazingElements.forEach((glazing) => {
      const glazingArea =
        glazing.northArea +
        glazing.southArea +
        glazing.eastArea +
        glazing.westArea;
      totalGlazingArea += glazingArea;
      currentTotalPerimeter += glazing.perimeter;

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
    let proposedTotalPerimeter = 0;

    // Heat Loss through Building Elements - ensure array exists
    const proposedBuildingElements = Array.isArray(proposedBuilding.buildingElements) ? proposedBuilding.buildingElements : [];
    proposedBuildingElements.forEach((element) => {
      switch (element.category) {
        case 'aboveGrade':
          if (element.rValue) {
            proposedEnvelopeHeatLoss += calculateHeatLoss(
              element.area,
              element.rValue,
              inputs.climateData.heatingDegreeDays
            );
            proposedEnvelopeHeatGain += calculateHeatGain(
              element.area,
              1 / element.rValue,
              inputs.climateData.coolingDegreeDays
            );
          }
          break;
        case 'slab':
          if (element.fFactor && element.perimeter) {
            // F*Ls = Qc, then Qc*(HDD+CDD)*24 = Qannual
            const qc = element.fFactor * element.perimeter;
            const qAnnual = qc * (inputs.climateData.heatingDegreeDays + inputs.climateData.coolingDegreeDays) * 24;
            proposedEnvelopeHeatLoss += qAnnual * (inputs.climateData.heatingDegreeDays / (inputs.climateData.heatingDegreeDays + inputs.climateData.coolingDegreeDays));
            proposedEnvelopeHeatGain += qAnnual * (inputs.climateData.coolingDegreeDays / (inputs.climateData.heatingDegreeDays + inputs.climateData.coolingDegreeDays));
          }
          break;
        case 'basementWall':
          if (element.cFactor) {
            // C-factor works like U-value in relationship to area
            proposedEnvelopeHeatLoss += calculateHeatLoss(
              element.area,
              1 / element.cFactor,
              inputs.climateData.heatingDegreeDays
            );
            proposedEnvelopeHeatGain += calculateHeatGain(
              element.area,
              element.cFactor,
              inputs.climateData.coolingDegreeDays
            );
          }
          break;
      }
    });

    // Glazing Calculations for Proposed Building - ensure array exists
    const proposedGlazingElements = Array.isArray(proposedBuilding.glazingElements) ? proposedBuilding.glazingElements : [];
    proposedGlazingElements.forEach((glazing) => {
      const glazingArea =
        glazing.northArea +
        glazing.southArea +
        glazing.eastArea +
        glazing.westArea;
      proposedTotalPerimeter += glazing.perimeter;

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
          inputs.climateData.eastSolarRadiation
        ) +
        calculateSolarHeatGain(
          glazing.westArea,
          glazing.shgc,
          inputs.climateData.westSolarRadiation
        );
    });

    const currentInfiltrationHeatLoss = calculateInfiltrationHeatLoss(
      currentTotalPerimeter,
      inputs.airflowRate,
      inputs.climateData.heatingDegreeDays
    );

    const currentInfiltrationHeatGain = calculateInfiltrationHeatLoss(
      currentTotalPerimeter,
      inputs.airflowRate,
      inputs.climateData.coolingDegreeDays
    );

    const proposedInfiltrationHeatLoss = calculateInfiltrationHeatLoss(
      proposedTotalPerimeter,
      inputs.airflowRate,
      inputs.climateData.heatingDegreeDays
    );

    const proposedInfiltrationHeatGain = calculateInfiltrationHeatLoss(
      proposedTotalPerimeter,
      inputs.airflowRate,
      inputs.climateData.coolingDegreeDays
    );

    // Use current building values for legacy results
    envelopeHeatLoss = currentEnvelopeHeatLoss;
    envelopeHeatGain = currentEnvelopeHeatGain;
    solarHeatGain = currentSolarHeatGain;

    const currentBuildingEnergy = Math.round(
      currentEnvelopeHeatLoss + currentEnvelopeHeatGain + currentSolarHeatGain + currentInfiltrationHeatLoss + currentInfiltrationHeatGain
    );

    const proposedBuildingEnergy = Math.round(
      proposedEnvelopeHeatLoss + proposedEnvelopeHeatGain + proposedSolarHeatGain + proposedInfiltrationHeatLoss + proposedInfiltrationHeatGain
    );

    return {
      envelopeHeatGain: Math.round(envelopeHeatGain),
      infiltrationHeatGain: Math.round(currentInfiltrationHeatGain),
      solarHeatGain: Math.round(solarHeatGain),
      envelopeHeatLoss: Math.round(envelopeHeatLoss),
      infiltrationHeatLoss: Math.round(currentInfiltrationHeatLoss),
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
    toast("CSV data imported successfully - you can now edit the values before running the simulation");
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
