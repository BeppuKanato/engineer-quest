"use client"

import { Box, Button, Card, CardContent, CardHeader, FormControl, FormControlLabel, Grow, LinearProgress, Switch, Typography } from "@mui/material";
import { AppHeader } from "../component/appHeader";
import { MissionCard } from "../component/missionCard";
import { useEffect, useState } from "react";
import { LocalizationProvider } from '@mui/x-date-pickers-pro/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers-pro/AdapterDayjs';
import { DateRangeCalendar } from '@mui/x-date-pickers-pro/DateRangeCalendar';
import { MonthlyCalender } from "../component/monthlyCalender";

const userData = {
    "rank": "Bronze",
    "level": 1,
    "requireNextLevelExp": 100,
    "exp": 10,
    "completedMissionNun": 10,
    "completedCourseNum": 3,
}

const continueMission =  {
    "id": "testContinueMission",
    "title": "test continue",
    "difficulty": 1,
    "goalImg": "/images/goals/sample.png",
}

const recommnetMission = {
    "id": "testContinueMission",
    "title": "test recommend",
    "difficulty": 1,
    "goalImg": "/images/goals/sample.png",
}

let useMission: {
    id: string,
    title: string,
    difficulty: number,
    goalImg: string
} = recommnetMission

export default function HomePage() {
    const [checked, setChecked] = useState(true)

    const handleMisisonCard = () => {
        useMission=continueMission
        setChecked(false)
    }
    useEffect(() => {
        setChecked(true)
    }, [checked])

    return (
        <div>
            <AppHeader />
            <Card>
                <CardHeader
                    title="ユーザデータ"
                />
                <CardContent>
                    <Typography>
                        ランク: {userData.rank}
                        レベル: {userData.level}
                        完了ミッション数: {userData.completedMissionNun}
                        完了コース数: {userData.completedCourseNum}
                    </Typography>
                    <LinearProgress
                        variant="buffer"
                        value={userData.level}
                        valueBuffer={userData.requireNextLevelExp}
                        aria-label="exp..."
                    />
                </CardContent>
            </Card>
            <Box sx={{ display: 'flex'}}>
                <FormControlLabel
                    control={<Button onClick={handleMisisonCard}/>}
                    label="Show"
                />
                <Grow 
                    in={checked}
                    style={{ transformOrigin: '0 0 0'}}
                    {...(checked ? {timeout: 1000}: {})}
                >
                    <Box>
                        <MissionCard
                            title={recommnetMission.title}
                            difficulty={recommnetMission.difficulty}
                            goalImg={recommnetMission.goalImg} 
                        />
                    </Box>
                </Grow>
                <MonthlyCalender
                    year={2026}
                    month={4}
                    date={21}
                />
            </Box>            
        </div>
    )
}