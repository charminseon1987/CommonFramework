import { ValueStatus } from "mendix";
import { useEffect, useState } from "react";
import getMxAttributes from "src/components/utils/mxHelper";
import { UserData, UserProps } from "src/types/user.types";

export default function useUserData(props: UserProps): UserData[] | null {
    const { currentUser } = props;
    const [userData, setUserData] = useState<UserData[] | null>(null);

    console.log("currentUser", currentUser);

    useEffect(() => {
        if (currentUser?.status !== ValueStatus.Available) return;

        const users: UserData[] =
            currentUser.items?.map(u => {
                const data = getMxAttributes(u);

                return {
                    userId: String(data.UserId?.value ?? ""),
                    nickName: String(data.NickName?.value ?? ""),
                    firstName: String(data.FirstName?.value ?? ""),
                    lastName: String(data.LastName?.value ?? ""),
                    language: String(data.Language?.value ?? "")
                };
            }) ?? [];

        setUserData(users);
    }, [currentUser?.status]);

    return userData;
}
