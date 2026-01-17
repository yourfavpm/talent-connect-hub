
const About = () => {
    return (
        <div className="bg-background min-h-screen text-foreground selection:bg-primary selection:text-white pb-20">
            <section className="pt-48 pb-32 px-6 text-center bg-slate-50">
                <div className="container max-w-4xl mx-auto">
                    <h1 className="text-6xl md:text-9xl font-bold font-display mb-12 opacity-10 text-primary uppercase tracking-widest">Manifesto</h1>
                    <p className="text-2xl md:text-3xl text-primary font-serif leading-relaxed font-medium">
                        "We believe that the best work is done by small, elite teams of high-agency individuals."
                    </p>
                </div>
            </section>

            <section className="px-6 py-20 border-t border-slate-200">
                <div className="container max-w-3xl mx-auto prose prose-xl prose-slate">
                    <p className="text-slate-600 leading-loose">
                        The recruiting industry is incentivized to send you noise. Headhunters spray and pray. Job boards are algorithmic slot machines.
                    </p>
                    <p className="text-slate-600 leading-loose">
                        We built Taskive because we were tired of hiring being a lottery. We wanted a system that rewarded craft, track record, and cultural fit.
                    </p>
                    <div className="my-16 pl-8 border-l-4 border-primary">
                        <h3 className="text-2xl font-bold text-primary mb-2 mt-0">Our Promise</h3>
                        <p className="text-slate-500 italic text-xl">We will never send you a candidate we wouldn't hire ourselves with our own money.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};
export default About;
