
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GripVertical, Copy, ArrowRight, Trash2 } from "lucide-react";

interface DragDropItem {
  id: string;
  name: string;
  [key: string]: any;
}

interface Props {
  items: DragDropItem[];
  onReorder: (items: DragDropItem[]) => void;
  onDuplicate: (id: string) => void;
  onCopyToOtherSide: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: string, value: any) => void;
  renderFields: (item: DragDropItem) => React.ReactNode;
  allowRemove?: boolean;
}

const DragDropList = ({ 
  items, 
  onReorder, 
  onDuplicate, 
  onCopyToOtherSide, 
  onRemove, 
  onUpdate,
  renderFields,
  allowRemove = true 
}: Props) => {
  const [draggedItem, setDraggedItem] = React.useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIndex = items.findIndex(item => item.id === draggedItem);
    const targetIndex = items.findIndex(item => item.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newItems = [...items];
    const [draggedElement] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedElement);

    onReorder(newItems);
    setDraggedItem(null);
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card 
          key={item.id}
          className={`transition-all duration-200 ${
            draggedItem === item.id ? 'opacity-50 rotate-2' : 'hover:shadow-md'
          }`}
          draggable
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, item.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
              <Input
                value={item.name}
                onChange={(e) => onUpdate(item.id, 'name', e.target.value)}
                className="font-semibold flex-1"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => onDuplicate(item.id)}
                  size="sm"
                  variant="outline"
                  title="Duplicate"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => onCopyToOtherSide(item.id)}
                  size="sm"
                  variant="outline"
                  title="Copy to other side"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
                {allowRemove && items.length > 1 && (
                  <Button
                    onClick={() => onRemove(item.id)}
                    size="sm"
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            {renderFields(item)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DragDropList;
