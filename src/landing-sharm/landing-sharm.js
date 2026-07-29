// src/landing-sharm/landing-sharm.js
// Main Orchestrator — Bootstraps all landing page widgets

import './landing-sharm.css';

import LandingHeader from './components/LandingHeader.js';
import HeroSection from './components/HeroSection.js';
import ItinerarySection from './components/ItinerarySection.js';
import ReviewsContainer from './components/ReviewsContainer.js';
import PricingWidget from './components/PricingWidget.js';
import BookingFormWidget from './components/BookingFormWidget.js';
import LandingFooter from './components/LandingFooter.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all widgets in order
  LandingHeader.init();
  HeroSection.init();
  ItinerarySection.init();
  ReviewsContainer.init();
  PricingWidget.init();
  BookingFormWidget.init();
  LandingFooter.init();

  console.log('Offerta Sharm Landing — All widgets initialized.');
});
