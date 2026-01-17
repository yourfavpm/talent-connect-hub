
import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram, Mail, MapPin } from "lucide-react";

const WebsiteFooter = () => {
    return (
        <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-12">
            <div className="container px-6 mx-auto">
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-8 mb-12">

                    {/* Services */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-primary">Services</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><Link to="/service-models" className="hover:text-blue-600 transition-colors">Executive Search</Link></li>
                            <li><Link to="/service-models" className="hover:text-blue-600 transition-colors">Full-Time Hire</Link></li>
                            <li><Link to="/service-models" className="hover:text-blue-600 transition-colors">Trial-to-Hire</Link></li>
                            <li><Link to="/service-models" className="hover:text-blue-600 transition-colors">Managed Teams</Link></li>
                            <li><Link to="/service-models" className="hover:text-blue-600 transition-colors">Project Staffing</Link></li>
                        </ul>
                    </div>

                    {/* Products (Portals) */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-primary">Products</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><Link to="/auth/login" className="hover:text-blue-600 transition-colors">Client Platform</Link></li>
                            <li><Link to="/auth/login" className="hover:text-blue-600 transition-colors">Talent Dashboard</Link></li>
                            <li><Link to="/for-companies" className="hover:text-blue-600 transition-colors">Vetting Engine</Link></li>
                            <li><Link to="/for-professionals" className="hover:text-blue-600 transition-colors">Payroll & Compliance</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-primary">Company</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><Link to="/about" className="hover:text-blue-600 transition-colors">About Us</Link></li>
                            <li><Link to="/careers" className="hover:text-blue-600 transition-colors">Internal Careers</Link></li>
                            <li><Link to="/contact" className="hover:text-blue-600 transition-colors">Contact</Link></li>
                            <li><Link to="/partners" className="hover:text-blue-600 transition-colors">Partners</Link></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-primary">Resources</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><Link to="/insights" className="hover:text-blue-600 transition-colors">Blog & Insights</Link></li>
                            <li><Link to="/salary-guide" className="hover:text-blue-600 transition-colors">Salary Guide</Link></li>
                            <li><Link to="/case-studies" className="hover:text-blue-600 transition-colors">Case Studies</Link></li>
                            <li><Link to="/community" className="hover:text-blue-600 transition-colors">Community</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-primary">Legal</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><Link to="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link></li>
                            <li><Link to="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/cookies" className="hover:text-blue-600 transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>

                    {/* Contact / Social */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-primary">Contact</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-blue-600" /> hello@taskive.com</li>
                            <li className="flex items-start gap-2"><MapPin className="h-4 w-4 text-blue-600 mt-0.5" /> 123 Business Park<br />NY, NY 10001</li>
                        </ul>
                        <div className="flex gap-4 pt-2">
                            <a href="#" className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-blue-600 hover:text-white transition-all"><Twitter className="h-4 w-4" /></a>
                            <a href="#" className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-blue-600 hover:text-white transition-all"><Linkedin className="h-4 w-4" /></a>
                            <a href="#" className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-blue-600 hover:text-white transition-all"><Instagram className="h-4 w-4" /></a>
                        </div>
                    </div>

                </div>

                <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-slate-500">© {new Date().getFullYear()} Taskive HR Solutions. All rights reserved.</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-semibold text-slate-500">Systems Operational</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default WebsiteFooter;
