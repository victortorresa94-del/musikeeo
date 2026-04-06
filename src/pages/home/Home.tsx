import { Navbar } from '../../components/home/Navbar';
import { Hero } from '../../components/home/Hero';
import { Footer } from '../../components/layout/Footer';

const Home = () => {
    return (
        <div className="min-h-screen bg-background text-white selection:bg-brand-yellow selection:text-brand-black">
            <Navbar />
            <main>
                <Hero />
            </main>
            <Footer />
        </div>
    );
};

export default Home;
