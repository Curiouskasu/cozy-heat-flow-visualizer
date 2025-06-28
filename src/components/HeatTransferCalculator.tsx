
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CalculatorInputs from "./CalculatorInputs";
import CalculatorResults from "./CalculatorResults";
import CalculatorCharts from "./CalculatorCharts";

export interface GlazingElement {
  id: string;
  name: string;
  northArea: number;
  southArea: number;
  eastArea: number;
  westArea: number;
  perimeter: number;
  rValue: number;
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

const HeatTransferCalculator = () => {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    climateData: {
      heatingDegreeDays: 3000,
      coolingDegreeDays: 1000,
      northSolarRadiation: 800,
      southSolarRadiation: 1200,
      eastSolarRadiation: 1000,
      westSolarRadiation: 1000,
      isManualInput: true,
    },
    currentBuilding: {
      glazingElements: [{
        id: '1',
        name: 'Main Glazing',
        northArea: 50,
        southArea: 80,
        eastArea: 60,
        westArea: 60,
        perimeter: 200,
        rValue: 3.0,
        shgc: 0.4
      }],
      buildingElements: [
        { id: '1', name: 'Soffit', area: 100, rValue: 20 },
        { id: '2', name: 'Basement Walls', area: 150, rValue: 10 },
        { id: '3', name: 'Roof', area: 200, rValue: 30 },
        { id: '4', name: 'Floor', area: 180, rValue: 15 },
        { id: '5', name: 'Opaque Walls', area: 300, rValue: 12 }
      ]
    },
    proposedBuilding: {
      glazingElements: [{
        id: '1',
        name: 'Improved Glazing',
        northArea: 50,
        southArea: 80,
        eastArea: 60,
        westArea: 60,
        perimeter: 200,
        rValue: 5.0,
        shgc: 0.3
      }],
      buildingElements: [
        { id: '1', name: 'Soffit', area: 100, rValue: 30 },
        { id: '2', name: 'Basement Walls', area: 150, rValue: 15 },
        { id: '3', name: 'Roof', area: 200, rValue: 40 },
        { id: '4', name: 'Floor', area: 180, rValue: 20 },
        { id: '5', name: 'Opaque Walls', area: 300, rValue: 20 }
      ]
    },
    // Legacy fields
    heatingDegreeDays: 3000,
    coolingDegreeDays: 1000,
    currentEnergyLoad: 50000000,
    northGlazingArea: 50,
    southGlazingArea: 80,
    eastGlazingArea: 60,
    westGlazingArea: 60,
    northSolarRadiation: 800,
    southSolarRadiation: 1200,
    eastSolarRadiation: 1000,
    westSolarRadiation: 1000,
    glazingPerimeter: 200,
    glazingRValue: 3.0,
    solarHeatGainCoeff: 0.4,
    soffitArea: 100,
    soffitRValue: 20,
    basementArea: 150,
    basementRValue: 10,
    roofArea: 200,
    roofRValue: 30,
    floorArea: 180,
    floorRValue: 15,
    opaqueWallArea: 300,
    opaqueWallRValue: 12,
  });

  const calculateBuildingEnergy = (building: BuildingData, climateData: ClimateData) => {
    // Calculate total UA value for building elements
    const buildingUAValue = building.buildingElements.reduce((sum, element) => 
      sum + (element.area / element.rValue), 0);
    
    // Calculate total UA value for glazing elements
    const glazingUAValue = building.glazingElements.reduce((sum, glazing) => {
      const totalGlazingArea = glazing.northArea + glazing.southArea + glazing.eastArea + glazing.westArea;
      return sum + (totalGlazingArea / glazing.rValue);
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
                        (inputs.soffitArea / inputs.soffitRValue) +
                        (inputs.basementArea / inputs.basementRValue) +
                        (inputs.roofArea / inputs.roofRValue) +
                        (inputs.floorArea / inputs.floorRValue) +
                        (inputs.opaqueWallArea / inputs.opaqueWallRValue);
    
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

  return (
    <div className="space-y-6">
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
