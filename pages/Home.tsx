import React from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../components/Icons';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div
        className="relative text-white overflow-hidden bg-gradient-to-br from-parish-blue to-purple-900 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(30,58,138,0.92), rgba(88,28,135,0.88)), url('/church-bg.jpg')"
        }}
      >
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 drop-shadow-lg">
            Welcome to Our Lady of <br />
            <span className="text-parish-pink">Miraculous Medal</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10 font-light">
            Quasi-Parish of Sabang Borongan. A community of faith, hope, and charity, 
            serving the people of God through the sacraments and the Word.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to="/schedules" 
              className="bg-parish-pink hover:bg-pink-600 text-white px-8 py-3 rounded-full font-medium transition shadow-lg flex items-center justify-center gap-2"
            >
              <Icons.Calendar size={20} /> Mass Schedules
            </Link>
            <Link 
              to="/bulletin" 
              className="bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/30 text-white px-8 py-3 rounded-full font-medium transition flex items-center justify-center gap-2"
            >
               <Icons.Bell size={20} /> Announcements
            </Link>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-parish-blue/10 text-parish-blue rounded-full text-sm font-semibold mb-4">
            <Icons.Sparkles size={16} /> Our Mission
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-800 mb-6">
            Proclaim the good news of Jesus Christ
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
            We are a community formed by the Gospel—welcoming all, serving the poor, and living
            the sacraments with joy in Sabang Borongan.
          </p>
        </div>
      </section>

      {/* Quick Links Grid */}
      <section className="py-16 bg-parish-silver">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group relative bg-gradient-to-br from-white via-white to-slate-50 p-8 sm:p-9 rounded-xl border border-slate-100 border-l-4 border-l-parish-blue shadow-sm transition hover:shadow-lg hover:-translate-y-0.5 hover:border-slate-200">
              <div className="bg-blue-100/80 w-11 h-11 rounded-lg flex items-center justify-center mb-4 text-parish-blue transition group-hover:bg-blue-100 group-hover:shadow-sm">
                <Icons.BookOpen size={22} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sacraments</h3>
              <p className="text-gray-600">
                Information on Baptism, Confirmation, Matrimony, and Anointing of the Sick.
              </p>
            </div>

            <div className="group relative bg-gradient-to-br from-white via-white to-rose-50/70 p-8 sm:p-9 rounded-xl border border-slate-100 border-l-4 border-l-parish-pink shadow-sm transition hover:shadow-lg hover:-translate-y-0.5 hover:border-slate-200">
              <div className="bg-pink-100/80 w-11 h-11 rounded-lg flex items-center justify-center mb-4 text-parish-pink transition group-hover:bg-pink-100 group-hover:shadow-sm">
                <Icons.Users size={22} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Community</h3>
              <p className="text-gray-600">
                Join our ministries, choirs, and youth organizations. Be part of the family.
              </p>
            </div>

            <div className="group relative bg-gradient-to-br from-white via-white to-amber-50/70 p-8 sm:p-9 rounded-xl border border-slate-100 border-l-4 border-l-yellow-500 shadow-sm transition hover:shadow-lg hover:-translate-y-0.5 hover:border-slate-200">
              <div className="bg-yellow-100/80 w-11 h-11 rounded-lg flex items-center justify-center mb-4 text-yellow-600 transition group-hover:bg-yellow-100 group-hover:shadow-sm">
                <Icons.FileText size={22} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Parish Office</h3>
              <p className="text-gray-600">
                Request certificates, schedule blessings, and mass intentions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Preview */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2025 Quasi-Parish of Our Lady of Miraculous Medal. Sabang Borongan.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
