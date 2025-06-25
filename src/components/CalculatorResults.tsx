
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Calculated Values Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-semibold">Total Glazing Area:</span>
              <div>{results.totalGlazingArea.toFixed(1)} ft²</div>
            </div>
            <div>
              <span className="font-semibold">Formula Used:</span>
              <div>Ag = Agn + Ags + Age + Agw</div>
            </div>
            <div>
              <span className="font-semibold">Components:</span>
              <div>N:{inputs.northGlazingArea} + S:{inputs.southGlazingArea} + E:{inputs.eastGlazingArea} + W:{inputs.westGlazingArea}</div>
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
