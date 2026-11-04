import {
  BookOpen, Box, Brain, Briefcase, Camera, Cloud, Code, Coffee, Cpu, Film, Gamepad2, Globe, GraduationCap, Heart, Image,
  type LucideIcon, Monitor, Palette, PenTool, Puzzle, Rocket, Settings, Shapes, Smartphone, Star, Terminal, User, Watch, Wrench,
} from "lucide-react";
import type { ICON_NAMES } from "@/lib/folder-input";

// The picture drawn on a folder, like KDE's folder emblems
export const EMBLEMS: Record<(typeof ICON_NAMES)[number], LucideIcon> = {
  code: Code, terminal: Terminal, globe: Globe, smartphone: Smartphone, monitor: Monitor, coffee: Coffee, watch: Watch,
  brain: Brain, shapes: Shapes, user: User, "graduation-cap": GraduationCap, briefcase: Briefcase, box: Box, image: Image,
  camera: Camera, gamepad: Gamepad2, book: BookOpen, pen: PenTool, palette: Palette, heart: Heart, star: Star, rocket: Rocket,
  settings: Settings, puzzle: Puzzle, film: Film, wrench: Wrench, cpu: Cpu, cloud: Cloud,
};
