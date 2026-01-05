import { ListValue } from "mendix";

export interface UserProps {
    currentUser?: ListValue;
}

export interface UserData {
    userId: string;
    nickName: string;
    firstName: string;
    lastName: string;
    language?: string;
}
