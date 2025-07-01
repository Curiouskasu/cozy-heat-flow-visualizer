
import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalculatorInputs } from './HeatTransferCalculator';

interface Props {
  onDataImported: (data: CalculatorInputs) => void;
}

const CSVImporter = ({ onDataImported }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvData, setCsvData] = useState<CalculatorInputs | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const parseCSVData = (csvContent: string): CalculatorInputs | null => {
    try {
      const lines = csvContent.split('\n').filter(line => line.trim());
      const data: any = {};
      
      // Parse key-value pairs from CSV
      lines.forEach(line => {
        const [key, value] = line.split(',').map(item => item.trim().replace(/"/g, ''));
        if (key && value !== undefined) {
          // Convert numeric values
          const numValue = parseFloat(value);
          data[key] = isNaN(numValue) ? value : numValue;
        }
      });

      // Map CSV data to CalculatorInputs structure
      const calculatorInputs: CalculatorInputs = {
        climateData: {
          heatingDegreeDays: data['Heating Degree Days'] || 0,
          coolingDegreeDays: data['Cooling Degree Days'] || 0,
          northSolarRadiation: data['North Solar Radiation'] || 0,
          southSolarRadiation: data['South Solar Radiation'] || 0,
          eastSolarRadiation: data['East Solar Radiation'] || 0,
          westSolarRadiation: data['West Solar Radiation'] || 0,
          isManualInput: true,
        },
        currentBuilding: {
          glazingElements: [{
            id: '1',
            name: 'Current Glazing',
            northArea: data['Current North Glazing Area'] || 0,
            southArea: data['Current South Glazing Area'] || 0,
            eastArea: data['Current East Glazing Area'] || 0,
            westArea: data['Current West Glazing Area'] || 0,
            perimeter: data['Current Glazing Perimeter'] || 0,
            uValue: data['Current Glazing U-Value'] || 0.3,
            shgc: data['Current Solar Heat Gain Coefficient'] || 0
          }],
          buildingElements: [
            { id: '1', name: 'Soffit', area: data['Current Soffit Area'] || 0, rValue: data['Current Soffit R-Value'] || 0 },
            { id: '2', name: 'Basement Walls', area: data['Current Basement Area'] || 0, rValue: data['Current Basement R-Value'] || 0 },
            { id: '3', name: 'Roof', area: data['Current Roof Area'] || 0, rValue: data['Current Roof R-Value'] || 0 },
            { id: '4', name: 'Floor', area: data['Current Floor Area'] || 0, rValue: data['Current Floor R-Value'] || 0 },
            { id: '5', name: 'Opaque Walls', area: data['Current Opaque Wall Area'] || 0, rValue: data['Current Opaque Wall R-Value'] || 0 }
          ]
        },
        proposedBuilding: {
          glazingElements: [{
            id: '1',
            name: 'Proposed Glazing',
            northArea: data['Proposed North Glazing Area'] || 0,
            southArea: data['Proposed South Glazing Area'] || 0,
            eastArea: data['Proposed East Glazing Area'] || 0,
            westArea: data['Proposed West Glazing Area'] || 0,
            perimeter: data['Proposed Glazing Perimeter'] || 0,
            uValue: data['Proposed Glazing U-Value'] || 0.3,
            shgc: data['Proposed Solar Heat Gain Coefficient'] || 0
          }],
          buildingElements: [
            { id: '1', name: 'Soffit', area: data['Proposed Soffit Area'] || 0, rValue: data['Proposed Soffit R-Value'] || 0 },
            { id: '2', name: 'Basement Walls', area: data['Proposed Basement Area'] || 0, rValue: data['Proposed Basement R-Value'] || 0 },
            { id: '3', name: 'Roof', area: data['Proposed Roof Area'] || 0, rValue: data['Proposed Roof R-Value'] || 0 },
            { id: '4', name: 'Floor', area: data['Proposed Floor Area'] || 0, rValue: data['Proposed Floor R-Value'] || 0 },
            { id: '5', name: 'Opaque Walls', area: data['Proposed Opaque Wall Area'] || 0, rValue: data['Proposed Opaque Wall R-Value'] || 0 }
          ]
        },
        // Legacy fields for backward compatibility
        heatingDegreeDays: data['Heating Degree Days'] || 0,
        coolingDegreeDays: data['Cooling Degree Days'] || 0,
        currentEnergyLoad: 0, // Will be calculated
        northGlazingArea: data['Current North Glazing Area'] || 0,
        southGlazingArea: data['Current South Glazing Area'] || 0,
        eastGlazingArea: data['Current East Glazing Area'] || 0,
        westGlazingArea: data['Current West Glazing Area'] || 0,
        northSolarRadiation: data['North Solar Radiation'] || 0,
        southSolarRadiation: data['South Solar Radiation'] || 0,
        eastSolarRadiation: data['East Solar Radiation'] || 0,
        westSolarRadiation: data['West Solar Radiation'] || 0,
        glazingPerimeter: data['Current Glazing Perimeter'] || 0,
        glazingRValue: data['Current Glazing U-Value'] ? 1 / data['Current Glazing U-Value'] : 3.0,
        solarHeatGainCoeff: data['Current Solar Heat Gain Coefficient'] || 0,
        soffitArea: data['Current Soffit Area'] || 0,
        soffitRValue: data['Current Soffit R-Value'] || 0,
        basementArea: data['Current Basement Area'] || 0,
        basementRValue: data['Current Basement R-Value'] || 0,
        roofArea: data['Current Roof Area'] || 0,
        roofRValue: data['Current Roof R-Value'] || 0,
        floorArea: data['Current Floor Area'] || 0,
        floorRValue: data['Current Floor R-Value'] || 0,
        opaqueWallArea: data['Current Opaque Wall Area'] || 0,
        opaqueWallRValue: data['Current Opaque Wall R-Value'] || 0,
      };

      return calculatorInputs;
    } catch (error) {
      console.error('Error parsing CSV:', error);
      return null;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsedData = parseCSVData(content);
      
      if (parsedData) {
        setCsvData(parsedData);
        setFileName(file.name);
      } else {
        alert('Error parsing CSV file. Please check the format.');
      }
    };
    
    reader.readAsText(file);
  };

  const handleFillInputs = () => {
    if (csvData) {
      onDataImported(csvData);
      alert('CSV data imported successfully!');
      setCsvData(null);
      setFileName('');
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Import CSV Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 flex-wrap">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Select CSV File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          {fileName && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                File loaded: {fileName}
              </span>
              <Button
                onClick={handleFillInputs}
                className="flex items-center gap-2"
                disabled={!csvData}
              >
                <Database className="h-4 w-4" />
                Fill Inputs
              </Button>
            </div>
          )}
          <span className="text-sm text-muted-foreground">
            Import a CSV file in the same format as the exported data
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CSVImporter;
