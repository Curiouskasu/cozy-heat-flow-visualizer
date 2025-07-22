import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalculatorInputs } from "./HeatTransferCalculator";
import ManualBuildingInput from "./ManualBuildingInput";
import ManualClimateInput from "./ManualClimateInput";

interface Props {
  inputs: CalculatorInputs;
  setInputs: React.Dispatch<React.SetStateAction<CalculatorInputs>>;
}

const SpreadsheetInputs = ({ inputs, setInputs }: Props) => {
  return (
    <div className="space-y-6">
      <ManualClimateInput inputs={inputs} setInputs={setInputs} />
      
      <Card>
        <CardHeader>
          <CardTitle>General Inputs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="airflow-rate">Airflow Rate (CFM)</Label>
              <Input
                id="airflow-rate"
                type="number"
                value={inputs.airflowRate || 0}
                onChange={(e) => setInputs(prev => ({ ...prev, airflowRate: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="current-energy-load">Current Energy Load (Btu/year)</Label>
              <Input
                id="current-energy-load"
                type="number"
                value={inputs.currentEnergyLoad || 0}
                onChange={(e) => setInputs(prev => ({ ...prev, currentEnergyLoad: Number(e.target.value) }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <ManualBuildingInput inputs={inputs} setInputs={setInputs} />
    </div>
  );
};

export default SpreadsheetInputs;