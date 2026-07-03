"use client"

import {
    AppBar,
    Avatar,
    Badge,
    Box,
    Container,
    IconButton,
    Toolbar,
    Tooltip,
    Typography,
} from "@mui/material"
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ArticleIcon from '@mui/icons-material/Article';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import CreateRoundedIcon from '@mui/icons-material/CreateRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

const pages = [
    { label: 'ホーム', href: '/home', icon: HomeRoundedIcon, match: ['/home'] },
    { label: 'コース', href: '/courses', icon: MenuBookRoundedIcon, match: ['/courses', '/mission'] },
    { label: '作る', href: '/create', icon: CreateRoundedIcon, match: ['/create', '/my-works'] },
    { label: '掲示板', href: '/quest-board', icon: SchoolRoundedIcon, match: ['/quest-board'] },
    { label: '履歴', href: '/history', icon: ArticleIcon, match: ['/history'] },
    {
        label: 'コレクション',
        href: '/collection',
        icon: CollectionsBookmarkIcon,
        match: ['/collection', '/badges', '/achievements', '/mission-rewards'],
    },
    { label: 'プロフィール', href: '/profile', icon: AccountCircleIcon, match: ['/profile'] },
];

export const AppHeader: React.FC = () => {
    const pathname = usePathname();

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                top: 0,
                zIndex: (theme) => theme.zIndex.drawer + 1,
                background: "linear-gradient(90deg, #0047c7 0%, #0053df 48%, #0041b8 100%)",
                borderBottom: "1px solid rgba(255,255,255,0.18)",
                boxShadow: "0 10px 28px rgba(0, 47, 140, 0.18)",
            }}
        >
            <Container maxWidth={false} sx={{ px: { xs: 2, md: 4 } }}>
                <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 78 }, gap: { xs: 1.5, md: 3 } }}>
                    <Box
                        component={Link}
                        href="/home"
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.25,
                            minWidth: { xs: "auto", lg: 292 },
                            color: "inherit",
                            textDecoration: "none",
                        }}
                    >
                        <Box
                            component="img"
                            src="/fit-logo.png"
                            alt="FIT"
                            sx={{ width: { xs: 40, md: 50 }, height: { xs: 40, md: 50 }, objectFit: "contain" }}
                        />
                        <Box sx={{ display: { xs: "none", sm: "block" }, lineHeight: 1 }}>
                            <Typography
                                component="div"
                                sx={{
                                    fontSize: { sm: 24, md: 30 },
                                    fontWeight: 900,
                                    fontStyle: "italic",
                                    letterSpacing: 0,
                                    lineHeight: 1,
                                }}
                            >
                                FIT
                            </Typography>
                            <Typography
                                component="div"
                                sx={{ mt: 0.4, fontSize: { sm: 13, md: 16 }, fontWeight: 700, letterSpacing: 0 }}
                            >
                                Engineer Quest
                            </Typography>
                        </Box>
                    </Box>

                    <Box
                        component="nav"
                        aria-label="Primary navigation"
                        sx={{
                            flex: 1,
                            display: "flex",
                            justifyContent: "center",
                            gap: { xs: 0.5, md: 1.5, lg: 2 },
                            minWidth: 0,
                            overflowX: { xs: "auto", lg: "visible" },
                            scrollbarWidth: "none",
                            "&::-webkit-scrollbar": { display: "none" },
                        }}
                    >
                        {pages.map((page) => {
                            const Icon = page.icon;
                            const active = page.match.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

                            return (
                                <Box
                                    key={page.label}
                                    component={Link}
                                    href={page.href}
                                    aria-current={active ? "page" : undefined}
                                    sx={{
                                        position: "relative",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 0.8,
                                        minWidth: "fit-content",
                                        px: { xs: 1.1, md: 1.4 },
                                        py: 1.2,
                                        color: "white",
                                        borderRadius: 2,
                                        fontSize: { xs: 13, md: 16 },
                                        fontWeight: 800,
                                        letterSpacing: 0,
                                        textDecoration: "none",
                                        opacity: active ? 1 : 0.88,
                                        transition: "background-color 160ms ease, opacity 160ms ease",
                                        "&:hover": {
                                            backgroundColor: "rgba(255,255,255,0.12)",
                                            opacity: 1,
                                        },
                                        "&::after": active
                                            ? {
                                                content: '""',
                                                position: "absolute",
                                                left: 10,
                                                right: 10,
                                                bottom: -10,
                                                height: 4,
                                                borderRadius: 999,
                                                backgroundColor: "white",
                                            }
                                            : undefined,
                                    }}
                                >
                                    <Icon sx={{ fontSize: { xs: 20, md: 25 } }} />
                                    <Box component="span" sx={{ display: { xs: "none", md: "inline" }, whiteSpace: "nowrap" }}>
                                        {page.label}
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 1.5 }, flexShrink: 0 }}>
                        <Tooltip title="通知">
                            <IconButton component={Link} href="/history" aria-label="通知" sx={{ color: "white" }}>
                                <Badge color="error" variant="dot" overlap="circular">
                                    <NotificationsRoundedIcon sx={{ fontSize: { xs: 24, md: 28 } }} />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="プロフィール">
                            <IconButton
                                component={Link}
                                href="/profile"
                                aria-label="プロフィール"
                                sx={{
                                    p: 0.35,
                                    border: "2px solid rgba(255,255,255,0.9)",
                                    backgroundColor: "rgba(255,255,255,0.14)",
                                    "&:hover": { backgroundColor: "rgba(255,255,255,0.24)" },
                                }}
                            >
                                <Avatar
                                    alt="ユーザーアイコン"
                                    src="/images/mascots/red-panda/normal.png"
                                    sx={{ width: { xs: 38, md: 48 }, height: { xs: 38, md: 48 } }}
                                />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    )
}
