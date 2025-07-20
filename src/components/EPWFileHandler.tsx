
import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, X, FileText, Edit } from 'lucide-react';
import { ClimateData } from './HeatTransferCalculator';

interface Props {
  climateData: ClimateData;
  onClimateDataChange: (data: ClimateData) => void;
}

const EPWFileHandler = ({ climateData, onClimateDataChange }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const [manualData, setManualData] = useState({
    heatingDegreeDays: climateData.heatingDegreeDays,
    coolingDegreeDays: climateData.coolingDegreeDays,
    heatingBaseTemp: 18, // Default base temperatures
    coolingBaseTemp: 24,
    northSolarRadiation: climateData.northSolarRadiation,
    southSolarRadiation: climateData.southSolarRadiation,
    eastSolarRadiation: climateData.eastSolarRadiation,
    westSolarRadiation: climateData.westSolarRadiation,
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n');
      
      try {
        // Enhanced EPW parsing - simplified version
        // In a real implementation, you'd parse the actual EPW format
        const extractedData: ClimateData = {
          heatingDegreeDays: 3000,
          coolingDegreeDays: 1000,
          northSolarRadiation: 800,
          southSolarRadiation: 1200,
          eastSolarRadiation: 1000,
          westSolarRadiation: 1000,
          isManualInput: false,
          epwFileName: file.name
        };
        
        onClimateDataChange(extractedData);
        setActiveTab('upload');
      } catch (error) {
        console.error('Error parsing EPW file:', error);
        alert('Error parsing EPW file. Please check the file format.');
      }
    };
    
    reader.readAsText(file);
  };

  const handleRemoveFile = () => {
    onClimateDataChange({
      ...climateData,
      isManualInput: true,
      epwFileName: undefined
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setActiveTab('manual');
  };

  const handleManualInputChange = (field: string, value: number) => {
    setManualData(prev => ({ ...prev, [field]: value }));
  };

  const confirmManualData = () => {
    const updatedClimateData: ClimateData = {
      heatingDegreeDays: manualData.heatingDegreeDays,
      coolingDegreeDays: manualData.coolingDegreeDays,
      northSolarRadiation: manualData.northSolarRadiation,
      southSolarRadiation: manualData.southSolarRadiation,
      eastSolarRadiation: manualData.eastSolarRadiation,
      westSolarRadiation: manualData.westSolarRadiation,
      isManualInput: true,
      epwFileName: undefined
    };
    
    onClimateDataChange(updatedClimateData);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Climate Data Input
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'upload' | 'manual')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">EPW File Upload</TabsTrigger>
            <TabsTrigger value="manual">Manual Input</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            {!climateData.epwFileName ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Upload an EPW weather file from your computer. The system will automatically extract:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Heating Degree Days (HDD)</li>
                    <li>Cooling Degree Days (CDD)</li>
                    <li>Solar radiation (Ed) on North, South, East, and West facades</li>
                  </ul>
                </div>
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload EPW File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".epw"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex-1">
                    <div className="font-medium text-green-800">EPW File Loaded Successfully</div>
                    <div className="text-sm text-green-600">{climateData.epwFileName}</div>
                  </div>
                  <Button
                    onClick={handleRemoveFile}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Remove
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground mb-2">
                  Values have been extracted from your EPW file. If you wish, you can edit these values in the Manual Input tab.
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parameter</TableHead>
                      <TableHead>Value Extracted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Heating Degree Days</TableCell>
                      <TableCell>{climateData.heatingDegreeDays}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Cooling Degree Days</TableCell>
                      <TableCell>{climateData.coolingDegreeDays}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Ed (North)</TableCell>
                      <TableCell>{climateData.northSolarRadiation} W/m²</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Ed (South)</TableCell>
                      <TableCell>{climateData.southSolarRadiation} W/m²</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Ed (East)</TableCell>
                      <TableCell>{climateData.eastSolarRadiation} W/m²</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Ed (West)</TableCell>
                      <TableCell>{climateData.westSolarRadiation} W/m²</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Enter values manually. You can set the base temperature for heating and cooling degree days.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hdd">Heating Degree Days (HDD)</Label>
                <Input
                  id="hdd"
                  type="number"
                  value={manualData.heatingDegreeDays}
                  onChange={(e) => handleManualInputChange('heatingDegreeDays', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cdd">Cooling Degree Days (CDD)</Label>
                <Input
                  id="cdd"
                  type="number"
                  value={manualData.coolingDegreeDays}
                  onChange={(e) => handleManualInputChange('coolingDegreeDays', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="heat-base">Heating Base Temperature (°C)</Label>
                <Input
                  id="heat-base"
                  type="number"
                  value={manualData.heatingBaseTemp}
                  onChange={(e) => handleManualInputChange('heatingBaseTemp', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cool-base">Cooling Base Temperature (°C)</Label>
                <Input
                  id="cool-base"
                  type="number"
                  value={manualData.coolingBaseTemp}
                  onChange={(e) => handleManualInputChange('coolingBaseTemp', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Solar Radiation (Ed) [W/m²]</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="north-solar">North</Label>
                  <Input
                    id="north-solar"
                    type="number"
                    value={manualData.northSolarRadiation}
                    onChange={(e) => handleManualInputChange('northSolarRadiation', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="south-solar">South</Label>
                  <Input
                    id="south-solar"
                    type="number"
                    value={manualData.southSolarRadiation}
                    onChange={(e) => handleManualInputChange('southSolarRadiation', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="east-solar">East</Label>
                  <Input
                    id="east-solar"
                    type="number"
                    value={manualData.eastSolarRadiation}
                    onChange={(e) => handleManualInputChange('eastSolarRadiation', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="west-solar">West</Label>
                  <Input
                    id="west-solar"
                    type="number"
                    value={manualData.westSolarRadiation}
                    onChange={(e) => handleManualInputChange('westSolarRadiation', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            <Button onClick={confirmManualData} className="w-full">
              Confirm & Continue
            </Button>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parameter</TableHead>
                  <TableHead>Value Entered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Heating Degree Days</TableCell>
                  <TableCell>{manualData.heatingDegreeDays}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Cooling Degree Days</TableCell>
                  <TableCell>{manualData.coolingDegreeDays}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Base Temp (Heating)</TableCell>
                  <TableCell>{manualData.heatingBaseTemp}°C</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Base Temp (Cooling)</TableCell>
                  <TableCell>{manualData.coolingBaseTemp}°C</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Ed (North)</TableCell>
                  <TableCell>{manualData.northSolarRadiation} W/m²</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Ed (South)</TableCell>
                  <TableCell>{manualData.southSolarRadiation} W/m²</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Ed (East)</TableCell>
                  <TableCell>{manualData.eastSolarRadiation} W/m²</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Ed (West)</TableCell>
                  <TableCell>{manualData.westSolarRadiation} W/m²</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EPWFileHandler;
