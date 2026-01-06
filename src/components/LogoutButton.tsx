import { ReactElement, createElement } from "react";
import { ActionValue } from "mendix";

interface LogoutButtonProps {
    onLogout: ActionValue;
}

export default function LogoutButton({ onLogout }: LogoutButtonProps): ReactElement {
    const handleLogout = () => {
        if (onLogout && onLogout.canExecute) {
            onLogout.execute();
        }
    };

    return <button onClick={handleLogout}>로그아웃</button>;
}
