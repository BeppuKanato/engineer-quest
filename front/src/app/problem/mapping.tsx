import { Mission_2 } from "./component/missions/mission_2";
import { Mission_3 } from "./component/missions/mission_3";
import { Mission_3_Exam } from "./component/missions/mission_3_exam";
import { Mission_4 } from "./component/missions/missoin_4";
import { Mission_1 } from "./component/missions/misson_1";
import { Mission_4_Exam } from "./component/missions/mission_4_exam";
import { Mission_5 } from "./component/missions/mission_5";
import { Mission_5_Exam } from "./component/missions/mission_5_exam";
import { Mission_6 } from "./component/missions/mission_6";
import { Mission_6_Exam } from "./component/missions/mission_6_exam";
import { Mission_7 } from "./component/missions/mission_7";
export const getMissionComponent = (componentName: string, highlight: string, componentType: string) => {
    switch (componentName) {
        case "Mission_1":
            return (
                <Mission_1 
                    highlight={highlight}
                    componentType={componentType}
                />
            );
        case "Mission_2":
            return(
                <Mission_2
                    highlight={highlight}
                    componentType={componentType}
                />
            )
        case "Mission_3":
            return(
                <Mission_3
                    highlight={highlight}
                    componentType={componentType}
                />
            )
        case "Mission_3_Exam":
            return(
                <Mission_3_Exam 
                />
            )
        case "Mission_4":
            return(
                <Mission_4
                    highlight={highlight}
                    componentType={componentType}
                />
            )
        case "Mission_4_Exam":
            return(
                <Mission_4_Exam
                />
            )
        case "Mission_5":
            return(
                <Mission_5
                    highlight={highlight}
                    componentType={componentType}
                />
            )
        case "Mission_5_Exam":
            return(
                <Mission_5_Exam 
                />
            )
        case "Mission_6":
            return(
                <Mission_6 
                    highlight={highlight}
                    componentType={componentType}
                />
            )
        case "Mission_6_Exam":
            return(
                <Mission_6_Exam
                />
            )
        case "Mission_7":
            return(
                <Mission_7 
                />
            )
        default:
            return null;
    }
}