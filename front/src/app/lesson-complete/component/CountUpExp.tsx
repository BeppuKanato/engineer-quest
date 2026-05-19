    "use client";

    import React, { RefObject, useEffect, useRef, useState } from "react";
    import { Box, Typography, keyframes } from "@mui/material";
    import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

    const cardPop = keyframes`
    0% {
        transform: scale(0.96);
        opacity: 0;
    }
    70% {
        transform: scale(1.025);
        opacity: 1;
    }
    100% {
        transform: scale(1);
    }
    `;

    const numberBounce = keyframes`
    0% {
    transform: scale(1);
    }
    45% {
    transform: scale(1.18);
    }
    100% {
    transform: scale(1);
    }
    `;

const shine = keyframes`
    0% {
        transform: translateX(-130%);
        opacity: 0;
    }
    25% {
        opacity: 0.55;
    }
    100% {
     transform: translateX(150%);
     opacity: 0;
    }
`;

type CountUpExpProps = {
    exp: number;
    expRef?: RefObject<HTMLDivElement | null>;
    duration?: number;
    delay?: number;
    onCountComplete?: () => void;
};

export const CountUpExp: React.FC<CountUpExpProps> = ({
    exp,
    expRef,
    duration = 1100,
    delay = 450,
    onCountComplete,
}) => {
    const [count, setCount] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const completedCalledRef = useRef(false);
    const onCountCompleteRef = useRef(onCountComplete);

    useEffect(() => {
        onCountCompleteRef.current = onCountComplete;
    }, [onCountComplete]);

    useEffect(() => {
        let animationFrameId: number;
        const startDelayId = window.setTimeout(() => {
            const startTime = performance.now();

            const animate = (currentTime: number) => {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / duration, 1);

                // 最初は速く、最後はゆっくり止まる
                const easedProgress = 1 - Math.pow(1 - progress, 3);

                const nextCount = Math.round(exp * easedProgress);
                setCount(nextCount);

                if (progress < 1) {
                    animationFrameId = requestAnimationFrame(animate);
                    return;
                }

                setCount(exp);
                setIsCompleted(true);

                if (!completedCalledRef.current) {
                    completedCalledRef.current = true;
                    onCountComplete?.();
                }
            };

        animationFrameId = requestAnimationFrame(animate);
        }, delay);

        return () => {
        window.clearTimeout(startDelayId);
            cancelAnimationFrame(animationFrameId);
        };
    }, [exp, duration, delay, onCountComplete]);

    return (
    <Box
        ref={expRef}
        sx={{
            position: "relative",
            overflow: "hidden",
            mt: 4,
            px: { xs: 3, md: 5 },
            py: { xs: 3, md: 4 },
            borderRadius: 4,
            color: "#fff",
            textAlign: "center",
            background:
                "linear-gradient(135deg, #1976D2 0%, #21B6E8 55%, #5B6CFF 100%)",
            boxShadow: "0 18px 40px rgba(25, 118, 210, 0.25)",
            animation: `${cardPop} 600ms ease-out`,
            "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                width: "38%",
                height: "100%",
                background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.48), transparent)",
                animation: `${shine} 2.2s ease-in-out 0.45s`,
            },
        }}
    >
        <AutoAwesomeIcon
            sx={{
                position: "absolute",
                top: 20,
                right: 24,
                color: "#FFF59D",
                opacity: 0.95,
            }}
        />

        <AutoAwesomeIcon
            sx={{
                position: "absolute",
                bottom: 22,
                left: 28,
                fontSize: 18,
                color: "#FFF59D",
                opacity: 0.85,
            }}
        />

        <Typography
            sx={{
                position: "relative",
                zIndex: 1,
                fontWeight: 900,
                opacity: 0.95,
            }}
        >
            獲得EXP
        </Typography>

        <Typography
            sx={{
                position: "relative",
                zIndex: 1,
                mt: 1,
                fontSize: { xs: 56, md: 72 },
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: "-0.04em",
                animation: isCompleted
                ? `${numberBounce} 420ms ease-out`
                : "none",
                transformOrigin: "center",
            }}
        >
            +{count}
        </Typography>

        <Typography
            sx={{
                position: "relative",
                zIndex: 1,
                mt: 1,
                fontWeight: 900,
                letterSpacing: "0.08em",
                opacity: 0.92,
            }}
        >
            EXP
        </Typography>
    </Box>
    );
}