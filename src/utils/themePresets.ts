import { WallpaperTheme } from '../types';
import banaueImg from '../assets/images/banaue_rice_terraces_1787969048030.jpg';
import mayonImg from '../assets/images/mayon_volcano_bicol_1787969070826.jpg';
import palawanImg from '../assets/images/palawan_el_nido_1787969087631.jpg';
import viganImg from '../assets/images/vigan_calle_crisologo_1787969107871.jpg';
import intramurosImg from '../assets/images/intramuros_fort_santiago_1787969126755.jpg';
import batanesImg from '../assets/images/batanes_basco_hills_1787969143570.jpg';
import boholImg from '../assets/images/bohol_chocolate_hills_1787969162667.jpg';

export interface ThemeOption {
  id: WallpaperTheme;
  name: string;
  location: string;
  category: 'Nature & Landscapes' | 'Historical Monuments' | 'Natural Wonders' | 'Coastal & Marine' | 'Minimalist Focus';
  description: string;
  previewUrl: string;
  cssBackground: string;
  overlayStyle: string;
  tag: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'banaue_rice_terraces',
    name: 'Banaue Rice Terraces',
    location: 'Ifugao, Cordillera',
    category: 'Nature & Landscapes',
    tag: 'UNESCO World Heritage',
    description: 'Ancient 2,000-year-old emerald stairways carved into the mist-covered Cordillera mountains.',
    previewUrl: banaueImg,
    cssBackground: `url('${banaueImg}')`,
    overlayStyle: 'bg-zinc-950/75 backdrop-brightness-75',
  },
  {
    id: 'mayon_volcano',
    name: 'Mayon Volcano',
    location: 'Albay, Bicol Region',
    category: 'Natural Wonders',
    tag: 'World\'s Perfect Cone',
    description: 'Renowned majestic symmetrical cone volcano soaring gracefully above verdant tropical rice fields.',
    previewUrl: mayonImg,
    cssBackground: `url('${mayonImg}')`,
    overlayStyle: 'bg-zinc-950/75 backdrop-brightness-75',
  },
  {
    id: 'palawan_el_nido',
    name: 'El Nido & Coron Lagoons',
    location: 'Palawan Archipelago',
    category: 'Coastal & Marine',
    tag: 'Last Ecological Frontier',
    description: 'Pristine emerald turquoise waters sheltered by towering ancient karst limestone cliffs.',
    previewUrl: palawanImg,
    cssBackground: `url('${palawanImg}')`,
    overlayStyle: 'bg-zinc-950/75 backdrop-brightness-75',
  },
  {
    id: 'vigan_calle_crisologo',
    name: 'Calle Crisologo, Vigan',
    location: 'Vigan City, Ilocos Sur',
    category: 'Historical Monuments',
    tag: 'UNESCO Heritage Town',
    description: 'Historic 16th-century Spanish colonial cobblestone promenade glowing in warm evening lantern light.',
    previewUrl: viganImg,
    cssBackground: `url('${viganImg}')`,
    overlayStyle: 'bg-zinc-950/80 backdrop-brightness-70',
  },
  {
    id: 'intramuros_manila',
    name: 'Intramuros & Fort Santiago',
    location: 'Manila, National Capital Region',
    category: 'Historical Monuments',
    tag: 'Historic Walled City',
    description: 'Centuries-old stone citadel gates, Spanish colonial bastions, and tranquil heritage stone courtyards.',
    previewUrl: intramurosImg,
    cssBackground: `url('${intramurosImg}')`,
    overlayStyle: 'bg-zinc-950/80 backdrop-brightness-70',
  },
  {
    id: 'batanes_hills',
    name: 'Batanes Marlboro Hills',
    location: 'Batanes Islands, Northern Luzon',
    category: 'Nature & Landscapes',
    tag: 'Pacific Frontier',
    description: 'Sweeping emerald wind-swept hills, dramatic ocean bluffs, and the iconic Basco coastline.',
    previewUrl: batanesImg,
    cssBackground: `url('${batanesImg}')`,
    overlayStyle: 'bg-zinc-950/75 backdrop-brightness-75',
  },
  {
    id: 'bohol_chocolate_hills',
    name: 'Chocolate Hills',
    location: 'Carmen, Bohol',
    category: 'Natural Wonders',
    tag: 'Geological Wonder',
    description: 'Over 1,200 symmetrical rolling geological mounds creating an iconic, surreal tropical vista.',
    previewUrl: boholImg,
    cssBackground: `url('${boholImg}')`,
    overlayStyle: 'bg-zinc-950/75 backdrop-brightness-75',
  },
  {
    id: 'clean_dark',
    name: 'Philippine Indigo Slate',
    location: 'Minimalist Study Mode',
    category: 'Minimalist Focus',
    tag: 'Zero Distraction',
    description: 'Clean dark slate backdrop infused with deep archipelago midnight tones for maximum concentration.',
    previewUrl: '',
    cssBackground: 'linear-gradient(135deg, #090d16 0%, #030712 100%)',
    overlayStyle: 'bg-zinc-950/30',
  },
  // Legacy aliases for backward compatibility
  {
    id: 'rice_terrace',
    name: 'Banaue Rice Terraces (Classic)',
    location: 'Ifugao',
    category: 'Nature & Landscapes',
    tag: 'Cordillera',
    description: 'Lush green terraced hills in golden warm sunlight.',
    previewUrl: banaueImg,
    cssBackground: `url('${banaueImg}')`,
    overlayStyle: 'bg-zinc-950/75 backdrop-brightness-75',
  },
];

export const SUBJECT_PRESETS = [
  { id: 'math', name: 'Mathematics', icon: '📐', prompt: 'Solve and explain step-by-step: ' },
  { id: 'science', name: 'Science & Biology', icon: '🔬', prompt: 'Explain the mechanism of: ' },
  { id: 'physics', name: 'Physics & Chemistry', icon: '⚡', prompt: 'Break down the principles behind: ' },
  { id: 'literature', name: 'English & Essays', icon: '✍️', prompt: 'Help me outline an essay on: ' },
  { id: 'history', name: 'Social Studies & History', icon: '🏛️', prompt: 'Analyze the causes and impacts of: ' },
  { id: 'cs', name: 'Computer Science & Code', icon: '💻', prompt: 'Explain the algorithm and code for: ' },
  { id: 'languages', name: 'World Languages', icon: '🌍', prompt: 'Help me practice speaking and grammar in: ' },
];

export const QUICK_STARTER_PROMPTS = [
  {
    category: 'STEM',
    title: 'Explain Cellular Respiration',
    prompt: 'Can you explain the steps of cellular respiration (Glycolysis, Krebs cycle, ETC) in a simple way with real-world analogies?',
    icon: '🧬',
  },
  {
    category: 'Math',
    title: 'Socratic Quadratic Formula',
    prompt: 'Can you guide me step-by-step through solving 2x² + 5x - 3 = 0 using Socratic mode?',
    icon: '📐',
  },
  {
    category: 'Writing',
    title: 'Review My Essay Thesis',
    prompt: 'I need help refining a thesis statement for an essay about the symbolism of the green light in The Great Gatsby. Here is my current draft: "The green light represents hope and the American dream."',
    icon: '📝',
  },
  {
    category: 'History',
    title: 'Cause of the French Revolution',
    prompt: 'What were the primary economic and social catalysts of the 1789 French Revolution?',
    icon: '👑',
  },
  {
    category: 'Study Aid',
    title: 'Create Flashcards on Mitosis',
    prompt: 'Generate 6 active recall flashcards on the phases of Mitosis (Prophase, Metaphase, Anaphase, Telophase, Cytokinesis).',
    icon: '🃏',
  },
  {
    category: 'Physics',
    title: 'Newton\'s Laws with Examples',
    prompt: 'Break down Newton\'s 3 Laws of Motion with real everyday high school examples and formulas.',
    icon: '🚀',
  },
  {
    category: 'Schedule',
    title: 'Schedule Math Exam & Prep',
    prompt: 'Can you schedule my Math Trigonometry exam for next Monday at 9:00 AM in Room 302 and create a 3-step study plan to prepare for it?',
    icon: '📅',
  },
  {
    category: 'Planner',
    title: 'Set Science Project Deadline',
    prompt: 'Save a date for my Biology Science Project presentation on Friday at 2:00 PM with high priority, and give me a checklist of what to include.',
    icon: '🎒',
  },
  {
    category: 'Philippine History',
    title: 'The Katipunan & 1896 Revolution',
    prompt: 'Can you analyze the key events and historical significance of the Cry of Pugad Lawin and the Philippine Revolution against Spanish colonial rule?',
    icon: '🇵🇭',
  },
  {
    category: 'Earth Science',
    title: 'Pacific Ring of Fire & Volcanoes',
    prompt: 'Why are the Philippines and Mount Mayon located along the Pacific Ring of Fire? Explain subduction zones and tectonic activity.',
    icon: '🌋',
  },
  {
    category: 'Chemistry',
    title: 'Balance Redox Reactions',
    prompt: 'How do you balance oxidation-reduction reactions using the half-reaction method in acidic solutions? Give me a worked example.',
    icon: '⚗️',
  },
  {
    category: 'Computer Science',
    title: 'Binary Search Algorithm',
    prompt: 'Explain how Binary Search works with an array diagram, step-by-step logic, and its O(log n) time complexity.',
    icon: '💻',
  },
  {
    category: 'Literature',
    title: 'Analyze Literary Devices in Poetry',
    prompt: 'Help me identify and analyze metaphors, imagery, and tone in Robert Frost\'s poem "The Road Not Taken".',
    icon: '📖',
  },
  {
    category: 'Economics',
    title: 'Supply, Demand & Market Equilibrium',
    prompt: 'Can you explain how price ceilings and floors affect supply and demand equilibrium with simple graph explanations?',
    icon: '📊',
  },
  {
    category: 'Biology',
    title: 'DNA Replication & Helicase',
    prompt: 'Walk me through the leading and lagging strand synthesis during DNA replication, including the role of DNA polymerase and Okazaki fragments.',
    icon: '🔬',
  },
  {
    category: 'Quiz Mode',
    title: 'Generate Quiz on World War II',
    prompt: 'Generate an interactive 5-question multiple choice quiz testing key turning points of World War II.',
    icon: '🎯',
  },
];
