export interface HomePageData {
    title: string;
    description: string;
    items: HomePageItem[];
}

export interface HomePageItem {
    id: string;
    name: string;
    link: string;
    icon?: string;
}

export type MessageFromWebview = {
    command: string;
    data?: any;
};

export type MessageToWebview = {
    command: string;
    payload?: any;
};