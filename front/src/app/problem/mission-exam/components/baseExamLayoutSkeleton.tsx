"use client";

import React from "react";
import { Card, CardContent, CardHeader, Skeleton } from "@mui/material";

export const BaseExamLayoutSkeleton = () => (
  <div className="container mx-auto p-6 flex flex-col gap-6 max-w-7xl">
    {/* タイトル */}
    <Skeleton variant="rectangular" width="60%" height={40} className="mx-auto mb-4" />

    <div className="flex flex-col md:flex-row gap-6">
      {/* 出題内容枠 */}
      <Card className="flex-1 p-6 shadow-md border border-gray-200 rounded-lg">
        <CardHeader title={<Skeleton variant="rectangular" width="40%" height={30} />} />
        <CardContent className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" width="100%" height={20} />
          ))}
        </CardContent>
      </Card>

      {/* コードエディタ枠 */}
      <Card className="flex-1 p-4 shadow-md border border-gray-200 rounded-lg">
        <CardHeader title={<Skeleton variant="rectangular" width="40%" height={30} />} />
        <CardContent className="space-y-2">
          <Skeleton variant="rectangular" width="100%" height={400} />
          <div className="flex justify-between mt-4 gap-2">
            <Skeleton variant="rectangular" width="48%" height={36} />
            <Skeleton variant="rectangular" width="48%" height={36} />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);
