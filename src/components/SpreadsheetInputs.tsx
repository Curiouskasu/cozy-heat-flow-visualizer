import React from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { CalculatorInputs } from "./HeatTransferCalculator";

interface Props {
  inputs: CalculatorInputs;
  setInputs: React.Dispatch<React.SetStateAction<CalculatorInputs>>;
}

const SpreadsheetInputs = ({ inputs, setInputs }: Props) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Climate Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Climate data is now managed through the EPW File Handler or manual input section above.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>General Inputs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Airflow Rate (CFM)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                value={inputs.airflowRate || 0}
                onChange={(e) => setInputs(prev => ({ ...prev, airflowRate: Number(e.target.value) }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Building Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Building data is now managed through the CSV import feature above. Use the CSV import to load multiple buildings with their respective elements.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpreadsheetInputs;