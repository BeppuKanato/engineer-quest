import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { Chip } from "@mui/material";
import React from "react";
import { Status } from "../courses/type";

type StatusChipProps = {
    status: Status;
    size?: "small" | "medium";
}

const STATUS_CONFIG: Record<Status, {label: string, icon: React.ReactElement, sx: {bgcolor: string, color: string}}> = {
    not_started: {
        label: "未着手",
        icon: <RadioButtonUncheckedIcon />,
        sx: {
            bgcolor: "#f1f5f9",
            color: "#475569"
        },
    },
    in_progress: {
        label: "進行中",
        icon: <PlayCircleIcon />,
        sx: {
            bgcolor: "#fff7ed",
            color: "#f97316",
        },
    },
    completed: {
        label: "クリア済み",
        icon: <CheckCircleIcon />,
        sx: {
            bgcolor: "#dcfce7",
            color: "#16a34a",
        },
    },
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, size = "small" }) => {
    const config = STATUS_CONFIG[status];

    return (
        <Chip
            icon={config.icon}
            label={config.label}
            size={size}
            sx={{
                width: "fit-content",
                fontWeight: 700,
                "& .MuiChip-icon": {
                    color: "inherit",
                },
                ...config.sx,
            }} 
        />
    );
};