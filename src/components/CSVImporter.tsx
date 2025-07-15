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
      const buildingData: any = {};
      
      // Parse CSV data into key-value pairs
      let currentBuildingName = '';
      let currentElementType = '';
      let currentElementIndex = 1;
      
      lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length >= 3) {
          const category = parts[0].replace(/"/g, '').trim();
          const parameter = parts[1].replace(/"/g, '').trim();
          const value = parts[2].replace(/"/g, '').trim();
          
          // Check if this is a building name row (category contains "Building" and parameter is empty or "Name")
          if (category.includes('Building') && (parameter === '' || parameter === 'Name' || value.includes('Building') || value.includes('Glazing') || value.includes('element'))) {
            currentBuildingName = category;
            if (!buildingData[currentBuildingName]) {
              buildingData[currentBuildingName] = {
                glazingElements: [],
                buildingElements: []
              };
            }
            currentElementIndex = 1;
            return;
          }
          
          // Check if this is a glazing or element type indicator
          if (category.includes('Glazing') && parameter === 'Name') {
            currentElementType = 'glazing';
            currentElementIndex = parseInt(category.match(/\d+/)?.[0] || '1');
            return;
          }
          
          if (category.includes('Element') && parameter === 'Name') {
            currentElementType = 'element';
            currentElementIndex = parseInt(category.match(/\d+/)?.[0] || '1');
            return;
          }
          
          // Handle climate data
          if (category === 'Climate Data') {
            const key = `${category}_${parameter}`;
            const numValue = parseFloat(value);
            data[key] = isNaN(numValue) ? value : numValue;
            return;
          }
          
          // Handle airflow rate
          if (category === 'Airflow Rate' || parameter === 'Airflow Rate') {
            data['airflowRate'] = parseFloat(value) || 0.01;
            return;
          }
          
          // Handle building-specific data
          if (currentBuildingName && parameter && value !== '') {
            if (!buildingData[currentBuildingName]) {
              buildingData[currentBuildingName] = {
                glazingElements: [],
                buildingElements: []
              };
            }
            
            const numValue = parseFloat(value);
            const finalValue = isNaN(numValue) ? value : numValue;
            
            // Create glazing element if it doesn't exist
            if (currentElementType === 'glazing') {
              let glazingElement = buildingData[currentBuildingName].glazingElements.find((g: any) => g.index === currentElementIndex);
              if (!glazingElement) {
                glazingElement = {
                  id: `glazing-${currentBuildingName}-${currentElementIndex}`,
                  name: value.includes('Glazing') ? value : `Glazing ${currentElementIndex}`,
                  index: currentElementIndex,
                  northArea: 0,
                  southArea: 0,
                  eastArea: 0,
                  westArea: 0,
                  perimeter: 0,
                  uValue: 0.3,
                  shgc: 0
                };
                buildingData[currentBuildingName].glazingElements.push(glazingElement);
              }
              
              // Map parameters to glazing properties
              if (parameter.includes('North Area')) glazingElement.northArea = finalValue;
              else if (parameter.includes('South Area')) glazingElement.southArea = finalValue;
              else if (parameter.includes('East Area')) glazingElement.eastArea = finalValue;
              else if (parameter.includes('West Area')) glazingElement.westArea = finalValue;
              else if (parameter.includes('Perimeter')) glazingElement.perimeter = finalValue;
              else if (parameter.includes('U-Value')) glazingElement.uValue = finalValue;
              else if (parameter.includes('SHGC')) glazingElement.shgc = finalValue;
              else if (parameter === 'Name' && typeof finalValue === 'string') glazingElement.name = finalValue;
            }
            
            // Create building element if it doesn't exist
            else if (currentElementType === 'element') {
              let buildingElement = buildingData[currentBuildingName].buildingElements.find((e: any) => e.index === currentElementIndex);
              if (!buildingElement) {
                buildingElement = {
                  id: `element-${currentBuildingName}-${currentElementIndex}`,
                  name: value.includes('Element') ? value : `Element ${currentElementIndex}`,
                  index: currentElementIndex,
                  area: 0,
                  rValue: 0
                };
                buildingData[currentBuildingName].buildingElements.push(buildingElement);
              }
              
              // Map parameters to building element properties
              if (parameter.includes('Area')) buildingElement.area = finalValue;
              else if (parameter.includes('R-Value')) buildingElement.rValue = finalValue;
              else if (parameter === 'Name' && typeof finalValue === 'string') buildingElement.name = finalValue;
            }
          }
        }
      });

      console.log('Parsed CSV data:', data);
      console.log('Building data:', buildingData);

      // Create dynamic building columns from CSV data
      const buildingColumns = Object.keys(buildingData).map((buildingName, index) => {
        const building = buildingData[buildingName];
        
        return {
          id: `building-${index}`,
          name: buildingName.replace(' Building', '').replace('Building ', ''),
          building: {
            glazingElements: building.glazingElements.map((glazing: any) => ({
              id: glazing.id,
              name: glazing.name,
              northArea: glazing.northArea || 0,
              southArea: glazing.southArea || 0,
              eastArea: glazing.eastArea || 0,
              westArea: glazing.westArea || 0,
              perimeter: glazing.perimeter || 0,
              uValue: glazing.uValue || 0.3,
              shgc: glazing.shgc || 0
            })),
            buildingElements: building.buildingElements.map((element: any) => ({
              id: element.id,
              name: element.name,
              area: element.area || 0,
              rValue: element.rValue || 0
            }))
          }
        };
      });

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
        airflowRate: data['airflowRate'] || 0.01,
        buildingColumns,
        // Legacy fields for backward compatibility - use first building if available
        currentBuilding: buildingColumns[0]?.building || {
          glazingElements: [],
          buildingElements: []
        },
        proposedBuilding: buildingColumns[1]?.building || {
          glazingElements: [],
          buildingElements: []
        },
        heatingDegreeDays: data['Climate Data_Heating Degree Days (Th)'] || 0,
        coolingDegreeDays: data['Climate Data_Cooling Degree Days (Tc)'] || 0,
        northGlazingArea: buildingColumns[0]?.building?.glazingElements[0]?.northArea || 0,
        southGlazingArea: buildingColumns[0]?.building?.glazingElements[0]?.southArea || 0,
        eastGlazingArea: buildingColumns[0]?.building?.glazingElements[0]?.eastArea || 0,
        westGlazingArea: buildingColumns[0]?.building?.glazingElements[0]?.westArea || 0,
        northSolarRadiation: data['Climate Data_North Solar Radiation (Edn)'] || 0,
        southSolarRadiation: data['Climate Data_South Solar Radiation (Eds)'] || 0,
        eastSolarRadiation: data['Climate Data_East Solar Radiation (Ede)'] || 0,
        westSolarRadiation: data['Climate Data_West Solar Radiation (Edw)'] || 0,
        glazingPerimeter: buildingColumns[0]?.building?.glazingElements[0]?.perimeter || 0,
        glazingRValue: buildingColumns[0]?.building?.glazingElements[0]?.uValue ? 1 / buildingColumns[0].building.glazingElements[0].uValue : 3.0,
        solarHeatGainCoeff: buildingColumns[0]?.building?.glazingElements[0]?.shgc || 0,
        soffitArea: buildingColumns[0]?.building?.buildingElements.find(e => e.name.toLowerCase().includes('soffit'))?.area || 0,
        soffitRValue: buildingColumns[0]?.building?.buildingElements.find(e => e.name.toLowerCase().includes('soffit'))?.rValue || 0,
        basementArea: buildingColumns[0]?.building?.buildingElements.find(e => e.name.toLowerCase().includes('basement'))?.area || 0,
        basementRValue: buildingColumns[0]?.building?.buildingElements.find(e => e.name.toLowerCase().includes('basement'))?.rValue || 0,
        roofArea: buildingColumns[0]?.building?.buildingElements.find(e => e.name.toLowerCase().includes('roof'))?.area || 0,
        roofRValue: buildingColumns[0]?.building?.buildingElements.find(e => e.name.toLowerCase().includes('roof'))?.rValue || 0,
        floorArea: buildingColumns[0]?.building?.buildingElements.find(e => e.name.toLowerCase().includes('floor'))?.area || 0,
        floorRValue: buildingColumns[0]?.building?.buildingElements.find(e => e.name.toLowerCase().includes('floor'))?.rValue || 0,
        opaqueWallArea: buildingColumns[0]?.building?.buildingElements.find(e => e.name.toLowerCase().includes('wall'))?.area || 0,
        opaqueWallRValue: buildingColumns[0]?.building?.buildingElements.find(e => e.name.toLowerCase().includes('wall'))?.rValue || 0,
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
      alert('CSV data imported successfully! All building data has been populated.');
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
                Fill All Inputs
              </Button>
            </div>
          )}
          <span className="text-sm text-muted-foreground">
            Import a CSV file to populate all fields including building comparisons
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CSVImporter;
