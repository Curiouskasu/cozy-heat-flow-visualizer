
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

  // Calculate total energy and percentage difference
  const totalCalculatedEnergy = results.envelopeHeatGain + results.envelopeHeatLoss + 
                               results.infiltrationHeatGain + results.infiltrationHeatLoss + 
                               results.solarHeatGain;
  
  const percentageDifference = ((totalCalculatedEnergy - inputs.currentEnergyLoad) / inputs.currentEnergyLoad * 100);

  // Download CSV function
  const downloadResultsCSV = () => {
    const csvData = [
      // Header
      ['Category', 'Parameter', 'Value', 'Unit'],
      
      // Inputs
      ['Inputs', 'Current Energy Load (Qc)', inputs.currentEnergyLoad, 'Btu/year'],
      ['Inputs', 'North Glazing Area', inputs.northGlazingArea, 'ft²'],
      ['Inputs', 'South Glazing Area', inputs.southGlazingArea, 'ft²'],
      ['Inputs', 'East Glazing Area', inputs.eastGlazingArea, 'ft²'],
      ['Inputs', 'West Glazing Area', inputs.westGlazingArea, 'ft²'],
      ['Inputs', 'Glazing R-Value', inputs.glazingRValue, 'ft²·°F·h/Btu'],
      ['Inputs', 'Soffit Area', inputs.soffitArea, 'ft²'],
      ['Inputs', 'Soffit R-Value', inputs.soffitRValue, 'ft²·°F·h/Btu'],
      ['Inputs', 'Basement Area', inputs.basementArea, 'ft²'],
      ['Inputs', 'Basement R-Value', inputs.basementRValue, 'ft²·°F·h/Btu'],
      ['Inputs', 'Roof Area', inputs.roofArea, 'ft²'],
      ['Inputs', 'Roof R-Value', inputs.roofRValue, 'ft²·°F·h/Btu'],
      ['Inputs', 'Floor Area', inputs.floorArea, 'ft²'],
      ['Inputs', 'Floor R-Value', inputs.floorRValue, 'ft²·°F·h/Btu'],
      ['Inputs', 'Opaque Wall Area', inputs.opaqueWallArea, 'ft²'],
      ['Inputs', 'Opaque Wall R-Value', inputs.opaqueWallRValue, 'ft²·°F·h/Btu'],
      ['Inputs', 'Solar Heat Gain Coefficient', inputs.solarHeatGainCoeff, 'dimensionless'],
      ['Inputs', 'Heating Degree Days', inputs.heatingDegreeDays, '°F·days'],
      ['Inputs', 'Cooling Degree Days', inputs.coolingDegreeDays, '°F·days'],
      ['Inputs', 'Glazing Perimeter', inputs.glazingPerimeter, 'ft'],
      ['Inputs', 'North Solar Radiation', inputs.northSolarRadiation, 'Btu/ft²·year'],
      ['Inputs', 'South Solar Radiation', inputs.southSolarRadiation, 'Btu/ft²·year'],
      ['Inputs', 'East Solar Radiation', inputs.eastSolarRadiation, 'Btu/ft²·year'],
      ['Inputs', 'West Solar Radiation', inputs.westSolarRadiation, 'Btu/ft²·year'],
      
      // Calculated Results
      ['Results', 'Total Glazing Area', results.totalGlazingArea, 'ft²'],
      ['Results', 'Envelope Heat Loss (Qel)', results.envelopeHeatLoss, 'Btu/year'],
      ['Results', 'Envelope Heat Gain (Qeg)', results.envelopeHeatGain, 'Btu/year'],
      ['Results', 'Infiltration Heat Loss (Qil)', results.infiltrationHeatLoss, 'Btu/year'],
      ['Results', 'Infiltration Heat Gain (Qig)', results.infiltrationHeatGain, 'Btu/year'],
      ['Results', 'Solar Heat Gain (Qshg)', results.solarHeatGain, 'Btu/year'],
      ['Results', 'Total Calculated Energy', totalCalculatedEnergy, 'Btu/year'],
      ['Results', 'Energy Difference vs Current', percentageDifference.toFixed(1), '%'],
      
      // Formulas
      ['Formulas', 'Envelope Heat Loss', 'Qel = (Ag/Rg + As/Rs + Ab/Rb + Ar/Rr + Af/Rf + Ao/Ro) × Th', ''],
      ['Formulas', 'Envelope Heat Gain', 'Qeg = (Ag/Rg + As/Rs + Ab/Rb + Ar/Rr + Af/Rf + Ao/Ro) × Tc', ''],
      ['Formulas', 'Infiltration Heat Loss', 'Qil = Lg × Th', ''],
      ['Formulas', 'Infiltration Heat Gain', 'Qig = Lg × Tc', ''],
      ['Formulas', 'Solar Heat Gain', 'Qshg = (Agn×Edn + Ags×Eds + Age×Ede + Agw×Edw) × SHGC', ''],
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'heat-transfer-calculation-results.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Energy Comparison & Results Download</CardTitle>
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
                {inputs.currentEnergyLoad.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Current Energy Load (Qc)</div>
              <div className="text-xs">Btu/year</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {totalCalculatedEnergy.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Calculated Energy Load</div>
              <div className="text-xs">Btu/year</div>
            </div>
          </div>
          <div className="text-center mt-4">
            <div className={`text-3xl font-bold ${percentageDifference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {percentageDifference >= 0 ? '+' : ''}{percentageDifference.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Energy Difference from Current</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ResultCard
          title="Annual Envelope Heat Loss (Qel)"
          value={results.envelopeHeatLoss}
          unit="Btu/year"
          description="Heat loss through building envelope during heating season"
        />
        
        <ResultCard
          title="Annual Envelope Heat Gain (Qeg)"
          value={results.envelopeHeatGain}
          unit="Btu/year"
          description="Heat gain through building envelope during cooling season"
        />
        
        <ResultCard
          title="Annual Infiltration Heat Loss (Qil)"
          value={results.infiltrationHeatLoss}
          unit="Btu/year"
          description="Heat loss due to air infiltration during heating season"
        />
        
        <ResultCard
          title="Annual Infiltration Heat Gain (Qig)"
          value={results.infiltrationHeatGain}
          unit="Btu/year"
          description="Heat gain due to air infiltration during cooling season"
        />
        
        <ResultCard
          title="Annual Solar Heat Gain (Qshg)"
          value={results.solarHeatGain}
          unit="Btu/year"
          description="Heat gain from solar radiation through glazing"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calculation Formulas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono bg-muted p-4 rounded">
            <div>
              <div className="font-semibold mb-2">Heat Loss:</div>
              <div>Qel = (Ag/Rg + As/Rs + Ab/Rb + Ar/Rr + Af/Rf + Ao/Ro) × Th</div>
            </div>
            <div>
              <div className="font-semibold mb-2">Heat Gain:</div>
              <div>Qeg = (Ag/Rg + As/Rs + Ab/Rb + Ar/Rr + Af/Rf + Ao/Ro) × Tc</div>
            </div>
            <div>
              <div className="font-semibold mb-2">Infiltration Loss:</div>
              <div>Qil = Lg × Th</div>
            </div>
            <div>
              <div className="font-semibold mb-2">Infiltration Gain:</div>
              <div>Qig = Lg × Tc</div>
            </div>
            <div className="md:col-span-2">
              <div className="font-semibold mb-2">Solar Heat Gain:</div>
              <div>Qshg = (Agn×Edn + Ags×Eds + Age×Ede + Agw×Edw) × SHGC</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalculatorResultsComponent;
