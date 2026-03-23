import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useUser, SignOutButton } from '@clerk/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { projects } from './data';
import type { Project, DifficultyLevel } from './data';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

const DifficultyBadge = ({ level }: { level: DifficultyLevel }) => {
  const config: Record<string, { color: string, stars: number }> = {
    Easy: { color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5', stars: 1 },
    Medium: { color: 'text-blue-400 border-blue-400/20 bg-blue-400/5', stars: 2 },
    Hard: { color: 'text-orange-400 border-orange-400/20 bg-orange-400/5', stars: 3 },
    Master: { color: 'text-red-500 border-red-500/20 bg-red-500/5', stars: 4 }
  };
  const current = config[level] || config.Easy;
  return (
    <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded border text-[8px] font-mono uppercase tracking-widest font-bold", current.color)}>
      <span>{level}</span>
      <div className="flex ml-1">
        {Array.from({ length: current.stars }).map((_, i) => <Icons.Star key={i} size={6} fill="currentColor" />)}
      </div>
    </div>
  );
};

const SoftwareBadge = ({ s }: { s: string }) => (
  <div className="flex items-center gap-1 px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[8px] font-mono text-gray-400 uppercase tracking-wider">
    <span>{s}</span>
  </div>
);

const DAILY_DESIGNS = [
  { title: "Sagrada Família", architect: "Antoni Gaudí", year: "1882–present", style: "Art Nouveau / Gothic", location: "Barcelona, Spain", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&auto=format&fit=crop", fact: "Still under construction after 140+ years. Gaudí devoted the last 15 years of his life entirely to this project." },
  { title: "Fallingwater", architect: "Frank Lloyd Wright", year: "1935", style: "Organic Architecture", location: "Pennsylvania, USA", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop", fact: "Cantilevered 30 feet over a waterfall. Wright designed it in just two hours after nine months of no progress." },
  { title: "Sydney Opera House", architect: "Jørn Utzon", year: "1973", style: "Expressionism", location: "Sydney, Australia", image: "https://images.unsplash.com/photo-1524820197278-540916411e20?w=600&auto=format&fit=crop", fact: "The roof shells were inspired by peeling an orange. Utzon resigned before it was completed and never saw the finished building." },
  { title: "Guggenheim Bilbao", architect: "Frank Gehry", year: "1997", style: "Deconstructivism", location: "Bilbao, Spain", image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&auto=format&fit=crop", fact: "The titanium panels are just 0.38mm thick. The building revived an entire city — now called the Bilbao Effect." },
  { title: "Panthéon", architect: "Jacques-Germain Soufflot", year: "1790", style: "Neoclassicism", location: "Paris, France", image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&auto=format&fit=crop", fact: "One of the earliest buildings to use iron reinforcement in its structure. Foucault's pendulum famously swung here in 1851." },
  { title: "Burj Khalifa", architect: "Adrian Smith (SOM)", year: "2010", style: "Neo-Futurism", location: "Dubai, UAE", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&auto=format&fit=crop", fact: "At 828m, you can watch the sunset from the base, take the elevator to the top, and watch it set again." },
  { title: "The Shard", architect: "Renzo Piano", year: "2012", style: "High-Tech Architecture", location: "London, UK", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&auto=format&fit=crop", fact: "Inspired by the spires of London churches and the masts of sailing ships moored on the Thames." },
  { title: "Villa Savoye", architect: "Le Corbusier", year: "1931", style: "International Style", location: "Poissy, France", image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&auto=format&fit=crop", fact: "The embodiment of Le Corbusier's Five Points of Architecture. It was nearly demolished in the 1960s." },
  { title: "Heydar Aliyev Center", architect: "Zaha Hadid", year: "2012", style: "Parametric Design", location: "Baku, Azerbaijan", image: "https://images.unsplash.com/photo-1549420590-8e0d1f500ccd?w=600&auto=format&fit=crop", fact: "There is not a single straight line or right angle in the entire building. It flows as one continuous surface." },
  { title: "Hagia Sophia", architect: "Isidore of Miletus & Anthemius", year: "537 AD", style: "Byzantine", location: "Istanbul, Turkey", image: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=600&auto=format&fit=crop", fact: "Its dome was the world's largest for nearly a thousand years. It has served as a cathedral, mosque, museum, and mosque again." },
  { title: "Louvre Pyramid", architect: "I.M. Pei", year: "1989", style: "Modern Classicism", location: "Paris, France", image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&auto=format&fit=crop", fact: "When first proposed, 90% of Parisians opposed it. Today it receives more visitors than the Eiffel Tower." },
  { title: "Seagram Building", architect: "Mies van der Rohe", year: "1958", style: "International Style", location: "New York, USA", image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&auto=format&fit=crop", fact: "Mies insisted on a deep plaza setback — rare in Manhattan. He wanted the building to stand apart, like a sculpture on a pedestal." },
  { title: "Lotus Temple", architect: "Fariborz Sahba", year: "1986", style: "Expressionist Modernism", location: "New Delhi, India", image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&auto=format&fit=crop", fact: "Made of 27 free-standing marble petals. It is open to people of all religions and has no idols, images, or clergy." },
  { title: "Centre Pompidou", architect: "Renzo Piano & Richard Rogers", year: "1977", style: "High-Tech / Bowellism", location: "Paris, France", image: "https://images.unsplash.com/photo-1503917988258-f87a78e3c995?w=600&auto=format&fit=crop", fact: "All structural and mechanical systems are on the outside. The color-coded pipes were considered an outrage when built." },
  { title: "Habitat 67", architect: "Moshe Safdie", year: "1967", style: "Brutalist Utopian", location: "Montreal, Canada", image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&auto=format&fit=crop", fact: "Built as a student thesis project. 354 identical prefab concrete boxes stacked in 146 unique configurations." },
  { title: "Tokyo Skytree", architect: "Nikken Sekkei", year: "2012", style: "Neo-Futurism", location: "Tokyo, Japan", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&auto=format&fit=crop", fact: "The cross-section transitions from a triangle at the base to a perfect circle at the top to maximize wind resistance." },
  { title: "Dancing House", architect: "Frank Gehry & Vlado Milunić", year: "1996", style: "Deconstructivism", location: "Prague, Czech Republic", image: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=600&auto=format&fit=crop", fact: "Nicknamed Fred and Ginger after Fred Astaire and Ginger Rogers. It was originally controversial but is now beloved." },
  { title: "Church of the Light", architect: "Tadao Ando", year: "1989", style: "Critical Regionalism", location: "Osaka, Japan", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop", fact: "The cross is simply two slits cut into a concrete wall. The budget was so low that Ando donated his fee to get it built." },
  { title: "Marina Bay Sands", architect: "Moshe Safdie", year: "2010", style: "Contemporary", location: "Singapore", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&auto=format&fit=crop", fact: "The 340m SkyPark cantilevers 65m beyond the north tower — longer than the Eiffel Tower on its side." },
  { title: "Nakagin Capsule Tower", architect: "Kisho Kurokawa", year: "1972", style: "Metabolism", location: "Tokyo, Japan", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&auto=format&fit=crop", fact: "Each capsule was designed to be replaceable. Unfortunately, none were ever replaced and the tower was demolished in 2022." },
  { title: "CCTV Headquarters", architect: "Rem Koolhaas (OMA)", year: "2012", style: "Deconstructivism", location: "Beijing, China", image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600&auto=format&fit=crop", fact: "The two leaning towers meet in an L-shaped overhang at the top. The structural forces required entirely new engineering methods." },
  { title: "National Stadium (Birds Nest)", architect: "Herzog & de Meuron", year: "2008", style: "Organic Architecture", location: "Beijing, China", image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600&auto=format&fit=crop", fact: "The tangled steel structure was originally designed to hide a retractable roof that was later removed from the design." },
  { title: "Thorncrown Chapel", architect: "E. Fay Jones", year: "1980", style: "Organic / Woodland", location: "Arkansas, USA", image: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&auto=format&fit=crop", fact: "No piece of lumber is longer than 2.4m — the maximum that could be carried through the forest by two men." },
  { title: "Torre Glòries", architect: "Jean Nouvel", year: "2005", style: "High-Tech", location: "Barcelona, Spain", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&auto=format&fit=crop", fact: "The tower changes color throughout the day. At night it becomes a 4,500 LED light sculpture visible for miles." },
  { title: "Metabolist Sky House", architect: "Kiyonori Kikutake", year: "1958", style: "Metabolism", location: "Tokyo, Japan", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&auto=format&fit=crop", fact: "Kikutake lived in it for decades, replacing different components over time — practicing what Metabolism preached." },
  { title: "Millau Viaduct", architect: "Norman Foster + Michel Virlogeux", year: "2004", style: "Structural Expressionism", location: "Millau, France", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&auto=format&fit=crop", fact: "Its tallest pier is higher than the Eiffel Tower. Drivers crossing it are literally above the clouds on foggy days." },
  { title: "Castelvecchio Museum", architect: "Carlo Scarpa", year: "1964", style: "Critical Restoration", location: "Verona, Italy", image: "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=600&auto=format&fit=crop", fact: "Scarpa's renovation exposed historic layers while inserting modern elements. The equestrian statue floats on a cantilevered platform." },
  { title: "Jewish Museum Berlin", architect: "Daniel Libeskind", year: "2001", style: "Deconstructivism", location: "Berlin, Germany", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop", fact: "The voids inside cannot be entered or used. They represent the absence of Jewish life in Berlin — permanent, silent, empty." },
  { title: "Casa Milà (La Pedrera)", architect: "Antoni Gaudí", year: "1912", style: "Art Nouveau", location: "Barcelona, Spain", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&auto=format&fit=crop", fact: "Not a single straight line exists in the entire building. The facade undulates like a stone sea cliff." },
  { title: "The Interlace", architect: "OMA / Ole Scheeren", year: "2013", style: "Contemporary Urbanism", location: "Singapore", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&auto=format&fit=crop", fact: "Thirty-one apartment blocks are stacked in a hexagonal pattern, creating eight sky gardens. Named World Building of the Year 2015." },
];


type DailyChallenge = {
  title: string;
  category: string;
  difficulty: string;
  duration: string;
  prompt: string;
  constraints: string[];
  deliverable: string;
  tip: string;
  color: string;
  architecturalStyle: string;
  colorPalette: { hex: string; name: string }[];
  bearings: string[];
  siteArea: string;
  siteLocation: string;
  inspirations: { name: string; architect: string; why: string }[];
};

const DAILY_CHALLENGES: DailyChallenge[] = [
  {
    title: "The 9sqm Studio", category: "Residential", difficulty: "Easy", duration: "3 hrs",
    prompt: "Design a fully functional studio apartment within exactly 9 square meters. Every centimeter must earn its keep.",
    constraints: ["No dimension may exceed 3m in any direction", "Must include: sleeping, cooking, bathing, and working zones", "Natural light from one window only"],
    deliverable: "Floor plan + 1 axonometric sketch showing space-saving strategy",
    tip: "Think vertically. Japanese micro-homes are your reference.", color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5",
    architecturalStyle: "Japanese Minimalism",
    colorPalette: [{ hex: "#F5F0E8", name: "Washi White" }, { hex: "#8B7355", name: "Timber Tan" }, { hex: "#2D2D2D", name: "Shadow Black" }, { hex: "#A8B5A0", name: "Moss Gray" }],
    bearings: ["N 00°00\'00\" E — 3.00m", "S 90°00\'00\" E — 3.00m", "S 00°00\'00\" W — 3.00m", "N 90°00\'00\" W — 3.00m"],
    siteArea: "9.00 sqm", siteLocation: "Makati City, Metro Manila",
    inspirations: [{ name: "House NA", architect: "Sou Fujimoto", why: "Master of micro-space — platforms instead of rooms" }, { name: "Tower House", architect: "Takamitsu Azuma", why: "Vertical living in a 20sqm urban footprint" }, { name: "Moriyama House", architect: "Ryue Nishizawa", why: "Dissolves the boundary between room and city" }],
  },
  {
    title: "Staircase as Architecture", category: "Interior / Detail", difficulty: "Medium", duration: "4 hrs",
    prompt: "Design a staircase that is the hero of a double-height living space. It should be structural art, not just circulation.",
    constraints: ["No standard straight-run stairs", "Must have a structural expression visible from below", "3 materials maximum"],
    deliverable: "Plan, section, and 1 detail drawing of the stair connection",
    tip: "Study the Barcelona Pavilion stair and Tadao Ando concrete folded planes.", color: "text-blue-400 border-blue-400/20 bg-blue-400/5",
    architecturalStyle: "Contemporary Sculptural",
    colorPalette: [{ hex: "#1A1A1A", name: "Cast Concrete" }, { hex: "#C0A060", name: "Brushed Brass" }, { hex: "#FAFAFA", name: "Plaster White" }, { hex: "#5C3A1E", name: "Oiled Oak" }],
    bearings: ["N 00°00\'00\" E — 8.00m", "S 90°00\'00\" E — 6.00m", "S 00°00\'00\" W — 8.00m", "N 90°00\'00\" W — 6.00m"],
    siteArea: "48.00 sqm (double-height volume)", siteLocation: "BGC, Taguig City",
    inspirations: [{ name: "Casa Mila Stair", architect: "Antoni Gaudi", why: "Structure and ornament are inseparable" }, { name: "Staircase at 23 Beekman Place", architect: "Philip Johnson", why: "Cantilevered concrete as spatial drama" }, { name: "Fuji Kindergarten", architect: "Tezuka Architects", why: "Circulation as the primary social space" }],
  },
  {
    title: "Facade Only Challenge", category: "Commercial", difficulty: "Hard", duration: "5 hrs",
    prompt: "You are given a plain 20m x 30m concrete box. Redesign only its facade to make it feel like a landmark without changing the floor plates.",
    constraints: ["No structural changes to the box", "Facade must respond to sun path", "Use only 2 materials on the exterior"],
    deliverable: "All 4 elevations + 1 facade detail section",
    tip: "Louvers, perforated screens, and green walls can transform a box into poetry.", color: "text-orange-400 border-orange-400/20 bg-orange-400/5",
    architecturalStyle: "High-Tech Skin Architecture",
    colorPalette: [{ hex: "#2C3E50", name: "Midnight Steel" }, { hex: "#BDC3C7", name: "Aluminum" }, { hex: "#ECF0F1", name: "Frosted Glass" }, { hex: "#E67E22", name: "Accent Copper" }],
    bearings: ["N 00°00\'00\" E — 30.00m", "S 90°00\'00\" E — 20.00m", "S 00°00\'00\" W — 30.00m", "N 90°00\'00\" W — 20.00m"],
    siteArea: "600.00 sqm", siteLocation: "Ortigas Center, Pasig City",
    inspirations: [{ name: "Arab World Institute", architect: "Jean Nouvel", why: "Facade as a climate-responsive diaphragm" }, { name: "Torre Banca", architect: "Renzo Piano", why: "Layered skin that breathes with the building" }, { name: "Allianz Tower", architect: "Arata Isozaki", why: "Facade geometry creates identity from a simple volume" }],
  },
  {
    title: "The Floating Library", category: "Institutional", difficulty: "Master", duration: "8 hrs",
    prompt: "Design a 200sqm public library that appears to float 4 meters above a public plaza. The space below must remain public and usable.",
    constraints: ["No columns touching the ground within the public zone", "Ground level 100% publicly accessible", "Acoustic isolation between library and plaza below"],
    deliverable: "Site plan, floor plan, 2 sections, all elevations, structural diagram",
    tip: "Study Toyo Ito Mediatheque in Sendai for column-as-structure expression.", color: "text-red-400 border-red-400/20 bg-red-400/5",
    architecturalStyle: "Structural Expressionism",
    colorPalette: [{ hex: "#FFFFFF", name: "Float White" }, { hex: "#4A90D9", name: "Sky Blue" }, { hex: "#2C2C2C", name: "Steel Gray" }, { hex: "#F5F0E8", name: "Page Cream" }],
    bearings: ["N 15°00\'00\" E — 20.00m", "S 75°00\'00\" E — 10.00m", "S 15°00\'00\" W — 20.00m", "N 75°00\'00\" W — 10.00m"],
    siteArea: "200.00 sqm (elevated plate)", siteLocation: "Intramuros, Manila",
    inspirations: [{ name: "Sendai Mediatheque", architect: "Toyo Ito", why: "Columns as transparent structural trees" }, { name: "CCTV Headquarters", architect: "Rem Koolhaas", why: "Cantilever at extreme scale as architecture" }, { name: "Musee du quai Branly", architect: "Jean Nouvel", why: "Elevated volume hovering over garden landscape" }],
  },
  {
    title: "Bamboo Pavilion Sketch", category: "Landscape / Pavilion", difficulty: "Easy", duration: "2 hrs",
    prompt: "Sketch a 6m x 6m meditation pavilion using bamboo as the only structural material. No concrete, no steel, no glass.",
    constraints: ["All structural members must be bamboo", "Must allow airflow from all 4 sides", "Maximum 3m height at ridge"],
    deliverable: "1 perspective sketch + annotated structural diagram",
    tip: "Bamboo in compression is stronger than concrete. Think of it like a woven basket scaled up.", color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5",
    architecturalStyle: "Vernacular Tropical",
    colorPalette: [{ hex: "#C8A96E", name: "Natural Bamboo" }, { hex: "#2D5016", name: "Canopy Green" }, { hex: "#F5ECD7", name: "Rice Paper" }, { hex: "#8B4513", name: "Earth Red" }],
    bearings: ["N 00°00\'00\" E — 6.00m", "S 90°00\'00\" E — 6.00m", "S 00°00\'00\" W — 6.00m", "N 90°00\'00\" W — 6.00m"],
    siteArea: "36.00 sqm", siteLocation: "Tagaytay City, Cavite",
    inspirations: [{ name: "Green School Bali", architect: "IBUKU / Elora Hardy", why: "Bamboo used for entire structural systems at building scale" }, { name: "Panyaden School", architect: "Chiangmai Life Construction", why: "Bamboo school that proves the material is buildable and beautiful" }, { name: "Caterpillar House", architect: "Vo Trong Nghia", why: "Bamboo vault as a refined structural language" }],
  },
  {
    title: "Adaptive Reuse: The Empty Mall", category: "Commercial / Adaptive Reuse", difficulty: "Hard", duration: "6 hrs",
    prompt: "A 3-floor dead mall has been handed to you. Transform it into a mixed-use community hub without demolishing the structure.",
    constraints: ["Retain minimum 70% of existing structural grid", "Program must include: co-working, market, clinic, and childcare", "Natural light must reach all new major spaces"],
    deliverable: "Existing vs proposed floor plans, section before/after, facade concept",
    tip: "The best adaptive reuse projects celebrate what was there. Expose the bones.", color: "text-orange-400 border-orange-400/20 bg-orange-400/5",
    architecturalStyle: "Industrial Adaptive Reuse",
    colorPalette: [{ hex: "#3E2723", name: "Exposed Brick" }, { hex: "#FF6F00", name: "Industrial Orange" }, { hex: "#BDBDBD", name: "Raw Concrete" }, { hex: "#F5F5F5", name: "New White" }],
    bearings: ["N 00°00\'00\" E — 80.00m", "S 90°00\'00\" E — 60.00m", "S 00°00\'00\" W — 80.00m", "N 90°00\'00\" W — 60.00m"],
    siteArea: "4,800.00 sqm", siteLocation: "Cubao, Quezon City",
    inspirations: [{ name: "Peckham Levels", architect: "Carl Turner Architects", why: "Dead multi-storey car park transformed into cultural hub" }, { name: "High Line", architect: "Diller Scofidio + Renfro", why: "Industrial infrastructure reborn as public space" }, { name: "Tate Modern", architect: "Herzog & de Meuron", why: "Power station turbine hall becomes the greatest interior in London" }],
  },
  {
    title: "Shadow Architecture", category: "Design Theory / Sketch", difficulty: "Medium", duration: "3 hrs",
    prompt: "Design a small chapel (50sqm) where the architectural experience is entirely defined by how light and shadow move through the day.",
    constraints: ["No electric lighting", "Openings must respond to sun path", "Interior palette: white surfaces only"],
    deliverable: "Floor plan + 3 shadow studies (9am, 12pm, 4pm)",
    tip: "Le Corbusier: Architecture is the play of volumes brought together in light.", color: "text-blue-400 border-blue-400/20 bg-blue-400/5",
    architecturalStyle: "Sacred Minimalism",
    colorPalette: [{ hex: "#FFFFFF", name: "Sacred White" }, { hex: "#D4AF37", name: "Divine Gold" }, { hex: "#2C2C2C", name: "Shadow Black" }, { hex: "#B8A99A", name: "Stone Gray" }],
    bearings: ["N 10°30\'00\" E — 8.00m", "S 79°30\'00\" E — 6.25m", "S 10°30\'00\" W — 8.00m", "N 79°30\'00\" W — 6.25m"],
    siteArea: "50.00 sqm", siteLocation: "Laguna, Philippines",
    inspirations: [{ name: "Church of the Light", architect: "Tadao Ando", why: "Two slits in concrete. That is all. Light does the rest." }, { name: "Bruder Klaus Field Chapel", architect: "Peter Zumthor", why: "Darkness as a spiritual material" }, { name: "Chapel of Notre-Dame du Haut", architect: "Le Corbusier", why: "Every opening is a calculated act against the sun" }],
  },
  {
    title: "Emergency Shelter", category: "Infrastructure / Humanitarian", difficulty: "Medium", duration: "4 hrs",
    prompt: "Design a shelter that can be assembled by 4 untrained people in 24 hours using only flatpack components that fit in a standard truck.",
    constraints: ["All components must fit in a 2.4m x 6m truck bed", "No tools required for assembly", "Must shelter 8 people from rain, wind, and 38C heat"],
    deliverable: "Component diagram, assembly sequence, assembled floor plan + section",
    tip: "IKEA builds entire houses this way. Shigeru Ban uses cardboard tubes. Think modular.", color: "text-blue-400 border-blue-400/20 bg-blue-400/5",
    architecturalStyle: "Humanitarian Design",
    colorPalette: [{ hex: "#FFFFFF", name: "Relief White" }, { hex: "#F5A623", name: "Safety Orange" }, { hex: "#4A90D9", name: "UNHCR Blue" }, { hex: "#7B8B6F", name: "Tarpaulin Green" }],
    bearings: ["N 00°00\'00\" E — 6.00m", "S 90°00\'00\" E — 4.00m", "S 00°00\'00\" W — 6.00m", "N 90°00\'00\" W — 4.00m"],
    siteArea: "24.00 sqm", siteLocation: "Tacloban City, Leyte",
    inspirations: [{ name: "Cardboard Cathedral", architect: "Shigeru Ban", why: "Cardboard tubes as disaster-relief architecture" }, { name: "IKEA Foundation Shelter", architect: "Better Shelter", why: "Flatpack humanitarian housing for 650,000 families" }, { name: "Paper Log Houses", architect: "Shigeru Ban", why: "Proof that humble materials can be dignified architecture" }],
  },
  {
    title: "Vertical Cemetery", category: "Institutional / Funerary", difficulty: "Hard", duration: "6 hrs",
    prompt: "Design a 10-storey vertical columbarium that does not feel like a building. It should feel like a garden.",
    constraints: ["No floor should feel like a conventional corridor", "Each level must have natural light and sky views", "Public and private zones clearly separated"],
    deliverable: "Typical floor plan, section through full height, exterior elevation",
    tip: "Grief architecture demands silence. Study Oslo Cemetery Extension.", color: "text-orange-400 border-orange-400/20 bg-orange-400/5",
    architecturalStyle: "Sacred Vertical Landscape",
    colorPalette: [{ hex: "#ECEFF1", name: "Serenity Gray" }, { hex: "#BFA980", name: "Memorial Stone" }, { hex: "#2E7D32", name: "Garden Green" }, { hex: "#FFFFFF", name: "Pure White" }],
    bearings: ["N 05°00\'00\" E — 20.00m", "S 85°00\'00\" E — 15.00m", "S 05°00\'00\" W — 20.00m", "N 85°00\'00\" W — 15.00m"],
    siteArea: "300.00 sqm footprint x 10 floors", siteLocation: "Mandaluyong City, Metro Manila",
    inspirations: [{ name: "Woodland Cemetery", architect: "Gunnar Asplund", why: "Landscape and mortality as a single architectural act" }, { name: "San Cataldo Cemetery", architect: "Aldo Rossi", why: "The unfinished house of the dead as pure form" }, { name: "Brion Cemetery", architect: "Carlo Scarpa", why: "Every joint, every material chosen for eternity" }],
  },
  {
    title: "The 1-Material House", category: "Residential", difficulty: "Easy", duration: "3 hrs",
    prompt: "Design a 2-bedroom family home using only ONE material for all structure, walls, floors, and roof. Choose wisely.",
    constraints: ["Single material throughout", "Must be a real, buildable material", "Must be locally available in the Philippines"],
    deliverable: "Floor plan, section, and a materials justification note",
    tip: "Earth, bamboo, concrete, timber — each tells a completely different story.", color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5",
    architecturalStyle: "Material Honesty",
    colorPalette: [{ hex: "#C4A882", name: "Adobe Earth" }, { hex: "#8B7355", name: "Timber Brown" }, { hex: "#F5F0E8", name: "Natural Light" }, { hex: "#4A7C59", name: "Site Green" }],
    bearings: ["N 45°00\'00\" E — 12.00m", "S 45°00\'00\" E — 12.00m", "S 45°00\'00\" W — 12.00m", "N 45°00\'00\" W — 12.00m"],
    siteArea: "144.00 sqm", siteLocation: "Batangas City, Batangas",
    inspirations: [{ name: "Brick House", architect: "Noero Wolf Architects", why: "A single material elevated to architectural poetry" }, { name: "Haiku House", architect: "Ken Kellogg", why: "Concrete as warmth — proving material is not destiny" }, { name: "Muji House", architect: "Kengo Kuma", why: "Wood as the entire architectural vocabulary" }],
  },
  {
    title: "Rooftop Farm + Cafe", category: "Commercial / Urban Agriculture", difficulty: "Medium", duration: "4 hrs",
    prompt: "Transform a rooftop (20m x 40m) into a working urban farm and cafe without exceeding 150kg/sqm live load.",
    constraints: ["Farm must be productive, not decorative", "Structural load limit: 150kg/sqm max", "Access only via existing stair core"],
    deliverable: "Roof plan, section, cafe layout, planting strategy diagram",
    tip: "Lightweight soil mixes, hydroponics, and raised beds are your structural allies.", color: "text-blue-400 border-blue-400/20 bg-blue-400/5",
    architecturalStyle: "Biophilic Urban Design",
    colorPalette: [{ hex: "#4CAF50", name: "Farm Green" }, { hex: "#8D6E63", name: "Soil Brown" }, { hex: "#FFF9C4", name: "Sunlight Yellow" }, { hex: "#FFFFFF", name: "Clean White" }],
    bearings: ["N 00°00\'00\" E — 40.00m", "S 90°00\'00\" E — 20.00m", "S 00°00\'00\" W — 40.00m", "N 90°00\'00\" W — 20.00m"],
    siteArea: "800.00 sqm (rooftop)", siteLocation: "Legazpi Village, Makati City",
    inspirations: [{ name: "Bosco Verticale", architect: "Stefano Boeri", why: "Vegetation integrated into the building structure itself" }, { name: "Pasona HQ", architect: "Kono Designs", why: "Rice paddies and tomato vines in a Tokyo office building" }, { name: "Rooftop Republic", architect: "Collective", why: "Productive urban farms above dense city blocks" }],
  },
  {
    title: "The Bridge House", category: "Residential / Structural", difficulty: "Master", duration: "8 hrs",
    prompt: "Design a 3-bedroom house that spans 15 meters across a ravine. The house IS the bridge. No columns may touch the ravine floor.",
    constraints: ["No structural support from ravine floor", "All bedrooms must have natural cross-ventilation", "Structural system must be architecturally expressed"],
    deliverable: "Floor plan, long section, 2 elevations, structural concept diagram",
    tip: "Think truss, think vierendeel frame. The house must carry itself as a beam.", color: "text-red-400 border-red-400/20 bg-red-400/5",
    architecturalStyle: "Structural Expressionism",
    colorPalette: [{ hex: "#1A1A1A", name: "Structural Steel" }, { hex: "#C0A060", name: "Weathering Bronze" }, { hex: "#F5F0E8", name: "Interior Warm" }, { hex: "#4A7C59", name: "Ravine Green" }],
    bearings: ["N 00°00\'00\" E — 15.00m (span)", "S 90°00\'00\" E — 8.00m", "S 00°00\'00\" W — 15.00m", "N 90°00\'00\" W — 8.00m"],
    siteArea: "120.00 sqm (deck area)", siteLocation: "Antipolo City, Rizal",
    inspirations: [{ name: "Villa Vals", architect: "SeARCH / CMA", why: "House embedded in slope, structure as landscape" }, { name: "Fallingwater", architect: "Frank Lloyd Wright", why: "The cantilevered slab over falling water" }, { name: "Edge House", architect: "Mobius Architekci", why: "House perched over cliff edge — gravity defied by design" }],
  },
  {
    title: "10 Doors in 10 Minutes", category: "Detail / Speed Sketch", difficulty: "Easy", duration: "10 mins",
    prompt: "Sketch 10 completely different door designs in 10 minutes. One per minute. No erasing.",
    constraints: ["10 different typologies", "Min 1 non-rectangular", "Min 1 for a public building"],
    deliverable: "10 door sketches on 1 sheet",
    tip: "Pivot, barn, folding, sliding, revolving, Dutch, arched, industrial, hidden, flush. Go.", color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5",
    architecturalStyle: "Vocabulary Building",
    colorPalette: [{ hex: "#2C2C2C", name: "Ink Black" }, { hex: "#F5F0E8", name: "Paper White" }, { hex: "#C0A060", name: "Sketch Gold" }, { hex: "#4A90D9", name: "Mark Blue" }],
    bearings: ["N 00°00\'00\" E — 2.10m (door height)", "S 90°00\'00\" E — 0.90m (door width)", "S 00°00\'00\" W — 2.10m", "N 90°00\'00\" W — 0.90m"],
    siteArea: "Standard door: 0.90m x 2.10m", siteLocation: "Your drafting table",
    inspirations: [{ name: "Barcelona Pavilion", architect: "Mies van der Rohe", why: "The door as threshold — minimal, precise, infinite" }, { name: "Ise Grand Shrine", architect: "Traditional Japanese", why: "The torii gate as the ultimate door concept" }, { name: "Kimbell Art Museum", architect: "Louis Kahn", why: "Openings as orchestrated light — not just holes" }],
  },
  {
    title: "The Windowless House", category: "Residential / Experimental", difficulty: "Hard", duration: "5 hrs",
    prompt: "Design a family home with absolutely no conventional windows. Light enters only through skylights, light wells, and perforations.",
    constraints: ["Zero vertical windows", "Every room must have natural light", "Prove it with a daylighting diagram"],
    deliverable: "Floor plan, roof plan, section with light path diagrams",
    tip: "Salk Institute, Bagsvaerd Church, Zumthor — darkness makes light meaningful.", color: "text-orange-400 border-orange-400/20 bg-orange-400/5",
    architecturalStyle: "Subterranean Minimalism",
    colorPalette: [{ hex: "#FFFFFF", name: "Light Shaft White" }, { hex: "#C4A882", name: "Earth Tone" }, { hex: "#1A1A1A", name: "Deep Shadow" }, { hex: "#D4AF37", name: "Zenith Gold" }],
    bearings: ["N 20°00\'00\" E — 15.00m", "S 70°00\'00\" E — 12.00m", "S 20°00\'00\" W — 15.00m", "N 70°00\'00\" W — 12.00m"],
    siteArea: "180.00 sqm", siteLocation: "Silang, Cavite",
    inspirations: [{ name: "Salk Institute", architect: "Louis Kahn", why: "Light as the first material of architecture" }, { name: "Bagsvaerd Church", architect: "Jorn Utzon", why: "Light arrives from the sky, never from the wall" }, { name: "Therme Vals", architect: "Peter Zumthor", why: "Slits of light between stone walls — darkness makes light sacred" }],
  },
  {
    title: "Beautiful Public Toilet", category: "Public / Small Architecture", difficulty: "Easy", duration: "2 hrs",
    prompt: "Redesign a public comfort room to be so beautiful that people actually want to go inside. 20sqm. Make it iconic.",
    constraints: ["Male, female, and PWD facilities", "No tile — different finish material", "Naturally ventilated"],
    deliverable: "Floor plan + 2 interior perspective sketches",
    tip: "The best architects take the most humble briefs the most seriously.", color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5",
    architecturalStyle: "Civic Craft",
    colorPalette: [{ hex: "#00897B", name: "Clean Teal" }, { hex: "#FFFFFF", name: "Porcelain White" }, { hex: "#4A4A4A", name: "Matte Black" }, { hex: "#B2EBF2", name: "Fresh Cyan" }],
    bearings: ["N 00°00\'00\" E — 5.00m", "S 90°00\'00\" E — 4.00m", "S 00°00\'00\" W — 5.00m", "N 90°00\'00\" W — 4.00m"],
    siteArea: "20.00 sqm", siteLocation: "Rizal Park, Manila",
    inspirations: [{ name: "Mopac Comfort Station", architect: "Dick Clark Architecture", why: "A public toilet that won a design award" }, { name: "Furnas do Enxofre", architect: "Wendy", why: "Minimal public pavilion with maximum dignity" }, { name: "Serpentine Pavilion 2014", architect: "Smiljan Radic", why: "The finest small public buildings demand total commitment" }],
  },
  {
    title: "Underground School", category: "Institutional / Subterranean", difficulty: "Master", duration: "8 hrs",
    prompt: "Design a 12-classroom primary school entirely below grade in a dense urban area.",
    constraints: ["All 12 classrooms must have natural light", "Emergency egress at minimum 2 points", "Natural ventilation demonstrated in section"],
    deliverable: "All floor plans, site plan, 2 sections, elevations of above-grade elements",
    tip: "Sunken courtyards, light wells, and clerestories. Study BIG subterranean projects.", color: "text-red-400 border-red-400/20 bg-red-400/5",
    architecturalStyle: "Subterranean Civic",
    colorPalette: [{ hex: "#1565C0", name: "Deep Blue" }, { hex: "#FDD835", name: "Sunlight Yellow" }, { hex: "#F5F5F5", name: "Classroom White" }, { hex: "#8BC34A", name: "Courtyard Green" }],
    bearings: ["N 00°00\'00\" E — 60.00m", "S 90°00\'00\" E — 40.00m", "S 00°00\'00\" W — 60.00m", "N 90°00\'00\" W — 40.00m"],
    siteArea: "2,400.00 sqm", siteLocation: "Makati City CBD",
    inspirations: [{ name: "Copenhagen Psychiatric Centre", architect: "Henning Larsen", why: "Subterranean volume with light courts as healing spaces" }, { name: "ACROS Fukuoka", architect: "Emilio Ambasz", why: "Stepped terraces bring greenery into urban density" }, { name: "BIG Mountain Dwellings", architect: "BIG Architects", why: "Building buried in landscape while harvesting daylight" }],
  },
  {
    title: "The Thin House", category: "Residential / Urban Infill", difficulty: "Medium", duration: "4 hrs",
    prompt: "Design a 3-storey townhouse on a 3-meter wide lot. Every square meter is precious. Make it livable, not claustrophobic.",
    constraints: ["Lot width: exactly 3 meters", "Lot depth: 20 meters", "Must include: 2 bedrooms, living, kitchen, 2 toilets, and outdoor space"],
    deliverable: "All floor plans, long section, street elevation",
    tip: "Search: Sou Fujimoto House NA. Japanese narrow-lot houses are the world standard.", color: "text-blue-400 border-blue-400/20 bg-blue-400/5",
    architecturalStyle: "Urban Infill Minimalism",
    colorPalette: [{ hex: "#F5F0E8", name: "Narrow White" }, { hex: "#5C3A1E", name: "Deep Wood" }, { hex: "#4A90D9", name: "Sky Slot" }, { hex: "#2C2C2C", name: "Urban Gray" }],
    bearings: ["N 00°00\'00\" E — 20.00m", "S 90°00\'00\" E — 3.00m", "S 00°00\'00\" W — 20.00m", "N 90°00\'00\" W — 3.00m"],
    siteArea: "60.00 sqm (3m x 20m)", siteLocation: "Sampaloc, Manila",
    inspirations: [{ name: "House NA", architect: "Sou Fujimoto", why: "Explodes the narrow lot into 21 platform levels" }, { name: "Keret House", architect: "Jakub Szczesny", why: "The world's narrowest house at 92cm minimum width" }, { name: "Sky Capsule House", architect: "Terunobu Fujimori", why: "Extreme vertical thinking in a tight urban lot" }],
  },
  {
    title: "Climate-First Floor Plan", category: "Environmental Design", difficulty: "Medium", duration: "3 hrs",
    prompt: "Start with Batangas climate data. Design a house floor plan that is a direct physical response to that data.",
    constraints: ["Must address: prevailing winds, solar path, rainfall, and temperature", "Each decision traceable to a climate fact", "No air-conditioning — passive cooling only"],
    deliverable: "Climate analysis diagram + annotated floor plan",
    tip: "Architecture that fights its climate is expensive. Architecture that works with it is timeless.", color: "text-blue-400 border-blue-400/20 bg-blue-400/5",
    architecturalStyle: "Passive Tropical Design",
    colorPalette: [{ hex: "#2196F3", name: "Trade Wind Blue" }, { hex: "#FF9800", name: "Solar Orange" }, { hex: "#4CAF50", name: "Tropical Green" }, { hex: "#F5F5F5", name: "Breeze White" }],
    bearings: ["N 30°00\'00\" E — 18.00m", "S 60°00\'00\" E — 12.00m", "S 30°00\'00\" W — 18.00m", "N 60°00\'00\" W — 12.00m"],
    siteArea: "216.00 sqm", siteLocation: "Batangas City, Batangas",
    inspirations: [{ name: "Marika-Alderton House", architect: "Glenn Murcutt", why: "Every wall is a climate instrument — opens, closes, breathes" }, { name: "Kandalama Hotel", architect: "Geoffrey Bawa", why: "Building disappears into landscape while managing its climate" }, { name: "Cube House Wai Wai", architect: "Vo Trong Nghia", why: "Vietnam tropical house using only passive strategies" }],
  },
  {
    title: "1 Column 1 Beam 1 Slab", category: "Structural / Conceptual", difficulty: "Easy", duration: "2 hrs",
    prompt: "Design the most beautiful pavilion using exactly 1 column, 1 beam, and 1 slab. Nothing else structurally.",
    constraints: ["Exactly 1 column, 1 beam, 1 slab", "Must be structurally logical", "Must cover at least 20sqm of shaded area"],
    deliverable: "Plan, elevation, section, and 1 perspective sketch",
    tip: "Mies van der Rohe: less is more. Prove it.", color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5",
    architecturalStyle: "Structural Minimalism",
    colorPalette: [{ hex: "#FFFFFF", name: "Pure White" }, { hex: "#1A1A1A", name: "Structural Black" }, { hex: "#C0A060", name: "Brass Detail" }, { hex: "#87CEEB", name: "Open Sky" }],
    bearings: ["N 00°00\'00\" E — 6.00m", "S 90°00\'00\" E — 4.00m", "S 00°00\'00\" W — 6.00m", "N 90°00\'00\" W — 4.00m"],
    siteArea: "24.00 sqm minimum", siteLocation: "Quezon Memorial Circle, Quezon City",
    inspirations: [{ name: "Barcelona Pavilion", architect: "Mies van der Rohe", why: "Eight columns hold a roof — perfection through reduction" }, { name: "Maison Domino", architect: "Le Corbusier", why: "The free plan born from 3 slabs and 6 columns" }, { name: "Schindler House", architect: "Rudolf Schindler", why: "The slab and post as the basis of all modern living" }],
  },
  {
    title: "The Ramp Building", category: "Commercial / Circulation", difficulty: "Hard", duration: "6 hrs",
    prompt: "Design a 5-storey office where the primary vertical circulation is a continuous ramp — no stairs as primary movement.",
    constraints: ["Ramp gradient must not exceed 1:12", "The ramp must be a spatial experience", "Stairs and lifts allowed only as secondary/emergency"],
    deliverable: "All floor plans, section through ramp, structural strategy for ramp support",
    tip: "Guggenheim NY by Frank Lloyd Wright. The entire building IS the ramp.", color: "text-orange-400 border-orange-400/20 bg-orange-400/5",
    architecturalStyle: "Promenade Architecture",
    colorPalette: [{ hex: "#F5F0E8", name: "Ramp Cream" }, { hex: "#C0A060", name: "Handrail Gold" }, { hex: "#2C2C2C", name: "Concrete Dark" }, { hex: "#4A90D9", name: "Atrium Blue" }],
    bearings: ["N 00°00\'00\" E — 40.00m", "S 90°00\'00\" E — 25.00m", "S 00°00\'00\" W — 40.00m", "N 90°00\'00\" W — 25.00m"],
    siteArea: "1,000.00 sqm", siteLocation: "BGC, Taguig City",
    inspirations: [{ name: "Guggenheim Museum NY", architect: "Frank Lloyd Wright", why: "The spiral ramp IS the architecture — not just circulation" }, { name: "Car Park Weil am Rhein", architect: "Zaha Hadid", why: "A ramp turned into a spatial experience" }, { name: "CCTV Headquarters", architect: "Rem Koolhaas", why: "Circulation as a loop that drives the entire building concept" }],
  },
  {
    title: "Vendor Stall Upgrade", category: "Commercial / Small Architecture", difficulty: "Easy", duration: "2 hrs",
    prompt: "A street vendor has saved enough to build a 12sqm permanent shop. Design something dignified and buildable for under PHP 300,000.",
    constraints: ["Max 12sqm floor area", "Budget: PHP 300,000 construction cost", "Must have: display, counter, storage, and sleeping loft"],
    deliverable: "Floor plan, elevation, section, rough materials cost breakdown",
    tip: "Dignity in small architecture is the hardest thing to achieve and the most important.", color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5",
    architecturalStyle: "Vernacular Commercial",
    colorPalette: [{ hex: "#FF9800", name: "Market Orange" }, { hex: "#FFFFFF", name: "Clean White" }, { hex: "#5C3A1E", name: "Counter Wood" }, { hex: "#4CAF50", name: "Awning Green" }],
    bearings: ["N 00°00\'00\" E — 4.00m", "S 90°00\'00\" E — 3.00m", "S 00°00\'00\" W — 4.00m", "N 90°00\'00\" W — 3.00m"],
    siteArea: "12.00 sqm", siteLocation: "Divisoria, Manila",
    inspirations: [{ name: "Rural Studio Hale County House", architect: "Samuel Mockbee", why: "Maximum dignity from minimal budget" }, { name: "Quinta Monroy Housing", architect: "Alejandro Aravena / ELEMENTAL", why: "Half a house built well is better than a whole house built poorly" }, { name: "Micro Housing NY", architect: "nArchitects", why: "Every square foot of a small space must work triple duty" }],
  },
  {
    title: "A Room for Grief", category: "Interior / Emotional Architecture", difficulty: "Medium", duration: "3 hrs",
    prompt: "Design a single room where people go to grieve. No program other than that. No function other than feeling. 30sqm.",
    constraints: ["No furniture specified — space must do the work", "Natural light only", "Must feel different at dawn, noon, and dusk"],
    deliverable: "Floor plan, section, and a written spatial narrative (100 words)",
    tip: "Zumthor: A good building must be capable of absorbing the traces of human life.", color: "text-blue-400 border-blue-400/20 bg-blue-400/5",
    architecturalStyle: "Emotional Minimalism",
    colorPalette: [{ hex: "#ECEFF1", name: "Quiet Gray" }, { hex: "#D4AF37", name: "Memory Gold" }, { hex: "#1A1A2E", name: "Night Blue" }, { hex: "#FFFFFF", name: "Still White" }],
    bearings: ["N 22°30\'00\" E — 6.00m", "S 67°30\'00\" E — 5.00m", "S 22°30\'00\" W — 6.00m", "N 67°30\'00\" W — 5.00m"],
    siteArea: "30.00 sqm", siteLocation: "Manila American Cemetery, Taguig",
    inspirations: [{ name: "Memorial to the Murdered Jews", architect: "Peter Eisenman", why: "Space as disorientation — architecture of loss" }, { name: "Vietnam Veterans Memorial", architect: "Maya Lin", why: "A wound in the earth that heals by being walked" }, { name: "Bruder Klaus Field Chapel", architect: "Peter Zumthor", why: "Interior darkness that makes you feel what you cannot say" }],
  },
  {
    title: "Anti-Corridor School", category: "Institutional / Educational", difficulty: "Hard", duration: "6 hrs",
    prompt: "Design a 6-classroom elementary school where NO student ever walks through a conventional corridor to reach any classroom.",
    constraints: ["Zero conventional corridors", "Every transition space must be a learning space", "All classrooms naturally ventilated and lit"],
    deliverable: "Floor plan, section, circulation diagram proving no dead corridors",
    tip: "Herman Hertzberger Montessori schools. Threshold spaces as the curriculum.", color: "text-orange-400 border-orange-400/20 bg-orange-400/5",
    architecturalStyle: "Child-Centered Design",
    colorPalette: [{ hex: "#FDD835", name: "Classroom Yellow" }, { hex: "#43A047", name: "Learning Green" }, { hex: "#1E88E5", name: "Play Blue" }, { hex: "#FFFFFF", name: "Clean White" }],
    bearings: ["N 10°00\'00\" E — 40.00m", "S 80°00\'00\" E — 30.00m", "S 10°00\'00\" W — 40.00m", "N 80°00\'00\" W — 30.00m"],
    siteArea: "1,200.00 sqm", siteLocation: "General Trias, Cavite",
    inspirations: [{ name: "Montessori Primary School", architect: "Herman Hertzberger", why: "Threshold space is the most important space in the school" }, { name: "Fuji Kindergarten", architect: "Tezuka Architects", why: "A roof as a running track — school as pure landscape" }, { name: "Vittra Telefonplan School", architect: "Rosan Bosch", why: "No rooms, no corridors — only learning landscapes" }],
  },
  {
    title: "Heritage Insertion", category: "Adaptive Reuse / Urban Design", difficulty: "Hard", duration: "5 hrs",
    prompt: "A 100-year-old bahay na bato needs a modern extension. Design so old and new are in conversation — not combat.",
    constraints: ["New extension must be clearly legible as new", "Original structure must remain intact", "The joint between old and new must be celebrated architecturally"],
    deliverable: "Site plan, floor plans both levels, elevations showing old+new, detail of the joint",
    tip: "Carlo Scarpa is the master of this. Every insertion was a conversation with history.", color: "text-orange-400 border-orange-400/20 bg-orange-400/5",
    architecturalStyle: "Critical Regionalism",
    colorPalette: [{ hex: "#8B4513", name: "Heritage Wood" }, { hex: "#C0A060", name: "Antique Gold" }, { hex: "#FFFFFF", name: "New White" }, { hex: "#2C2C2C", name: "Modern Steel" }],
    bearings: ["N 05°15\'30\" E — 20.00m", "S 84°44\'30\" E — 12.00m", "S 05°15\'30\" W — 20.00m", "N 84°44\'30\" W — 12.00m"],
    siteArea: "240.00 sqm", siteLocation: "Vigan City, Ilocos Sur",
    inspirations: [{ name: "Castelvecchio Museum", architect: "Carlo Scarpa", why: "The joint between old and new as the most honest architectural act" }, { name: "Neues Museum", architect: "David Chipperfield", why: "Restoration as dialogue — not erasure, not pastiche" }, { name: "MAXXI Rome", architect: "Zaha Hadid", why: "New architecture that intensifies, not apologizes for, what came before" }],
  },
  {
    title: "30 Roofs in 30 Minutes", category: "Speed Sketch / Vocabulary", difficulty: "Easy", duration: "30 mins",
    prompt: "Draw 30 different roof forms in 30 minutes. Build your architectural vocabulary the fast way.",
    constraints: ["Each must be a clearly different typology", "Include at least 3 Filipino vernacular roof forms", "Label each with its structural logic"],
    deliverable: "1 sheet of 30 annotated roof sketches",
    tip: "Gable, hip, shed, barrel vault, dome, folded plate, butterfly, green roof, sawtooth, tensile — and 20 more.", color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5",
    architecturalStyle: "Structural Vocabulary",
    colorPalette: [{ hex: "#2C2C2C", name: "Sketch Black" }, { hex: "#F5F0E8", name: "Paper" }, { hex: "#C0A060", name: "Annotation Gold" }, { hex: "#4A90D9", name: "Sky Reference" }],
    bearings: ["N 00°00\'00\" E — 8.00m (typical span)", "S 90°00\'00\" E — 5.00m", "S 00°00\'00\" W — 8.00m", "N 90°00\'00\" W — 5.00m"],
    siteArea: "Vocabulary exercise — no fixed site", siteLocation: "Your studio",
    inspirations: [{ name: "Kimbell Art Museum", architect: "Louis Kahn", why: "The cycloid vault as a perfect marriage of structure and light" }, { name: "Denver Art Museum", architect: "Daniel Libeskind", why: "Roof as angular sculpture — identity through form" }, { name: "Hundertwasserhaus", architect: "Friedensreich Hundertwasser", why: "The undulating roof as living landscape" }],
  },
  {
    title: "Space Without a Roof", category: "Landscape / Conceptual", difficulty: "Medium", duration: "3 hrs",
    prompt: "Design a community gathering space for 200 people with no roof. Weather is part of the experience.",
    constraints: ["No permanent overhead cover", "Must function in tropical climate year-round", "Design for both sunny and rainy conditions"],
    deliverable: "Site plan, section in sun condition, section in rain condition, perspective sketch",
    tip: "The best plazas in the world have no roof. Water, light, and air are the materials.", color: "text-blue-400 border-blue-400/20 bg-blue-400/5",
    architecturalStyle: "Landscape Architecture",
    colorPalette: [{ hex: "#87CEEB", name: "Open Sky" }, { hex: "#4CAF50", name: "Ground Green" }, { hex: "#F5F0E8", name: "Paving Stone" }, { hex: "#1A1A2E", name: "Night Gather" }],
    bearings: ["N 00°00\'00\" E — 30.00m", "S 90°00\'00\" E — 25.00m", "S 00°00\'00\" W — 30.00m", "N 90°00\'00\" W — 25.00m"],
    siteArea: "750.00 sqm", siteLocation: "Bonifacio Global City, Taguig",
    inspirations: [{ name: "Piazza del Campo", architect: "Medieval Siena", why: "A sloped shell of brick that gathers 50,000 people twice a year" }, { name: "Paley Park NY", architect: "Zion & Breen", why: "The pocket plaza — urban room without a roof" }, { name: "Olympic Sculpture Park", architect: "Weiss/Manfredi", why: "Landscape folded into city — roof is the ground itself" }],
  },
  {
    title: "The Mirrored Building", category: "Commercial / Urban Design", difficulty: "Medium", duration: "4 hrs",
    prompt: "Design a commercial building with an entirely mirrored glass exterior. Now solve the urban problems that creates.",
    constraints: ["Mirrored facade is non-negotiable", "Must not increase solar heat gain of adjacent buildings excessively", "Pedestrian level must be comfortable — no glare at eye level"],
    deliverable: "Site plan with reflection analysis, all elevations, section at pedestrian level",
    tip: "Orientation and geometry are your tools. The Infinity Tower in Dubai solves this by twisting.", color: "text-blue-400 border-blue-400/20 bg-blue-400/5",
    architecturalStyle: "Contemporary Urban Skin",
    colorPalette: [{ hex: "#87CEEB", name: "Sky Reflection" }, { hex: "#C0C0C0", name: "Mirror Silver" }, { hex: "#1A1A2E", name: "Deep Reflect" }, { hex: "#FFFFFF", name: "Reflected Cloud" }],
    bearings: ["N 00°00\'00\" E — 30.00m", "S 90°00\'00\" E — 20.00m", "S 00°00\'00\" W — 30.00m", "N 90°00\'00\" W — 20.00m"],
    siteArea: "600.00 sqm", siteLocation: "Makati CBD",
    inspirations: [{ name: "Torre Agbar / Torre Glories", architect: "Jean Nouvel", why: "A reflective tower that captures sky while transforming the street" }, { name: "IAC Building", architect: "Frank Gehry", why: "The white glass curtain wall as urban presence" }, { name: "30 St Mary Axe (Gherkin)", architect: "Norman Foster", why: "Curved glass that reduces wind load while managing solar gain" }],
  },
  {
    title: "Dream Thesis Sketch", category: "Personal / Visioning", difficulty: "Easy", duration: "2 hrs",
    prompt: "Forget constraints. Sketch the architecture thesis you would design if you had unlimited time, money, and courage.",
    constraints: ["Must be buildable — even if expensive", "Must address a real problem in Philippine society", "Must make you feel something when you look at it"],
    deliverable: "1 concept sketch + a 150-word project statement",
    tip: "Your best work comes from your deepest convictions. What breaks your heart about the built environment?", color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5",
    architecturalStyle: "Personal Vision",
    colorPalette: [{ hex: "#F4B400", name: "Dream Gold" }, { hex: "#0D47A1", name: "Vision Blue" }, { hex: "#FFFFFF", name: "Blank Canvas" }, { hex: "#2C2C2C", name: "Ink" }],
    bearings: ["N 00°00\'00\" E — undefined", "S 90°00\'00\" E — undefined", "S 00°00\'00\" W — undefined", "N 90°00\'00\" W — undefined"],
    siteArea: "Unbounded", siteLocation: "Philippines",
    inspirations: [{ name: "Medina de Bou Saada Housing", architect: "Hassan Fathy", why: "One architect who chose the poor over the powerful" }, { name: "ELEMENTAL Housing", architect: "Alejandro Aravena", why: "Architecture as a tool for social equity" }, { name: "Pritzker Prize Lecture", architect: "Any laureate", why: "Every great architect started with a thesis they never abandoned" }],
  },
  {
    title: "The Prison Reform", category: "Institutional / Social Architecture", difficulty: "Master", duration: "8 hrs",
    prompt: "Redesign a 200-person detention facility based on rehabilitation, not punishment. Architecture as social transformation.",
    constraints: ["No cells — all rooms must be private, dignified, lockable from inside", "Must include vocational training, therapy, education, and outdoor spaces", "Perimeter security must be architectural, not just fencing"],
    deliverable: "Master site plan, typical floor plan, section, security strategy diagram",
    tip: "Halden Prison Norway proves that dignity in incarceration leads to the lowest reoffending rates in the world.", color: "text-red-400 border-red-400/20 bg-red-400/5",
    architecturalStyle: "Therapeutic Institutionalism",
    colorPalette: [{ hex: "#4CAF50", name: "Rehabilitation Green" }, { hex: "#F5F0E8", name: "Dignity White" }, { hex: "#1565C0", name: "Justice Blue" }, { hex: "#795548", name: "Grounding Brown" }],
    bearings: ["N 00°00\'00\" E — 100.00m", "S 90°00\'00\" E — 80.00m", "S 00°00\'00\" W — 100.00m", "N 90°00\'00\" W — 80.00m"],
    siteArea: "8,000.00 sqm", siteLocation: "Muntinlupa City, Metro Manila",
    inspirations: [{ name: "Halden Prison", architect: "Erik Moller Arkitekter", why: "The world's most humane prison — and the most effective" }, { name: "Bastoy Prison Island", architect: "Norwegian Correctional Service", why: "An island community where rehabilitation is the architecture" }, { name: "Justice Center Leoben", architect: "Josef Hohensinn", why: "Single occupancy rooms, natural light, dignity as the security system" }],
  },
  {
    title: "Section Drawing Marathon", category: "Technical / Drawing Skills", difficulty: "Medium", duration: "4 hrs",
    prompt: "Pick any room in your house. Draw it in section at 1:20 scale. Show every material, every joint, every finish.",
    constraints: ["Scale: 1:20", "Every material must be indicated with a legend", "Minimum 3 construction details called out and drawn at 1:5"],
    deliverable: "Full section at 1:20 + minimum 3 enlarged details at 1:5",
    tip: "The section is where architecture lives. If you can draw it, you understand it.", color: "text-blue-400 border-blue-400/20 bg-blue-400/5",
    architecturalStyle: "Construction Documentation",
    colorPalette: [{ hex: "#2C2C2C", name: "Ink Black" }, { hex: "#F5F0E8", name: "Drawing Paper" }, { hex: "#C0A060", name: "Poché Gold" }, { hex: "#4A90D9", name: "Material Blue" }],
    bearings: ["N 00°00\'00\" E — variable", "S 90°00\'00\" E — variable", "S 00°00\'00\" W — variable", "N 90°00\'00\" W — variable"],
    siteArea: "Your existing room", siteLocation: "Your home",
    inspirations: [{ name: "Villa Savoye Details", architect: "Le Corbusier", why: "Every detail resolved as a philosophical statement" }, { name: "Kimbell Art Museum Details", architect: "Louis Kahn", why: "The joint is where the building tells the truth" }, { name: "Therme Vals Details", architect: "Peter Zumthor", why: "Stone on stone — nothing hidden, everything honest" }],
  },
  {
    title: "Floating Volume", category: "Residential / Structural Concept", difficulty: "Hard", duration: "5 hrs",
    prompt: "Design a 3-bedroom house where the second floor appears to float with no visible support from below.",
    constraints: ["No visible columns on the ground floor", "Structural solution must be real and buildable", "Ground floor must be at least 60% open to the outside"],
    deliverable: "Floor plans both levels, section showing structural system, exterior perspective",
    tip: "Think core wall, cantilevered slab, transfer beam hidden in the upper floor.", color: "text-orange-400 border-orange-400/20 bg-orange-400/5",
    architecturalStyle: "Structural Minimalism",
    colorPalette: [{ hex: "#F5F0E8", name: "Floating White" }, { hex: "#2C2C2C", name: "Concrete Dark" }, { hex: "#C0A060", name: "Frame Bronze" }, { hex: "#4A7C59", name: "Ground Green" }],
    bearings: ["N 15°00\'00\" E — 16.00m", "S 75°00\'00\" E — 12.00m", "S 15°00\'00\" W — 16.00m", "N 75°00\'00\" W — 12.00m"],
    siteArea: "192.00 sqm", siteLocation: "Antipolo City, Rizal",
    inspirations: [{ name: "Villa Tugendhat", architect: "Mies van der Rohe", why: "Columns so refined they disappear into the spatial experience" }, { name: "Glass House", architect: "Philip Johnson", why: "The ground plane is the architecture — walls are secondary" }, { name: "Lever House", architect: "SOM", why: "The pilotis as the act that frees the city ground" }],
  },
  {
    title: "The Silent Library", category: "Institutional / Acoustic Architecture", difficulty: "Medium", duration: "4 hrs",
    prompt: "Design a reading room for 80 people where the architecture itself enforces silence — no signs, no rules.",
    constraints: ["No acoustic tiles or conventional sound-dampening finishes", "Spatial configuration must discourage noise naturally", "Natural light only"],
    deliverable: "Floor plan, reflected ceiling plan, section, acoustic strategy diagram",
    tip: "High ceilings scatter sound. Soft surfaces absorb it. Alcoves create intimacy.", color: "text-blue-400 border-blue-400/20 bg-blue-400/5",
    architecturalStyle: "Contemplative Civic",
    colorPalette: [{ hex: "#F5F0E8", name: "Page White" }, { hex: "#5C3A1E", name: "Shelf Wood" }, { hex: "#1A1A2E", name: "Deep Quiet" }, { hex: "#D4AF37", name: "Reading Gold" }],
    bearings: ["N 00°00\'00\" E — 25.00m", "S 90°00\'00\" E — 16.00m", "S 00°00\'00\" W — 25.00m", "N 90°00\'00\" W — 16.00m"],
    siteArea: "400.00 sqm", siteLocation: "University of the Philippines, Diliman",
    inspirations: [{ name: "Phillips Exeter Academy Library", architect: "Louis Kahn", why: "The reading alcove as the unit of silence and light" }, { name: "Stockholm Public Library", architect: "Erik Gunnar Asplund", why: "Cylindrical drum of books — the room that makes you want to read" }, { name: "National Library Singapore", architect: "T.R. Hamzah and Yeang", why: "Light wells and sky gardens make silence a spatial event" }],
  },
  {
    title: "Typhoon-Proof House", category: "Residential / Resilience", difficulty: "Hard", duration: "6 hrs",
    prompt: "Design a family home in Leyte that can survive a Category 5 typhoon and keep the family safe.",
    constraints: ["Must withstand 300kph wind loads", "Ground floor may flood — design accordingly", "Emergency shelter room built into the structure"],
    deliverable: "Floor plans, section showing flood strategy, structural concept diagram, safe room detail",
    tip: "After Haiyan, buildings killed more than wind. Design the structure as the life-safety system.", color: "text-orange-400 border-orange-400/20 bg-orange-400/5",
    architecturalStyle: "Resilient Vernacular",
    colorPalette: [{ hex: "#1565C0", name: "Storm Blue" }, { hex: "#F5F0E8", name: "Shelter White" }, { hex: "#795548", name: "Foundation Brown" }, { hex: "#4CAF50", name: "Recovery Green" }],
    bearings: ["N 30°00\'00\" E — 14.00m", "S 60°00\'00\" E — 10.00m", "S 30°00\'00\" W — 14.00m", "N 60°00\'00\" W — 10.00m"],
    siteArea: "140.00 sqm", siteLocation: "Tacloban City, Leyte",
    inspirations: [{ name: "DOST Resilient House", architect: "DOST-ACERD", why: "Filipino post-disaster housing using improved bamboo technology" }, { name: "Casapueblo", architect: "Carlos Paez Vilaro", why: "Sculptural mass as wind-resistant form" }, { name: "Post-Haiyan Bahay Resilyente", architect: "Multiple Firms", why: "The architecture community responding to the storm" }],
  },
  {
    title: "Architecture in 6 Lines", category: "Conceptual / Speed Sketch", difficulty: "Easy", duration: "15 mins",
    prompt: "Draw a complete, readable architectural concept using exactly 6 lines. No more. Convey space, structure, and light.",
    constraints: ["Exactly 6 lines", "Must be readable as architecture, not abstract art", "No text labels allowed"],
    deliverable: "1 sketch with exactly 6 lines",
    tip: "This is the hardest challenge on this list. Simplicity is the ultimate sophistication.", color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5",
    architecturalStyle: "Diagrammatic Minimalism",
    colorPalette: [{ hex: "#2C2C2C", name: "Line Black" }, { hex: "#F5F0E8", name: "White Space" }, { hex: "#D4AF37", name: "Essential Gold" }, { hex: "#4A90D9", name: "Sky Implied" }],
    bearings: ["N 00°00\'00\" E — implied", "S 90°00\'00\" E — implied", "S 00°00\'00\" W — implied", "N 90°00\'00\" W — implied"],
    siteArea: "Implied by the 6 lines", siteLocation: "Universal",
    inspirations: [{ name: "Maison Domino Sketch", architect: "Le Corbusier", why: "The most influential architectural drawing of the 20th century — 6 lines" }, { name: "Pritzker Prize Diagram", architect: "Various", why: "Great architects can explain their entire philosophy in one drawing" }, { name: "Piano + Rogers Competition Sketch", architect: "Renzo Piano", why: "The Pompidou Centre won with the simplest concept sketch" }],
  },
  {
    title: "People-First Street", category: "Urban Design / Landscape", difficulty: "Master", duration: "8 hrs",
    prompt: "Redesign a 200m stretch of a typical Manila street to prioritize pedestrians, cyclists, and vendors — without removing a single vehicle lane.",
    constraints: ["All existing vehicle lanes must be retained", "Sidewalk minimum width: 3m", "Must include: tree canopy, vendor spaces, bicycle lane, and seating"],
    deliverable: "Before/after street section, plan view 200m stretch, cross-section at 3 key points, perspective sketch",
    tip: "Gehl Architects proved in Copenhagen that when you design for people, more people come. Then fewer cars follow.", color: "text-red-400 border-red-400/20 bg-red-400/5",
    architecturalStyle: "Urban Design / Tactical Urbanism",
    colorPalette: [{ hex: "#4CAF50", name: "Tree Green" }, { hex: "#FF9800", name: "Vendor Orange" }, { hex: "#1565C0", name: "Bike Blue" }, { hex: "#F5F5F5", name: "Pavement Gray" }],
    bearings: ["N 00°00\'00\" E — 200.00m (street length)", "S 90°00\'00\" E — 18.00m (ROW width)", "S 00°00\'00\" W — 200.00m", "N 90°00\'00\" W — 18.00m"],
    siteArea: "3,600.00 sqm (ROW)", siteLocation: "Espana Boulevard, Manila",
    inspirations: [{ name: "Superilles Barcelona", architect: "Salvador Rueda / BCNecologia", why: "Taking back the street from cars by making it a living room" }, { name: "High Line NYC", architect: "Diller Scofidio + Renfro", why: "Infrastructure reclaimed as a public park" }, { name: "Paseo de Gracia", architect: "Ildefons Cerda", why: "The original people-first boulevard — chamfered corners as gift to the city" }],
  },
];

export default function App() {
  const { user } = useUser();
  const [currentView, setCurrentView] = useState<'dashboard' | 'calendar' | 'gantt' | 'profile' | 'friends'>('dashboard');
  const [profileTab, setProfileTab] = useState<'profile' | 'friends' | 'collab'>('profile');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Convex queries
  const convexUser = useQuery(api.users.getUser, user?.id ? { clerkId: user.id } : "skip");
  const projectsData = useQuery(api.projects.getUserProjects, user?.id ? { clerkId: user.id } : "skip");
  const journalData = useQuery(api.journal.getJournalEntries, user?.id ? { clerkId: user.id } : "skip");
  const challengeData = useQuery(api.challenges.getChallengeProgress, user?.id ? { clerkId: user.id } : "skip");
  const friendsData = useQuery(api.friends.getFriends, user?.id ? { clerkId: user.id } : "skip");
  // COLLAB QUERIES — uncomment after running: npx convex dev (with collaborations.ts in convex/)
  // const invitationsSent = useQuery(api.collaborations.getInvitationsSent, user?.id && profileTab === 'collab' ? { clerkId: user.id } : "skip");
  // const invitationsReceived = useQuery(api.collaborations.getInvitationsReceived, user?.id && profileTab === 'collab' ? { clerkId: user.id } : "skip");
  const invitationsSent: any[] = [];
  const invitationsReceived: any[] = [];

  // Convex mutations
  const acceptProjectMutation = useMutation(api.projects.acceptProject);
  const discardProjectMutation = useMutation(api.projects.discardProject);
  const submitProjectMutation = useMutation(api.projects.submitProject);
  const uploadFileMutation = useMutation(api.projects.uploadFile);
  const updateProfileMutation = useMutation(api.users.updateProfile);
  const addJournalEntryMutation = useMutation(api.journal.addJournalEntry);
  const deleteJournalEntryMutation = useMutation(api.journal.deleteJournalEntry);
  const acceptChallengeMutation = useMutation(api.challenges.acceptChallenge);
  const completeChallengeMutation = useMutation(api.challenges.completeChallenge);
  const abandonChallengeMutation = useMutation(api.challenges.abandonChallenge);
  const addFriendMutation = useMutation(api.friends.addFriend);
  const removeFriendMutation = useMutation(api.friends.removeFriend);
  // COLLAB MUTATIONS — uncomment after deploying collaborations.ts
  // const sendInvitationMutation = useMutation(api.collaborations.sendInvitation);
  // const acceptInvitationMutation = useMutation(api.collaborations.acceptInvitation);
  // const declineInvitationMutation = useMutation(api.collaborations.declineInvitation);
  // const cancelInvitationMutation = useMutation(api.collaborations.cancelInvitation);
  const sendInvitationMutation = async (_args: any) => {};
  const acceptInvitationMutation = async (_args: any) => {};
  const declineInvitationMutation = async (_args: any) => {};
  const cancelInvitationMutation = async (_args: any) => {};

  // Derived state from Convex data
  const acceptedData = useMemo(() => projectsData?.accepted || {}, [projectsData]);
  const submittedIds = useMemo(() => projectsData?.submitted || [], [projectsData]);
  const uploadedFiles = useMemo(() => projectsData?.uploadedFiles || {}, [projectsData]);
  const journalEntries = useMemo(() => journalData || [], [journalData]);
  const challengeAccepted = useMemo(() => challengeData || null, [challengeData]);

  type ProfileType = {
    name: string; title: string; school: string; firm: string; bio: string; avatarUrl: string;
    specialties: string[]; designPreferences: string[];
  };
  const defaultProfile: ProfileType = { name: '', title: 'Student Architect', school: '', firm: '', bio: '', avatarUrl: '', specialties: [], designPreferences: [] };

  // Profile data from Convex user
  const profileData = useMemo<ProfileType>(() => {
    if (convexUser) {
      return {
        name: convexUser.name || user?.fullName || '',
        title: convexUser.title || 'Student Architect',
        school: convexUser.school || '',
        firm: convexUser.firm || '',
        bio: convexUser.bio || '',
        avatarUrl: convexUser.imageUrl || user?.imageUrl || '',
        specialties: convexUser.specialties || [],
        designPreferences: convexUser.designPreferences || [],
      };
    }
    return {
      ...defaultProfile,
      name: user?.fullName || user?.firstName || '',
      avatarUrl: user?.imageUrl || '',
    };
  }, [convexUser, user]);

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState<ProfileType>(defaultProfile);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Sync profile draft when profile data changes
  useEffect(() => {
    setProfileDraft(profileData);
  }, [profileData]);

  // Friends data from Convex
  type Friend = { id: string; name: string; title: string; school: string; firm: string; avatarUrl: string; specialties: string[]; addedAt: number };
  const friends = useMemo((): Friend[] => {
    return friendsData || [];
  }, [friendsData]);
  
  // User's friend code from Convex
  const friendCode = useMemo(() => {
    return convexUser?.friendCode || '';
  }, [convexUser]);
  
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [addFriendError, setAddFriendError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteProjectId, setInviteProjectId] = useState<string | null>(null);
  const [inviteRecipientCode, setInviteRecipientCode] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [globalTime, setGlobalTime] = useState(Date.now());
  const [filter, setFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [pomoTime, setPomoTime] = useState(25 * 60);
  const [pomoActive, setPomoActive] = useState(false);
  const [pomoMode, setPomoMode] = useState<'work' | 'break'>('work');
  const [workDuration] = useState(25);
  const [breakDuration] = useState(5);

  const [newEntry, setNewEntry] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [confirmDiscard, setConfirmDiscard] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [uploadingChallenge, setUploadingChallenge] = useState(false);
  const challengeFileInputRef = useRef<HTMLInputElement>(null);

  // Hidden file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUploadTarget = useRef<string | null>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setProfileDraft(prev => ({ ...prev, avatarUrl: url }));
    };
    reader.readAsDataURL(file);
  };

  const ARCH_QUOTES = [
    "Architecture is the learned game, correct and magnificent, of forms assembled in the light.",
    "The mother art is the art of building. Nothing is architecture unless it serves the way of life.",
    "To provide an end to end user experience",
    "Quality is not an act, it is a habit.",
    "We shape our buildings; thereafter they shape us.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "Form follows function -- that has been misunderstood. Form and function should be one, joined in a spiritual union.",
    "Details make perfection, and perfection is not a detail."
  ];

  const dailyQuote = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return ARCH_QUOTES[dayOfYear % ARCH_QUOTES.length];
  }, []);

  const dailyDesign = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return DAILY_DESIGNS[dayOfYear % DAILY_DESIGNS.length];
  }, []);

  const dailyChallenge = useMemo(() => {
    // Offset by 7 so challenge rotates differently from design
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000) + 7;
    return DAILY_CHALLENGES[dayOfYear % DAILY_CHALLENGES.length];
  }, []);

  // Data is now persisted in Convex, no localStorage sync needed

  const handleAddFriend = async () => {
    const code = friendCodeInput.trim().toUpperCase();
    setAddFriendError('');
    
    if (!code) { 
      setAddFriendError('Enter a friend code first.'); 
      return; 
    }
    
    if (code === friendCode) { 
      setAddFriendError("That's your own code!"); 
      return; 
    }
    
    if (friends.find(f => f.id === code)) { 
      setAddFriendError('Already in your peers list.'); 
      return; 
    }

    try {
      if (user?.id) {
        await addFriendMutation({
          clerkId: user.id,
          friendCode: code,
        });
        setFriendCodeInput('');
        setAddFriendError('');
      }
    } catch (error: unknown) {
      setAddFriendError(error instanceof Error ? error.message : 'Failed to add friend');
    }
  };

  // XP & Level calculations
  const totalXP = useMemo(() => {
    return projects
      .filter(p => submittedIds.includes(p.id))
      .reduce((acc, p) => acc + (p.xp || 0), 0);
  }, [submittedIds]);

  const getLevelInfo = (xp: number) => {
    const levels = [
      { level: 1, title: 'Drafting Apprentice', minXP: 0, maxXP: 50 },
      { level: 2, title: 'Junior Technician', minXP: 50, maxXP: 150 },
      { level: 3, title: 'Design Associate', minXP: 150, maxXP: 300 },
      { level: 4, title: 'Project Architect', minXP: 300, maxXP: 500 },
      { level: 5, title: 'Senior Designer', minXP: 500, maxXP: 750 },
      { level: 6, title: 'Studio Lead', minXP: 750, maxXP: 1050 },
      { level: 7, title: 'Principal Architect', minXP: 1050, maxXP: 1400 },
      { level: 8, title: 'Design Director', minXP: 1400, maxXP: 1800 },
      { level: 9, title: 'Master Builder', minXP: 1800, maxXP: 2300 },
      { level: 10, title: 'Legendary Architect', minXP: 2300, maxXP: 9999 },
    ];
    const current = levels.findLast(l => xp >= l.minXP) || levels[0];
    const next = levels.find(l => l.level === current.level + 1);
    const progress = next ? Math.min(100, Math.round(((xp - current.minXP) / (next.minXP - current.minXP)) * 100)) : 100;
    return { ...current, progress, nextXP: next?.minXP || current.maxXP, xpInLevel: xp - current.minXP, xpNeeded: next ? next.minXP - current.minXP : 0 };
  };

  useEffect(() => {
    const timer = setInterval(() => setGlobalTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let interval: number;
    if (pomoActive && pomoTime > 0) { interval = setInterval(() => setPomoTime(prev => prev - 1), 1000); }
    else if (pomoTime === 0) {
      setPomoActive(false);
      const next = pomoMode === 'work' ? 'break' : 'work';
      setPomoMode(next);
      setPomoTime((next === 'work' ? workDuration : breakDuration) * 60);
    }
    return () => clearInterval(interval);
  }, [pomoActive, pomoTime, pomoMode, workDuration, breakDuration]);

  const resetPomo = () => {
    setPomoActive(false);
    setPomoTime((pomoMode === 'work' ? workDuration : breakDuration) * 60);
  };

  const formatPomo = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getRemainingTime = useCallback((projectId: string) => {
    const start = acceptedData[projectId];
    const project = (projects || []).find(p => p.id === projectId);
    if (!start || !project) return null;
    const diff = (start + (project.durationDays * 86400000)) - globalTime;
    if (diff <= 0) return { text: "OVERDUE", color: "text-red-500" };
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { text: `${d}d ${h}h ${m}m ${s}s`, color: d < 2 ? "text-orange-400" : "text-blue-400" };
  }, [acceptedData, globalTime]);

  const getProgress = (id: string) => {
    const p = (projects || []).find(x => x.id === id);
    if (!p) return 0;
    const count = Object.keys(uploadedFiles[id] || {}).length;
    return Math.round((count / (p.requiredFiles?.length || 1)) * 100);
  };

  const handleAuth = () => {
    if (!window.google) return;
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (res: { access_token?: string }) => { if (res.access_token) setAccessToken(res.access_token); },
    });
    client.requestAccessToken();
  };

  // Helper: find or create a Drive folder by name under a parent
  const getOrCreateFolder = async (name: string, parentId: string | null, token: string): Promise<string> => {
    // Search for existing folder
    const query = parentId
      ? `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
      : `name='${name}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`;

    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // Create new folder
    const meta: { name: string; mimeType: string; parents?: string[] } = { name, mimeType: 'application/vnd.google-apps.folder' };
    if (parentId) meta.parents = [parentId];
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(meta),
    });
    const folder = await createRes.json();
    return folder.id;
  };

  // Trigger local file picker
  const openFilePicker = (fileName: string) => {
    if (!selectedProject) return;
    currentUploadTarget.current = fileName;
    fileInputRef.current?.click();
  };

  // Upload selected local file to Google Drive inside organized folders
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const fileName = currentUploadTarget.current;
    if (!file || !fileName || !selectedProject || !accessToken) return;

    setUploadingFile(fileName);

    try {
      // 1. Get or create root "Arki Challenge" folder
      const rootFolderId = await getOrCreateFolder('Arki Challenge', null, accessToken);

      // 2. Get or create project subfolder e.g. "[PLATE-07] Greenfield Elementary School"
      const projectFolderName = `${selectedProject.plateNumber} — ${selectedProject.title}`;
      const projectFolderId = await getOrCreateFolder(projectFolderName, rootFolderId, accessToken);

      // 3. Upload file into the project folder
      const metadata = {
        name: `${fileName} — ${file.name}`,
        mimeType: file.type,
        parents: [projectFolderId],
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });

      if (res.ok) {
        const driveFile = await res.json();
        // Upload file info to Convex
        if (user?.id) {
          await uploadFileMutation({
            clerkId: user.id,
            projectId: selectedProject.id,
            fileName: file.name,
            fileType: fileName,
            driveId: driveFile.id,
          });
        }
      } else {
        alert('Upload failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Upload error. Check your connection and try again.');
    } finally {
      setUploadingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const addJournalEntry = async () => {
    if (!newEntry.trim() || !user?.id) return;
    await addJournalEntryMutation({
      clerkId: user.id,
      text: newEntry,
    });
    setNewEntry('');
  };

  // Upload challenge deliverable to Google Drive → Arki Challenge / Daily Challenges / [date] Challenge Title
  const handleChallengeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !challengeAccepted || !accessToken) return;
    setUploadingChallenge(true);
    try {
      // 1. Root Arki Challenge folder
      const rootId = await getOrCreateFolder('Arki Challenge', null, accessToken);
      // 2. Daily Challenges subfolder
      const challengesFolderId = await getOrCreateFolder('Daily Challenges', rootId, accessToken);
      // 3. Per-challenge folder: [Mar 15] The 9sqm Studio
      const dateStr = new Date(challengeAccepted.acceptedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
      const challengeFolderName = `[${dateStr}] ${challengeAccepted.title}`;
      const challengeFolderId = await getOrCreateFolder(challengeFolderName, challengesFolderId, accessToken);
      // 4. Upload file
      const metadata = { name: file.name, mimeType: file.type, parents: [challengeFolderId] };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);
      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });
      if (res.ok) {
        const driveFile = await res.json();
        // TODO: Update challenge files - this needs to be handled when completing the challenge
        console.log('Challenge file uploaded:', { name: file.name, driveId: driveFile.id });
      } else {
        alert('Upload failed. Please try again.');
      }
    } catch {
      alert('Upload error. Check your connection.');
    } finally {
      setUploadingChallenge(false);
      if (challengeFileInputRef.current) challengeFileInputRef.current.value = '';
    }
  };

  const calendarDays = useMemo(() => {
    const startOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
    const endOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
    const days = [];
    const startDay = startOfMonth.getDay();
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= endOfMonth.getDate(); i++) days.push(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), i));
    return days;
  }, [calendarDate]);

  const getDeadlinesForDate = (date: Date) => {
    return (projects || []).filter(p => {
      const acceptedAt = acceptedData[p.id];
      if (!acceptedAt) return false;
      const deadline = new Date(acceptedAt + (p.durationDays * 24 * 60 * 60 * 1000));
      return deadline.toDateString() === date.toDateString();
    });
  };

  const levelInfo = getLevelInfo(totalXP);
  const totalPoints = projects.filter(p => submittedIds.includes(p.id)).reduce((acc, p) => acc + ((p as any).points || 0), 0);

  const filtered = projects.filter(p => {
    const categoryMatch = filter === 'all' || p.category === filter;
    const difficultyMatch = difficultyFilter === 'all' || p.difficulty === difficultyFilter;
    const statusMatch =
      statusFilter === 'all' ||
      (statusFilter === 'active' && acceptedData[p.id] && !submittedIds.includes(p.id)) ||
      (statusFilter === 'submitted' && submittedIds.includes(p.id)) ||
      (statusFilter === 'open' && !acceptedData[p.id]);
    return categoryMatch && difficultyMatch && statusMatch;
  });
  const activeProjects = projects.filter(p => acceptedData[p.id] && !submittedIds.includes(p.id));

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-200 flex font-sans selection:bg-architectural-yellow selection:text-black overflow-hidden relative">

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelected}
      />
      {/* Hidden challenge file input */}
      <input ref={challengeFileInputRef} type="file" className="hidden" multiple onChange={handleChallengeFileUpload} />
      {/* Hidden avatar input */}
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

      <aside className="w-64 border-r border-white/10 bg-black/40 backdrop-blur-2xl fixed h-full z-[60] flex flex-col p-6 shadow-2xl">
        <a href="/" className="flex items-center gap-3 mb-6 group">
          <div className="w-10 h-10 bg-architectural-yellow text-black flex items-center justify-center font-bold text-xl rounded-xl shadow-lg group-hover:scale-105 transition-transform">A</div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest leading-tight text-white group-hover:text-architectural-yellow transition-colors">Arki<br />Challenge</div>
        </a>
        
        {/* User Profile Section */}
        <div className="flex items-center gap-3 mb-8 p-3 bg-white/5 rounded-xl border border-white/5">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-architectural-yellow/20 flex items-center justify-center">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Icons.User size={18} className="text-architectural-yellow" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.firstName || 'Architect'}</p>
            <p className="text-[9px] font-mono text-gray-500 truncate">{user?.primaryEmailAddress?.emailAddress || ''}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
          <button onClick={() => setCurrentView('dashboard')} className={cn("w-full flex items-center gap-3 p-3 rounded-lg text-xs font-mono transition-all", currentView === 'dashboard' ? "bg-white/5 text-architectural-yellow shadow-inner" : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]")}><Icons.Activity size={16} /> Dashboard</button>
          <button onClick={() => setCurrentView('calendar')} className={cn("w-full flex items-center gap-3 p-3 rounded-lg text-xs font-mono transition-all", currentView === 'calendar' ? "bg-white/5 text-architectural-yellow shadow-inner" : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]")}><Icons.Calendar size={16} /> Calendar</button>
          <button onClick={() => setCurrentView('gantt')} className={cn("w-full flex items-center gap-3 p-3 rounded-lg text-xs font-mono transition-all", currentView === 'gantt' ? "bg-white/5 text-architectural-yellow shadow-inner" : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]")}><Icons.GanttChart size={16} /> Gantt Chart</button>
          <button onClick={() => setCurrentView('profile')} className={cn("w-full flex items-center gap-3 p-3 rounded-lg text-xs font-mono transition-all", currentView === 'profile' ? "bg-white/5 text-architectural-yellow shadow-inner" : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]")}><Icons.User size={16} /> Profile</button>

          <div className="pt-6 border-t border-white/5 space-y-3">
            <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest font-black flex items-center gap-1.5"><Icons.Filter size={9} /> Filters</p>

            {/* Category */}
            <div>
              <label className="text-[8px] font-mono text-gray-700 uppercase font-black block mb-1">Category</label>
              <div className="relative">
                <select
                  value={filter}
                  onChange={e => { setFilter(e.target.value); setCurrentView('dashboard'); }}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-mono text-gray-300 uppercase focus:border-architectural-yellow outline-none cursor-pointer hover:bg-white/10 transition-all pr-7"
                >
                  {['all', 'residential', 'commercial', 'industrial', 'institutional', 'infrastructure', 'high-rise'].map(c => (
                    <option key={c} value={c} className="bg-[#0f1115] text-gray-300">{c === 'all' ? 'All Categories' : c}</option>
                  ))}
                </select>
                <Icons.ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="text-[8px] font-mono text-gray-700 uppercase font-black block mb-1">Difficulty</label>
              <div className="relative">
                <select
                  value={difficultyFilter}
                  onChange={e => { setDifficultyFilter(e.target.value); setCurrentView('dashboard'); }}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-mono text-gray-300 uppercase focus:border-architectural-yellow outline-none cursor-pointer hover:bg-white/10 transition-all pr-7"
                >
                  <option value="all" className="bg-[#0f1115]">All Levels</option>
                  <option value="Easy" className="bg-[#0f1115]">Easy</option>
                  <option value="Medium" className="bg-[#0f1115]">Medium</option>
                  <option value="Hard" className="bg-[#0f1115]">Hard</option>
                  <option value="Master" className="bg-[#0f1115]">Master</option>
                </select>
                <Icons.ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-[8px] font-mono text-gray-700 uppercase font-black block mb-1">Status</label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setCurrentView('dashboard'); }}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-mono text-gray-300 uppercase focus:border-architectural-yellow outline-none cursor-pointer hover:bg-white/10 transition-all pr-7"
                >
                  <option value="all" className="bg-[#0f1115]">All Projects</option>
                  <option value="open" className="bg-[#0f1115]">Open</option>
                  <option value="active" className="bg-[#0f1115]">In Production</option>
                  <option value="submitted" className="bg-[#0f1115]">Submitted</option>
                </select>
                <Icons.ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Clear button */}
            {(filter !== 'all' || difficultyFilter !== 'all' || statusFilter !== 'all') && (
              <button onClick={() => { setFilter('all'); setDifficultyFilter('all'); setStatusFilter('all'); }} className="w-full py-2 text-[9px] font-mono text-red-500/60 uppercase font-black hover:text-red-400 transition-all flex items-center justify-center gap-1.5">
                <Icons.X size={9} /> Clear Filters
              </button>
            )}
          </div>
        </nav>
        <div className="mt-8 space-y-2">
          <button onClick={handleAuth} className="w-full py-3 border border-white/10 rounded-lg font-mono text-[10px] uppercase hover:bg-architectural-yellow hover:text-black transition-all font-bold tracking-widest">
            {accessToken ? '✓ DRIVE LINKED' : 'CONNECT DRIVE'}
          </button>
          <SignOutButton>
            <button className="w-full py-3 border border-white/10 rounded-lg font-mono text-[10px] uppercase hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 transition-all font-bold tracking-widest text-gray-500 flex items-center justify-center gap-2">
              <Icons.LogOut size={12} /> Sign Out
            </button>
          </SignOutButton>
        </div>
      </aside>

      <main className="ml-64 mr-80 flex-1 p-12 overflow-y-auto h-screen relative z-10">
        {currentView === 'dashboard' ? (
          <>
            <header className="flex justify-between items-end mb-16 border-b border-white/5 pb-8">
              <div><h1 className="text-4xl font-bold uppercase tracking-tighter mb-1 text-white">Design Workspace</h1><p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest">{submittedIds.length} Projects Lodged</p></div>
              <div className="bg-architectural-slate/40 border border-white/10 p-4 rounded-xl min-w-[140px] text-center"><span className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Firm Capacity</span><span className="text-3xl font-bold text-architectural-yellow">{Math.round((submittedIds.length / projects.length) * 100)}%</span></div>
            </header>

            {activeProjects.length > 0 && (
              <section className="mb-16">
                <div className="flex items-center gap-3 mb-8"><Icons.Timer className="text-architectural-yellow" size={20} /><h2 className="text-sm font-mono font-bold uppercase tracking-[0.3em] text-white">Active Production</h2></div>
                <div className="grid grid-cols-1 gap-6">
                  {activeProjects.map(p => {
                    const time = getRemainingTime(p.id);
                    const progress = getProgress(p.id);
                    return (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={`active-${p.id}`} onClick={() => setSelectedProject(p)} className={cn("group p-8 rounded-2xl border bg-architectural-slate/60 cursor-pointer flex flex-col gap-6 relative overflow-hidden transition-all", time?.text === "OVERDUE" ? "border-red-500" : "border-blue-500")}>
                        <div className="flex justify-between items-start mb-8">
                          <div className="space-y-3"><div className="flex items-center gap-3"><span className="font-mono text-[10px] text-architectural-yellow bg-architectural-yellow/10 px-2 py-0.5 rounded">{p.plateNumber}</span><DifficultyBadge level={p.difficulty} /></div><h3 className="text-3xl font-bold tracking-tight text-white">{p.title}</h3><div className="flex flex-wrap gap-2">{p.software.map(s => <SoftwareBadge key={s} s={s} />)}</div></div>
                          <div className="text-right bg-black/20 p-4 rounded-xl border border-white/5"><span className="text-[10px] font-mono text-gray-500 block uppercase mb-1">Production Window</span><span className={cn("text-2xl font-bold font-mono tracking-tighter", time?.color)}>{time?.text}</span></div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-end px-1"><span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold">Documentation Status</span><span className="text-xs font-mono font-bold text-blue-400">{progress}%</span></div>
                          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden shadow-inner"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className={cn("h-full transition-all duration-1000 ease-out", progress === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-blue-600 to-blue-400")} /></div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            <section>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3"><Icons.LayoutGrid className="text-gray-500" size={20} /><h2 className="text-sm font-mono font-bold uppercase tracking-[0.3em] text-white">Project Inquiries</h2><span className="text-[10px] font-mono text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">{filtered.length}</span></div>
                {(filter !== 'all' || difficultyFilter !== 'all' || statusFilter !== 'all') && (
                  <button onClick={() => { setFilter('all'); setDifficultyFilter('all'); setStatusFilter('all'); }} className="text-[9px] font-mono text-gray-500 uppercase hover:text-white transition-colors flex items-center gap-1"><Icons.X size={10} /> Clear Filters</button>
                )}
              </div>
              {(filter !== 'all' || difficultyFilter !== 'all' || statusFilter !== 'all') && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {filter !== 'all' && <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-mono text-architectural-yellow uppercase"><Icons.LayoutGrid size={9} />{filter}<button onClick={() => setFilter('all')} className="ml-1 hover:text-white"><Icons.X size={8} /></button></span>}
                  {difficultyFilter !== 'all' && <span className={cn("flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-mono uppercase", difficultyFilter === 'Easy' ? 'text-emerald-400' : difficultyFilter === 'Medium' ? 'text-blue-400' : difficultyFilter === 'Hard' ? 'text-orange-400' : 'text-red-400')}><Icons.Star size={9} />{difficultyFilter}<button onClick={() => setDifficultyFilter('all')} className="ml-1 hover:text-white"><Icons.X size={8} /></button></span>}
                  {statusFilter !== 'all' && <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-mono text-gray-300 uppercase"><Icons.Filter size={9} />{statusFilter}<button onClick={() => setStatusFilter('all')} className="ml-1 hover:text-white"><Icons.X size={8} /></button></span>}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filtered.length === 0 && (
                  <div className="col-span-3 py-24 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem]">
                    <Icons.SearchX size={48} className="mx-auto text-gray-800 mb-4" />
                    <p className="text-gray-600 font-mono text-[10px] uppercase font-black">No projects match your filters</p>
                    <button onClick={() => { setFilter('all'); setDifficultyFilter('all'); setStatusFilter('all'); }} className="mt-4 text-[9px] font-mono text-architectural-yellow uppercase hover:underline">Clear all filters</button>
                  </div>
                )}
                {filtered.map(p => (
                  <motion.div whileHover={{ y: -8 }} key={p.id} onClick={() => setSelectedProject(p)} className={cn("bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-white/20 hover:shadow-2xl transition-all duration-500", submittedIds.includes(p.id) && "opacity-40 grayscale")}>
                    <div className="aspect-[16/10] relative overflow-hidden"><img src={p.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" /><div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-transparent p-6 flex flex-col justify-end">
                      <div className="flex items-center gap-2 mb-2"><span className="font-mono text-[9px] text-architectural-yellow border border-architectural-yellow/30 px-1.5 rounded">{p.plateNumber}</span><DifficultyBadge level={p.difficulty} /></div><h4 className="font-bold text-lg text-white leading-tight">{p.title}</h4></div></div>
                    <div className="p-6 space-y-5"><div className="flex flex-wrap gap-1.5">{p.software.slice(0, 3).map(s => <SoftwareBadge key={s} s={s} />)}</div><div className="flex items-center justify-between text-[10px] font-mono text-gray-500 uppercase border-t border-white/5 pt-4"><span>{p.category}</span><div className="flex items-center gap-3"><span className="text-architectural-yellow font-black flex items-center gap-1"><Icons.Star size={9} fill="currentColor" />{(p as any).points} pts</span><span className="text-blue-400 font-black flex items-center gap-1"><Icons.Zap size={9} />{(p as any).xp} xp</span><div className="flex items-center gap-1 text-white font-bold group-hover:text-architectural-yellow transition-colors uppercase">VIEW INQUIRY <Icons.ChevronRight size={12} /></div></div></div></div>
                  </motion.div>
                ))}
              </div>
            </section>
          </>
        ) : currentView === 'calendar' ? (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 h-full flex flex-col">
            <header className="mb-12 flex items-center justify-between"><div><h1 className="text-4xl font-black uppercase tracking-tighter text-white">Studio Schedule</h1></div>
              <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/10">
                <button onClick={(e) => { e.stopPropagation(); setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1)); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors pointer-events-auto"><Icons.ChevronLeft size={20} /></button>
                <span className="font-mono text-sm font-black min-w-[150px] text-center uppercase tracking-tighter">{calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                <button onClick={(e) => { e.stopPropagation(); setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1)); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors rotate-180 pointer-events-auto"><Icons.ChevronLeft size={20} /></button>
              </div>
            </header>
            <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] overflow-hidden flex-1 grid grid-rows-[auto_1fr] min-h-[600px] shadow-2xl backdrop-blur-md">
              <div className="grid grid-cols-7 border-b border-white/10 bg-white/5">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (<div key={d} className="p-4 text-center text-[10px] font-mono text-gray-500 font-black tracking-[0.2em]">{d}</div>))}
              </div>
              <div className="grid grid-cols-7 flex-1">
                {calendarDays.map((day, i) => {
                  const deadlines = day ? getDeadlinesForDate(day) : [];
                  const isToday = day?.toDateString() === new Date().toDateString();
                  return (
                    <div key={i} className={cn("min-h-[120px] p-4 border-r border-b border-white/5 flex flex-col gap-2 transition-all hover:bg-white/[0.02]", !day && "bg-black/20", isToday && "bg-architectural-yellow/[0.05]")}>
                      {day && (
                        <>
                          <span className={cn("text-xs font-mono font-black", isToday ? "text-architectural-yellow" : "text-gray-600")}>{day.getDate()}</span>
                          <div className="space-y-1">
                            {deadlines.map(p => (
                              <button key={p.id} onClick={(e) => { e.stopPropagation(); setSelectedProject(p); }} className={cn("w-full text-[8px] font-mono p-1.5 rounded-lg border text-left flex flex-col gap-0.5 transition-all hover:scale-[1.02] pointer-events-auto", submittedIds.includes(p.id) ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-blue-500/10 border-blue-500/30 text-blue-400")}><span className="font-black truncate">{p.plateNumber}</span><span className="opacity-60 truncate font-bold uppercase">Lodgment</span></button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.section>
        ) : currentView === 'gantt' ? (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 h-full flex flex-col">
            <header className="mb-10 flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Gantt Chart</h1>
                <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest mt-1">Production Timeline — Active Projects</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-[9px] font-mono uppercase text-gray-500"><span className="w-3 h-3 rounded-sm bg-blue-500/60 inline-block" />In Progress</div>
                <div className="flex items-center gap-2 text-[9px] font-mono uppercase text-gray-500"><span className="w-3 h-3 rounded-sm bg-emerald-500/60 inline-block" />Submitted</div>
                <div className="flex items-center gap-2 text-[9px] font-mono uppercase text-gray-500"><span className="w-3 h-3 rounded-sm bg-red-500/60 inline-block" />Overdue</div>
              </div>
            </header>

            {Object.keys(acceptedData).length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem]">
                <Icons.GanttChart size={48} className="mx-auto text-gray-800 mb-4" />
                <p className="text-gray-600 font-mono text-[10px] uppercase font-black">No active projects yet</p>
                <p className="text-gray-700 font-mono text-[9px] uppercase mt-2">Start a project to see it on the timeline</p>
              </div>
            ) : (() => {
              // Build timeline bounds
              const acceptedProjects = projects.filter(p => acceptedData[p.id]);
              const starts = acceptedProjects.map(p => acceptedData[p.id]);
              const ends = acceptedProjects.map(p => acceptedData[p.id] + p.durationDays * 86400000);
              const minTime = Math.min(...starts);
              const maxTime = Math.max(...ends);
              const totalMs = maxTime - minTime || 1;

              // Build day columns
              const totalDays = Math.ceil(totalMs / 86400000) + 1;
              const dayLabels: Date[] = [];
              for (let i = 0; i <= totalDays; i++) {
                dayLabels.push(new Date(minTime + i * 86400000));
              }
              const today = Date.now();
              const todayLeft = Math.max(0, Math.min(100, ((today - minTime) / totalMs) * 100));

              const diffColor: Record<string, string> = {
                Easy: 'bg-emerald-500',
                Medium: 'bg-blue-500',
                Hard: 'bg-orange-500',
                Master: 'bg-red-500',
              };

              return (
                <div className="flex-1 overflow-auto custom-scrollbar rounded-[2rem] border border-white/10 bg-white/[0.02] shadow-2xl">
                  <div className="min-w-[900px]">

                    {/* Day header */}
                    <div className="flex border-b border-white/10 bg-white/5 sticky top-0 z-10">
                      <div className="w-64 shrink-0 p-4 text-[9px] font-mono text-gray-500 uppercase font-black border-r border-white/10">Project</div>
                      <div className="flex-1 relative h-12 overflow-hidden">
                        {dayLabels.filter((_, i) => i % Math.max(1, Math.floor(totalDays / 12)) === 0).map((d, i) => (
                          <div key={i} className="absolute top-0 h-full flex flex-col justify-center" style={{ left: `${((d.getTime() - minTime) / totalMs) * 100}%` }}>
                            <span className="text-[8px] font-mono text-gray-600 whitespace-nowrap pl-1">{d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        ))}
                        {/* Today line label */}
                        <div className="absolute top-0 h-full flex flex-col justify-end pb-1" style={{ left: `${todayLeft}%` }}>
                          <span className="text-[8px] font-mono text-architectural-yellow whitespace-nowrap pl-1 font-black">TODAY</span>
                        </div>
                      </div>
                    </div>

                    {/* Rows */}
                    {acceptedProjects.map((p, idx) => {
                      const start = acceptedData[p.id];
                      const end = start + p.durationDays * 86400000;
                      const leftPct = ((start - minTime) / totalMs) * 100;
                      const widthPct = ((end - start) / totalMs) * 100;
                      const isSubmitted = submittedIds.includes(p.id);
                      const isOverdue = !isSubmitted && today > end;
                      const progress = getProgress(p.id);

                      const barColor = isSubmitted
                        ? 'bg-emerald-500/70 border-emerald-400/40'
                        : isOverdue
                        ? 'bg-red-500/70 border-red-400/40'
                        : 'bg-blue-500/60 border-blue-400/30';

                      return (
                        <div key={p.id} className={cn("flex border-b border-white/5 hover:bg-white/[0.02] transition-all group", idx % 2 === 0 ? '' : 'bg-black/10')}>
                          {/* Project label */}
                          <div className="w-64 shrink-0 p-4 border-r border-white/5 flex flex-col justify-center gap-1 cursor-pointer" onClick={() => setSelectedProject(p)}>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-mono text-architectural-yellow bg-architectural-yellow/10 px-1.5 py-0.5 rounded">{p.plateNumber}</span>
                              <span className={cn("text-[8px] font-mono px-1.5 py-0.5 rounded border", {
                                Easy: 'text-emerald-400 border-emerald-400/20',
                                Medium: 'text-blue-400 border-blue-400/20',
                                Hard: 'text-orange-400 border-orange-400/20',
                                Master: 'text-red-400 border-red-400/20',
                              }[p.difficulty])}>{p.difficulty}</span>
                            </div>
                            <p className="text-[11px] font-bold text-white truncate group-hover:text-architectural-yellow transition-colors">{p.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full transition-all", diffColor[p.difficulty] || 'bg-blue-500')} style={{ width: `${progress}%`, opacity: 0.7 }} />
                              </div>
                              <span className="text-[8px] font-mono text-gray-500">{progress}%</span>
                            </div>
                          </div>

                          {/* Bar area */}
                          <div className="flex-1 relative py-4 px-2">
                            {/* Grid lines */}
                            {dayLabels.filter((_, i) => i % Math.max(1, Math.floor(totalDays / 12)) === 0).map((d, i) => (
                              <div key={i} className="absolute top-0 h-full w-px bg-white/[0.03]" style={{ left: `${((d.getTime() - minTime) / totalMs) * 100}%` }} />
                            ))}

                            {/* Today line */}
                            <div className="absolute top-0 h-full w-px bg-architectural-yellow/40 z-10" style={{ left: `${todayLeft}%` }} />

                            {/* Gantt bar */}
                            <div
                              className={cn("absolute top-1/2 -translate-y-1/2 h-8 rounded-xl border flex items-center px-3 cursor-pointer hover:brightness-125 transition-all shadow-lg", barColor)}
                              style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 1)}%` }}
                              onClick={() => setSelectedProject(p)}
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                {isSubmitted && <Icons.CheckCircle size={10} className="text-emerald-300 shrink-0" />}
                                {isOverdue && <Icons.AlertTriangle size={10} className="text-red-300 shrink-0" />}
                                {!isSubmitted && !isOverdue && <Icons.Clock size={10} className="text-blue-300 shrink-0" />}
                                <span className="text-[9px] font-mono font-black text-white truncate">
                                  {isSubmitted ? 'LODGED' : isOverdue ? 'OVERDUE' : getRemainingTime(p.id)?.text}
                                </span>
                              </div>
                              {/* Progress fill */}
                              {!isSubmitted && (
                                <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                                  <div className="h-full bg-white/10 rounded-xl" style={{ width: `${progress}%` }} />
                                </div>
                              )}
                            </div>

                            {/* Start/end date labels */}
                            <div className="absolute bottom-1 text-[7px] font-mono text-gray-600 whitespace-nowrap" style={{ left: `${leftPct}%` }}>
                              {new Date(start).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  </div>
                </div>
              );
            })()}
          </motion.section>
        ) : currentView === 'profile' ? (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

            {/* Profile / Friends / Collab Tab Switch */}
            <div className="flex gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl w-fit">
              <button onClick={() => setProfileTab('profile')} className={cn("px-6 py-2.5 rounded-xl text-xs font-mono uppercase font-black transition-all", profileTab === 'profile' ? "bg-white/10 text-white shadow-inner" : "text-gray-500 hover:text-gray-300")}>
                <span className="flex items-center gap-2"><Icons.User size={13} />My Profile</span>
              </button>
              <button onClick={() => setProfileTab('friends')} className={cn("px-6 py-2.5 rounded-xl text-xs font-mono uppercase font-black transition-all flex items-center gap-2", profileTab === 'friends' ? "bg-white/10 text-white shadow-inner" : "text-gray-500 hover:text-gray-300")}>
                <Icons.Users size={13} />Studio Peers
                {friends.length > 0 && <span className="bg-architectural-yellow text-black text-[8px] font-black px-1.5 py-0.5 rounded-full">{friends.length}</span>}
              </button>
              <button onClick={() => setProfileTab('collab')} className={cn("px-6 py-2.5 rounded-xl text-xs font-mono uppercase font-black transition-all flex items-center gap-2", profileTab === 'collab' ? "bg-white/10 text-white shadow-inner" : "text-gray-500 hover:text-gray-300")}>
                <Icons.Handshake size={13} />Collabs
                {((invitationsReceived as any[]) || []).filter((inv: any) => inv.status === 'pending').length > 0 && (
                  <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                    {((invitationsReceived as any[]) || []).filter((inv: any) => inv.status === 'pending').length}
                  </span>
                )}
              </button>
            </div>

            {profileTab === 'profile' ? (<>

            {/* PROFILE HEADER */}
            <div className="p-10 bg-white/[0.02] border border-white/10 rounded-[2rem] flex items-start gap-8 relative">
              {!editingProfile && (
                <button onClick={() => { setProfileDraft(profileData); setEditingProfile(true); }} className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono uppercase font-black text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                  <Icons.PencilLine size={12} /> Edit Profile
                </button>
              )}
              <div className="relative shrink-0">
                <div className="w-28 h-28 rounded-[1.5rem] overflow-hidden border-2 border-white/10 shadow-2xl bg-architectural-yellow flex items-center justify-center">
                  {profileData.avatarUrl ? <img src={profileData.avatarUrl} className="w-full h-full object-cover" alt="avatar" /> : <span className="text-black font-black text-3xl">{profileData.name ? profileData.name[0].toUpperCase() : 'A'}</span>}
                </div>
                {editingProfile && <button onClick={() => avatarInputRef.current?.click()} className="absolute -bottom-2 -right-2 p-2 bg-architectural-yellow text-black rounded-xl shadow-lg hover:brightness-110 transition-all"><Icons.Camera size={12} /></button>}
              </div>

              {editingProfile ? (
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[9px] font-mono text-gray-500 uppercase font-black block mb-1">Full Name</label><input value={profileDraft.name} onChange={e => setProfileDraft(p => ({ ...p, name: e.target.value }))} placeholder="Your name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:border-architectural-yellow outline-none transition-all" /></div>
                    <div><label className="text-[9px] font-mono text-gray-500 uppercase font-black block mb-1">Title / Role</label><input value={profileDraft.title} onChange={e => setProfileDraft(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Student Architect" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:border-architectural-yellow outline-none transition-all" /></div>
                    <div><label className="text-[9px] font-mono text-gray-500 uppercase font-black block mb-1 flex items-center gap-1"><Icons.GraduationCap size={9} /> School</label><input value={profileDraft.school} onChange={e => setProfileDraft(p => ({ ...p, school: e.target.value }))} placeholder="e.g. UST College of Architecture" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:border-architectural-yellow outline-none transition-all" /></div>
                    <div><label className="text-[9px] font-mono text-gray-500 uppercase font-black block mb-1 flex items-center gap-1"><Icons.Building2 size={9} /> Architectural Firm</label><input value={profileDraft.firm} onChange={e => setProfileDraft(p => ({ ...p, firm: e.target.value }))} placeholder="e.g. Juan dela Cruz Architects" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:border-architectural-yellow outline-none transition-all" /></div>
                  </div>
                  <div><label className="text-[9px] font-mono text-gray-500 uppercase font-black block mb-1">Bio</label><textarea value={profileDraft.bio} onChange={e => setProfileDraft(p => ({ ...p, bio: e.target.value }))} placeholder="Tell us about yourself..." rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:border-architectural-yellow outline-none resize-none transition-all" /></div>

                  {/* Specialties */}
                  <div>
                    <label className="text-[9px] font-mono text-gray-500 uppercase font-black block mb-2 flex items-center gap-1"><Icons.Cpu size={9} /> Software Specialties</label>
                    <div className="flex flex-wrap gap-2">
                      {['AutoCAD', 'Revit', 'SketchUp', 'Rhino', 'Grasshopper', 'Lumion', 'V-Ray', 'Enscape', 'ArchiCAD', 'Navisworks', 'Blender', '3ds Max', 'Adobe Suite', 'Civil 3D', 'BIM 360'].map(s => (
                        <button key={s} onClick={() => setProfileDraft(p => ({ ...p, specialties: p.specialties.includes(s) ? p.specialties.filter(x => x !== s) : [...p.specialties, s] }))} className={cn("px-3 py-1.5 rounded-xl text-[10px] font-mono font-black uppercase transition-all border", profileDraft.specialties.includes(s) ? "bg-architectural-yellow/20 border-architectural-yellow/40 text-architectural-yellow" : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300")}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Design Preferences */}
                  <div>
                    <label className="text-[9px] font-mono text-gray-500 uppercase font-black block mb-2 flex items-center gap-1"><Icons.Palette size={9} /> Design Preferences</label>
                    <div className="flex flex-wrap gap-2">
                      {['Filipino Vernacular', 'Japandi', 'Brutalism', 'Minimalism', 'Biophilic', 'Parametric', 'Art Deco', 'Tropical Modern', 'Industrial', 'Neoclassical', 'Deconstructivism', 'Organic', 'Scandinavian', 'Mediterranean', 'Futurism', 'Adaptive Reuse'].map(d => (
                        <button key={d} onClick={() => setProfileDraft(p => ({ ...p, designPreferences: p.designPreferences.includes(d) ? p.designPreferences.filter(x => x !== d) : [...p.designPreferences, d] }))} className={cn("px-3 py-1.5 rounded-xl text-[10px] font-mono font-black uppercase transition-all border", profileDraft.designPreferences.includes(d) ? "bg-blue-500/20 border-blue-500/40 text-blue-400" : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300")}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={async () => {
                      if (user?.id) {
                        await updateProfileMutation({
                          clerkId: user.id,
                          title: profileDraft.title,
                          school: profileDraft.school,
                          firm: profileDraft.firm,
                          bio: profileDraft.bio,
                          specialties: profileDraft.specialties,
                          designPreferences: profileDraft.designPreferences,
                        });
                      }
                      setEditingProfile(false);
                    }} className="px-6 py-2.5 bg-architectural-yellow text-black font-black rounded-xl text-xs font-mono uppercase hover:brightness-110 transition-all">Save Profile</button>
                    <button onClick={() => setEditingProfile(false)} className="px-6 py-2.5 bg-white/5 border border-white/10 text-gray-400 font-black rounded-xl text-xs font-mono uppercase hover:bg-white/10 transition-all">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <h1 className="text-4xl font-black uppercase tracking-tighter text-white">{profileData.name || user?.fullName || 'Unnamed Architect'}</h1>
                  <p className="text-architectural-yellow font-mono text-sm uppercase tracking-widest mt-1 font-bold">{profileData.title}</p>
                  {user?.primaryEmailAddress?.emailAddress && (
                    <p className="text-gray-500 font-mono text-xs mt-1 flex items-center gap-1.5">
                      <Icons.Mail size={12} /> {user.primaryEmailAddress.emailAddress}
                    </p>
                  )}
                  {profileData.bio && <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-xl">{profileData.bio}</p>}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {profileData.school && <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-mono text-blue-400 font-black"><Icons.GraduationCap size={11} />{profileData.school}</span>}
                    {profileData.firm && <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] font-mono text-purple-400 font-black"><Icons.Building2 size={11} />{profileData.firm}</span>}
                  </div>
                  {/* Specialties display */}
                  {profileData.specialties.length > 0 && (
                    <div className="mt-5">
                      <p className="text-[9px] font-mono text-gray-600 uppercase font-black mb-2 flex items-center gap-1"><Icons.Cpu size={9} /> Specialties</p>
                      <div className="flex flex-wrap gap-2">
                        {profileData.specialties.map(s => <span key={s} className="px-2.5 py-1 bg-architectural-yellow/10 border border-architectural-yellow/20 rounded-lg text-[10px] font-mono text-architectural-yellow font-black">{s}</span>)}
                      </div>
                    </div>
                  )}
                  {/* Design preferences display */}
                  {profileData.designPreferences.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[9px] font-mono text-gray-600 uppercase font-black mb-2 flex items-center gap-1"><Icons.Palette size={9} /> Design Preferences</p>
                      <div className="flex flex-wrap gap-2">
                        {profileData.designPreferences.map(d => <span key={d} className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-mono text-blue-400 font-black">{d}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* XP LEVEL BAR */}
            <div className="p-8 bg-white/[0.02] border border-white/10 rounded-[2rem] space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl font-black text-architectural-yellow">Level {levelInfo.level}</span>
                    <span className="text-sm font-mono text-gray-400 uppercase font-black tracking-widest">{levelInfo.title}</span>
                  </div>
                  <p className="text-[10px] font-mono text-gray-600 uppercase">{totalXP} XP total · {levelInfo.xpInLevel} / {levelInfo.xpNeeded || '∞'} XP this level</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-gray-500">{levelInfo.level < 10 ? `${levelInfo.nextXP - totalXP} XP to next level` : 'Legendary'}</p>
                </div>
              </div>
              <div className="relative h-4 bg-white/5 rounded-full overflow-hidden shadow-inner">
                <motion.div initial={{ width: 0 }} animate={{ width: `${levelInfo.progress}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} className="h-full rounded-full bg-gradient-to-r from-architectural-yellow via-yellow-400 to-amber-300 shadow-[0_0_12px_rgba(244,180,0,0.5)]" />
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-[9px] font-black font-mono text-black/70 uppercase tracking-widest drop-shadow">{levelInfo.progress}%</span></div>
              </div>
              <div className="flex justify-between text-[8px] font-mono text-gray-700 uppercase font-black px-1">
                {['1','2','3','4','5','6','7','8','9','10'].map(l => <span key={l} className={parseInt(l) <= levelInfo.level ? 'text-architectural-yellow' : ''}>{l}</span>)}
              </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-4 gap-6">
              <div className="p-6 bg-white/[0.02] border border-white/10 rounded-[2rem] text-center"><span className="text-[10px] font-mono text-gray-500 uppercase font-black block mb-3">Total XP</span><span className="text-3xl font-black text-architectural-yellow">{totalXP}</span></div>
              <div className="p-6 bg-white/[0.02] border border-white/10 rounded-[2rem] text-center"><span className="text-[10px] font-mono text-gray-500 uppercase font-black block mb-3">Points</span><span className="text-3xl font-black text-white">{totalPoints.toLocaleString()}</span></div>
              <div className="p-6 bg-white/[0.02] border border-white/10 rounded-[2rem] text-center"><span className="text-[10px] font-mono text-gray-500 uppercase font-black block mb-3">Lodgments</span><span className="text-3xl font-black text-white">{submittedIds.length}<span className="text-gray-700 text-xl"> / {projects.length}</span></span></div>
              <div className="p-6 bg-white/[0.02] border border-white/10 rounded-[2rem] text-center"><span className="text-[10px] font-mono text-gray-500 uppercase font-black block mb-3">Active</span><span className="text-3xl font-black text-blue-400">{Object.keys(acceptedData).filter(id => !submittedIds.includes(id)).length}</span></div>
            </div>

            {/* COMPLETED SETS */}
            <section>
              <h2 className="text-xs font-mono uppercase font-black tracking-[0.4em] text-gray-600 mb-6 border-b border-white/5 pb-4">Completed Technical Sets</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {projects.filter(p => submittedIds.includes(p.id)).map(p => (
                  <div key={`lodged-${p.id}`} className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div><span className="font-mono text-[9px] text-emerald-400 uppercase font-black">{p.plateNumber}</span><h4 className="font-bold text-base text-white mt-0.5">{p.title}</h4></div>
                      <div className="text-right shrink-0 ml-3"><p className="text-architectural-yellow font-black text-sm flex items-center gap-1 justify-end"><Icons.Star size={10} fill="currentColor" />{(p as any).points}</p><p className="text-[9px] font-mono text-blue-400 flex items-center gap-1 justify-end"><Icons.Zap size={9} />+{(p as any).xp} XP</p></div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">{p.software.slice(0, 3).map(s => <SoftwareBadge key={s} s={s} />)}</div>
                  </div>
                ))}
                {submittedIds.length === 0 && (
                  <div className="col-span-3 py-20 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem]">
                    <Icons.Inbox size={48} className="mx-auto text-gray-800 mb-4" />
                    <p className="text-gray-600 font-mono text-[10px] uppercase font-black">No technical sets lodged — complete a project to earn XP</p>
                  </div>
                )}
              </div>
            </section>

            </>) : (<>

            {/* FRIENDS / STUDIO PEERS TAB */}
            <div className="grid grid-cols-2 gap-8">

              {/* Your Friend Code */}
              <div className="p-8 bg-white/[0.02] border border-white/10 rounded-[2rem] space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2"><Icons.QrCode size={16} className="text-architectural-yellow" /> Your Peer Code</h3>
                <p className="text-[10px] font-mono text-gray-500">Share this code with your classmates so they can add you to their peers list.</p>
                <div className="flex items-center gap-3 p-4 bg-black/40 border border-white/10 rounded-2xl">
                  <span className="flex-1 text-architectural-yellow font-black font-mono text-base tracking-widest">{friendCode}</span>
                  <button onClick={() => navigator.clipboard.writeText(friendCode)} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all" title="Copy code">
                    <Icons.Copy size={14} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Add a Peer */}
              <div className="p-8 bg-white/[0.02] border border-white/10 rounded-[2rem] space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2"><Icons.UserPlus size={16} className="text-blue-400" /> Add a Peer</h3>
                <p className="text-[10px] font-mono text-gray-500">Enter your classmate's peer code to add them to your studio network.</p>
                <div className="flex gap-2">
                  <input
                    value={friendCodeInput}
                    onChange={e => { setFriendCodeInput(e.target.value.toUpperCase()); setAddFriendError(''); }}
                    placeholder="ARCH-XXXX-XXXX"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:border-architectural-yellow outline-none uppercase tracking-widest transition-all"
                  />
                  <button onClick={handleAddFriend} className="px-4 py-2.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 font-black rounded-xl text-xs font-mono uppercase hover:bg-blue-500/30 transition-all">Add</button>
                </div>
                {addFriendError && <p className="text-[10px] font-mono text-red-400">{addFriendError}</p>}
              </div>
            </div>

            {/* Peers List */}
            <section>
              <h2 className="text-xs font-mono uppercase font-black tracking-[0.4em] text-gray-600 mb-6 border-b border-white/5 pb-4 flex items-center gap-2">
                <Icons.Users size={12} /> Studio Network — {friends.length} {friends.length === 1 ? 'Peer' : 'Peers'}
              </h2>
              {friends.length === 0 ? (
                <div className="py-24 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem]">
                  <Icons.Users size={48} className="mx-auto text-gray-800 mb-4" />
                  <p className="text-gray-600 font-mono text-[10px] uppercase font-black">No peers added yet</p>
                  <p className="text-gray-700 font-mono text-[9px] uppercase mt-2">Share your peer code with classmates to connect</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {friends.map(f => (
                    <div key={f.id} className="p-6 bg-white/[0.02] border border-white/10 rounded-[2rem] flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-architectural-yellow/20 border border-architectural-yellow/20 flex items-center justify-center shrink-0 overflow-hidden">
                          {f.avatarUrl ? <img src={f.avatarUrl} className="w-full h-full object-cover" alt={f.name} /> : <span className="text-architectural-yellow font-black text-lg">{f.name[0]?.toUpperCase() || '?'}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-white text-sm truncate">{f.name}</p>
                          <p className="text-[9px] font-mono text-gray-500 uppercase truncate">{f.title}</p>
                        </div>
                        <button onClick={async () => {
                          if (user?.id) {
                            try {
                              await removeFriendMutation({
                                clerkId: user.id,
                                friendCode: f.id,
                              });
                            } catch (error) {
                              console.error('Failed to remove friend:', error);
                            }
                          }
                        }} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-all shrink-0" title="Remove peer">
                          <Icons.UserMinus size={13} className="text-gray-600 hover:text-red-400" />
                        </button>
                      </div>
                      <div className="space-y-1.5 text-[9px] font-mono">
                        {f.school && <p className="text-blue-400 flex items-center gap-1.5"><Icons.GraduationCap size={9} />{f.school}</p>}
                        {f.firm && <p className="text-purple-400 flex items-center gap-1.5"><Icons.Building2 size={9} />{f.firm}</p>}
                        <p className="text-gray-600 flex items-center gap-1.5"><Icons.Hash size={9} />{f.id}</p>
                      </div>
                      {f.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {f.specialties.slice(0, 4).map(s => <span key={s} className="px-2 py-0.5 bg-architectural-yellow/10 border border-architectural-yellow/20 rounded-lg text-[8px] font-mono text-architectural-yellow font-black">{s}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            </>)}

            {profileTab === 'collab' && (<>

            {/* COLLABORATION TAB */}
            <div className="grid grid-cols-2 gap-8">

              {/* Incoming Invitations */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Icons.MailOpen size={16} className="text-architectural-yellow" />
                  Incoming Invitations
                  {((invitationsReceived as any[]) || []).filter((i: any) => i.status === 'pending').length > 0 && (
                    <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full">
                      {((invitationsReceived as any[]) || []).filter((i: any) => i.status === 'pending').length} new
                    </span>
                  )}
                </h3>

                {((invitationsReceived as any[]) || []).length === 0 ? (
                  <div className="py-12 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-[2rem]">
                    <Icons.MailOpen size={32} className="mx-auto text-gray-800 mb-3" />
                    <p className="text-gray-700 font-mono text-[9px] uppercase font-black">No invitations yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {((invitationsReceived as any[]) || []).map((inv: any) => (
                      <div key={inv._id} className={cn("p-5 rounded-2xl border space-y-3", inv.status === 'pending' ? "bg-blue-500/5 border-blue-500/20" : inv.status === 'accepted' ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/[0.02] border-white/5")}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[9px] font-mono text-gray-500 uppercase font-black mb-1">Project Collaboration</p>
                            <p className="text-sm font-black text-white">{inv.projectTitle}</p>
                            <p className="text-[10px] font-mono text-gray-500 mt-1">From: <span className="text-gray-300">{inv.senderName}</span></p>
                          </div>
                          <span className={cn("text-[8px] font-mono px-2 py-0.5 rounded-full border font-black uppercase shrink-0",
                            inv.status === 'pending' ? "text-blue-400 border-blue-400/20 bg-blue-400/5" :
                            inv.status === 'accepted' ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/5" :
                            "text-gray-500 border-gray-500/20 bg-gray-500/5"
                          )}>{inv.status}</span>
                        </div>
                        {inv.message && <p className="text-[11px] font-mono text-gray-400 italic border-l-2 border-white/10 pl-3">"{inv.message}"</p>}
                        <p className="text-[9px] font-mono text-gray-600">{new Date(inv.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        {inv.status === 'pending' && (
                          <div className="flex gap-2 pt-1">
                            <button onClick={async () => {
                              if (user?.id) await acceptInvitationMutation({ clerkId: user.id, invitationId: inv._id });
                            }} className="flex-1 py-2.5 bg-emerald-600 text-white font-black rounded-xl text-[10px] font-mono uppercase hover:bg-emerald-500 transition-all">
                              Accept
                            </button>
                            <button onClick={async () => {
                              if (user?.id) await declineInvitationMutation({ clerkId: user.id, invitationId: inv._id });
                            }} className="flex-1 py-2.5 bg-white/5 border border-white/10 text-gray-400 font-black rounded-xl text-[10px] font-mono uppercase hover:bg-red-500/10 hover:text-red-400 transition-all">
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sent Invitations */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Icons.Send size={14} className="text-blue-400" />
                  Sent Invitations
                </h3>

                {/* Send new invite */}
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-2xl space-y-3">
                  <p className="text-[9px] font-mono text-gray-500 uppercase font-black">Invite a Peer to Collaborate</p>
                  <div>
                    <label className="text-[8px] font-mono text-gray-600 uppercase font-black block mb-1">Peer Code</label>
                    <input value={inviteRecipientCode} onChange={e => { setInviteRecipientCode(e.target.value.toUpperCase()); setInviteError(''); }} placeholder="ARCH-XXXX-XXXX" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-architectural-yellow outline-none uppercase tracking-widest transition-all" />
                  </div>
                  <div>
                    <label className="text-[8px] font-mono text-gray-600 uppercase font-black block mb-1">Project</label>
                    <div className="relative">
                      <select value={inviteProjectId || ''} onChange={e => setInviteProjectId(e.target.value)} className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-gray-300 focus:border-architectural-yellow outline-none cursor-pointer pr-7 transition-all">
                        <option value="" className="bg-[#0f1115]">Select a project...</option>
                        {projects.filter(p => acceptedData[p.id] && !submittedIds.includes(p.id)).map(p => (
                          <option key={p.id} value={p.id} className="bg-[#0f1115]">{p.plateNumber} — {p.title}</option>
                        ))}
                      </select>
                      <Icons.ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[8px] font-mono text-gray-600 uppercase font-black block mb-1">Message (optional)</label>
                    <input value={inviteMessage} onChange={e => setInviteMessage(e.target.value)} placeholder="Let's work on this together..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-architectural-yellow outline-none transition-all" />
                  </div>
                  {inviteError && <p className="text-[10px] font-mono text-red-400">{inviteError}</p>}
                  <button onClick={async () => {
                    if (!inviteRecipientCode.trim()) { setInviteError('Enter a peer code.'); return; }
                    if (!inviteProjectId) { setInviteError('Select a project.'); return; }
                    if (!user?.id) return;
                    setInviteSending(true);
                    try {
                      const project = projects.find(p => p.id === inviteProjectId);
                      await sendInvitationMutation({
                        clerkId: user.id,
                        recipientCode: inviteRecipientCode.trim(),
                        projectId: inviteProjectId,
                        projectTitle: project?.title || '',
                        message: inviteMessage,
                      });
                      setInviteRecipientCode('');
                      setInviteProjectId(null);
                      setInviteMessage('');
                    } catch { setInviteError('Failed to send. Check the peer code.'); }
                    setInviteSending(false);
                  }} disabled={inviteSending} className="w-full py-2.5 bg-architectural-yellow text-black font-black rounded-xl text-[10px] font-mono uppercase hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {inviteSending ? <><Icons.Loader size={12} className="animate-spin" /> Sending...</> : <><Icons.Send size={12} /> Send Invitation</>}
                  </button>
                </div>

                {/* Sent list */}
                {((invitationsSent as any[]) || []).length > 0 && (
                  <div className="space-y-3">
                    {((invitationsSent as any[]) || []).map((inv: any) => (
                      <div key={inv._id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white truncate">{inv.projectTitle}</p>
                          <p className="text-[9px] font-mono text-gray-500 mt-0.5">To: <span className="text-gray-400">{inv.recipientCode}</span></p>
                          <p className="text-[9px] font-mono text-gray-600 mt-0.5">{new Date(inv.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn("text-[8px] font-mono px-2 py-0.5 rounded-full border font-black uppercase",
                            inv.status === 'pending' ? "text-yellow-400 border-yellow-400/20 bg-yellow-400/5" :
                            inv.status === 'accepted' ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/5" :
                            "text-gray-500 border-gray-500/20 bg-gray-500/5"
                          )}>{inv.status}</span>
                          {inv.status === 'pending' && (
                            <button onClick={async () => {
                              if (user?.id) await cancelInvitationMutation({ clerkId: user.id, invitationId: inv._id });
                            }} className="p-1 hover:bg-red-500/10 rounded-lg transition-all" title="Cancel invitation">
                              <Icons.X size={12} className="text-gray-600 hover:text-red-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            </>)}
          </motion.section>
        ) : null}
      </main>

      {/* RIGHT SIDEBAR */}
      <aside className="w-80 border-l border-white/10 bg-black/40 backdrop-blur-2xl fixed right-0 h-full z-[60] flex flex-col overflow-hidden shadow-2xl">

        {/* DESIGN OF THE DAY */}
        <div className="shrink-0 border-b border-white/10">
          <div className="relative h-44 overflow-hidden">
            <img src={dailyDesign.image} className="w-full h-full object-cover" alt={dailyDesign.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="absolute top-3 left-4 flex items-center gap-2">
              <span className="text-[8px] font-mono text-architectural-yellow bg-architectural-yellow/20 border border-architectural-yellow/30 px-2 py-0.5 rounded-full uppercase font-black tracking-widest">Design of the Day</span>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-base font-black text-white uppercase tracking-tight leading-tight">{dailyDesign.title}</h3>
              <p className="text-[10px] font-mono text-gray-400 mt-0.5">{dailyDesign.architect} · {dailyDesign.year}</p>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex gap-2 flex-wrap">
              <span className="text-[8px] font-mono text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded-full uppercase font-black">{dailyDesign.style}</span>
              <span className="text-[8px] font-mono text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full uppercase font-black flex items-center gap-1"><Icons.MapPin size={8} />{dailyDesign.location}</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed font-mono border-l-2 border-architectural-yellow/30 pl-3 italic">"{dailyDesign.fact}"</p>
          </div>
        </div>

        {/* CHALLENGE OF THE DAY */}
        <div className="shrink-0 border-b border-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Icons.Sword size={13} className="text-architectural-yellow" /><span className="text-[9px] font-mono uppercase font-black tracking-[0.2em] text-architectural-yellow">Challenge of the Day</span></div>
            <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full border font-black uppercase ${dailyChallenge.color}`}>{dailyChallenge.difficulty}</span>
          </div>
          <h4 className="text-sm font-black text-white uppercase tracking-tight leading-tight">{dailyChallenge.title}</h4>
          <div className="flex gap-2 flex-wrap">
            <span className="text-[8px] font-mono text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full uppercase font-black flex items-center gap-1"><Icons.Layers size={7} />{dailyChallenge.category}</span>
            <span className="text-[8px] font-mono text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full uppercase font-black flex items-center gap-1"><Icons.Clock size={7} />{dailyChallenge.duration}</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed font-mono line-clamp-3">{dailyChallenge.prompt}</p>

          {/* Status / Actions */}
          {challengeAccepted?.title === dailyChallenge.title ? (
            challengeAccepted.done ? (
              <div className="space-y-2">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                  <Icons.CheckCircle size={14} className="text-emerald-400 shrink-0" />
                  <p className="text-[10px] font-mono text-emerald-400 font-black uppercase">Challenge Complete!</p>
                </div>
                <button onClick={async () => {
                  if (user?.id) {
                    await abandonChallengeMutation({ clerkId: user.id });
                  }
                }} className="w-full py-2 border border-white/10 text-gray-600 font-black rounded-xl text-[9px] font-mono uppercase hover:text-white hover:bg-white/5 transition-all">
                  Clear
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-[9px] font-mono text-blue-400 font-black uppercase mb-1 flex items-center gap-1"><Icons.Timer size={9} /> In Progress</p>
                  <p className="text-[9px] font-mono text-gray-500">Started {new Date(challengeAccepted.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowChallengeModal(true)} className="flex-1 py-2 bg-white/5 border border-white/10 text-gray-300 font-black rounded-xl text-[9px] font-mono uppercase hover:bg-white/10 transition-all">
                    View Brief
                  </button>
                  <button onClick={async () => {
                    if (user?.id) {
                      await completeChallengeMutation({ clerkId: user.id });
                    }
                  }} className="flex-1 py-2 bg-emerald-600 text-white font-black rounded-xl text-[9px] font-mono uppercase hover:bg-emerald-500 transition-all">
                    Mark Done
                  </button>
                </div>
                <button onClick={async () => {
                  if (user?.id) {
                    await abandonChallengeMutation({ clerkId: user.id });
                  }
                }} className="w-full py-1.5 text-red-500/50 font-black rounded-xl text-[9px] font-mono uppercase hover:text-red-400 transition-all">
                  Abandon
                </button>
              </div>
            )
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setShowChallengeModal(true)} className="flex-1 py-2.5 bg-white/5 border border-white/10 text-gray-300 font-black rounded-xl text-[9px] font-mono uppercase hover:bg-white/10 transition-all">
                View Brief
              </button>
              <button
                onClick={async () => {
                  if (user?.id) {
                    await acceptChallengeMutation({
                      clerkId: user.id,
                      challengeTitle: dailyChallenge.title,
                    });
                  }
                }}
                className="flex-1 py-2.5 bg-architectural-yellow text-black font-black rounded-xl text-[9px] font-mono uppercase hover:brightness-110 transition-all shadow-[0_0_20px_rgba(244,180,0,0.2)]"
              >
                Accept
              </button>
            </div>
          )}
        </div>

        {/* QUOTE */}
        <div className="shrink-0 px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2 text-architectural-yellow mb-3"><Icons.Quote size={14} /><span className="text-[9px] font-mono uppercase font-black tracking-[0.2em]">Mindset</span></div>
          <p className="text-xs font-serif italic text-gray-300 leading-relaxed">{dailyQuote}</p>
        </div>

        {/* JOURNAL */}
        <div className="flex-1 flex flex-col overflow-hidden p-6">
          <div className="flex items-center gap-2 text-blue-400 mb-4"><Icons.PencilLine size={16} /><span className="text-[9px] font-mono uppercase font-black tracking-[0.2em]">Journal</span></div>
          <div className="space-y-2 mb-4">
            <textarea value={newEntry} onChange={e => setNewEntry(e.target.value)} placeholder="Log technical milestone..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-mono focus:border-architectural-yellow outline-none min-h-[80px] resize-none shadow-inner" />
            <button onClick={addJournalEntry} className="w-full py-2.5 bg-white/10 rounded-lg text-[9px] font-mono uppercase font-black tracking-[0.2em] hover:bg-white/20 transition-all">Add Entry</button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {journalEntries.map(e => (
              <div key={e.id} className="group p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:border-white/10 transition-all">
                <p className="text-[11px] text-gray-400 font-mono leading-relaxed">{e.text}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[8px] text-gray-600 font-mono">{new Date(e.time).toLocaleDateString()}</span>
                  <button
                    onClick={async () => {
                      if (user?.id) {
                        await deleteJournalEntryMutation({
                          clerkId: user.id,
                          entryId: e.id as any, // e.id is the Convex document ID
                        });
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Delete entry"
                  >
                    <Icons.Trash2 size={10} className="text-red-500/60 hover:text-red-400" />
                  </button>
                </div>
              </div>
            ))}
            {journalEntries.length === 0 && <p className="text-[9px] font-mono text-gray-700 uppercase text-center pt-4">No entries yet</p>}
          </div>
        </div>

        {/* POMODORO */}
        <div className="shrink-0 border-t border-white/10 bg-black/40 px-6 py-5 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-[9px] font-mono uppercase text-gray-500 font-black tracking-widest"><Icons.Zap size={14} className="text-architectural-yellow animate-pulse" /> Focus Sprint</div>
            <span className={cn("text-2xl font-mono font-black tracking-tighter", pomoMode === 'work' ? "text-architectural-yellow" : "text-emerald-400")}>{formatPomo(pomoTime)}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPomoActive(!pomoActive)} className="flex-1 py-2.5 bg-white/5 rounded-xl text-[9px] font-mono uppercase font-black hover:bg-white/10 transition-all shadow-lg border border-white/5">{pomoActive ? 'PAUSE' : 'FOCUS'}</button>
            <button onClick={resetPomo} className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 border border-white/5"><Icons.RotateCcw size={16} /></button>
          </div>
        </div>
      </aside>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProject(null)} className="fixed inset-0 bg-black/95 cursor-zoom-out" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-[#0d0f12] border border-white/10 rounded-[2rem] w-full max-w-7xl flex flex-col md:flex-row h-[90vh] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
              <div className={cn("flex-1 p-16 relative", acceptedData[selectedProject.id] ? "overflow-y-auto custom-scrollbar" : "overflow-hidden")}>
                <div className="flex justify-between items-start mb-12 relative z-[75]"><div><div className="flex items-center gap-3 mb-3"><span className="text-architectural-yellow font-mono text-base bg-architectural-yellow/10 px-3 py-1 rounded-full font-bold">{selectedProject.plateNumber}</span><DifficultyBadge level={selectedProject.difficulty} /><span className="flex items-center gap-1 text-architectural-yellow font-mono text-sm bg-architectural-yellow/10 px-3 py-1 rounded-full font-black"><Icons.Star size={11} fill="currentColor" />{(selectedProject as any).points} pts</span><span className="flex items-center gap-1 text-blue-400 font-mono text-sm bg-blue-400/10 px-3 py-1 rounded-full font-black"><Icons.Zap size={11} />{(selectedProject as any).xp} xp</span></div><h2 className="text-6xl font-black tracking-tighter text-white uppercase">{selectedProject.title}</h2></div></div>

                {!acceptedData[selectedProject.id] && (
                  <div className="absolute inset-0 top-[200px] bg-[#0d0f12]/98 z-[70] flex flex-col items-center justify-start text-center p-20 border-t border-white/5 pt-48">
                    <Icons.Lock size={120} className="mb-10 text-gray-800 animate-pulse" />
                    <h3 className="text-5xl font-black text-white uppercase tracking-tighter mb-6">Briefing Encrypted</h3>
                    <p className="text-gray-500 font-mono uppercase text-base tracking-[0.3em] max-w-xl leading-relaxed font-bold">All technical data, client visions, and survey bearings are secured. Accept the inquiry to release project files.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
                  <div className="space-y-12">
                    <section><h4 className="text-sm font-mono uppercase text-gray-500 mb-6 tracking-[0.3em] font-black border-b border-white/5 pb-2">Client Vision</h4><div className="p-10 bg-blue-500/5 border border-blue-500/10 rounded-[2rem] relative"><Icons.Quote size={40} className="absolute top-6 right-6 opacity-5 text-blue-400" /><p className="text-xl font-serif italic text-gray-300 leading-relaxed">"{selectedProject.client.message}"</p><p className="mt-8 text-sm font-mono text-blue-400 uppercase font-black tracking-[0.2em]">— {selectedProject.client.name}</p></div></section>
                    <section className="space-y-8">
                      <div><h4 className="text-sm font-mono uppercase text-gray-500 mb-4 tracking-[0.2em] font-black">Mandated Niche</h4><p className="text-3xl font-black text-architectural-yellow uppercase tracking-tight">{selectedProject.niche}</p></div>
                      <div className="grid grid-cols-2 gap-8">
                        <div><span className="text-xs font-mono text-gray-500 uppercase block mb-2 font-black">Style</span><p className="text-base font-bold text-white uppercase">{selectedProject.designSpecs.architecturalStyle}</p></div>
                        <div><span className="text-xs font-mono text-gray-500 uppercase block mb-3 font-black">Palette</span><div className="flex gap-2">{selectedProject.designSpecs.colorPalette.map(c => <div key={c.hex} className="w-10 h-10 rounded-xl border border-white/10 shadow-lg" style={{ backgroundColor: c.hex }} title={c.name} />)}</div></div>
                      </div>
                    </section>
                  </div>
                  <div className="space-y-12">
                    <section><h4 className="text-sm font-mono uppercase text-architectural-blue mb-6 tracking-[0.3em] font-black border-b border-white/5 pb-2">Geodetic Survey</h4>
                    <div className="bg-black/40 p-8 rounded-[2rem] border border-white/5 font-mono text-sm text-emerald-400 space-y-3 shadow-inner">{selectedProject.siteTechnicalSpecs.bearings.map((b,idx) => <p key={idx} className="flex gap-4"><span className="opacity-30 font-black">0{idx+1}</span> {b}</p>)}<div className="mt-8 pt-8 border-t border-white/5 text-gray-500 uppercase flex justify-between px-2 font-black text-xs"><span>Area: {selectedProject.siteTechnicalSpecs.area}</span><span>{selectedProject.siteTechnicalSpecs.location}</span></div></div></section>
                    <section><h4 className="text-sm font-mono uppercase text-red-400 mb-4 tracking-[0.2em] font-black">Principal Requirements</h4><div className="space-y-2">{selectedProject.designSpecs.technicalNeeds.map(n => <div key={n} className="flex items-center gap-3 text-sm text-gray-400 bg-white/[0.02] p-4 rounded-lg border border-white/5 font-bold"><Icons.CheckCircle size={14} className="text-emerald-500 shrink-0" /> {n}</div>)}</div></section>
                  </div>
                </div>

                {/* ARCHITECTURAL INSPIRATIONS */}
                <div className="mt-16 relative z-10">
                  <h4 className="text-sm font-mono uppercase text-blue-400 mb-6 tracking-[0.3em] font-black border-b border-white/5 pb-2 flex items-center gap-2"><Icons.BookOpen size={14} /> Architectural Inspirations</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {selectedProject.inspirations.map((ins: any, i: number) => (
                      <div key={i} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all">
                        <p className="text-sm font-black text-white mb-1">{ins.name}</p>
                        <p className="text-[10px] font-mono text-architectural-yellow mb-3 uppercase font-bold">— {ins.architect}</p>
                        <p className="text-[11px] font-mono text-gray-500 leading-relaxed italic">"{ins.why}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ROOM PROGRAM TABLE */}
                <div className="mt-16">
                  <h4 className="text-sm font-mono uppercase text-architectural-yellow mb-6 tracking-[0.3em] font-black border-b border-white/5 pb-2 flex items-center gap-2"><Icons.LayoutList size={14} /> Room Program</h4>
                  <div className="overflow-x-auto rounded-2xl border border-white/5">
                    <table className="w-full text-sm font-mono">
                      <thead>
                        <tr className="bg-white/5 text-gray-500 uppercase tracking-widest text-xs">
                          <th className="text-left p-4 font-black">Room / Space</th>
                          <th className="text-center p-4 font-black w-16">Qty</th>
                          <th className="text-center p-4 font-black w-36">Min Area</th>
                          <th className="text-left p-4 font-black">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProject.roomProgram.map((r: any, idx: number) => (
                          <tr key={idx} className={cn("border-t border-white/5 transition-colors hover:bg-white/[0.03]", idx % 2 === 0 ? "" : "bg-white/[0.01]")}>
                            <td className="p-4 text-white font-bold">{r.room}</td>
                            <td className="p-4 text-center text-architectural-yellow font-black">{r.quantity}</td>
                            <td className="p-4 text-center text-emerald-400 font-bold whitespace-nowrap">{r.minArea}</td>
                            <td className="p-4 text-gray-400">{r.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              <div className="w-[450px] bg-white/[0.02] p-12 border-l border-white/10 flex flex-col shadow-2xl relative z-[80] h-full overflow-y-auto custom-scrollbar">
                {!acceptedData[selectedProject.id] ? (
                  <div className="flex-1 flex flex-col justify-center text-center space-y-8">
                    <div className="p-10 bg-architectural-yellow/5 border border-architectural-yellow/10 rounded-[3rem] shadow-inner"><Icons.Compass size={64} className="mx-auto text-architectural-yellow mb-6" /><h5 className="text-2xl font-black uppercase tracking-tighter text-white">Start Production</h5><p className="text-sm text-gray-500 mt-4 leading-relaxed font-mono uppercase font-bold">Accepting this brief starts a {selectedProject.durationDays}-day production window.</p></div>
                    <button onClick={async () => {
                      if (user?.id && selectedProject) {
                        await acceptProjectMutation({
                          clerkId: user.id,
                          projectId: selectedProject.id,
                        });
                      }
                    }} className="w-full py-6 bg-architectural-yellow text-black font-black rounded-[2rem] uppercase text-sm tracking-[0.3em] hover:scale-[1.02] transition-all shadow-[0_20px_50px_rgba(244,180,0,0.3)] pointer-events-auto">Start Project</button>
                    <button onClick={() => setSelectedProject(null)} className="w-full py-4 border border-white/10 text-gray-500 font-black rounded-[2rem] uppercase text-xs tracking-[0.3em] hover:bg-white/5 hover:text-white transition-all pointer-events-auto">Cancel</button>
                  </div>
                ) : !submittedIds.includes(selectedProject.id) ? (
                  <div className="flex flex-col gap-5 h-full">
                    <div className="p-8 rounded-[2rem] border border-blue-500/30 bg-blue-500/5 text-center font-mono text-blue-400 shadow-inner shrink-0"><p className="text-xs uppercase font-black tracking-widest mb-2 opacity-50">Remaining Time</p><p className="text-4xl font-black tracking-tighter">{getRemainingTime(selectedProject.id)?.text}</p></div>

                    {/* Connect Drive prompt if not linked */}
                    {!accessToken && (
                      <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl text-center shrink-0">
                        <p className="text-xs font-mono text-yellow-400 uppercase font-black mb-3">Connect Drive to upload files</p>
                        <button onClick={handleAuth} className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-xs font-mono text-yellow-400 uppercase font-black hover:bg-yellow-500/30 transition-all pointer-events-auto"><Icons.Cloud size={12} className="inline mr-2" />Connect Drive</button>
                      </div>
                    )}

                    <div className="flex justify-between text-xs font-mono text-gray-500 uppercase font-black px-1 shrink-0"><span>Set Checklist</span><span>{getProgress(selectedProject.id)}%</span></div>
                    <div className="overflow-y-auto custom-scrollbar space-y-3 pr-1 min-h-0 flex-1">
                      {selectedProject.requiredFiles.map(f => {
                        const up = (uploadedFiles[selectedProject.id] || {})[f];
                        const isUploading = uploadingFile === f;
                        return (
                          <div key={f} className={cn("flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300", up ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" : "border-white/5 bg-white/5")}>
                            {isUploading ? <Icons.Loader size={20} className="animate-spin text-blue-400" /> : up ? <Icons.FileCheck size={20} /> : <Icons.FileText size={20} className="text-gray-600" />}
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-mono uppercase truncate font-bold block">{f}</span>
                              {up && <span className="text-xs font-mono text-emerald-300 opacity-70 truncate block">{up.name}</span>}
                            </div>
                            <button onClick={() => openFilePicker(f)} disabled={!accessToken || isUploading} className="p-2 hover:bg-white/10 rounded-xl transition-all disabled:opacity-20 pointer-events-auto" title={accessToken ? (up ? 'Replace file' : 'Upload file') : 'Connect Drive first'}>
                              {isUploading ? <Icons.Loader size={16} className="animate-spin" /> : up ? <Icons.PencilLine size={16} /> : <Icons.Upload size={16} />}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-col gap-3 shrink-0">
                      {/* Invite Peers to Collaborate */}
                      <button onClick={() => {
                        setInviteProjectId(selectedProject.id);
                        setCurrentView('profile');
                        setProfileTab('collab');
                        setSelectedProject(null);
                      }} className="w-full py-3 border border-blue-500/30 bg-blue-500/5 text-blue-400 font-black rounded-[2rem] uppercase text-xs tracking-[0.2em] hover:bg-blue-500/15 hover:border-blue-500/50 transition-all pointer-events-auto flex items-center justify-center gap-2">
                        <Icons.Handshake size={14} /> Invite Peers to Collaborate
                      </button>
                      <button onClick={async () => {
                        if (user?.id && selectedProject) {
                          await submitProjectMutation({
                            clerkId: user.id,
                            projectId: selectedProject.id,
                          });
                        }
                      }} disabled={getProgress(selectedProject.id) < 100} className={cn("w-full py-6 font-black rounded-[2rem] uppercase text-sm tracking-[0.3em] shadow-2xl transition-all duration-500 pointer-events-auto", getProgress(selectedProject.id) === 100 ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-white/5 text-gray-600 cursor-not-allowed shadow-none")}>Lodge Final Set</button>
                      <button onClick={() => setSelectedProject(null)} className="w-full py-4 border border-white/10 text-gray-500 font-black rounded-[2rem] uppercase text-xs tracking-[0.3em] hover:bg-white/5 hover:text-white transition-all pointer-events-auto">Cancel</button>

                      {/* DISCARD */}
                      {confirmDiscard === selectedProject.id ? (
                        <div className="p-5 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-3">
                          <p className="text-xs font-mono text-red-400 uppercase font-black text-center tracking-widest">Terminate this project?</p>
                          <p className="text-[10px] font-mono text-gray-500 text-center">All progress and uploaded files will be removed. This cannot be undone.</p>
                          <div className="flex gap-2 mt-2">
                            <button onClick={async () => {
                              if (user?.id && selectedProject) {
                                await discardProjectMutation({
                                  clerkId: user.id,
                                  projectId: selectedProject.id,
                                });
                              }
                              setConfirmDiscard(null);
                              setSelectedProject(null);
                            }} className="flex-1 py-3 bg-red-500/20 border border-red-500/30 text-red-400 font-black rounded-xl text-xs font-mono uppercase hover:bg-red-500/30 transition-all pointer-events-auto">
                              Yes, Terminate
                            </button>
                            <button onClick={() => setConfirmDiscard(null)} className="flex-1 py-3 bg-white/5 border border-white/10 text-gray-400 font-black rounded-xl text-xs font-mono uppercase hover:bg-white/10 transition-all pointer-events-auto">
                              Keep It
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDiscard(selectedProject.id)} className="w-full py-3 border border-red-500/20 text-red-500/60 font-black rounded-[2rem] uppercase text-xs tracking-[0.3em] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40 transition-all pointer-events-auto flex items-center justify-center gap-2">
                          <Icons.Trash2 size={12} /> Discard Project
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-center text-center space-y-6">
                    <div className="p-12 bg-emerald-500/5 border border-emerald-500/10 rounded-[3rem] shadow-inner"><Icons.CheckCircle size={80} className="mx-auto text-emerald-500 mb-6" /><h5 className="text-3xl font-black text-white uppercase tracking-tighter">Set Lodged</h5><p className="text-sm font-mono text-emerald-400 uppercase tracking-widest mt-2 font-black">Review In Progress</p></div>
                    {/* TODO: Implement retract project mutation */}
                    {/* <button onClick={() => setSubmittedIds(prev => prev.filter(id => id !== selectedProject.id))} className="text-sm font-mono text-gray-600 uppercase hover:text-white transition-colors font-black pointer-events-auto">Retract Submission</button> */}
                    <button onClick={() => setSelectedProject(null)} className="w-full py-4 border border-white/10 text-gray-500 font-black rounded-[2rem] uppercase text-xs tracking-[0.3em] hover:bg-white/5 hover:text-white transition-all pointer-events-auto">Close</button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CHALLENGE BRIEF MODAL */}
      <AnimatePresence>
        {showChallengeModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowChallengeModal(false)} className="fixed inset-0 bg-black/95 cursor-zoom-out" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-[#0d0f12] border border-white/10 rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.6)]">

              {/* Header */}
              <div className="p-8 border-b border-white/10 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[8px] font-mono text-architectural-yellow bg-architectural-yellow/10 border border-architectural-yellow/20 px-2 py-0.5 rounded-full uppercase font-black tracking-widest">Challenge of the Day</span>
                    <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full border font-black uppercase ${dailyChallenge.color}`}>{dailyChallenge.difficulty}</span>
                  </div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{dailyChallenge.title}</h2>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <span className="text-[9px] font-mono text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full uppercase font-black flex items-center gap-1"><Icons.Layers size={8} />{dailyChallenge.category}</span>
                    <span className="text-[9px] font-mono text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full uppercase font-black flex items-center gap-1"><Icons.Clock size={8} />{dailyChallenge.duration}</span>
                  </div>
                </div>
                <button onClick={() => setShowChallengeModal(false)} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all shrink-0">
                  <Icons.X size={18} className="text-gray-400" />
                </button>
              </div>

              {/* Body */}
              <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar max-h-[60vh]">

                {/* Prompt */}
                <div>
                  <p className="text-[10px] font-mono text-gray-600 uppercase font-black mb-2 tracking-widest">The Brief</p>
                  <p className="text-base text-gray-200 leading-relaxed font-serif italic">"{dailyChallenge.prompt}"</p>
                </div>

                {/* Constraints */}
                <div>
                  <p className="text-[10px] font-mono text-red-400 uppercase font-black mb-3 tracking-widest flex items-center gap-2"><Icons.AlertTriangle size={10} /> Constraints</p>
                  <div className="space-y-2">
                    {dailyChallenge.constraints.map((c, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                        <span className="text-architectural-yellow font-black text-xs mt-0.5 shrink-0">0{i + 1}</span>
                        <p className="text-sm font-mono text-gray-300">{c}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deliverable */}
                <div className="p-4 bg-blue-500/5 border border-blue-500/15 rounded-2xl">
                  <p className="text-[10px] font-mono text-blue-400 uppercase font-black mb-2 tracking-widest flex items-center gap-2"><Icons.FileCheck size={10} /> What to Submit</p>
                  <p className="text-sm font-mono text-gray-300">{dailyChallenge.deliverable}</p>
                </div>

                {/* Architectural Style + Palette */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-mono text-gray-600 uppercase font-black mb-2 tracking-widest">Style</p>
                    <p className="text-sm font-bold text-white uppercase">{dailyChallenge.architecturalStyle}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-gray-600 uppercase font-black mb-2 tracking-widest">Palette</p>
                    <div className="flex gap-1.5">
                      {dailyChallenge.colorPalette.map(c => (
                        <div key={c.hex} className="w-8 h-8 rounded-lg border border-white/10 shadow" style={{ backgroundColor: c.hex }} title={c.name} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Site Bearings */}
                <div>
                  <p className="text-[10px] font-mono text-gray-600 uppercase font-black mb-2 tracking-widest flex items-center gap-2"><Icons.Compass size={10} /> Site Bearings</p>
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-xs text-emerald-400 space-y-1.5">
                    {dailyChallenge.bearings.map((b, i) => (
                      <p key={i} className="flex gap-3"><span className="opacity-30 font-black">0{i+1}</span>{b}</p>
                    ))}
                    <div className="mt-3 pt-3 border-t border-white/5 text-gray-500 flex justify-between text-[9px] font-black uppercase">
                      <span>Area: {dailyChallenge.siteArea}</span>
                      <span>{dailyChallenge.siteLocation}</span>
                    </div>
                  </div>
                </div>

                {/* Inspirations */}
                <div>
                  <p className="text-[10px] font-mono text-gray-600 uppercase font-black mb-3 tracking-widest flex items-center gap-2"><Icons.BookOpen size={10} /> Architectural Inspirations</p>
                  <div className="space-y-2">
                    {dailyChallenge.inspirations.map((ins, i) => (
                      <div key={i} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-mono text-architectural-yellow font-black">{ins.name}</span>
                          <span className="text-[8px] font-mono text-gray-600">— {ins.architect}</span>
                        </div>
                        <p className="text-[10px] font-mono text-gray-500 italic">{ins.why}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tip */}
                <div className="p-4 bg-architectural-yellow/5 border border-architectural-yellow/15 rounded-2xl">
                  <p className="text-[10px] font-mono text-architectural-yellow uppercase font-black mb-2 tracking-widest flex items-center gap-2"><Icons.Zap size={10} /> Architect's Tip</p>
                  <p className="text-sm font-mono text-gray-300 italic">{dailyChallenge.tip}</p>
                </div>
              </div>

              {/* Footer actions */}
              <div className="p-6 border-t border-white/10 space-y-3">

                {/* Deliverable upload — only when accepted */}
                {challengeAccepted?.title === dailyChallenge.title && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-mono text-gray-500 uppercase font-black tracking-widest flex items-center gap-2"><Icons.Upload size={10} /> Submit Deliverables to Drive</p>

                    {/* Uploaded files list */}
                    {(challengeAccepted.files || []).length > 0 && (
                      <div className="space-y-1.5">
                        {(challengeAccepted.files || []).map((f, i) => (
                          <div key={i} className="flex items-center gap-3 p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                            <Icons.FileCheck size={14} className="text-emerald-400 shrink-0" />
                            <span className="text-[10px] font-mono text-emerald-300 truncate flex-1">{f.name}</span>
                            <a href={`https://drive.google.com/file/d/${f.driveId}/view`} target="_blank" rel="noreferrer" className="p-1 hover:bg-white/10 rounded-lg transition-all" title="Open in Drive">
                              <Icons.ExternalLink size={11} className="text-gray-500 hover:text-white" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload button */}
                    {!accessToken ? (
                      <button onClick={handleAuth} className="w-full py-3 border-2 border-dashed border-white/10 text-gray-500 font-black rounded-xl text-[10px] font-mono uppercase flex items-center justify-center gap-2 hover:bg-white/5 hover:text-white transition-all">
                        <Icons.Cloud size={13} /> Connect Drive to Upload
                      </button>
                    ) : (
                      <button
                        onClick={() => challengeFileInputRef.current?.click()}
                        disabled={uploadingChallenge}
                        className="w-full py-3 border border-white/10 bg-white/5 text-gray-300 font-black rounded-xl text-[10px] font-mono uppercase flex items-center justify-center gap-2 hover:bg-white/10 transition-all disabled:opacity-50"
                      >
                        {uploadingChallenge ? <><Icons.Loader size={13} className="animate-spin" /> Uploading...</> : <><Icons.Upload size={13} /> Upload Deliverable</>}
                      </button>
                    )}
                    <p className="text-[9px] font-mono text-gray-700 text-center">Saved to: Arki Challenge → Daily Challenges → [{new Date(challengeAccepted.acceptedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}] {challengeAccepted.title}</p>
                  </div>
                )}

                {/* Accept / Done / Abandon */}
                <div className="flex gap-3">
                  {challengeAccepted?.title === dailyChallenge.title ? (
                    challengeAccepted.done ? (
                      <div className="flex-1 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
                        <p className="text-sm font-mono text-emerald-400 font-black uppercase flex items-center justify-center gap-2"><Icons.CheckCircle size={16} /> Challenge Complete</p>
                      </div>
                    ) : (
                      <>
                        <button onClick={async () => {
                          if (user?.id) {
                            await completeChallengeMutation({ clerkId: user.id });
                          }
                          setShowChallengeModal(false);
                        }} className="flex-1 py-4 bg-emerald-600 text-white font-black rounded-2xl uppercase text-sm tracking-widest hover:bg-emerald-500 transition-all">
                          Mark as Done
                        </button>
                        <button onClick={async () => {
                          if (user?.id) {
                            await abandonChallengeMutation({ clerkId: user.id });
                          }
                          setShowChallengeModal(false);
                        }} className="py-4 px-6 border border-red-500/20 text-red-500/60 font-black rounded-2xl uppercase text-xs hover:bg-red-500/10 hover:text-red-400 transition-all">
                          Abandon
                        </button>
                      </>
                    )
                  ) : (
                    <>
                      <button onClick={() => setShowChallengeModal(false)} className="py-4 px-6 border border-white/10 text-gray-500 font-black rounded-2xl uppercase text-xs hover:bg-white/5 hover:text-white transition-all">
                        Close
                      </button>
                      <button onClick={async () => {
                        if (user?.id) {
                          await acceptChallengeMutation({
                            clerkId: user.id,
                            challengeTitle: dailyChallenge.title,
                          });
                        }
                      }} className="flex-1 py-4 bg-architectural-yellow text-black font-black rounded-2xl uppercase text-sm tracking-widest hover:brightness-110 transition-all shadow-[0_0_30px_rgba(244,180,0,0.25)]">
                        Accept Challenge
                      </button>
                    </>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
