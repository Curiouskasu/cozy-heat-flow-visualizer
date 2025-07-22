import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Copy, Trash2 } from "lucide-react";
import { CalculatorInputs, BuildingElement } from "./HeatTransferCalculator";

interface Props {
  inputs: CalculatorInputs;
  setInputs: React.Dispatch<React.SetStateAction<CalculatorInputs>>;
}

const ManualBuildingInput = ({ inputs, setInputs }: Props) => {
  const [newBuildingName, setNewBuildingName] = useState('');

  const addBuilding = () => {
    if (!newBuildingName.trim()) return;
    
    const newBuilding = {
      name: newBuildingName,
      elements: []
    };
    
    setInputs(prev => ({
      ...prev,
      buildingColumns: [...(prev.buildingColumns || []), newBuilding]
    }));
    
    setNewBuildingName('');
  };

  const duplicateBuilding = (buildingIndex: number) => {
    const originalBuilding = inputs.buildingColumns?.[buildingIndex];
    if (!originalBuilding) return;
    
    const duplicatedBuilding = {
      ...originalBuilding,
      name: `${originalBuilding.name} Copy`,
      elements: originalBuilding.elements.map(element => ({ ...element }))
    };
    
    setInputs(prev => ({
      ...prev,
      buildingColumns: [...(prev.buildingColumns || []), duplicatedBuilding]
    }));
  };

  const removeBuilding = (buildingIndex: number) => {
    setInputs(prev => ({
      ...prev,
      buildingColumns: prev.buildingColumns?.filter((_, index) => index !== buildingIndex) || []
    }));
  };

  const updateBuildingName = (buildingIndex: number, name: string) => {
    setInputs(prev => ({
      ...prev,
      buildingColumns: prev.buildingColumns?.map((building, index) => 
        index === buildingIndex ? { ...building, name } : building
      ) || []
    }));
  };

  const addElementToBuilding = (buildingIndex: number) => {
    const newElement: BuildingElement = {
      name: 'New Element',
      category: 'glazing',
      area: 0,
      rValue: 0,
      uValue: 0,
      fFactor: 0,
      perimeter: 0,
      cFactor: 0
    };

    setInputs(prev => ({
      ...prev,
      buildingColumns: prev.buildingColumns?.map((building, index) => 
        index === buildingIndex 
          ? { ...building, elements: [...building.elements, newElement] }
          : building
      ) || []
    }));
  };

  const duplicateElement = (buildingIndex: number, elementIndex: number) => {
    const originalElement = inputs.buildingColumns?.[buildingIndex]?.elements[elementIndex];
    if (!originalElement) return;
    
    const duplicatedElement = { ...originalElement, name: `${originalElement.name} Copy` };
    
    setInputs(prev => ({
      ...prev,
      buildingColumns: prev.buildingColumns?.map((building, index) => 
        index === buildingIndex 
          ? { ...building, elements: [...building.elements, duplicatedElement] }
          : building
      ) || []
    }));
  };

  const removeElement = (buildingIndex: number, elementIndex: number) => {
    setInputs(prev => ({
      ...prev,
      buildingColumns: prev.buildingColumns?.map((building, index) => 
        index === buildingIndex 
          ? { ...building, elements: building.elements.filter((_, eIndex) => eIndex !== elementIndex) }
          : building
      ) || []
    }));
  };

  const updateElement = (buildingIndex: number, elementIndex: number, updates: Partial<BuildingElement>) => {
    setInputs(prev => ({
      ...prev,
      buildingColumns: prev.buildingColumns?.map((building, index) => 
        index === buildingIndex 
          ? { 
              ...building, 
              elements: building.elements.map((element, eIndex) => 
                eIndex === elementIndex ? { ...element, ...updates } : element
              )
            }
          : building
      ) || []
    }));
  };

  const renderElementInputs = (element: BuildingElement, buildingIndex: number, elementIndex: number) => {
    switch (element.category) {
      case 'glazing':
        return (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor={`area-${buildingIndex}-${elementIndex}`}>Area (ft²)</Label>
                <Input
                  id={`area-${buildingIndex}-${elementIndex}`}
                  type="number"
                  value={element.area || 0}
                  onChange={(e) => updateElement(buildingIndex, elementIndex, { area: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor={`uvalue-${buildingIndex}-${elementIndex}`}>U-Value</Label>
                <Input
                  id={`uvalue-${buildingIndex}-${elementIndex}`}
                  type="number"
                  step="0.01"
                  value={element.uValue || 0}
                  onChange={(e) => updateElement(buildingIndex, elementIndex, { uValue: Number(e.target.value) })}
                />
              </div>
            </div>
          </>
        );
      
      case 'aboveGrade':
        return (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor={`area-${buildingIndex}-${elementIndex}`}>Area (ft²)</Label>
                <Input
                  id={`area-${buildingIndex}-${elementIndex}`}
                  type="number"
                  value={element.area || 0}
                  onChange={(e) => updateElement(buildingIndex, elementIndex, { area: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor={`rvalue-${buildingIndex}-${elementIndex}`}>R-Value</Label>
                <Input
                  id={`rvalue-${buildingIndex}-${elementIndex}`}
                  type="number"
                  step="0.1"
                  value={element.rValue || 0}
                  onChange={(e) => updateElement(buildingIndex, elementIndex, { rValue: Number(e.target.value) })}
                />
              </div>
            </div>
          </>
        );
      
      case 'slab':
        return (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor={`ffactor-${buildingIndex}-${elementIndex}`}>F-Factor</Label>
                <Input
                  id={`ffactor-${buildingIndex}-${elementIndex}`}
                  type="number"
                  step="0.01"
                  value={element.fFactor || 0}
                  onChange={(e) => updateElement(buildingIndex, elementIndex, { fFactor: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor={`perimeter-${buildingIndex}-${elementIndex}`}>Perimeter (ft)</Label>
                <Input
                  id={`perimeter-${buildingIndex}-${elementIndex}`}
                  type="number"
                  value={element.perimeter || 0}
                  onChange={(e) => updateElement(buildingIndex, elementIndex, { perimeter: Number(e.target.value) })}
                />
              </div>
            </div>
          </>
        );
      
      case 'basementWall':
        return (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor={`area-${buildingIndex}-${elementIndex}`}>Area (ft²)</Label>
                <Input
                  id={`area-${buildingIndex}-${elementIndex}`}
                  type="number"
                  value={element.area || 0}
                  onChange={(e) => updateElement(buildingIndex, elementIndex, { area: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor={`cfactor-${buildingIndex}-${elementIndex}`}>C-Factor</Label>
                <Input
                  id={`cfactor-${buildingIndex}-${elementIndex}`}
                  type="number"
                  step="0.01"
                  value={element.cFactor || 0}
                  onChange={(e) => updateElement(buildingIndex, elementIndex, { cFactor: Number(e.target.value) })}
                />
              </div>
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manual Building Input</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter building name..."
              value={newBuildingName}
              onChange={(e) => setNewBuildingName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addBuilding} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Building
            </Button>
          </div>

          <div className="space-y-4">
            {inputs.buildingColumns?.map((building, buildingIndex) => (
              <Card key={buildingIndex} className="border-l-4 border-l-primary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex-1">
                    <Input
                      value={building.name}
                      onChange={(e) => updateBuildingName(buildingIndex, e.target.value)}
                      className="font-semibold"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => duplicateBuilding(buildingIndex)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeBuilding(buildingIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {building.elements.map((element, elementIndex) => (
                      <Card key={elementIndex} className="p-3">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2 flex-1">
                              <Input
                                placeholder="Element name"
                                value={element.name}
                                onChange={(e) => updateElement(buildingIndex, elementIndex, { name: e.target.value })}
                                className="flex-1"
                              />
                              <Select
                                value={element.category}
                                onValueChange={(value: 'glazing' | 'aboveGrade' | 'slab' | 'basementWall') => 
                                  updateElement(buildingIndex, elementIndex, { category: value })
                                }
                              >
                                <SelectTrigger className="w-48">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="glazing">Glazing</SelectItem>
                                  <SelectItem value="aboveGrade">Above Grade</SelectItem>
                                  <SelectItem value="slab">On/Sub-grade Slab</SelectItem>
                                  <SelectItem value="basementWall">Basement Wall</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => duplicateElement(buildingIndex, elementIndex)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeElement(buildingIndex, elementIndex)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {renderElementInputs(element, buildingIndex, elementIndex)}
                        </div>
                      </Card>
                    ))}
                    
                    <Button
                      variant="outline"
                      onClick={() => addElementToBuilding(buildingIndex)}
                      className="w-full flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Element
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManualBuildingInput;