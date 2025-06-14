// app/page.tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart3,
  Brain,
  FileText,
  Lightbulb,
  TrendingUp,
  Users,
} from "lucide-react";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <span className="font-bold text-2xl text-gray-900">ReviewAI</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Transform Customer Reviews into
            <span className="text-blue-600"> Strategic Insights</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AI-powered analysis of customer reviews to unlock actionable
            business intelligence. Get sentiment analysis, customer personas,
            competitive insights, and strategic recommendations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/signup">Start Free Analysis</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Review Analysis
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get 11 different AI-powered analyses from your customer review
              data
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Brain className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Sentiment Analysis</CardTitle>
                <CardDescription>
                  Understand what customers love and dislike about your products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Automatically categorize feedback into themes with importance
                  levels and customer quotes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Customer Personas</CardTitle>
                <CardDescription>
                  AI-generated customer profiles with demographics and behaviors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Detailed personas including psychographics, buying behavior,
                  and AI-generated profile images.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>SWOT Analysis</CardTitle>
                <CardDescription>
                  Identify strengths, weaknesses, opportunities, and threats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Strategic analysis based on customer feedback patterns and
                  sentiment trends.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Lightbulb className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Jobs To Be Done</CardTitle>
                <CardDescription>
                  Understand functional, emotional, and social jobs customers
                  hire your product for
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Apply Christensen methodology to uncover deeper customer
                  motivations and needs.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Customer Journey</CardTitle>
                <CardDescription>
                  Map the complete customer experience from awareness to
                  post-purchase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Identify touchpoints, emotions, pain points, and opportunities
                  at each stage.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Strategic Recommendations</CardTitle>
                <CardDescription>
                  Actionable insights for product, marketing, and competitive
                  strategy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Prioritized recommendations with implementation timelines and
                  expected impact.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to unlock your review insights?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Upload your CSV file and get comprehensive AI analysis in minutes.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/auth/signup">Start Your Free Analysis</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6" />
              <span className="font-bold text-lg">ReviewAI</span>
            </div>
            <p className="text-gray-400">
              © 2024 ReviewAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
