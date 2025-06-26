
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Energy Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="text-center">
              <div className={`text-2xl font-bold ${percentageDifference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {percentageDifference >= 0 ? '+' : ''}{percentageDifference.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Energy Difference</div>
              <div className="text-xs">{percentageDifference >= 0 ? 'Increase' : 'Decrease'} from Current</div>
            </div>
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
