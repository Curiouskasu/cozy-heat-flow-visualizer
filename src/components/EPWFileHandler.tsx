import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, X, FileText } from 'lucide-react';
// import { ClimateData } from './HeatTransferCalculator';
//
// const ClimateData = {
//   heatingDegreeDays: number,
//   coolingDegreeDays: number,
//   heatingBaseTemp: number,
//   coolingBaseTemp: number,
//   northSolarRadiation: number,
//   southSolarRadiation: number,
//   eastSolarRadiation: number,
//   westSolarRadiation: number,
//   isManualInput: boolean,
//   epwFileName?: string
// }
//
// <-- Uncomment/replace above line as appropriate for your codebase

const DEFAULT_HEAT_BASE = 18;
const DEFAULT_COOL_BASE = 24;

function sunAzimuthToFacadeIdx(azimuth) {
  // Azimuth in EPW: 0 = North, 90 = East, 180 = South, 270 = West (but can vary!)
  // For simplicity, we'll use:
  // 315-45: North, 45-135: East, 135-225: South, 225-315: West

  azimuth = (azimuth + 360) % 360;
  if ((azimuth > 315) || (azimuth <= 45)) return 0; // North
  if (azimuth > 45 && azimuth <= 135) return 1; // East
  if (azimuth > 135 && azimuth <= 225) return 2; // South
  if (azimuth > 225 && azimuth <= 315) return 3; // West
  return 2; // Default to South
}

const EPWFileHandler = ({ climateData, onClimateDataChange }) => {
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [manualData, setManualData] = useState({
    heatingDegreeDays: climateData.heatingDegreeDays || 0,
    coolingDegreeDays: climateData.coolingDegreeDays || 0,
    heatingBaseTemp: climateData.heatingBaseTemp || DEFAULT_HEAT_BASE,
    coolingBaseTemp: climateData.coolingBaseTemp || DEFAULT_COOL_BASE,
    northSolarRadiation: climateData.northSolarRadiation || 0,
    southSolarRadiation: climateData.southSolarRadiation || 0,
    eastSolarRadiation: climateData.eastSolarRadiation || 0,
    westSolarRadiation: climateData.westSolarRadiation || 0,
  });

  // Keep base temp in extracted, display them in upload summary
  const [baseTemps, setBaseTemps] = useState({
    heatingBaseTemp: manualData.heatingBaseTemp,
    coolingBaseTemp: manualData.coolingBaseTemp
  });

  // Parse and extract data from EPW file
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      const lines = content.split('\n');
      try {
        // Find start of data
        let dataStartIdx = lines.findIndex(l => l.startsWith('DATA PERIODS')) + 1;
        if (dataStartIdx <= 0) dataStartIdx = 8;
        const labelLine = lines[dataStartIdx];
        const colNames = labelLine.split(',').map(s => s.trim().toLowerCase());

        const colIndex = (key) => colNames.findIndex(n => n.includes(key));
        const idxDryBulb = colIndex('dry bulb');
        const idxGHorRad = colIndex('global horiz');
        const idxAzimuth = colIndex('azimuth');

        // Use the latest set base temps
        const heatingBaseTemp = baseTemps.heatingBaseTemp || DEFAULT_HEAT_BASE;
        const coolingBaseTemp = baseTemps.coolingBaseTemp || DEFAULT_COOL_BASE;

        let hdh = 0, cdh = 0;
        let eds = [0, 0, 0, 0]; // N, E, S, W

        for (let i = dataStartIdx + 1; i < lines.length; ++i) {
          const line = lines[i].trim();
          if (!line) continue;
          const cols = line.split(',');
          if (cols.length < Math.max(idxDryBulb, idxGHorRad) + 1) continue;

          const tdb = parseFloat(cols[idxDryBulb]);
          if (isNaN(tdb)) continue;

          if (tdb < heatingBaseTemp) hdh += (heatingBaseTemp - tdb);
          if (tdb > coolingBaseTemp) cdh += (tdb - coolingBaseTemp);

          const ghr = parseFloat(cols[idxGHorRad]) || 0; // Wh/m² for this hour
          const azimuth = idxAzimuth !== -1 && cols[idxAzimuth] ? parseFloat(cols[idxAzimuth]) : null;
          let facadeIdx;
          if (azimuth != null && !isNaN(azimuth)) {
            facadeIdx = sunAzimuthToFacadeIdx(azimuth);
          } else {
            // crude fallback: time-of-day for sun's direction
            const hour = parseInt(cols[1]);
            if (hour >= 6 && hour < 12) facadeIdx = 1; // east morning
            else if (hour === 12) facadeIdx = 2; // south midday
            else if (hour > 12 && hour < 18) facadeIdx = 3; // west afternoon
            else facadeIdx = 0; // night/north
          }
          eds[facadeIdx] += ghr;
        }

        const heatingDegreeDays = +(hdh / 24).toFixed(1);
        const coolingDegreeDays = +(cdh / 24).toFixed(1);
        const [north, east, south, west] = eds.map(e => +e.toFixed(1));

        const extractedData = {
          heatingDegreeDays,
          coolingDegreeDays,
          heatingBaseTemp,
          coolingBaseTemp,
          northSolarRadiation: north,
          southSolarRadiation: south,
          eastSolarRadiation: east,
          westSolarRadiation: west,
          isManualInput: false,
          epwFileName: file.name,
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

  const handleManualInputChange = (field, value) => {
    setManualData(prev => ({ ...prev, [field]: value }));
    if (field === 'heatingBaseTemp' || field === 'coolingBaseTemp') {
      setBaseTemps(prev => ({ ...prev, [field]: value }));
    }
  };

  const confirmManualData = () => {
    const updatedClimateData = {
      ...manualData,
      isManualInput: true,
      epwFileName: undefined,
    };
    onClimateDataChange(updatedClimateData);
    setBaseTemps({
      heatingBaseTemp: manualData.heatingBaseTemp,
      coolingBaseTemp: manualData.coolingBaseTemp,
    });
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
        <Tabs value={activeTab} onValueChange={val => setActiveTab(val)}>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="heat-base-upload">Heating Base Temperature (°C)</Label>
                    <Input
                      id="heat-base-upload"
                      type="number"
                      value={baseTemps.heatingBaseTemp}
                      onChange={e=>{
                        const val = parseFloat(e.target.value) || 0;
                        setBaseTemps(b=>({...b,heatingBaseTemp:val}));
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cool-base-upload">Cooling Base Temperature (°C)</Label>
                    <Input
                      id="cool-base-upload"
                      type="number"
                      value={baseTemps.coolingBaseTemp}
                      onChange={e=>{
                        const val = parseFloat(e.target.value) || 0;
                        setBaseTemps(b=>({...b,coolingBaseTemp:val}));
                      }}
                    />
                  </div>
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
                  Values extracted from your EPW file. Change base temperature above and re-upload to update.
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
                      <TableCell>Heating Base Temp</TableCell>
                      <TableCell>{climateData.heatingBaseTemp}°C</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Cooling Base Temp</TableCell>
                      <TableCell>{climateData.coolingBaseTemp}°C</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Ed (North)</TableCell>
                      <TableCell>{climateData.northSolarRadiation} Wh/m²</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Ed (South)</TableCell>
                      <TableCell>{climateData.southSolarRadiation} Wh/m²</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Ed (East)</TableCell>
                      <TableCell>{climateData.eastSolarRadiation} Wh/m²</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Ed (West)</TableCell>
                      <TableCell>{climateData.westSolarRadiation} Wh/m²</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Enter values manually. Set the base temperature for heating and cooling degree days.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hdd">Heating Degree Days (HDD)</Label>
                <Input
                  id="hdd"
                  type="number"
                  value={manualData.heatingDegreeDays}
                  onChange={e => handleManualInputChange('heatingDegreeDays', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cdd">Cooling Degree Days (CDD)</Label>
                <Input
                  id="cdd"
                  type="number"
                  value={manualData.coolingDegreeDays}
                  onChange={e => handleManualInputChange('coolingDegreeDays', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heat-base">Heating Base Temp (°C)</Label>
                <Input
                  id="heat-base"
                  type="number"
                  value={manualData.heatingBaseTemp}
                  onChange={e => handleManualInputChange('heatingBaseTemp', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cool-base">Cooling Base Temp (°C)</Label>
                <Input
                  id="cool-base"
                  type="number"
                  value={manualData.coolingBaseTemp}
                  onChange={e => handleManualInputChange('coolingBaseTemp', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Solar Radiation (Ed) [Wh/m²]</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="north-solar">North</Label>
                  <Input
                    id="north-solar"
                    type="number"
                    value={manualData.northSolarRadiation}
                    onChange={e => handleManualInputChange('northSolarRadiation', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="south-solar">South</Label>
                  <Input
                    id="south-solar"
                    type="number"
                    value={manualData.southSolarRadiation}
                    onChange={e => handleManualInputChange('southSolarRadiation', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="east-solar">East</Label>
                  <Input
                    id="east-solar"
                    type="number"
                    value={manualData.eastSolarRadiation}
                    onChange={e => handleManualInputChange('eastSolarRadiation', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="west-solar">West</Label>
                  <Input
                    id="west-solar"
                    type="number"
                    value={manualData.westSolarRadiation}
                    onChange={e => handleManualInputChange('westSolarRadiation', parseFloat(e.target.value) || 0)}
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
                  <TableCell>{manualData.northSolarRadiation} Wh/m²</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Ed (South)</TableCell>
                  <TableCell>{manualData.southSolarRadiation} Wh/m²</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Ed (East)</TableCell>
                  <TableCell>{manualData.eastSolarRadiation} Wh/m²</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Ed (West)</TableCell>
                  <TableCell>{manualData.westSolarRadiation} Wh/m²</TableCell>
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
