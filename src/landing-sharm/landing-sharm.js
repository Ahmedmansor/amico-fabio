// src/landing-sharm/landing-sharm.js
// Main Orchestrator — Bootstraps all landing page widgets

import './landing-sharm.css';

import LandingHeader from './components/LandingHeader.js';
import HeroSection from './components/HeroSection.js';
import WhatsAppFloat from './components/WhatsAppFloat.js';
import WhyChooseUs from './components/WhyChooseUs.js';
import ProgramsCards from './components/ProgramsCards.js';
import TimelineSteps from './components/TimelineSteps.js';
import VideoTestimonials from './components/VideoTestimonials.js';
import FaqSection from './components/FaqSection.js';
import BookingFormWidget from './components/BookingFormWidget.js';
import TrustBadges from './components/TrustBadges.js';
import LandingFooter from './components/LandingFooter.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all widgets in section order
  LandingHeader.init();
  HeroSection.init();
  WhatsAppFloat.init();
  WhyChooseUs.init();
  ProgramsCards.init();
  TimelineSteps.init();
  VideoTestimonials.init();
  FaqSection.init();
  BookingFormWidget.init();
  TrustBadges.init();
  LandingFooter.init();

  console.log('Offerta Sharm Landing — All widgets initialized.');
});
