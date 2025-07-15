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
      
      // Parse CSV data into key-value pairs
      lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length >= 3) {
          const category = parts[0].replace(/"/g, '').trim();
          const parameter = parts[1].replace(/"/g, '').trim();
          const value = parts[2].replace(/"/g, '').trim();
          
          if (parameter && value !== '') {
            const key = `${category}_${parameter}`;
            const numValue = parseFloat(value);
            data[key] = isNaN(numValue) ? value : numValue;
          }
        }
      });

      console.log('Parsed CSV data:', data);

      // Map CSV data to CalculatorInputs structure
      const calculatorInputs: CalculatorInputs = {
        climateData: {
          heatingDegreeDays: data['Climate Data_Heating Degree Days (Th)'] || 0,
          coolingDegreeDays: data['Climate Data_Cooling Degree Days (Tc)'] || 0,
          northSolarRadiation: data['Climate Data_North Solar Radiation (Edn)'] || 0,
          southSolarRadiation: data['Climate Data_South Solar Radiation (Eds)'] || 0,
          eastSolarRadiation: data['Climate Data_East Solar Radiation (Ede)'] || 0,
          westSolarRadiation: data['Climate Data_West Solar Radiation (Edw)'] || 0,
          isManualInput: true,
        },
        currentEnergyLoad: 0,
        airflowRate: data['Airflow Rate'] || 0.01,
        buildingColumns: [
          {
            id: 'current',
            name: 'Current Building',
            building: {
              glazingElements: [{
                id: '1',
                name: 'Current Glazing',
                northArea: data['Current Building Glazing 1_North Area (Agn)'] || 0,
                southArea: data['Current Building Glazing 1_South Area (Ags)'] || 0,
                eastArea: data['Current Building Glazing 1_East Area (Age)'] || 0,
                westArea: data['Current Building Glazing 1_West Area (Agw)'] || 0,
                perimeter: data['Current Building Glazing 1_Perimeter (Lg)'] || 0,
                uValue: data['Current Building Glazing 1_U-Value (Ug)'] || 0.3,
                shgc: data['Current Building Glazing 1_SHGC'] || 0
              }],
              buildingElements: [
                { id: '1', name: 'Soffit', area: data['Current Building Element 1_Area (A)'] || 0, rValue: data['Current Building Element 1_R-Value (R)'] || 0 },
                { id: '2', name: 'Basement Walls', area: data['Current Building Element 2_Area (A)'] || 0, rValue: data['Current Building Element 2_R-Value (R)'] || 0 },
                { id: '3', name: 'Roof', area: data['Current Building Element 3_Area (A)'] || 0, rValue: data['Current Building Element 3_R-Value (R)'] || 0 },
                { id: '4', name: 'Floor', area: data['Current Building Element 4_Area (A)'] || 0, rValue: data['Current Building Element 4_R-Value (R)'] || 0 },
                { id: '5', name: 'Opaque Walls', area: data['Current Building Element 5_Area (A)'] || 0, rValue: data['Current Building Element 5_R-Value (R)'] || 0 }
              ]
            }
          },
          {
            id: 'proposed',
            name: 'Proposed Building',
            building: {
              glazingElements: [{
                id: '1',
                name: 'Proposed Glazing',
                northArea: data['Proposed Building Glazing 1_North Area (Agn)'] || 0,
                southArea: data['Proposed Building Glazing 1_South Area (Ags)'] || 0,
                eastArea: data['Proposed Building Glazing 1_East Area (Age)'] || 0,
                westArea: data['Proposed Building Glazing 1_West Area (Agw)'] || 0,
                perimeter: data['Proposed Building Glazing 1_Perimeter (Lg)'] || 0,
                uValue: data['Proposed Building Glazing 1_U-Value (Ug)'] || 0.3,
                shgc: data['Proposed Building Glazing 1_SHGC'] || 0
              }],
              buildingElements: [
                { id: '1', name: 'Soffit', area: data['Proposed Building Element 1_Area (A)'] || 0, rValue: data['Proposed Building Element 1_R-Value (R)'] || 0 },
                { id: '2', name: 'Basement Walls', area: data['Proposed Building Element 2_Area (A)'] || 0, rValue: data['Proposed Building Element 2_R-Value (R)'] || 0 },
                { id: '3', name: 'Roof', area: data['Proposed Building Element 3_Area (A)'] || 0, rValue: data['Proposed Building Element 3_R-Value (R)'] || 0 },
                { id: '4', name: 'Floor', area: data['Proposed Building Element 4_Area (A)'] || 0, rValue: data['Proposed Building Element 4_R-Value (R)'] || 0 },
                { id: '5', name: 'Opaque Walls', area: data['Proposed Building Element 5_Area (A)'] || 0, rValue: data['Proposed Building Element 5_R-Value (R)'] || 0 }
              ]
            }
          }
        ],
        // Legacy fields for backward compatibility
        currentBuilding: {
          glazingElements: [{
            id: '1',
            name: 'Current Glazing',
            northArea: data['Current Building Glazing 1_North Area (Agn)'] || 0,
            southArea: data['Current Building Glazing 1_South Area (Ags)'] || 0,
            eastArea: data['Current Building Glazing 1_East Area (Age)'] || 0,
            westArea: data['Current Building Glazing 1_West Area (Agw)'] || 0,
            perimeter: data['Current Building Glazing 1_Perimeter (Lg)'] || 0,
            uValue: data['Current Building Glazing 1_U-Value (Ug)'] || 0.3,
            shgc: data['Current Building Glazing 1_SHGC'] || 0
          }],
          buildingElements: [
            { id: '1', name: 'Soffit', area: data['Current Building Element 1_Area (A)'] || 0, rValue: data['Current Building Element 1_R-Value (R)'] || 0 },
            { id: '2', name: 'Basement Walls', area: data['Current Building Element 2_Area (A)'] || 0, rValue: data['Current Building Element 2_R-Value (R)'] || 0 },
            { id: '3', name: 'Roof', area: data['Current Building Element 3_Area (A)'] || 0, rValue: data['Current Building Element 3_R-Value (R)'] || 0 },
            { id: '4', name: 'Floor', area: data['Current Building Element 4_Area (A)'] || 0, rValue: data['Current Building Element 4_R-Value (R)'] || 0 },
            { id: '5', name: 'Opaque Walls', area: data['Current Building Element 5_Area (A)'] || 0, rValue: data['Current Building Element 5_R-Value (R)'] || 0 }
          ]
        },
        proposedBuilding: {
          glazingElements: [{
            id: '1',
            name: 'Proposed Glazing',
            northArea: data['Proposed Building Glazing 1_North Area (Agn)'] || 0,
            southArea: data['Proposed Building Glazing 1_South Area (Ags)'] || 0,
            eastArea: data['Proposed Building Glazing 1_East Area (Age)'] || 0,
            westArea: data['Proposed Building Glazing 1_West Area (Agw)'] || 0,
            perimeter: data['Proposed Building Glazing 1_Perimeter (Lg)'] || 0,
            uValue: data['Proposed Building Glazing 1_U-Value (Ug)'] || 0.3,
            shgc: data['Proposed Building Glazing 1_SHGC'] || 0
          }],
          buildingElements: [
            { id: '1', name: 'Soffit', area: data['Proposed Building Element 1_Area (A)'] || 0, rValue: data['Proposed Building Element 1_R-Value (R)'] || 0 },
            { id: '2', name: 'Basement Walls', area: data['Proposed Building Element 2_Area (A)'] || 0, rValue: data['Proposed Building Element 2_R-Value (R)'] || 0 },
            { id: '3', name: 'Roof', area: data['Proposed Building Element 3_Area (A)'] || 0, rValue: data['Proposed Building Element 3_R-Value (R)'] || 0 },
            { id: '4', name: 'Floor', area: data['Proposed Building Element 4_Area (A)'] || 0, rValue: data['Proposed Building Element 4_R-Value (R)'] || 0 },
            { id: '5', name: 'Opaque Walls', area: data['Proposed Building Element 5_Area (A)'] || 0, rValue: data['Proposed Building Element 5_R-Value (R)'] || 0 }
          ]
        },
        heatingDegreeDays: data['Climate Data_Heating Degree Days (Th)'] || 0,
        coolingDegreeDays: data['Climate Data_Cooling Degree Days (Tc)'] || 0,
        northGlazingArea: data['Current Building Glazing 1_North Area (Agn)'] || 0,
        southGlazingArea: data['Current Building Glazing 1_South Area (Ags)'] || 0,
        eastGlazingArea: data['Current Building Glazing 1_East Area (Age)'] || 0,
        westGlazingArea: data['Current Building Glazing 1_West Area (Agw)'] || 0,
        northSolarRadiation: data['Climate Data_North Solar Radiation (Edn)'] || 0,
        southSolarRadiation: data['Climate Data_South Solar Radiation (Eds)'] || 0,
        eastSolarRadiation: data['Climate Data_East Solar Radiation (Ede)'] || 0,
        westSolarRadiation: data['Climate Data_West Solar Radiation (Edw)'] || 0,
        glazingPerimeter: data['Current Building Glazing 1_Perimeter (Lg)'] || 0,
        glazingRValue: data['Current Building Glazing 1_U-Value (Ug)'] ? 1 / data['Current Building Glazing 1_U-Value (Ug)'] : 3.0,
        solarHeatGainCoeff: data['Current Building Glazing 1_SHGC'] || 0,
        soffitArea: data['Current Building Element 1_Area (A)'] || 0,
        soffitRValue: data['Current Building Element 1_R-Value (R)'] || 0,
        basementArea: data['Current Building Element 2_Area (A)'] || 0,
        basementRValue: data['Current Building Element 2_R-Value (R)'] || 0,
        roofArea: data['Current Building Element 3_Area (A)'] || 0,
        roofRValue: data['Current Building Element 3_R-Value (R)'] || 0,
        floorArea: data['Current Building Element 4_Area (A)'] || 0,
        floorRValue: data['Current Building Element 4_R-Value (R)'] || 0,
        opaqueWallArea: data['Current Building Element 5_Area (A)'] || 0,
        opaqueWallRValue: data['Current Building Element 5_R-Value (R)'] || 0,
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
        console.log('CSV data loaded successfully:', parsedData);
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
