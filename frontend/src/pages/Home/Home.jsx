import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Battery, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-badge glass-panel"
          >
            <Zap size={16} className="text-gradient" />
            <span>The Future of EV Charging is Here</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="hero-title"
          >
            Make EV Charging <span className="text-gradient">Effortless.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-subtitle"
          >
            Discover, navigate, and access reliable EV charging stations near you. 
            No more range anxiety—just plug in and power up.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hero-actions"
          >
            <button className="btn-primary" onClick={() => navigate('/stations')}>
              Find Nearest Station <ArrowRight size={20} />
            </button>
            <button className="btn-secondary" onClick={() => navigate('/auth?mode=register')}>
              Create Account
            </button>
          </motion.div>
        </div>

        {/* Floating elements representing EV stations */}
        <div className="hero-visuals">
          <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="floating-card c-1 glass-panel"
          >
            <div className="fc-icon bg-green"><Battery size={24} color="#0f172a" /></div>
            <div>
              <h4>Supercharger V3</h4>
              <p>Available • 2.4 km</p>
            </div>
          </motion.div>
          
          <motion.div 
            animate={{ y: [0, 20, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
            className="floating-card c-2 glass-panel"
          >
            <div className="fc-icon bg-blue"><MapPin size={24} color="#0f172a" /></div>
            <div>
              <h4>City Center Mall</h4>
              <p>2 Slots Open</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Why Choose <span className="text-gradient">EV-ChargeMate?</span></h2>
        
        <div className="features-grid">
          <FeatureCard 
            icon={<MapPin size={32} color="var(--accent-neon-blue)" />}
            title="Smart Discovery"
            description="Our app detects your location and instantly displays nearby charging infrastructure."
          />
          <FeatureCard 
            icon={<ShieldCheck size={32} color="var(--accent-neon-green)" />}
            title="Reliable Data"
            description="Get real-time availability and operator info so you know exactly what to expect."
          />
          <FeatureCard 
            icon={<Zap size={32} color="var(--accent-purple)" />}
            title="Direct Navigation"
            description="Step-by-step directions directly to the station pad without any guesswork."
          />
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <motion.div 
    whileHover={{ y: -10, scale: 1.02 }}
    className="feature-card glass-panel"
  >
    <div className="feature-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{description}</p>
  </motion.div>
);

export default Home;
