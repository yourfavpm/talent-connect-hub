
import { Outlet } from "react-router-dom";
import WebsiteNavbar from "./WebsiteNavbar";
import WebsiteFooter from "./WebsiteFooter";

const WebsiteLayout = () => {
    return (
        <div className="flex flex-col min-h-screen font-sans bg-background text-foreground selection:bg-accent/10">
            <WebsiteNavbar />
            <main className="flex-grow animate-fade-in">
                <Outlet />
            </main>

            <WebsiteFooter />
        </div>
    );
};

export default WebsiteLayout;
