import { Outlet } from "react-router-dom";
import AcademyNavbar from "./AcademyNavbar";
import AcademyFooter from "./AcademyFooter";
import ScrollToTop from "@/components/ScrollToTop";

const AcademyLayout = () => {
    return (
        <div className="flex flex-col min-h-screen font-inter bg-background text-foreground selection:bg-blue-600/10">
            <ScrollToTop />
            <AcademyNavbar />
            <main className="flex-grow pt-[72px] animate-fade-in">
                <Outlet />
            </main>
            <AcademyFooter />
        </div>
    );
};

export default AcademyLayout;
