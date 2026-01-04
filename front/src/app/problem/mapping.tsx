import { Web_Mission_2 } from "./component/missions/Web/Web_Mission_2";
import { Web_Mission_3 } from "./component/missions/Web/Web_Mission_3";
import { Web_Mission_3_Exam } from "./component/missions/Web/Web_Mission_3_exam";
import { Web_Mission_4 } from "./component/missions/Web/Web_Missoin_4";
import { Web_Mission_1 } from "./component/missions/Web/Web_Misson_1";
import { Web_Mission_4_Exam } from "./component/missions/Web/Web_Mission_4_exam";
import { Web_Mission_5 } from "./component/missions/Web/Web_Mission_5";
import { Web_Mission_5_Exam } from "./component/missions/Web/Web_Mission_5_exam";
import { Web_Mission_6 } from "./component/missions/Web/Web_Mission_6";
import { Web_Mission_6_Exam } from "./component/missions/Web/Web_Mission_6_exam";
import { Web_Mission_7 } from "./component/missions/Web/Web_Mission_7";
import { Java_Mission_1 } from "./component/missions/Java/Java_Mission_1";
import { Java_Mission_2 } from "./component/missions/Java/Java_Mission_2";
import { Java_Mission_3 } from "./component/missions/Java/Java_Mission_3";
import { Java_Mission_4 } from "./component/missions/Java/Java_Mission_4";
import { Java_Mission_5 } from "./component/missions/Java/Java_Mission_5";
import { Java_Mission_6 } from "./component/missions/Java/Java_Mission_6";
import { Java_Mission_7 } from "./component/missions/Java/Java_Mission_7";
export const getMissionComponent = (componentName: string, highlight: string, componentType: string) => {
    console.log("getMissionComponent called with:", componentName, highlight, componentType);
    switch (componentName) {
        case "Java_Mission_1":
            return (
                <Java_Mission_1 />
            );
        case "Java_Mission_2":
            return(
                <Java_Mission_2
                    highlight={highlight}
                    componentType={componentType}
                />
            )
        case "Java_Mission_3":
            return(
                <Java_Mission_3 
                />
            )
        case "Java_Mission_4":
            return(
                <Java_Mission_4
                />
            )
        case "Java_Mission_5":
            return(
                <Java_Mission_5
                    highlight={highlight}
                    componentType={componentType}
                />
            )
        case "Java_Mission_6":
            return(
                <Java_Mission_6
                    highlight={highlight}
                    componentType={componentType}
                />
            )
        case "Java_Mission_7":
            return(
                <Java_Mission_7
                    highlight={highlight}
                    componentType={componentType}
                />
            )
        case "Web_Mission_1":
            return (
                <Web_Mission_1 
                    highlight={highlight}
                    componentType={componentType}
                />
            );
        case "Web_Mission_2":
            return(
                <Web_Mission_2
                    highlight={highlight}
                    componentType={componentType}
                />
            )
        case "Web_Mission_3":
            return(
                <Web_Mission_3
                    highlight={highlight}
                    componentType={componentType}
                />
            )
        case "Web_Mission_3_Exam":
            return(
                <Web_Mission_3_Exam 
                />
            )
        case "Web_Mission_4":
            return(
                <Web_Mission_4
                    highlight={highlight}
                    componentType={componentType}
                />
            )
        case "Web_Mission_4_Exam":
            return(
                <Web_Mission_4_Exam
                />
            )
        case "Web_Mission_5":
            return(
                <Web_Mission_5
                    highlight={highlight}
                    componentType={componentType}
                />
            )
        case "Web_Mission_5_Exam":
            return(
                <Web_Mission_5_Exam 
                />
            )
        case "Web_Mission_6":
            return(
                <Web_Mission_6 
                    highlight={highlight}
                    componentType={componentType}
                />
            )
        case "Web_Mission_6_Exam":
            return(
                <Web_Mission_6_Exam
                />
            )
        case "Web_Mission_7":
            return(
                <Web_Mission_7 
                />
            )
        default:
            return null;
    }
}