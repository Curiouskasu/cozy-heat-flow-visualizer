import React, { useRef, useState } from "react";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui"; // Adjust these imports to your project structure!
import { Upload, X, FileText } from "lucide-react";

const DEFAULT_HEAT_BASE = 18;
const DEFAULT_COOL_BASE = 18;

function sunAzimuthToFacadeIdx(azimuth) {
  // North: 315 to 45, East: 45-135, South: 135-225, West: 225-315
  azimuth = (Number(azimuth) + 360) % 360;
  if (azimuth > 315 || azimuth <= 45) return 0; // North
  if (azimuth > 45 && azimuth <= 135) return 1; // East
  if (azimuth > 135 && azimuth <= 225) return 2; // South
  if (azimuth > 225 && azimuth <= 315) return 3; // West
  return 2;
}

function safeParseFloat(val) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

// MAIN COMPONENT
const EPWFileHandler = ({ climateData, onClimateDataChange }) => {
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("upload");
  const [manualData, setManualData] = useState({
    heatingDegreeDays: climateData.heatingDegreeDays || 0,
    coolingDegreeDays: climateData.coolingDegreeDays || 0,
    heatingBaseTemp: climateData.heatingBaseTemp ?? DEFAULT_HEAT_BASE,
    coolingBaseTemp: climateData.coolingBaseTemp ?? DEFAULT_COOL_BASE,
    northSolarRadiation: climateData.northSolarRadiation || 0,
    southSolarRadiation: climateData.southSolarRadiation || 0,
    eastSolarRadiation: climateData.eastSolarRadiation || 0,
    westSolarRadiation: climateData.westSolarRadiation || 0,
  });

  const [baseTemps, setBaseTemps] = useState({
    heatingBaseTemp: manualData.heatingBaseTemp,
    coolingBaseTemp: manualData.coolingBaseTemp,
  });

  // ---- EPW FILE PARSING & COMPUTATION ----
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const heatingBaseTemp = baseTemps.heatingBaseTemp ?? DEFAULT_HEAT_BASE;
    const coolingBaseTemp = baseTemps.coolingBaseTemp ?? DEFAULT_COOL_BASE;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const lines = e.target.result.split(/\r?\n/).filter(l => !!l.trim());
        // Find header: EPW spec is line 8: header. Data starts at 9 (0-based)
        const headerLine = lines[8];
        if (!headerLine) throw new Error("EPW: No column header row found.");
        const colNames = headerLine.split(",").map((x) => x.trim().toLowerCase());

        // Indexes
        const idxDryBulb = colNames.findIndex(k => k.includes("dry bulb"));
        const idxGHorRad = colNames.findIndex(k => k.includes("global horiz"));
        let idxAzimuth = colNames.findIndex(k => k.includes("azimuth"));
        const idxHour = 1; // EPW: 0=Year, 1=Month, 2=Day, 3=Hour

        if (idxDryBulb === -1 || idxGHorRad === -1) {
          throw new Error("EPW file missing required columns: Dry Bulb or Global Horizontal Radiation.");
        }
        // If azimuth missing, fallback to -1 index.

        let hddHours = 0, cddHours = 0;
        let eds = [0, 0, 0, 0]; // N, E, S, W

        for (let i = 9; i < lines.length; ++i) {
          const cols = lines[i].split(",");
          if (cols.length < colNames.length) continue;
          const tdb = safeParseFloat(cols[idxDryBulb]);
          if (tdb !== undefined) {
            if (tdb < heatingBaseTemp) hddHours += (heatingBaseTemp - tdb);
            if (tdb > coolingBaseTemp) cddHours += (tdb - coolingBaseTemp);
          }
          const ghr = safeParseFloat(cols[idxGHorRad]);

          // FACADE MAPPING
          let facadeIdx = 2; // Default: south
          if (idxAzimuth !== -1) {
            const az = safeParseFloat(cols[idxAzimuth]);
            facadeIdx = sunAzimuthToFacadeIdx(az);
          } else {
            // Approximate based on hour
            const hour = safeParseFloat(cols[idxHour]);
            if (hour >= 6 && hour < 12) facadeIdx = 1;
            else if (hour >= 12 && hour < 18) facadeIdx = 3;
            else if (hour >= 18 || hour < 6) facadeIdx = 0;
          }
          eds[facadeIdx] += ghr;
        }
        // Convert h/c degree-hours to degree-days
        const heatingDegreeDays = +(hddHours / 24).toFixed(1);
        const coolingDegreeDays = +(cddHours / 24).toFixed(1);
        const [north, east, south, west] = eds.map(w => +w.toFixed(1));

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
        setActiveTab("upload");
      } catch (err) {
        console.error("Error parsing EPW:", err);
        alert("Error parsing EPW file. " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleRemoveFile = () => {
    onClimateDataChange({
      ...climateData,
      isManualInput: true,
      epwFileName: undefined,
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
    setActiveTab("manual");
  };

  const handleManualInputChange = (field, value) => {
    setManualData((prev) => ({ ...prev, [field]: value }));
    if (field === "heatingBaseTemp" || field === "coolingBaseTemp") {
      setBaseTemps((prev) => ({ ...prev, [field]: value }));
    }
  };

  const confirmManualData = () => {
    const updated = { ...manualData, isManualInput: true, epwFileName: undefined };
    onClimateDataChange(updated);
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-2">
            <TabsTrigger value="upload">EPW File Upload</TabsTrigger>
            <TabsTrigger value="manual">Manual Input</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            {!climateData.epwFileName ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Upload an EPW weather file from your computer. The system will automatically extract:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Heating Degree Days (HDD)</li>
                    <li>Cooling Degree Days (CDD)</li>
                    <li>Solar radiation (Ed) on North, South, East, and West facades</li>
                  </ul>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="heat-base-upload">Heating Base Temperature (°C)</Label>
                    <Input
                      id="heat-base-upload"
                      type="number"
                      min="0"
                      step="0.1"
                      value={baseTemps.heatingBaseTemp}
                      onChange={e =>
                        setBaseTemps(prev=>({...prev, heatingBaseTemp:parseFloat(e.target.value) || 0}))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cool-base-upload">Cooling Base Temperature (°C)</Label>
                    <Input
                      id="cool-base-upload"
                      type="number"
                      min="0"
                      step="0.1"
                      value={baseTemps.coolingBaseTemp}
                      onChange={e =>
                        setBaseTemps(prev=>({...prev, coolingBaseTemp:parseFloat(e.target.value) || 0}))
                      }
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
              </>
            ) : (
              <>
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex-1">
                    <div className="font-medium text-green-800">EPW File Loaded Successfully</div>
                    <div className="text-sm text-green-600">{climateData.epwFileName}</div>
                  </div>
                  <Button onClick={handleRemoveFile} size="sm" variant="outline" className="flex items-center gap-1">
                    <X className="h-3 w-3" />
                    Remove
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  Values extracted from your EPW file. Adjust the base temperature and re-upload to update derived data.
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
              </>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-2">
              Enter values manually. Set the base temperature for heating and cooling degree days.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="hdd">Heating Degree Days (HDD)</Label>
                <Input
                  id="hdd"
                  type="number"
                  value={manualData.heatingDegreeDays}
                  onChange={e => handleManualInputChange("heatingDegreeDays", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cdd">Cooling Degree Days (CDD)</Label>
                <Input
                  id="cdd"
                  type="number"
                  value={manualData.coolingDegreeDays}
                  onChange={e => handleManualInputChange("coolingDegreeDays", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="heat-base">Heating Base Temp (°C)</Label>
                <Input
                  id="heat-base"
                  type="number"
                  value={manualData.heatingBaseTemp}
                  onChange={e => handleManualInputChange("heatingBaseTemp", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cool-base">Cooling Base Temp (°C)</Label>
                <Input
                  id="cool-base"
                  type="number"
                  value={manualData.coolingBaseTemp}
                  onChange={e => handleManualInputChange("coolingBaseTemp", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Solar Radiation (Ed) [Wh/m², annual sum]</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="north-solar">North</Label>
                  <Input
                    id="north-solar"
                    type="number"
                    value={manualData.northSolarRadiation}
                    onChange={e => handleManualInputChange("northSolarRadiation", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="south-solar">South</Label>
                  <Input
                    id="south-solar"
                    type="number"
                    value={manualData.southSolarRadiation}
                    onChange={e => handleManualInputChange("southSolarRadiation", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="east-solar">East</Label>
                  <Input
                    id="east-solar"
                    type="number"
                    value={manualData.eastSolarRadiation}
                    onChange={e => handleManualInputChange("eastSolarRadiation", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="west-solar">West</Label>
                  <Input
                    id="west-solar"
                    type="number"
                    value={manualData.westSolarRadiation}
                    onChange={e => handleManualInputChange("westSolarRadiation", parseFloat(e.target.value) || 0)}
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
