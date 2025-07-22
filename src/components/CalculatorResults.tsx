import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from 'lucide-react';
import { CalculatorInputs, CalculatorResults, BuildingData } from "./HeatTransferCalculator";

interface Props {
  inputs: CalculatorInputs;
  results: CalculatorResults;
}

interface BuildingResult {
  name: string;
  energy: number;
  data: BuildingData;
  breakdown: {
    envelopeHeatLoss: number;
    envelopeHeatGain: number;
    solarHeatGain: number;
    infiltrationHeatLoss: number;
    infiltrationHeatGain: number;
  };
}

const CalculatorResultsComponent = ({ inputs, results }: Props) => {
  // Helper calculation functions
  const calculateHeatLoss = (area: number, rValue: number, degreeDays: number) => {
    return (area / rValue) * degreeDays * 24;
  };

  const calculateHeatGain = (area: number, uValue: number, degreeDays: number) => {
    return area * uValue * degreeDays * 24;
  };

  const calculateSolarHeatGain = (area: number, shgc: number, solarRadiation: number) => {
    return area * shgc * solarRadiation;
  };

  const calculateInfiltrationHeatLoss = (perimeter: number, airflowRate: number, degreeDays: number) => {
    return perimeter * 1.08 * airflowRate * degreeDays;
  };

  // Calculate results for each building
  const buildingResults = useMemo((): BuildingResult[] => {
    const buildings: BuildingResult[] = [];
    
    // Add all buildings from buildingColumns
    if (inputs.buildingColumns && Array.isArray(inputs.buildingColumns)) {
      inputs.buildingColumns.forEach((column) => {
        const elements = column.elements || [];
          let envelopeHeatLoss = 0;
          let envelopeHeatGain = 0;
          let solarHeatGain = 0;
          let totalPerimeter = 0;

          // Calculate from building elements
          if (Array.isArray(elements)) {
            elements.forEach((element) => {
              switch (element.category) {
                case 'aboveGrade':
                  if (element.rValue && element.area) {
                    envelopeHeatLoss += calculateHeatLoss(
                      element.area,
                      element.rValue,
                      inputs.climateData.heatingDegreeDays
                    );
                    envelopeHeatGain += calculateHeatGain(
                      element.area,
                      1 / element.rValue,
                      inputs.climateData.coolingDegreeDays
                    );
                  }
                  break;
                case 'slab':
                  if (element.fFactor && element.perimeter) {
                    const qc = element.fFactor * element.perimeter;
                    const qAnnual = qc * (inputs.climateData.heatingDegreeDays + inputs.climateData.coolingDegreeDays) * 24;
                    envelopeHeatLoss += qAnnual * (inputs.climateData.heatingDegreeDays / (inputs.climateData.heatingDegreeDays + inputs.climateData.coolingDegreeDays));
                    envelopeHeatGain += qAnnual * (inputs.climateData.coolingDegreeDays / (inputs.climateData.heatingDegreeDays + inputs.climateData.coolingDegreeDays));
                  }
                  break;
                case 'basementWall':
                  if (element.cFactor && element.area) {
                    envelopeHeatLoss += calculateHeatLoss(
                      element.area,
                      1 / element.cFactor,
                      inputs.climateData.heatingDegreeDays
                    );
                    envelopeHeatGain += calculateHeatGain(
                      element.area,
                      element.cFactor,
                      inputs.climateData.coolingDegreeDays
                    );
                  }
                  break;
              }
            });
          }

          // Calculate from glazing elements (legacy support)
          const glazingElements = elements.filter(el => el.category === 'glazing');
          glazingElements.forEach((glazing) => {
              const glazingArea = glazing.area || 0;
              if (glazing.uValue && glazingArea > 0) {
                envelopeHeatLoss += calculateHeatLoss(
                  glazingArea,
                  1 / glazing.uValue,
                  inputs.climateData.heatingDegreeDays
                );
                envelopeHeatGain += calculateHeatGain(
                  glazingArea,
                  glazing.uValue,
                  inputs.climateData.coolingDegreeDays
                );
              }
            });

          const infiltrationHeatLoss = calculateInfiltrationHeatLoss(
            totalPerimeter,
            inputs.airflowRate,
            inputs.climateData.heatingDegreeDays
          );

          const infiltrationHeatGain = calculateInfiltrationHeatLoss(
            totalPerimeter,
            inputs.airflowRate,
            inputs.climateData.coolingDegreeDays
          );

          const totalEnergy = envelopeHeatLoss + envelopeHeatGain + solarHeatGain + infiltrationHeatLoss + infiltrationHeatGain;

          buildings.push({
            name: column.name,
            energy: Math.round(totalEnergy),
            data: {} as BuildingData,
            breakdown: {
              envelopeHeatLoss: Math.round(envelopeHeatLoss),
              envelopeHeatGain: Math.round(envelopeHeatGain),
              solarHeatGain: Math.round(solarHeatGain),
              infiltrationHeatLoss: Math.round(infiltrationHeatLoss),
              infiltrationHeatGain: Math.round(infiltrationHeatGain),
            }
          });
      });
    }

    return buildings;
  }, [inputs]);

  // Download comprehensive CSV function
  const downloadResultsCSV = () => {
    const csvData = [
      ['Building Comparison Results'],
      [''],
      ['Climate Data'],
      ['Heating Degree Days', inputs.climateData.heatingDegreeDays],
      ['Cooling Degree Days', inputs.climateData.coolingDegreeDays],
      ['North Solar Radiation', inputs.climateData.northSolarRadiation],
      ['South Solar Radiation', inputs.climateData.southSolarRadiation],
      ['East Solar Radiation', inputs.climateData.eastSolarRadiation],
      ['West Solar Radiation', inputs.climateData.westSolarRadiation],
      ['Airflow Rate', inputs.airflowRate],
      [''],
      ['Building Results'],
      ['Building Name', 'Total Energy (Btu/year)', 'Envelope Heat Loss', 'Envelope Heat Gain', 'Solar Heat Gain', 'Infiltration Heat Loss', 'Infiltration Heat Gain'],
      ...buildingResults.map(building => [
        building.name,
        building.energy,
        building.breakdown.envelopeHeatLoss,
        building.breakdown.envelopeHeatGain,
        building.breakdown.solarHeatGain,
        building.breakdown.infiltrationHeatLoss,
        building.breakdown.infiltrationHeatGain
      ])
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'building-comparison-results.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (buildingResults.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>No Buildings to Calculate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please import building data using the CSV import feature above, or add buildings manually to see calculation results.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Building Energy Comparison Results</CardTitle>
          <Button
            variant="outline"
            onClick={downloadResultsCSV}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Download Results (CSV)
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {buildingResults.map((building, index) => (
              <Card key={index} className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg text-center">{building.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-primary">
                      {building.energy.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Annual Energy</div>
                    <div className="text-xs">Btu/year</div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Envelope Heat Loss:</span>
                      <span>{building.breakdown.envelopeHeatLoss.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Envelope Heat Gain:</span>
                      <span>{building.breakdown.envelopeHeatGain.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Solar Heat Gain:</span>
                      <span>{building.breakdown.solarHeatGain.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Infiltration Heat Loss:</span>
                      <span>{building.breakdown.infiltrationHeatLoss.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Infiltration Heat Gain:</span>
                      <span>{building.breakdown.infiltrationHeatGain.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
              <div>Qel = Σ(A/R) × Th × 24</div>
            </div>
            <div>
              <div className="font-semibold mb-2">Envelope Heat Gain:</div>
              <div>Qeg = Σ(A × U) × Tc × 24</div>
            </div>
            <div>
              <div className="font-semibold mb-2">Infiltration Loss:</div>
              <div>Qil = Σ(Lg) × 1.08 × Airflow × Th</div>
            </div>
            <div>
              <div className="font-semibold mb-2">Infiltration Gain:</div>
              <div>Qig = Σ(Lg) × 1.08 × Airflow × Tc</div>
            </div>
            <div>
              <div className="font-semibold mb-2">Slab (On/Sub-grade):</div>
              <div>Q = F × Ls × (HDD+CDD) × 24</div>
            </div>
            <div>
              <div className="font-semibold mb-2">Basement Walls:</div>
              <div>Q = A × C × (HDD+CDD) × 24</div>
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