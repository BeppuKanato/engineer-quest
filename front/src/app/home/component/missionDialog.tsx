"use client";

import { useState } from "react";
import { Button } from "../../component/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogFooter } from "../../component/ui/dialog";

export interface MissionSentence {
  id: string;
  title: string;
  detail: string;
  sentences: {
    sentence: string;
    speaker: {
      name: string;
      imagePath: string;
    };
  }[];
}

interface MissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  mission: MissionSentence;
  missionTypeLabel?: string;
  missionTypeColor?: string;
  missionTypeIcon?: React.ElementType;
}

export function MissionDialog({
  isOpen,
  onClose,
  onAccept,
  mission,
  missionTypeLabel,
  missionTypeColor,
  missionTypeIcon: MissionTypeIcon,
}: MissionDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLast = currentIndex === mission.sentences.length - 1;

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="bg-white border-b border-gray-200 p-4 flex items-center gap-3 text-base">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden text-xl">
            {mission.sentences[currentIndex].speaker.imagePath}
            </div>
            <span className="font-medium">
            {mission.sentences[currentIndex].speaker.name}
            </span>
        </DialogHeader>

        {/* Message */}
        <div className="p-4 bg-gray-50 flex flex-col gap-4 max-h-96 overflow-y-auto text-base">
            <p className="bg-white p-4 rounded-lg shadow break-words">
                {mission.sentences[currentIndex].sentence}
            </p>

            {/* Mission Info (only on last) */}
            {isLast && (
            <div className="p-4 bg-white border-t border-gray-200 text-base">
            {missionTypeLabel && MissionTypeIcon && (
              <div
                className="flex items-center gap-2 mb-2 text-sm font-medium px-2 py-1 rounded-full w-max"
                style={{ backgroundColor: missionTypeColor }}
              >
                <MissionTypeIcon className="w-5 h-5 text-white" /> 
                <span className="text-white">{missionTypeLabel}</span>
              </div>
            )}
                <h3 className="font-bold mb-2">{mission.title}</h3>
                <p className="text-gray-600 mb-3">{mission.detail}</p>
            </div>
            )}

          {/* Progress Indicator for messages */}
          <div className="flex items-center gap-1 mt-2">
            {mission.sentences.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  idx <= currentIndex ? "bg-blue-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Navigation */}
        <DialogFooter className="p-4 border-t border-gray-200 flex justify-end gap-2">
          {!isLast ? (
            <Button
              onClick={() => setCurrentIndex(currentIndex + 1)}
            >
                次へ
            </Button>
          ):
            <Button onClick={onAccept}>
                受注する
            </Button>
          }
          <Button 
            text="閉じる" variant="outline" onClick={() => {
              onClose()
              setCurrentIndex(0)
            }} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
