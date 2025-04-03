import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  Leaf,
  Heart,
  Users,
  Star,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

const LandingPage = () => {
  const user = useSelector((state: RootState) => state.auth?.user ?? null);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
     

      <header className="bg-white shadow-md  px-6">
  <div className="max-w-7xl mx-auto flex justify-between items-center">
    {/* Contact Number Section */}
    <div className="flex items-center space-x-2">
      <span className="text-green-600 text-lg font-semibold">📞</span>
      <a href="tel:+1501 668 0123" className="text-green-700 text-lg font-medium hover:underline">
   +1 501 668 0123

      </a>
    </div>

    {/* Logo Section */}
    <div>
      <img src="/logobg.png" alt="Logo" className="h-24 md:h-24 transition-transform duration-300 hover:scale-105" />
    </div>
  </div>
</header>




      <section className="relative bg-green-700">
  {/* Gradient Overlay */}
  <div className="absolute inset-0 bg-gradient-to-r from-green-900 to-green-600 opacity-90" aria-hidden="true" />

  

  {/* Content Section */}
  <div className="relative z-10 px-6 sm:px-10 lg:px-16 py-20 md:py-28 mx-auto max-w-7xl text-center flex flex-col items-center">
    <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6">
      Fresh Produce, <span className="text-yellow-300">Direct to You</span>
    </h1>
    <p className="text-lg md:text-2xl text-white/90 max-w-3xl mb-8">
      Vali Produce delivers the freshest fruits and vegetables from farm to your shop, ensuring quality and sustainability at every step.
    </p>

    {/* Buttons */}
    <div className="flex flex-col sm:flex-row gap-4">
      <a href="/shop" className="px-6 py-3 text-lg font-medium bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg shadow-md">
        Shop Now
      </a>
      <a href="/auth" className="px-6 py-3 text-lg font-medium border border-white text-white hover:bg-white/10 rounded-lg shadow-md">
        Create Account
      </a>
    </div>
  </div>
</section>


      {/* Features Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Vali Produce?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're committed to quality, sustainability, and exceptional
              service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6 flex flex-col items-center text-center p-6">
                <div className="p-3 rounded-full bg-green-100 mb-4">
                  <Leaf className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Farm Fresh</h3>
                <p className="text-gray-600">
                  All our produce comes directly from local farms, ensuring
                  freshness and supporting local agriculture.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6 flex flex-col items-center text-center p-6">
                <div className="p-3 rounded-full bg-green-100 mb-4">
                  <ShieldCheck className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Quality Guaranteed</h3>
                <p className="text-gray-600">
                  We handpick and inspect every item to ensure only the best
                  quality produce reaches your business.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6 flex flex-col items-center text-center p-6">
                <div className="p-3 rounded-full bg-green-100 mb-4">
                  <Truck className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Reliable Delivery</h3>
                <p className="text-gray-600">
                  Our efficient delivery system ensures your orders arrive on
                  time, every time.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-green-50">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                About Vali Produce
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                Founded with a passion for fresh produce and sustainable
                farming, Vali Produce has been connecting farmers with
                businesses for over a decade.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                We believe in building lasting relationships with both our
                suppliers and customers, ensuring transparency and trust
                throughout the supply chain.
              </p>
              <p className="text-lg text-gray-700">
                Our mission is to make fresh, high-quality produce accessible to
                all businesses while supporting sustainable farming practices.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-gray-700">100% Farm Direct</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-gray-700">Sustainable Practices</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-gray-700">Ethical Sourcing</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-green-200 flex items-center justify-center">
                <div className="text-center p-8">
                  <Leaf className="h-20 w-20 text-green-700 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-green-800">
                    Vali Produce
                  </h3>
                  <p className="text-green-700">Farm Fresh, Business Ready</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How to Get Started
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Setting up your account and ordering is simple
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-700 font-bold text-xl mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Create Account</h3>
              <p className="text-gray-600">
                Sign up for a free business account to access our full product
                catalog
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-700 font-bold text-xl mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Browse Products</h3>
              <p className="text-gray-600">
                Explore our extensive range of fresh fruits and vegetables
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-700 font-bold text-xl mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Place Order</h3>
              <p className="text-gray-600">
                Select your items, quantities, and preferred delivery options
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-700 font-bold text-xl mb-4">
                4
              </div>
              <h3 className="text-xl font-bold mb-2">Receive Delivery</h3>
              <p className="text-gray-600">
                Get fresh produce delivered right to your business location
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white font-medium text-lg"
              asChild
            >
              <Link to="/auth">Create Your Account Today</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-green-50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Businesses that rely on Vali Produce every day
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-none shadow-lg">
              <CardContent className="pt-6 p-6">
                <div className="flex mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-5 w-5 text-yellow-500 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6">
                  "Vali Produce has transformed how we source our ingredients.
                  The quality is consistently exceptional, and their delivery is
                  always on time."
                </p>
                <div className="flex items-center">
                  <div className="rounded-full bg-green-200 w-12 h-12 flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-700" />
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold">Fresh Bites Cafe</h4>
                    <p className="text-sm text-gray-500">Restaurant</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardContent className="pt-6 p-6">
                <div className="flex mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-5 w-5 text-yellow-500 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6">
                  "As a grocery store owner, I need reliable suppliers. Vali
                  Produce has never let me down - their produce is always fresh
                  and their service is excellent."
                </p>
                <div className="flex items-center">
                  <div className="rounded-full bg-green-200 w-12 h-12 flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-700" />
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold">Community Market</h4>
                    <p className="text-sm text-gray-500">Grocery Store</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardContent className="pt-6 p-6">
                <div className="flex mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-5 w-5 text-yellow-500 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6">
                  "The organic selection at Vali Produce has helped us maintain
                  our commitment to healthy, sustainable food. Their customer
                  service is top-notch."
                </p>
                <div className="flex items-center">
                  <div className="rounded-full bg-green-200 w-12 h-12 flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-700" />
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold">Green Earth Co-op</h4>
                    <p className="text-sm text-gray-500">Food Cooperative</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-green-700 text-white">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Experience the Vali Produce Difference?
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join hundreds of satisfied businesses that trust us for their fresh
            produce needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium text-lg"
              asChild
            >
              <Link to="/store">Browse Products</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white text-gray-900 hover:bg-white/10 font-medium text-lg"
              asChild
            >
              <Link to="/auth">Sign Up Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Vali Produce</h3>
              <p className="mb-4">
                Delivering fresh produce to businesses since 2010.
              </p>
              <p className="text-green-300">Farm Fresh, Business Ready</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/store"
                    className="text-green-300 hover:text-white transition-colors"
                  >
                    Products
                  </Link>
                </li>
                <li>
                  <Link
                    to="/auth"
                    className="text-green-300 hover:text-white transition-colors"
                  >
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    className="text-green-300 hover:text-white transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-green-300 hover:text-white transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contact Us</h3>
              <p className="mb-2">123 Produce Lane</p>
              <p className="mb-2">Freshville, CA 94107</p>
              <p className="mb-2">contact@valiproduce.com</p>
              <p>(555) 123-4567</p>
            </div>
          </div>
          <div className="border-t border-green-800 mt-8 pt-8 text-center">
            <p>
              © {new Date().getFullYear()} Vali Produce. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
