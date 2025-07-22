import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalculatorInputs } from "./HeatTransferCalculator";

interface Props {
  inputs: CalculatorInputs;
  setInputs: React.Dispatch<React.SetStateAction<CalculatorInputs>>;
}

const ManualClimateInput = ({ inputs, setInputs }: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Climate Data Input</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="hdd">Heating Degree Days (HDD)</Label>
            <Input
              id="hdd"
              type="number"
              value={inputs.heatingDegreeDays || 0}
              onChange={(e) => setInputs(prev => ({ ...prev, heatingDegreeDays: Number(e.target.value) }))}
            />
          </div>
          <div>
            <Label htmlFor="cdd">Cooling Degree Days (CDD)</Label>
            <Input
              id="cdd"
              type="number"
              value={inputs.coolingDegreeDays || 0}
              onChange={(e) => setInputs(prev => ({ ...prev, coolingDegreeDays: Number(e.target.value) }))}
            />
          </div>
          <div>
            <Label htmlFor="heating-base-temp">Heating Base Temperature (°F)</Label>
            <Input
              id="heating-base-temp"
              type="number"
              value={inputs.heatingBaseTemp || 65}
              onChange={(e) => setInputs(prev => ({ ...prev, heatingBaseTemp: Number(e.target.value) }))}
            />
          </div>
          <div>
            <Label htmlFor="cooling-base-temp">Cooling Base Temperature (°F)</Label>
            <Input
              id="cooling-base-temp"
              type="number"
              value={inputs.coolingBaseTemp || 65}
              onChange={(e) => setInputs(prev => ({ ...prev, coolingBaseTemp: Number(e.target.value) }))}
            />
          </div>
        </div>
        
        <div className="mt-6">
          <h4 className="font-medium mb-3">Solar Radiation (Ed) - W/m² or kWh/m²</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ed-north">North</Label>
              <Input
                id="ed-north"
                type="number"
                step="0.1"
                value={inputs.edNorth || 0}
                onChange={(e) => setInputs(prev => ({ ...prev, edNorth: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="ed-south">South</Label>
              <Input
                id="ed-south"
                type="number"
                step="0.1"
                value={inputs.edSouth || 0}
                onChange={(e) => setInputs(prev => ({ ...prev, edSouth: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="ed-east">East</Label>
              <Input
                id="ed-east"
                type="number"
                step="0.1"
                value={inputs.edEast || 0}
                onChange={(e) => setInputs(prev => ({ ...prev, edEast: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="ed-west">West</Label>
              <Input
                id="ed-west"
                type="number"
                step="0.1"
                value={inputs.edWest || 0}
                onChange={(e) => setInputs(prev => ({ ...prev, edWest: Number(e.target.value) }))}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualClimateInput;