"use client"

import { AppBar, Container, Box, Toolbar, Typography, IconButton, Menu, MenuItem, Button, Tooltip, Avatar } from "@mui/material"
import AdbIcon from '@mui/icons-material/Adb';
import * as React from 'react';

const pages = ['Home', 'Courses', 'Achievements', 'Profile'];
const settings = ['Test1', 'Test2', 'Test3'];

export const AppHeader: React.FC = () => {
    const [anchorELlUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
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
                        {pages.map((page) => (
                            <Button
                                key={page}
                                sx={{ my: 2, color: 'white', display: 'block' }}
                            >
                                {page}
                            </Button>
                        ))}
                    </Box>
                    <Box sx={{ flexGrow: 0}} >
                        <Tooltip title="Open Settings">
                            <IconButton onClick={() => alert("click user icon")} sx={{ p: 0}}>
                                <Avatar alt="Remy Sharp" src="temp_user_icon.png" />
                            </IconButton>
                        </Tooltip>
                        <Menu
                            sx={{ mt: '45px'}}
                            id="menu-appbar"
                            anchorEl={anchorELlUser}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right'
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right'
                            }}
                            open={Boolean(anchorELlUser)}
                            onClose={() => setAnchorElUser(null)}
                        >
                            {settings.map((setting) => (
                                <MenuItem key={setting} onClick={() => setAnchorElUser(null)}>
                                    <Typography textAlign="center">{setting}</Typography>
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>
            </Toolbar>
        </Container>
    </AppBar>)
}