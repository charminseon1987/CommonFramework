import { ReactElement, createElement } from "react";
import { UserData } from "src/types/user.types";
import LogoutButton from "./LogoutButton";
import { ActionValue } from "mendix";

interface UserInformationProps {
    user?: UserData;
    onLogout: ActionValue;
}

export function UserInformation({ user, onLogout }: UserInformationProps): ReactElement | null {
    if (!user) return null;

    return (
        <div className="nav-header">
            <div>{user.nickName}</div>
            <div>{user.language}</div>
            <LogoutButton onLogout={onLogout} />
        </div>
    );
}
