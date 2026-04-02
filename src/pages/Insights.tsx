import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";

const Insights = () => {
    // Mock blog posts
    const Posts = [
        { title: "The End of the Generalist PM", category: "Trends", date: "Jan 12, 2026" },
        { title: "Why your Chief of Staff should be technical", category: "Hiring", date: "Jan 05, 2026" },
        { title: "Structuring Equity for Fractional Leaders", category: "Compensation", date: "Dec 28, 2025" },
        { title: "The 48-Hour Onboarding Sprint", category: "Operations", date: "Dec 15, 2025" },
    ];

    return (
        <div className="bg-background min-h-screen text-foreground pb-20">
            <SEO 
                title="Insights & Signals | African Operations Leadership Trends"
                description="Observations and deep dives into modern company building, specialized product leadership, and the shifting landscape of African operations talent."
                keywords="Operations Insights, Product Leadership Trends, African Talent Market, Remote Operations Strategy, Company Building Signals"
            />
            <section className="pt-40 pb-20 px-6 bg-slate-50 border-b border-slate-200">
                <div className="container max-w-6xl mx-auto">
                    <h1 className="text-5xl md:text-7xl font-bold font-display mb-8 text-primary">Signals</h1>
                    <p className="text-xl text-slate-600 font-serif max-w-2xl">
                        Observations from the front lines of modern company building.
                    </p>
                </div>
            </section>

            <section className="px-6 py-20">
                <div className="container max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-8">
                        {Posts.map((post, i) => (
                            <Card key={i} className="bg-white border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer group rounded-2xl overflow-hidden shadow-sm">
                                <CardHeader>
                                    <div className="flex justify-between items-center mb-4">
                                        <Badge variant="outline" className="border-slate-300 text-slate-500">{post.category}</Badge>
                                        <span className="text-xs text-slate-400 font-mono">{post.date}</span>
                                    </div>
                                    <CardTitle className="text-2xl font-bold text-primary group-hover:text-blue-600 transition-colors leading-tight">
                                        {post.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-600 leading-relaxed">
                                        A deep dive into why the market is shifting towards specialized product leadership...
                                    </p>
                                    <div className="mt-6 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                        Read Article &rarr;
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};
export default Insights;
