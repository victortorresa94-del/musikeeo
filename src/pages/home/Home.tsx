import { Navbar } from '../../components/home/Navbar';
import { Hero } from '../../components/home/Hero';
import { HowItWorks } from '../../components/home/HowItWorks';
import { FeaturedArtists } from '../../components/home/FeaturedArtists';
import { RodrigoBanner } from '../../components/home/RodrigoBanner';
import { Footer } from '../../components/layout/Footer';

const Home = () => {
    return (
        <div className="min-h-screen bg-background text-white selection:bg-brand-yellow selection:text-brand-black">
            <Navbar />
            <main>
                <Hero />
                <HowItWorks />
                <FeaturedArtists />
                <RodrigoBanner />
            </main>
            <Footer />
        </div>
    );
};

export default Home;
