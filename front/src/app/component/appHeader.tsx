"use client"

import { AppBar, Container, Box, Toolbar, Typography, IconButton, Button, Tooltip, Avatar } from "@mui/material"
import AdbIcon from '@mui/icons-material/Adb';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import Link from 'next/link';
import * as React from 'react';
import { useSoundEffect } from './soundFeedback';

const pages = [
    { label: 'Home', href: '/home' },
    { label: 'Courses', href: '/courses' },
    { label: 'Board', href: '/quest-board' },
    { label: 'Create', href: '/create-missions' },
    { label: 'My Works', href: '/my-works' },
    { label: 'History', href: '/history' },
    { label: 'Collection', href: '/collection' },
    { label: 'Achievements', href: '/achievements' },
    { label: 'Badges', href: '/badges' },
    { label: 'Profile', href: '/profile' },
];
export const AppHeader: React.FC = () => {
    const { enabled, setEnabled } = useSoundEffect();
    const handleSoundToggle = () => {
        const nextEnabled = !enabled;
        setEnabled(nextEnabled);
        if (nextEnabled) {
            const audio = new Audio("/audio/SE/button-click.mp3");
            audio.volume = 0.38;
            audio.play().catch(() => undefined);
        }
    };

    return (
    <AppBar position="static">
        <Container maxWidth="xl">
            <Toolbar disableGutters>
                <AdbIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
                    <Typography
                        variant="h6"
                        noWrap
                        component="a"
                        href="#app-bar-with-responsive-menu"
                        sx={{
                            mr: 2,
                            display: { xs: 'none', md: 'flex' },
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '.3rm',
                            color: 'inherit',
                            textDecoration: 'none',
                        }}
                    >
                        FIT
                    </Typography>
                    <AdbIcon sx={{ display: { xs: 'flex', md: 'none'}, mr: 1}} />
                    <Typography
                        variant="h5"
                        noWrap
                        component="a"
                        href="#app-bar-with-responsive-menu"
                        sx={{
                            mr: 2,
                            display: { xs: 'flex', md: 'none'},
                            flexGrow: 1,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '.3rm',
                            color: 'inherit',
                            textDecoration: 'none',
                        }}
                    >
                        FIT
                    </Typography>
                    <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex'} }}>
                        {pages.map((page) => page.href ? (
                            <Button
                                key={page.label}
                                component={Link}
                                href={page.href}
                                sx={{ my: 2, color: 'white', display: 'block' }}
                            >
                                {page.label}
                            </Button>
                        ) : (
                            <Button
                                key={page.label}
                                sx={{ my: 2, color: 'white', display: 'block' }}
                            >
                                {page.label}
                            </Button>
                        ))}
                    </Box>
                    <Box sx={{ flexGrow: 0}} >
                        <Tooltip title={enabled ? "Sound on" : "Sound off"}>
                            <IconButton
                                onClick={handleSoundToggle}
                                sx={{ mr: 1, color: "white" }}
                            >
                                {enabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Profile">
                            <IconButton component={Link} href="/profile" sx={{ p: 0}}>
                                <Avatar alt="Remy Sharp" src="temp_user_icon.png" />
                            </IconButton>
                        </Tooltip>
                    </Box>
            </Toolbar>
        </Container>
    </AppBar>)
}
