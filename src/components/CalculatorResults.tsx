
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from 'lucide-react';
import { CalculatorInputs, CalculatorResults } from "./HeatTransferCalculator";

interface Props {
  inputs: CalculatorInputs;
  results: CalculatorResults;
}

const CalculatorResultsComponent = ({ inputs, results }: Props) => {
  const ResultCard = ({ 
    title, 
    value, 
    unit, 
    description 
  }: { 
    title: string; 
    value: number; 
    unit: string; 
    description: string;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-primary mb-2">
          {value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </div>
        <div className="text-sm text-muted-foreground mb-2">{unit}</div>
        <div className="text-sm">{description}</div>
      </CardContent>
    </Card>
  );

  // Calculate percentage difference between current and proposed
  const percentageDifference = ((results.proposedBuildingEnergy - results.currentBuildingEnergy) / results.currentBuildingEnergy * 100);

  // Download comprehensive CSV function
  const downloadResultsCSV = () => {
    const csvData = [
      // Header
      ['Category', 'Parameter', 'Value', 'Unit', 'Description'],
      
      // Climate Data
      ['Climate Data', 'Heating Degree Days (Th)', inputs.climateData.heatingDegreeDays, '°F-days', 'Annual heating degree days'],
      ['Climate Data', 'Cooling Degree Days (Tc)', inputs.climateData.coolingDegreeDays, '°F-days', 'Annual cooling degree days'],
      ['Climate Data', 'North Solar Radiation (Edn)', inputs.climateData.northSolarRadiation, 'Btu/ft²', 'Solar radiation on north face'],
      ['Climate Data', 'South Solar Radiation (Eds)', inputs.climateData.southSolarRadiation, 'Btu/ft²', 'Solar radiation on south face'],
      ['Climate Data', 'East Solar Radiation (Ede)', inputs.climateData.eastSolarRadiation, 'Btu/ft²', 'Solar radiation on east face'],
      ['Climate Data', 'West Solar Radiation (Edw)', inputs.climateData.westSolarRadiation, 'Btu/ft²', 'Solar radiation on west face'],
      ['Climate Data', 'Data Source', inputs.climateData.isManualInput ? 'Manual Input' : `EPW File: ${inputs.climateData.epwFileName}`, '', 'Source of climate data'],
      
      // Current Building Inputs
      ['Current Building', '', '', '', ''],
      ...inputs.currentBuilding.glazingElements.flatMap((glazing, index) => [
        [`Current Building Glazing ${index + 1}`, 'Name', glazing.name, '', 'Glazing element name'],
        [`Current Building Glazing ${index + 1}`, 'North Area (Agn)', glazing.northArea, 'ft²', 'North-facing glazing area'],
        [`Current Building Glazing ${index + 1}`, 'South Area (Ags)', glazing.southArea, 'ft²', 'South-facing glazing area'],
        [`Current Building Glazing ${index + 1}`, 'East Area (Age)', glazing.eastArea, 'ft²', 'East-facing glazing area'],
        [`Current Building Glazing ${index + 1}`, 'West Area (Agw)', glazing.westArea, 'ft²', 'West-facing glazing area'],
        [`Current Building Glazing ${index + 1}`, 'Total Area', glazing.northArea + glazing.southArea + glazing.eastArea + glazing.westArea, 'ft²', 'Total glazing area'],
        [`Current Building Glazing ${index + 1}`, 'Perimeter (Lg)', glazing.perimeter, 'ft', 'Glazing perimeter'],
        [`Current Building Glazing ${index + 1}`, 'U-Value (Ug)', glazing.uValue, 'Btu/ft²·°F·h', 'Thermal transmittance'],
        [`Current Building Glazing ${index + 1}`, 'R-Value Equivalent', glazing.uValue > 0 ? 1 / glazing.uValue : 0, 'ft²·°F·h/Btu', 'Thermal resistance equivalent'],
        [`Current Building Glazing ${index + 1}`, 'SHGC', glazing.shgc, 'dimensionless', 'Solar heat gain coefficient'],
      ]),
      ...inputs.currentBuilding.buildingElements.flatMap((element, index) => [
        [`Current Building Element ${index + 1}`, 'Name', element.name, '', 'Building element name'],
        [`Current Building Element ${index + 1}`, 'Area (A)', element.area, 'ft²', 'Surface area'],
        [`Current Building Element ${index + 1}`, 'R-Value (R)', element.rValue, 'ft²·°F·h/Btu', 'Thermal resistance'],
      ]),

      // Proposed Building Inputs
      ['Proposed Building', '', '', '', ''],
      ...inputs.proposedBuilding.glazingElements.flatMap((glazing, index) => [
        [`Proposed Building Glazing ${index + 1}`, 'Name', glazing.name, '', 'Glazing element name'],
        [`Proposed Building Glazing ${index + 1}`, 'North Area (Agn)', glazing.northArea, 'ft²', 'North-facing glazing area'],
        [`Proposed Building Glazing ${index + 1}`, 'South Area (Ags)', glazing.southArea, 'ft²', 'South-facing glazing area'],
        [`Proposed Building Glazing ${index + 1}`, 'East Area (Age)', glazing.eastArea, 'ft²', 'East-facing glazing area'],
        [`Proposed Building Glazing ${index + 1}`, 'West Area (Agw)', glazing.westArea, 'ft²', 'West-facing glazing area'],
        [`Proposed Building Glazing ${index + 1}`, 'Total Area', glazing.northArea + glazing.southArea + glazing.eastArea + glazing.westArea, 'ft²', 'Total glazing area'],
        [`Proposed Building Glazing ${index + 1}`, 'Perimeter (Lg)', glazing.perimeter, 'ft', 'Glazing perimeter'],
        [`Proposed Building Glazing ${index + 1}`, 'U-Value (Ug)', glazing.uValue, 'Btu/ft²·°F·h', 'Thermal transmittance'],
        [`Proposed Building Glazing ${index + 1}`, 'R-Value Equivalent', glazing.uValue > 0 ? 1 / glazing.uValue : 0, 'ft²·°F·h/Btu', 'Thermal resistance equivalent'],
        [`Proposed Building Glazing ${index + 1}`, 'SHGC', glazing.shgc, 'dimensionless', 'Solar heat gain coefficient'],
      ]),
      ...inputs.proposedBuilding.buildingElements.flatMap((element, index) => [
        [`Proposed Building Element ${index + 1}`, 'Name', element.name, '', 'Building element name'],
        [`Proposed Building Element ${index + 1}`, 'Area (A)', element.area, 'ft²', 'Surface area'],
        [`Proposed Building Element ${index + 1}`, 'R-Value (R)', element.rValue, 'ft²·°F·h/Btu', 'Thermal resistance'],
      ]),
      
      // Calculated Results
      ['Results', '', '', '', ''],
      ['Results', 'Current Building Energy (Qc)', results.currentBuildingEnergy, 'Btu/year', 'Total annual energy for current building'],
      ['Results', 'Proposed Building Energy (Qp)', results.proposedBuildingEnergy, 'Btu/year', 'Total annual energy for proposed building'],
      ['Results', 'Energy Difference', results.proposedBuildingEnergy - results.currentBuildingEnergy, 'Btu/year', 'Energy difference (Proposed - Current)'],
      ['Results', 'Percentage Change', percentageDifference.toFixed(1), '%', 'Percentage change in energy consumption'],
      
      // Formulas
      ['Formulas', '', '', '', ''],
      ['Formulas', 'Envelope Heat Loss', 'Qel = Σ(A/R) × Th', 'Btu/year', 'Sum of all building element areas divided by R-values, multiplied by heating degree days'],
      ['Formulas', 'Envelope Heat Gain', 'Qeg = Σ(A/R) × Tc', 'Btu/year', 'Sum of all building element areas divided by R-values, multiplied by cooling degree days'],
      ['Formulas', 'Infiltration Heat Loss', 'Qil = Σ(Lg) × Th', 'Btu/year', 'Sum of glazing perimeters multiplied by heating degree days'],
      ['Formulas', 'Infiltration Heat Gain', 'Qig = Σ(Lg) × Tc', 'Btu/year', 'Sum of glazing perimeters multiplied by cooling degree days'],
      ['Formulas', 'Solar Heat Gain', 'Qshg = Σ(Agn×Edn + Ags×Eds + Age×Ede + Agw×Edw) × SHGC', 'Btu/year', 'Sum of glazing areas times solar radiation by orientation, multiplied by SHGC'],
      ['Formulas', 'Total Building Energy', 'Q = Qel + Qeg + Qil + Qig + Qshg', 'Btu/year', 'Sum of all heat transfer components'],
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'heat-transfer-calculation-complete.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Building Energy Comparison & Complete Results</CardTitle>
          <Button
            variant="outline"
            onClick={downloadResultsCSV}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Download Complete Results (CSV)
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {results.currentBuildingEnergy.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Current Building Energy (Qc)</div>
              <div className="text-xs">Btu/year</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {results.proposedBuildingEnergy.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Proposed Building Energy (Qp)</div>
              <div className="text-xs">Btu/year</div>
            </div>
          </div>
          <div className="text-center mt-4">
            <div className={`text-3xl font-bold ${percentageDifference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {percentageDifference >= 0 ? '+' : ''}{percentageDifference.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Energy Change (Proposed vs Current)</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Calculation Formulas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono bg-muted p-4 rounded">
            <div>
              <div className="font-semibold mb-2">Envelope Heat Loss:</div>
              <div>Qel = Σ(A/R) × Th</div>
            </div>
            <div>
              <div className="font-semibold mb-2">Envelope Heat Gain:</div>
              <div>Qeg = Σ(A/R) × Tc</div>
            </div>
            <div>
              <div className="font-semibold mb-2">Infiltration Loss:</div>
              <div>Qil = Σ(Lg) × Th</div>
            </div>
            <div>
              <div className="font-semibold mb-2">Infiltration Gain:</div>
              <div>Qig = Σ(Lg) × Tc</div>
            </div>
            <div className="md:col-span-2">
              <div className="font-semibold mb-2">Solar Heat Gain:</div>
              <div>Qshg = Σ(Agn×Edn + Ags×Eds + Age×Ede + Agw×Edw) × SHGC</div>
            </div>
            <div className="md:col-span-2">
              <div className="font-semibold mb-2">Total Building Energy:</div>
              <div>Q = Qel + Qeg + Qil + Qig + Qshg</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalculatorResultsComponent;
