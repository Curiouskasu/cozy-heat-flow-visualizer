import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalculatorInputs } from "./HeatTransferCalculator";

interface Props {
  inputs: CalculatorInputs;
  setInputs: React.Dispatch<React.SetStateAction<CalculatorInputs>>;
}

// Move InputField OUTSIDE the component so it doesn't get recreated
const InputField = ({ 
  label, 
  field, 
  unit = "",
  step = "0.1",
  value,
  onChange
}: { 
  label: string; 
  field: string; 
  unit?: string;
  step?: string;
  value: number;
  onChange: (value: number) => void;
}) => (
  <div className="space-y-2">
    <Label htmlFor={field}>{label} {unit && `(${unit})`}</Label>
    <Input
      id={field}
      type="number"
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-full"
    />
  </div>
);

const CalculatorInputsComponent = ({ inputs, setInputs }: Props) => {
  const updateInput = useCallback((field: keyof CalculatorInputs, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  }, [setInputs]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Climate Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InputField 
            label="Heating Degree Days" 
            field="heatingDegreeDays" 
            unit="°F-days" 
            step="1"
            value={inputs.heatingDegreeDays}
            onChange={(value) => updateInput('heatingDegreeDays', value)}
          />
          <InputField 
            label="Cooling Degree Days" 
            field="coolingDegreeDays" 
            unit="°F-days" 
            step="1"
            value={inputs.coolingDegreeDays}
            onChange={(value) => updateInput('coolingDegreeDays', value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Building Load</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InputField 
            label="Current Energy Load (Qc)" 
            field="currentEnergyLoad" 
            unit="Btu/year" 
            step="1000"
            value={inputs.currentEnergyLoad}
            onChange={(value) => updateInput('currentEnergyLoad', value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Glazing Areas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InputField 
            label="North Glazing Area" 
            field="northGlazingArea" 
            unit="ft²"
            value={inputs.northGlazingArea}
            onChange={(value) => updateInput('northGlazingArea', value)}
          />
          <InputField 
            label="South Glazing Area" 
            field="southGlazingArea" 
            unit="ft²"
            value={inputs.southGlazingArea}
            onChange={(value) => updateInput('southGlazingArea', value)}
          />
          <InputField 
            label="East Glazing Area" 
            field="eastGlazingArea" 
            unit="ft²"
            value={inputs.eastGlazingArea}
            onChange={(value) => updateInput('eastGlazingArea', value)}
          />
          <InputField 
            label="West Glazing Area" 
            field="westGlazingArea" 
            unit="ft²"
            value={inputs.westGlazingArea}
            onChange={(value) => updateInput('westGlazingArea', value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Solar Radiation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InputField 
            label="North Solar Radiation" 
            field="northSolarRadiation" 
            unit="Btu/ft²"
            value={inputs.northSolarRadiation}
            onChange={(value) => updateInput('northSolarRadiation', value)}
          />
          <InputField 
            label="South Solar Radiation" 
            field="southSolarRadiation" 
            unit="Btu/ft²"
            value={inputs.southSolarRadiation}
            onChange={(value) => updateInput('southSolarRadiation', value)}
          />
          <InputField 
            label="East Solar Radiation" 
            field="eastSolarRadiation" 
            unit="Btu/ft²"
            value={inputs.eastSolarRadiation}
            onChange={(value) => updateInput('eastSolarRadiation', value)}
          />
          <InputField 
            label="West Solar Radiation" 
            field="westSolarRadiation" 
            unit="Btu/ft²"
            value={inputs.westSolarRadiation}
            onChange={(value) => updateInput('westSolarRadiation', value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Glazing Properties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InputField 
            label="Glazing Perimeter" 
            field="glazingPerimeter" 
            unit="ft"
            value={inputs.glazingPerimeter}
            onChange={(value) => updateInput('glazingPerimeter', value)}
          />
          <InputField 
            label="Glazing R-Value" 
            field="glazingRValue" 
            unit="ft²·°F·h/Btu"
            value={inputs.glazingRValue}
            onChange={(value) => updateInput('glazingRValue', value)}
          />
          <InputField 
            label="Solar Heat Gain Coefficient" 
            field="solarHeatGainCoeff"
            value={inputs.solarHeatGainCoeff}
            onChange={(value) => updateInput('solarHeatGainCoeff', value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Building Envelope - Areas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InputField 
            label="Soffit Area" 
            field="soffitArea" 
            unit="ft²"
            value={inputs.soffitArea}
            onChange={(value) => updateInput('soffitArea', value)}
          />
          <InputField 
            label="Basement Walls Area" 
            field="basementArea" 
            unit="ft²"
            value={inputs.basementArea}
            onChange={(value) => updateInput('basementArea', value)}
          />
          <InputField 
            label="Roof Area" 
            field="roofArea" 
            unit="ft²"
            value={inputs.roofArea}
            onChange={(value) => updateInput('roofArea', value)}
          />
          <InputField 
            label="Floor Area" 
            field="floorArea" 
            unit="ft²"
            value={inputs.floorArea}
            onChange={(value) => updateInput('floorArea', value)}
          />
          <InputField 
            label="Opaque Walls Area" 
            field="opaqueWallArea" 
            unit="ft²"
            value={inputs.opaqueWallArea}
            onChange={(value) => updateInput('opaqueWallArea', value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Building Envelope - R-Values</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InputField 
            label="Soffit R-Value" 
            field="soffitRValue" 
            unit="ft²·°F·h/Btu"
            value={inputs.soffitRValue}
            onChange={(value) => updateInput('soffitRValue', value)}
          />
          <InputField 
            label="Basement R-Value" 
            field="basementRValue" 
            unit="ft²·°F·h/Btu"
            value={inputs.basementRValue}
            onChange={(value) => updateInput('basementRValue', value)}
          />
          <InputField 
            label="Roof R-Value" 
            field="roofRValue" 
            unit="ft²·°F·h/Btu"
            value={inputs.roofRValue}
            onChange={(value) => updateInput('roofRValue', value)}
          />
          <InputField 
            label="Floor R-Value" 
            field="floorRValue" 
            unit="ft²·°F·h/Btu"
            value={inputs.floorRValue}
            onChange={(value) => updateInput('floorRValue', value)}
          />
          <InputField 
            label="Opaque Wall R-Value" 
            field="opaqueWallRValue" 
            unit="ft²·°F·h/Btu"
            value={inputs.opaqueWallRValue}
            onChange={(value) => updateInput('opaqueWallRValue', value)}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CalculatorInputsComponent;