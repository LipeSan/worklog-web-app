"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Star, 
  Zap, 
  Sparkles, 
  Rocket, 
  Code, 
  Palette, 
  MousePointer 
} from "lucide-react";

export default function Home() {
  const [liked, setLiked] = useState(false);
  const [stars, setStars] = useState(42);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <motion.div
        className="max-w-6xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <motion.h1 
            className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Sparkles className="inline-block mr-2 text-yellow-500" />
            Bibliotecas UI Integradas
          </motion.h1>
          <motion.p 
            className="text-xl text-slate-600 dark:text-slate-300"
            variants={itemVariants}
          >
            Demonstração do Shadcn/UI + Radix + Lucide + Framer Motion
          </motion.p>
        </motion.div>

        {/* Badges */}
        <motion.div variants={itemVariants} className="flex justify-center gap-2 mb-8 flex-wrap">
          <Badge variant="default" className="text-sm">
            <Code className="w-4 h-4 mr-1" />
            Shadcn/UI
          </Badge>
          <Badge variant="secondary" className="text-sm">
            <Palette className="w-4 h-4 mr-1" />
            Radix UI
          </Badge>
          <Badge variant="outline" className="text-sm">
            <Sparkles className="w-4 h-4 mr-1" />
            Lucide Icons
          </Badge>
          <Badge variant="destructive" className="text-sm">
            <Zap className="w-4 h-4 mr-1" />
            Framer Motion
          </Badge>
        </motion.div>

        {/* Cards Grid */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {/* Card 1 - Shadcn/UI */}
          <motion.div
            whileHover={{ scale: 1.05, rotateY: 5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-blue-500" />
                  Shadcn/UI
                </CardTitle>
                <CardDescription>
                  Componentes reutilizáveis construídos com Radix UI e Tailwind CSS
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full">
                    <Rocket className="w-4 h-4 mr-2" />
                    Botão Principal
                  </Button>
                  <Button variant="outline" className="w-full">
                    Botão Secundário
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full">
                    Botão Ghost
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 2 - Lucide Icons */}
          <motion.div
            whileHover={{ scale: 1.05, rotateY: -5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-green-500" />
                  Lucide Icons
                </CardTitle>
                <CardDescription>
                  Ícones bonitos e consistentes para sua aplicação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {[Heart, Star, Zap, Sparkles, Rocket, Code, Palette, MousePointer].map((Icon, index) => (
                    <motion.div
                      key={index}
                      className="flex justify-center p-3 rounded-lg bg-slate-100 dark:bg-slate-800"
                      whileHover={{ scale: 1.2, rotate: 360 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 3 - Framer Motion */}
          <motion.div
            whileHover={{ scale: 1.05, rotateX: 5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-500" />
                  Framer Motion
                </CardTitle>
                <CardDescription>
                  Animações fluidas e interações envolventes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div
                  className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg"
                  animate={{
                    scale: [1, 1.05, 1],
                    rotate: [0, 1, -1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                />
                <div className="flex gap-2">
                  <motion.button
                    className="flex-1 p-2 bg-blue-500 text-white rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setLiked(!liked);
                      if (!liked) setStars(stars + 1);
                      else setStars(stars - 1);
                    }}
                  >
                    <Heart className={`w-4 h-4 mx-auto ${liked ? 'fill-current' : ''}`} />
                  </motion.button>
                  <motion.div
                    className="flex items-center gap-1 px-3 py-2 bg-yellow-500 text-white rounded-lg"
                    animate={{ scale: liked ? [1, 1.2, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Star className="w-4 h-4" />
                    <span className="text-sm font-medium">{stars}</span>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="text-center">
          <motion.p 
            className="text-slate-600 dark:text-slate-400 mb-4"
            whileHover={{ scale: 1.05 }}
          >
            Todas as bibliotecas funcionando perfeitamente juntas! 🚀
          </motion.p>
          <motion.div
            className="flex justify-center gap-4"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants}>
              <Button variant="outline" size="lg">
                <Code className="w-4 h-4 mr-2" />
                Ver Código
              </Button>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Button size="lg">
                <Rocket className="w-4 h-4 mr-2" />
                Começar Projeto
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
