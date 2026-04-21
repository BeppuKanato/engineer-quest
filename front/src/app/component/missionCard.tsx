import { Button, Card, CardContent, CardHeader, CardMedia } from "@mui/material";

type MissionCardProps = {
    title: string;
    difficulty: number;
    goalImg: string;
}

export const MissionCard: React.FC<MissionCardProps> = ({
    title, difficulty, goalImg
}) => {
    return(
        <Card sx={{ maxWidth: 345}}>
            <CardHeader
                title={title}
                subheader={difficulty}
            />
            <CardMedia
                component="img"
                height="194"
                image={goalImg}
                alt="Goal Image"
            />
            <CardContent>
                <Button
                    variant="contained"
                >
                    ミッション開始
                </Button>
            </CardContent>
        </Card>
    )
}