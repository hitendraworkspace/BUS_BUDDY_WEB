'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MapPinIcon,
  VideoCameraIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  CloudArrowUpIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  Bars3Icon,
  XMarkIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  StarIcon,
  TruckIcon,
  BellIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline'

export default function Home() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState(0)
  
  useEffect(() => {
    const localUser = localStorage.getItem('local_auth_user')
    if (localUser) {
      router.push('/dashboard')
    }
  }, [router])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center">
              <img 
                src="/assets/Gemini_Generated_Image_g28j6og28j6og28j.png" 
                alt="Bus buddy - fleet management system" 
                className="h-10 w-auto"
              />
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('features')}
                className="text-white hover:text-yellow-400 transition-colors flex items-center gap-1 text-sm font-medium"
              >
                Product & Solutions
                <ChevronDownIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => scrollToSection('solutions')}
                className="text-white hover:text-yellow-400 transition-colors flex items-center gap-1 text-sm font-medium"
              >
                Discover
                <ChevronDownIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="text-white hover:text-yellow-400 transition-colors flex items-center gap-1 text-sm font-medium"
              >
                Resource
                <ChevronDownIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
              >
                CONTACT US
              </button>
              <Link
                href="/login"
                className="bg-transparent text-white px-6 py-2.5 rounded-lg border-2 border-white hover:bg-white/10 transition-colors no-underline text-sm font-semibold"
              >
                Login
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black border-t border-gray-800">
            <div className="px-4 pt-2 pb-4 space-y-2">
              <button
                onClick={() => scrollToSection('features')}
                className="block w-full text-left px-3 py-2 text-white hover:bg-gray-900 rounded-lg"
              >
                Product & Solutions
              </button>
              <button
                onClick={() => scrollToSection('solutions')}
                className="block w-full text-left px-3 py-2 text-white hover:bg-gray-900 rounded-lg"
              >
                Discover
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="block w-full text-left px-3 py-2 text-white hover:bg-gray-900 rounded-lg"
              >
                Resource
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="block w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"
              >
                CONTACT US
              </button>
              <Link
                href="/login"
                className="block w-full bg-transparent text-white px-3 py-2 rounded-lg border-2 border-white hover:bg-white/10 no-underline text-center font-semibold"
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="hero" className="pt-14 pb-20 relative overflow-hidden bg-gradient-to-b from-black via-slate-900 via-blue-950 to-blue-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center py-20">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              <span className="text-white">THE FUTURE OF </span>
              <span className="text-yellow-400">SCHOOL TRANSPORTATION</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
              School Bus Tracking Solution Ensuring Student Safety and Streamlining Journey
            </p>
            <button
              onClick={() => scrollToSection('contact')}
              className="bg-white text-blue-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all shadow-2xl hover:shadow-blue-500/50"
            >
              GET A DEMO
            </button>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 rounded-2xl overflow-hidden shadow-2xl border border-gray-700/50">
            <img 
              src="/assets/smart-bus-hero-image-1.png" 
              alt="Smart Bus Dashboard" 
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose Bus Buddy?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive fleet management solutions designed for modern transportation needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheckIcon,
                title: 'White Label Software',
                description: 'Fully customizable solution that aligns with your brand identity and operational needs.',
              },
              {
                icon: CpuChipIcon,
                title: 'Device Agnostic',
                description: 'Works seamlessly with any GPS tracker, sensor, or camera hardware you already have.',
              },
              {
                icon: UserCircleIcon,
                title: 'Multi-Language Support',
                description: 'Reach global audiences with built-in support for multiple languages.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:scale-110 transition-all">
                  <feature.icon className="h-8 w-8 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-b from-black via-slate-900 via-blue-950 to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '15+', label: 'Countries' },
              { number: '1000+', label: 'Schools' },
              { number: '500K+', label: 'Students' },
              { number: '450K+', label: 'Happy Parents' },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-5xl md:text-6xl font-black text-white mb-2">{stat.number}</div>
                <div className="text-lg text-blue-100 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Solutions */}
      <section id="solutions" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Complete Business Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage your fleet efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheckIcon,
                title: 'White Labelling',
                description: 'Customize the platform to match your brand perfectly.',
              },
              {
                icon: CpuChipIcon,
                title: 'Device Agnostic',
                description: 'Compatible with all major GPS and tracking devices.',
              },
              {
                icon: Cog6ToothIcon,
                title: 'Custom Development',
                description: 'Build features tailored to your specific requirements.',
              },
              {
                icon: UserCircleIcon,
                title: 'Training & Onboarding',
                description: 'Comprehensive training programs for your team.',
              },
              {
                icon: CloudArrowUpIcon,
                title: 'Bulk Data Import',
                description: 'Import student and fleet data via CSV or Excel.',
              },
              {
                icon: ClockIcon,
                title: '24/7 Support',
                description: 'Round-the-clock assistance from our expert team.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Solutions for Everyone
            </h2>
            <p className="text-xl text-gray-600">
              Dedicated apps for parents, admins, and drivers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Parent App',
                features: ['Real-Time Bus Tracking', 'Alerts & Notifications', 'Leave Management'],
                icon: DevicePhoneMobileIcon,
              },
              {
                title: 'Admin App',
                features: ['Dashboard & Analytics', 'Student Management', 'Reports & Insights'],
                icon: ComputerDesktopIcon,
              },
              {
                title: 'Driver App',
                features: ['Route Navigation', 'Trip Management', 'Real-Time Updates'],
                icon: TruckIcon,
              },
            ].map((app, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border-2 border-blue-100 hover:border-blue-500 transition-all"
              >
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <app.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">{app.title}</h3>
                <ul className="space-y-3">
                  {app.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about Bus Buddy
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: 'What is Bus Buddy?',
                answer: 'Bus Buddy is a comprehensive school bus monitoring software that ensures the safety and efficiency of student transportation through real-time tracking and management.',
              },
              {
                question: 'How does Bus Buddy improve transportation efficiency?',
                answer: 'Bus Buddy provides real-time tracking, route optimization, automated notifications, and comprehensive analytics to streamline operations and reduce delays.',
              },
              {
                question: 'Is Bus Buddy customizable?',
                answer: 'Yes, Bus Buddy offers white-label solutions and customizable features to fit the specific needs and branding of each school or organization.',
              },
              {
                question: 'Can parents track bus location?',
                answer: 'Absolutely! Parents can track their child\'s bus in real-time through our mobile app, receiving live updates and notifications about arrival times.',
              },
              {
                question: 'How does Bus Buddy enhance safety?',
                answer: 'Bus Buddy includes GPS tracking, driver behavior monitoring, emergency alerts, and comprehensive reporting to ensure student safety throughout their journey.',
              },
            ].map((faq, index) => {
              const isOpen = openFaqIndex === index
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-bold text-gray-900 text-lg pr-4">{faq.question}</span>
                    {isOpen ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-600 flex-shrink-0" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-600 flex-shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-black via-slate-900 via-blue-950 to-blue-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Take the stress out of school transportation with Bus Buddy
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => scrollToSection('contact')}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-xl"
            >
              GET A DEMO
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="bg-transparent text-white px-8 py-4 rounded-lg font-bold text-lg border-2 border-white hover:bg-white/10 transition-colors"
            >
              CONTACT US
            </button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              We're Here to Help 24/7
            </h2>
            <p className="text-xl text-gray-600">
              Get in touch with our team anytime
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: ChatBubbleLeftRightIcon,
                title: "Let's Chat",
                description: 'Get answers to your questions',
                contact: '+91 72838 68560',
                link: 'tel:+917283868560',
              },
              {
                icon: EnvelopeIcon,
                title: 'Sales Inquiries',
                description: 'Get answers to your questions',
                contact: 'director@vasdigitek.net',
                link: 'mailto:director@vasdigitek.net',
              },
              {
                icon: PhoneIcon,
                title: 'Call Us',
                description: 'Instant and easy communication',
                contact: '+91 72838 68560',
                link: 'tel:+917283868560',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl p-8 text-center border-2 border-gray-100 hover:border-blue-500 hover:shadow-xl transition-all"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 mb-4">{item.description}</p>
                <a
                  href={item.link}
                  className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                >
                  {item.contact}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-black via-slate-900 via-blue-950 to-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="text-lg font-bold mb-4 text-white">BUS BUDDY</h3>
              <p className="text-white text-sm mb-4 font-medium">
                Comprehensive fleet management platform for modern transportation needs.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4 text-white">Quick Links</h3>
              <div className="space-y-2 text-sm text-white">
                <a href="#" className="block hover:text-blue-300 transition-colors font-semibold">Home</a>
                <a href="#" className="block hover:text-blue-300 transition-colors font-semibold">About Us</a>
                <a href="#" className="block hover:text-blue-300 transition-colors font-semibold">Contact</a>
                <a href="#" className="block hover:text-blue-300 transition-colors font-semibold">Blog</a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4 text-white">Products</h3>
              <div className="space-y-2 text-sm text-white">
                <a href="#" className="block hover:text-blue-300 transition-colors font-semibold">School Bus Management</a>
                <a href="#" className="block hover:text-blue-300 transition-colors font-semibold">Employee Transport</a>
                <a href="#" className="block hover:text-blue-300 transition-colors font-semibold">Public Transportation</a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4 text-white">Contact</h3>
              <div className="space-y-3 text-sm text-white">
                <div className="flex items-center gap-2">
                  <PhoneIcon className="h-5 w-5" />
                  <a href="tel:+917283868560" className="hover:text-blue-300 transition-colors font-semibold">
                    +91 72838 68560
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <EnvelopeIcon className="h-5 w-5" />
                  <a href="mailto:director@vasdigitek.net" className="hover:text-blue-300 transition-colors font-semibold">
                    director@vasdigitek.net
                  </a>
                </div>
                <div className="flex items-start gap-2 mt-4">
                  <BuildingOfficeIcon className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-semibold">307 Dev Prime Corporate</p>
                    <p className="font-semibold">Road 380051</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-white text-sm font-semibold">Copyright © 2025 Bus Buddy. All rights reserved.</p>
              <div className="flex gap-6 text-sm text-white">
                <a href="#" className="hover:text-blue-300 transition-colors font-semibold">Privacy Policy</a>
                <a href="#" className="hover:text-blue-300 transition-colors font-semibold">Terms & Conditions</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/7878701007"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-colors"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </a>

      {/* Let's Connect Sidebar */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 hidden lg:block">
        <button className="bg-gradient-to-l from-sky-600 to-sky-700 text-white px-4 py-4 rounded-l-2xl shadow-xl cursor-pointer hover:from-sky-500 hover:to-sky-600 transition-all border-0 outline-none">
          <div className="writing-vertical-rl text-sm font-semibold whitespace-nowrap">
            Let's Connect !
          </div>
        </button>
      </div>
    </div>
  )
}
