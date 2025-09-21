"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  Clock, 
  DollarSign, 
  BarChart3, 
  Calendar, 
  Timer, 
  TrendingUp,
  CheckCircle,
  Users,
  Smartphone,
  Shield,
  Zap,
  ArrowRight
} from "lucide-react";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  const features = [
    {
      icon: Clock,
      title: "Time Tracking",
      description: "Record your working hours simply and accurately",
      color: "text-blue-500"
    },
    {
      icon: DollarSign,
      title: "Automatic Calculation",
      description: "Automatically calculate your earnings based on your hourly rate",
      color: "text-green-500"
    },
    {
      icon: BarChart3,
      title: "Detailed Reports",
      description: "View comprehensive reports of your time and earnings",
      color: "text-purple-500"
    },
    {
      icon: Calendar,
      title: "Date Organization",
      description: "Organize and filter your records by period",
      color: "text-orange-500"
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Sign Up",
      description: "Create your account and set up your hourly rate",
      icon: Users
    },
    {
      number: "2",
      title: "Log Hours",
      description: "Add your working hours with project and description",
      icon: Timer
    },
    {
      number: "3",
      title: "Track Earnings",
      description: "View your earnings and reports in real time",
      icon: TrendingUp
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants} className="text-center py-20">
          <motion.div
            className="inline-flex items-center gap-2 mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Clock className="w-12 h-12 text-blue-600" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              WorkLog
            </h1>
          </motion.div>
          
          <motion.p 
            className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
            variants={itemVariants}
          >
            Track your working hours and calculate your earnings simply and efficiently. 
            Perfect for freelancers and independent professionals.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={itemVariants}
          >
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                <Users className="w-5 h-5 mr-2" />
                Create Free Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Shield className="w-5 h-5 mr-2" />
                Sign In
              </Button>
            </Link>
          </motion.div>

          <motion.div 
            className="flex justify-center gap-2 mt-6 flex-wrap"
            variants={itemVariants}
          >
            <Badge variant="secondary" className="text-sm">
              <CheckCircle className="w-4 h-4 mr-1" />
              Free
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <Smartphone className="w-4 h-4 mr-1" />
              Responsive
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <Zap className="w-4 h-4 mr-1" />
              Fast
            </Badge>
          </motion.div>
        </motion.div>

        {/* Features Section */}
        <motion.div variants={itemVariants} className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Key Features
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage your time and calculate your earnings
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="h-full text-center border-0 shadow-lg">
                  <CardHeader>
                    <div className="mx-auto mb-4">
                      <feature.icon className={`w-12 h-12 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* How it Works Section */}
        <motion.div variants={itemVariants} className="py-16 bg-gray-50 rounded-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              In just 3 simple steps you'll be tracking your hours
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto px-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="text-center"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {step.number}
                  </div>
                  <step.icon className="w-8 h-8 text-blue-600 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div variants={itemVariants} className="py-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who already track their hours with WorkLog
          </p>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-4">
                <Users className="w-5 h-5 mr-2" />
                Get Started Now - It's Free!
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>

          <p className="text-sm text-gray-500 mt-4">
            No credit card required
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
