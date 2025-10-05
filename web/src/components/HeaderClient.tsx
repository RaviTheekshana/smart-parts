"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ChevronDownIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export default function HeaderClient() {
  const { token, logout, user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-30 ${
        isScrolled 
          ? "bg-black/50 backdrop-blur-xs shadow-lg" 
          : "bg-transparent"
      }`}
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              <img src="/logo.png" alt="Logo" className="w-32 h-31 pt-1" />
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link 
              href="/catalog" 
              className="text-white hover:text-gray-400 font-medium transition-colors duration-200"
            >
              Catalog
            </Link>
            <Link 
              href="/cart" 
              className="text-white hover:text-gray-400 font-medium transition-colors duration-200 relative"
            >
              Cart
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </Link>
            <Link 
              href="/orders" 
              className="text-white hover:text-gray-400 font-medium transition-colors duration-200"
            >
              Orders
            </Link>
            <Link 
              href="/community" 
              className="text-white hover:text-gray-400 font-medium transition-colors duration-200"
            >
              Community
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            {token ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 cursor-pointer group">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">U</span>
                  </div>
                  <ChevronDownIcon className="w-4 h-4 text-gray-500 group-hover:text-purple-600 transition-colors" />
                </div>
                <button 
                  onClick={logout}
                  className="bg-gray-100 hover:bg-gray-200 text-zinc-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link 
                  href="/login"
                  className="text-white hover:text-gray-400 font-medium transition-colors duration-200"
                >
                  Login
                </Link>
                <Link 
                  href="/register"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Register
                </Link>
              </>
            )}
            {user?.role === "admin" && (
              <a
                href="/admin"
                className="inline-flex items-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-3 py-1.5 text-sm hover:opacity-90 transition"
              >
                Admin
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200">
            <div className="px-4 py-6 space-y-4">
              <Link 
                href="/catalog"
                className="block text-gray-700 hover:text-purple-600 font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Catalog
              </Link>
              <Link 
                href="/cart"
                className="block text-gray-700 hover:text-purple-600 font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Cart
              </Link>
              <Link 
                href="/orders"
                className="block text-gray-700 hover:text-purple-600 font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Orders
              </Link>
              <Link 
                href="/community"
                className="block text-gray-700 hover:text-purple-600 font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Community
              </Link>
              
              <hr className="border-gray-200" />
              
              {token ? (
                <button 
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left text-gray-700 hover:text-purple-600 font-medium py-2"
                >
                  Logout
                </button>
              ) : (
                <div className="space-y-3">
                  <Link 
                    href="/login"
                    className="block text-gray-700 hover:text-purple-600 font-medium py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    href="/register"
                    className="block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg font-medium text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
