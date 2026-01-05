import { ReactElement, createElement } from "react";
import { UserData } from "src/types/user.types";

interface UserInformationProps {
    user?: UserData;
}

export function UserInformation({ user }: UserInformationProps): ReactElement | null {
    if (!user) return null;

    return (
    
    <div className="widget-hello-world">Hello {user.nickName}</div>
    

)
    
}
