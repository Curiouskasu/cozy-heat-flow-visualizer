
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CalculatorInputs from "./CalculatorInputs";
import CalculatorResults from "./CalculatorResults";
import CalculatorCharts from "./CalculatorCharts";

export interface CalculatorInputs {
  // Climate data
  heatingDegreeDays: number;
  coolingDegreeDays: number;
  
  // Current building load
  currentEnergyLoad: number;
  
  // Glazing areas
  northGlazingArea: number;
  southGlazingArea: number;
  eastGlazingArea: number;
  westGlazingArea: number;
  
  // Solar radiation
  northSolarRadiation: number;
  southSolarRadiation: number;
  eastSolarRadiation: number;
  westSolarRadiation: number;
  
  // Glazing properties
  glazingPerimeter: number;
  glazingRValue: number;
  solarHeatGainCoeff: number;
  
  // Building envelope
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
}

const HeatTransferCalculator = () => {
  const [inputs, setInputs] = useState<CalculatorInputs>({
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

  const results = useMemo((): CalculatorResults => {
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
    
    return {
      totalGlazingArea,
      envelopeHeatLoss,
      envelopeHeatGain,
      infiltrationHeatLoss,
      infiltrationHeatGain,
      solarHeatGain,
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
