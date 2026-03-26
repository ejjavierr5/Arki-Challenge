import { useState, useEffect, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth, UserButton } from '@clerk/react';
import { projects } from './data';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Featured architectural designs for the showcase
const FEATURED_DESIGNS = [
  { title: "Sagrada Família", architect: "Antoni Gaudí", year: "1882–present", style: "Art Nouveau", location: "Barcelona, Spain", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&auto=format&fit=crop" },
  { title: "Fallingwater", architect: "Frank Lloyd Wright", year: "1935", style: "Organic Architecture", location: "Pennsylvania, USA", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop" },
  { title: "Sydney Opera House", architect: "Jørn Utzon", year: "1973", style: "Expressionism", location: "Sydney, Australia", image: "https://images.unsplash.com/photo-1524820197278-540916411e20?w=800&auto=format&fit=crop" },
  { title: "Guggenheim Bilbao", architect: "Frank Gehry", year: "1997", style: "Deconstructivism", location: "Bilbao, Spain", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&auto=format&fit=crop" },
  { title: "Burj Khalifa", architect: "Adrian Smith (SOM)", year: "2010", style: "Neo-Futurism", location: "Dubai, UAE", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop" },
];

// Features list
const FEATURES = [
  {
    icon: Icons.FileStack,
    title: "Structured Project Briefs",
    description: "Complete with room programs, site specs, bearings, and client requirements — just like real practice.",
    color: "text-architectural-yellow",
  },
  {
    icon: Icons.Timer,
    title: "Timed Challenges",
    description: "Push your limits with daily design challenges. From 10-minute sketches to 8-hour master exercises.",
    color: "text-blue-400",
  },
  {
    icon: Icons.Cloud,
    title: "Google Drive Integration",
    description: "Seamlessly save and organize your project files to the cloud with one-click upload.",
    color: "text-emerald-400",
  },
  {
    icon: Icons.Trophy,
    title: "XP & Progression System",
    description: "Earn points and XP for completed projects. Track your growth from Drafting Apprentice to Legendary Architect.",
    color: "text-orange-400",
  },
  {
    icon: Icons.Palette,
    title: "Design Inspirations",
    description: "Daily curated architectural masterpieces from around the world to spark your creativity.",
    color: "text-purple-400",
  },
  {
    icon: Icons.Users,
    title: "Studio Network",
    description: "Connect with fellow architecture students and professionals. Share your peer code and build your network.",
    color: "text-pink-400",
  },
];

// Difficulty badges
const DIFFICULTIES = [
  { level: "Easy", stars: 1, color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10", description: "5-7 days · 75-150 pts" },
  { level: "Medium", stars: 2, color: "text-blue-400 border-blue-400/30 bg-blue-400/10", description: "14 days · 300-450 pts" },
  { level: "Hard", stars: 3, color: "text-orange-400 border-orange-400/30 bg-orange-400/10", description: "21 days · 600-700 pts" },
  { level: "Master", stars: 4, color: "text-red-500 border-red-500/30 bg-red-500/10", description: "30 days · 900-950 pts" },
];

// Categories
const CATEGORIES = [
  { name: "Residential", icon: Icons.Home, count: projects.filter(p => p.category === 'residential').length },
  { name: "Commercial", icon: Icons.Building2, count: projects.filter(p => p.category === 'commercial').length },
  { name: "Institutional", icon: Icons.Landmark, count: projects.filter(p => p.category === 'institutional').length },
  { name: "Infrastructure", icon: Icons.Factory, count: projects.filter(p => p.category === 'infrastructure').length },
  { name: "High-Rise", icon: Icons.Building, count: projects.filter(p => p.category === 'high-rise').length },
];

export default function Homepage() {
  const [currentDesign, setCurrentDesign] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();

  // Auto-rotate featured designs
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDesign((prev) => (prev + 1) % FEATURED_DESIGNS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Track scroll for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sample projects for preview
  const previewProjects = useMemo(() => projects.slice(0, 6), []);

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-200 font-sans selection:bg-architectural-yellow selection:text-black overflow-x-hidden">
      {/* Architectural Grid Background */}
      <div className="fixed inset-0 architectural-grid opacity-30 pointer-events-none" />
      
      {/* Gradient Orbs */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-architectural-yellow/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled ? "bg-black/80 backdrop-blur-2xl border-b border-white/10 shadow-2xl" : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-architectural-yellow text-black flex items-center justify-center font-bold text-xl rounded-xl shadow-lg">
                A
              </div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-widest leading-tight text-white">
                Archimedian
              </div>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-xs font-mono text-gray-400 hover:text-white transition-colors uppercase tracking-wider">Features</a>
              <a href="#projects" className="text-xs font-mono text-gray-400 hover:text-white transition-colors uppercase tracking-wider">Projects</a>
              <a href="#challenges" className="text-xs font-mono text-gray-400 hover:text-white transition-colors uppercase tracking-wider">Challenges</a>
            </div>

            {/* CTA */}
            {isLoaded && isSignedIn ? (
              <div className="flex items-center gap-4">
                <a
                  href="/dashboard"
                  className="px-6 py-3 bg-architectural-yellow text-black font-mono text-xs font-black uppercase tracking-wider rounded-xl hover:brightness-110 transition-all shadow-lg hover:shadow-architectural-yellow/20 flex items-center gap-2"
                >
                  Dashboard <Icons.ArrowRight size={14} />
                </a>
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: 'w-10 h-10 border-2 border-white/20 hover:border-architectural-yellow/50 transition-colors',
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <a
                  href="/sign-in"
                  className="px-5 py-2.5 text-gray-300 font-mono text-xs font-medium uppercase tracking-wider rounded-xl hover:text-white hover:bg-white/5 transition-all"
                >
                  Sign In
                </a>
                <a
                  href="/sign-up"
                  className="px-6 py-3 bg-architectural-yellow text-black font-mono text-xs font-black uppercase tracking-wider rounded-xl hover:brightness-110 transition-all shadow-lg hover:shadow-architectural-yellow/20 flex items-center gap-2"
                >
                  Get Started <Icons.ArrowRight size={14} />
                </a>
              </div>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24 grid lg:grid-cols-2 gap-16 items-start">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full"
              >
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Practice Architecture Like a Pro</span>
              </motion.div>

              <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9]">
                <span className="text-white">Design.</span><br />
                <span className="text-architectural-yellow">Build.</span><br />
                <span className="text-white">Master.</span>
              </h1>

              <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
                The ultimate architecture practice platform for students and professionals in the Philippines. 
                Real project briefs. Real challenges. Real growth.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              {isLoaded && isSignedIn ? (
                <a
                  href="/dashboard"
                  className="px-8 py-4 bg-architectural-yellow text-black font-mono text-sm font-black uppercase tracking-wider rounded-2xl hover:brightness-110 transition-all shadow-lg hover:shadow-architectural-yellow/30 flex items-center gap-3"
                >
                  <Icons.Compass size={18} /> Go to Dashboard
                </a>
              ) : (
                <a
                  href="/sign-up"
                  className="px-8 py-4 bg-architectural-yellow text-black font-mono text-sm font-black uppercase tracking-wider rounded-2xl hover:brightness-110 transition-all shadow-lg hover:shadow-architectural-yellow/30 flex items-center gap-3"
                >
                  <Icons.Compass size={18} /> Start Designing
                </a>
              )}
              <a
                href="#features"
                className="px-8 py-4 bg-white/5 border border-white/10 text-white font-mono text-sm font-bold uppercase tracking-wider rounded-2xl hover:bg-white/10 transition-all flex items-center gap-3"
              >
                <Icons.Play size={18} /> See How It Works
              </a>
            </div>
          </motion.div>

          {/* Right - Featured Design Showcase - Hidden on Mobile */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative lg:mt-0 hidden md:block"
          >
            <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentDesign}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.7 }}
                  className="absolute inset-0"
                >
                  <img
                    src={FEATURED_DESIGNS[currentDesign].image}
                    alt={FEATURED_DESIGNS[currentDesign].title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                </motion.div>
              </AnimatePresence>

              {/* Design Info */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <motion.div
                  key={`info-${currentDesign}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="text-[9px] font-mono text-architectural-yellow uppercase tracking-widest mb-2 block">
                    Daily Inspiration
                  </span>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                    {FEATURED_DESIGNS[currentDesign].title}
                  </h3>
                  <p className="text-sm font-mono text-gray-400 mt-1">
                    {FEATURED_DESIGNS[currentDesign].architect} · {FEATURED_DESIGNS[currentDesign].year}
                  </p>
                  <div className="flex items-center gap-4 mt-4">
                    <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1">
                      <Icons.MapPin size={10} /> {FEATURED_DESIGNS[currentDesign].location}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500 flex items-center gap-1">
                      <Icons.Palette size={10} /> {FEATURED_DESIGNS[currentDesign].style}
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Progress Dots */}
              <div className="absolute top-6 right-6 flex gap-2">
                {FEATURED_DESIGNS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentDesign(i)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      i === currentDesign ? "bg-architectural-yellow w-6" : "bg-white/30 hover:bg-white/50"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Floating Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="absolute -bottom-6 -left-6 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-architectural-yellow/20 rounded-xl flex items-center justify-center">
                  <Icons.Award size={24} className="text-architectural-yellow" />
                </div>
                <div>
                  <p className="text-[10px] font-mono text-gray-500 uppercase">Earn Up To</p>
                  <p className="text-xl font-black text-white">950 Points</p>
                  <p className="text-[9px] font-mono text-gray-600">Per Master Project</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex flex-col items-center gap-2 text-gray-600"
          >
            <span className="text-[9px] font-mono uppercase tracking-widest">Scroll to Explore</span>
            <Icons.ChevronDown size={16} />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="text-[10px] font-mono text-architectural-yellow uppercase tracking-[0.3em] mb-4 block">
              Platform Features
            </span>
            <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-white mb-6">
              Everything You Need to<br />
              <span className="text-architectural-yellow">Level Up Your Skills</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              From detailed project briefs to daily challenges, we've built the tools architecture students 
              and professionals need to practice like they're working in a real studio.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 bg-white/[0.02] border border-white/10 rounded-[2rem] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-500"
              >
                <div className={cn("w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", feature.color)}>
                  <feature.icon size={24} />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Difficulty Levels Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-[10px] font-mono text-architectural-yellow uppercase tracking-[0.3em] mb-4 block">
              Progressive Difficulty
            </span>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
              Projects for Every Skill Level
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {DIFFICULTIES.map((diff, i) => (
              <motion.div
                key={diff.level}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn("p-6 rounded-2xl border text-center", diff.color)}
              >
                <div className="flex justify-center gap-1 mb-4">
                  {Array.from({ length: diff.stars }).map((_, j) => (
                    <Icons.Star key={j} size={16} fill="currentColor" />
                  ))}
                </div>
                <h3 className="text-xl font-black uppercase mb-2">{diff.level}</h3>
                <p className="text-[10px] font-mono opacity-70">{diff.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-[10px] font-mono text-architectural-yellow uppercase tracking-[0.3em] mb-4 block">
              Project Categories
            </span>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
              Diverse Design Challenges
            </h2>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-4">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 px-6 py-4 bg-white/[0.02] border border-white/10 rounded-2xl hover:border-architectural-yellow/30 hover:bg-architectural-yellow/5 transition-all cursor-pointer group"
              >
                <cat.icon size={20} className="text-gray-500 group-hover:text-architectural-yellow transition-colors" />
                <span className="text-sm font-bold text-white uppercase">{cat.name}</span>
                <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{cat.count}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Preview Section */}
      <section id="projects" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-12"
          >
            <div>
              <span className="text-[10px] font-mono text-architectural-yellow uppercase tracking-[0.3em] mb-4 block">
                Sample Projects
              </span>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
                Real-World Design Briefs
              </h2>
            </div>
            <a
              href="/dashboard"
              className="hidden md:flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-architectural-yellow transition-colors uppercase tracking-wider"
            >
              View All Projects <Icons.ArrowRight size={14} />
            </a>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {previewProjects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 hover:shadow-2xl transition-all duration-500"
              >
                <div className="aspect-[16/10] relative overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-[9px] text-architectural-yellow border border-architectural-yellow/30 px-1.5 rounded">
                        {project.plateNumber}
                      </span>
                      <span className={cn(
                        "font-mono text-[8px] px-2 py-0.5 rounded border uppercase font-bold flex items-center gap-1",
                        project.difficulty === 'Easy' && "text-emerald-400 border-emerald-400/20 bg-emerald-400/5",
                        project.difficulty === 'Medium' && "text-blue-400 border-blue-400/20 bg-blue-400/5",
                        project.difficulty === 'Hard' && "text-orange-400 border-orange-400/20 bg-orange-400/5",
                        project.difficulty === 'Master' && "text-red-500 border-red-500/20 bg-red-500/5",
                      )}>
                        {project.difficulty}
                      </span>
                    </div>
                    <h4 className="font-bold text-lg text-white leading-tight">{project.title}</h4>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {project.software.slice(0, 3).map(s => (
                      <span key={s} className="px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[8px] font-mono text-gray-400 uppercase">
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 uppercase border-t border-white/5 pt-4">
                    <span>{project.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-architectural-yellow font-bold flex items-center gap-1">
                        <Icons.Star size={9} fill="currentColor" /> {project.points} pts
                      </span>
                      <span className="text-white font-bold flex items-center gap-1">
                        <Icons.Clock size={9} /> {project.durationDays}d
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12 md:hidden">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white font-mono text-sm font-bold uppercase tracking-wider rounded-2xl hover:bg-white/10 transition-all"
            >
              View All Projects <Icons.ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* Daily Challenges Section */}
      <section id="challenges" className="py-32 relative bg-gradient-to-b from-transparent via-architectural-yellow/5 to-transparent">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-[10px] font-mono text-architectural-yellow uppercase tracking-[0.3em] mb-4 block">
              Daily Challenges
            </span>
            <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-white mb-6">
              Sharpen Your Skills<br />
              <span className="text-architectural-yellow">Every Single Day</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Quick design exercises with specific constraints and deliverables. 
              From 10-minute sketches to 8-hour master challenges.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Challenge Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 bg-emerald-400/5 border border-emerald-400/20 rounded-[2rem]"
            >
              <div className="flex items-center gap-2 mb-4">
                <Icons.Zap size={16} className="text-emerald-400" />
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Easy · 2-3 hrs</span>
              </div>
              <h3 className="text-xl font-black text-white uppercase mb-3">The 9sqm Studio</h3>
              <p className="text-sm text-gray-400 mb-6">
                Design a fully functional studio apartment within exactly 9 square meters. 
                Every centimeter must earn its keep.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-[8px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">Floor Plan</span>
                <span className="text-[8px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">Axonometric</span>
              </div>
            </motion.div>

            {/* Challenge Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-8 bg-blue-400/5 border border-blue-400/20 rounded-[2rem]"
            >
              <div className="flex items-center gap-2 mb-4">
                <Icons.Zap size={16} className="text-blue-400" />
                <span className="text-[10px] font-mono text-blue-400 uppercase font-bold">Medium · 4 hrs</span>
              </div>
              <h3 className="text-xl font-black text-white uppercase mb-3">Staircase as Architecture</h3>
              <p className="text-sm text-gray-400 mb-6">
                Design a staircase that is the hero of a double-height living space. 
                It should be structural art, not just circulation.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-[8px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">Plan</span>
                <span className="text-[8px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">Section</span>
                <span className="text-[8px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">Detail</span>
              </div>
            </motion.div>

            {/* Challenge Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-8 bg-red-400/5 border border-red-400/20 rounded-[2rem]"
            >
              <div className="flex items-center gap-2 mb-4">
                <Icons.Zap size={16} className="text-red-400" />
                <span className="text-[10px] font-mono text-red-400 uppercase font-bold">Master · 8 hrs</span>
              </div>
              <h3 className="text-xl font-black text-white uppercase mb-3">The Floating Library</h3>
              <p className="text-sm text-gray-400 mb-6">
                Design a 200sqm public library that appears to float 4 meters above a public plaza. 
                The space below must remain public.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-[8px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">Site Plan</span>
                <span className="text-[8px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">Sections</span>
                <span className="text-[8px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">Structural</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-12 lg:p-16 bg-gradient-to-br from-architectural-yellow/10 to-blue-500/10 border border-white/10 rounded-[3rem] relative overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 architectural-grid opacity-20" />
            
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-white mb-6">
                Ready to Design<br />
                <span className="text-architectural-yellow">Like a Pro?</span>
              </h2>
              <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
                Join architecture students and professionals across the Philippines 
                who are leveling up their design skills every day.
              </p>
              <a
                href="/dashboard"
                className="inline-flex items-center gap-3 px-10 py-5 bg-architectural-yellow text-black font-mono text-sm font-black uppercase tracking-wider rounded-2xl hover:brightness-110 transition-all shadow-lg hover:shadow-architectural-yellow/30"
              >
                <Icons.Rocket size={20} /> Launch Your Dashboard
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-architectural-yellow text-black flex items-center justify-center font-bold text-sm rounded-lg">
                A
              </div>
              <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">
                Archimedian · 2026
              </span>
            </div>
            <p className="text-xs font-mono text-gray-600 text-center md:text-right">
              Built for architecture students and professionals in the Philippines.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
