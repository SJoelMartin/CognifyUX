import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { 
  Brain, 
  ArrowLeft, 
  ShoppingCart, 
  CreditCard, 
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";

/**
 * Demo Checkout Page with Intentional UX Friction
 * 
 * This page is designed to trigger cognitive load signals:
 * - Confusing labels (decision hesitation)
 * - Too many choices (cognitive overload)
 * - Poor error messages (error recovery cost)
 * - Hidden important information
 * - Unexpected scroll requirements
 */

const Demo = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
    shippingSpeed: "",
    giftWrap: false,
    newsletter: true,
    terms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitAttempts, setSubmitAttempts] = useState(0);

  // Friction: Many confusing shipping options
  const shippingOptions = [
    { id: "standard", label: "Standard (7-10 business days)", price: "$4.99", note: "Excludes weekends" },
    { id: "expedited", label: "Expedited (5-7 business days)", price: "$9.99", note: "Weather may affect" },
    { id: "express", label: "Express (3-5 business days)", price: "$14.99", note: "Not available in all areas" },
    { id: "overnight", label: "Overnight (1-2 business days)", price: "$24.99", note: "Order by 2PM EST" },
    { id: "sameday", label: "Same Day (Select areas)", price: "$39.99", note: "Limited availability" },
    { id: "priority", label: "Priority Plus (2-3 business days)", price: "$19.99", note: "Signature required" },
  ];

  // Friction: Unclear country options
  const countries = [
    "United States of America (USA)",
    "United States Minor Outlying Islands",
    "United States Virgin Islands",
    "Canada (CA)",
    "Canada (French)",
    "UK - United Kingdom",
    "United Kingdom (Great Britain)",
    "Other - International",
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (currentStep === 1) {
      // Friction: Unhelpful error messages
      if (!formData.email) newErrors.email = "Required field";
      else if (!formData.email.includes("@")) newErrors.email = "Invalid format";
      if (!formData.phone) newErrors.phone = "Required field";
      else if (formData.phone.length < 10) newErrors.phone = "Invalid format";
      if (!formData.firstName) newErrors.firstName = "Required field";
      if (!formData.lastName) newErrors.lastName = "Required field";
    }
    
    if (currentStep === 2) {
      if (!formData.address1) newErrors.address1 = "Required";
      if (!formData.city) newErrors.city = "Required";
      if (!formData.state) newErrors.state = "Required";
      if (!formData.zip) newErrors.zip = "Required";
      if (!formData.country) newErrors.country = "Required";
      if (!formData.shippingSpeed) newErrors.shippingSpeed = "Please select shipping";
    }
    
    if (currentStep === 3) {
      if (!formData.cardNumber) newErrors.cardNumber = "Card number is required";
      else if (formData.cardNumber.length < 16) newErrors.cardNumber = "Invalid card";
      if (!formData.cardExpiry) newErrors.cardExpiry = "Required";
      if (!formData.cardCvc) newErrors.cardCvc = "Required";
      if (!formData.terms) newErrors.terms = "You must accept terms";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setSubmitAttempts(prev => prev + 1);
      toast.error("Please fix the errors before continuing");
    }
  };

  const handleSubmit = () => {
    if (validateStep(3)) {
      toast.success("Order placed successfully! (Demo mode)");
      setStep(4);
    } else {
      setSubmitAttempts(prev => prev + 1);
      toast.error("Please complete all required fields");
    }
  };

  return (
    <div className="min-h-screen bg-background dark tech-grid-bg">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-semibold">CLA Demo</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 text-cla-warning" />
                This page has intentional UX friction for testing
              </div>
              <Link to="/dashboard">
                <Button variant="outline" size="sm">
                  View Analytics
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps - Friction: Unclear step labels */}
      <div className="border-b border-border/50 bg-muted/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-center gap-4">
            {[
              { num: 1, label: "Information", sublabel: "Contact & Personal" },
              { num: 2, label: "Delivery Options", sublabel: "Address & Shipping" },
              { num: 3, label: "Payment Details", sublabel: "Billing & Review" },
              { num: 4, label: "Confirmation", sublabel: "Order Complete" },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step >= s.num ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                </div>
                <div className="hidden md:block">
                  <div className={`text-sm font-medium ${step >= s.num ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {s.label}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.sublabel}</div>
                </div>
                {i < 3 && <div className="hidden md:block w-12 h-px bg-border mx-2" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {/* Step 1: Contact Information */}
            {step === 1 && (
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    Please provide your contact details for order updates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Friction: Two similar fields with confusing labels */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-1">
                        Email Address (Primary)
                        <HelpCircle className="w-3 h-3 text-muted-foreground" />
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={errors.email ? "border-destructive" : ""}
                      />
                      {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-1">
                        Phone Number (with country code)
                        <HelpCircle className="w-3 h-3 text-muted-foreground" />
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className={errors.phone ? "border-destructive" : ""}
                      />
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                    </div>
                  </div>

                  {/* Friction: Separate first/last name in unusual order */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Family Name / Surname</Label>
                      <Input
                        id="lastName"
                        placeholder="Smith"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        className={errors.lastName ? "border-destructive" : ""}
                      />
                      {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Given Name / First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        className={errors.firstName ? "border-destructive" : ""}
                      />
                      {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                    </div>
                  </div>

                  {/* Friction: Hidden additional options */}
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Advanced Contact Options
                  </button>
                  
                  {showAdvanced && (
                    <div className="space-y-4 p-4 bg-muted/30 rounded-lg animate-fade-in">
                      <p className="text-sm text-muted-foreground">
                        These options are optional but recommended for faster delivery updates.
                      </p>
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="newsletter"
                          checked={formData.newsletter}
                          onCheckedChange={(checked) => handleInputChange("newsletter", checked as boolean)}
                        />
                        <div>
                          <Label htmlFor="newsletter" className="text-sm cursor-pointer">
                            Subscribe to our promotional emails, newsletters, special offers, 
                            partner communications, and weekly digest
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            (Pre-selected for your convenience)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: Shipping */}
            {step === 2 && (
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle>Delivery Information</CardTitle>
                  <CardDescription>
                    Where should we ship your order?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="address1">Street Address (Line 1)</Label>
                    <Input
                      id="address1"
                      placeholder="123 Main St"
                      value={formData.address1}
                      onChange={(e) => handleInputChange("address1", e.target.value)}
                      className={errors.address1 ? "border-destructive" : ""}
                    />
                    {errors.address1 && <p className="text-xs text-destructive">{errors.address1}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address2">
                      Apartment, Suite, Unit, Building, Floor, Door Code (Optional)
                    </Label>
                    <Input
                      id="address2"
                      placeholder="Apt 4B"
                      value={formData.address2}
                      onChange={(e) => handleInputChange("address2", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City/Town/Locality</Label>
                      <Input
                        id="city"
                        placeholder="New York"
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        className={errors.city ? "border-destructive" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province/Region</Label>
                      <Input
                        id="state"
                        placeholder="NY"
                        value={formData.state}
                        onChange={(e) => handleInputChange("state", e.target.value)}
                        className={errors.state ? "border-destructive" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP/Postal Code</Label>
                      <Input
                        id="zip"
                        placeholder="10001"
                        value={formData.zip}
                        onChange={(e) => handleInputChange("zip", e.target.value)}
                        className={errors.zip ? "border-destructive" : ""}
                      />
                    </div>
                  </div>

                  {/* Friction: Confusing country dropdown */}
                  <div className="space-y-2">
                    <Label>Country/Region/Territory</Label>
                    <Select 
                      value={formData.country} 
                      onValueChange={(value) => handleInputChange("country", value)}
                    >
                      <SelectTrigger className={errors.country ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select your country..." />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.country && <p className="text-xs text-destructive">{errors.country}</p>}
                  </div>

                  {/* Friction: Too many shipping options */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      Shipping Method
                      <span className="text-xs text-muted-foreground">(Required)</span>
                    </Label>
                    {errors.shippingSpeed && (
                      <p className="text-xs text-destructive">{errors.shippingSpeed}</p>
                    )}
                    <RadioGroup
                      value={formData.shippingSpeed}
                      onValueChange={(value) => handleInputChange("shippingSpeed", value)}
                      className="space-y-2"
                    >
                      {shippingOptions.map((option) => (
                        <div
                          key={option.id}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                            formData.shippingSpeed === option.id ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value={option.id} id={option.id} />
                            <div>
                              <Label htmlFor={option.id} className="cursor-pointer font-medium">
                                {option.label}
                              </Label>
                              <p className="text-xs text-muted-foreground">{option.note}</p>
                            </div>
                          </div>
                          <span className="font-semibold text-primary">{option.price}</span>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Friction: Upsell in the middle of checkout */}
                  <div className="p-4 bg-secondary/10 border border-secondary/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="giftWrap"
                        checked={formData.giftWrap}
                        onCheckedChange={(checked) => handleInputChange("giftWrap", checked as boolean)}
                      />
                      <div>
                        <Label htmlFor="giftWrap" className="cursor-pointer font-medium">
                          Add Premium Gift Wrapping (+$7.99)
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Includes ribbon, personalized card, and luxury box
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Information
                  </CardTitle>
                  <CardDescription>
                    Enter your payment details securely
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="4242 4242 4242 4242"
                      value={formData.cardNumber}
                      onChange={(e) => handleInputChange("cardNumber", e.target.value.replace(/\D/g, '').slice(0, 16))}
                      className={errors.cardNumber ? "border-destructive" : ""}
                    />
                    {errors.cardNumber && <p className="text-xs text-destructive">{errors.cardNumber}</p>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardExpiry">Expiration (MM/YY)</Label>
                      <Input
                        id="cardExpiry"
                        placeholder="12/25"
                        value={formData.cardExpiry}
                        onChange={(e) => handleInputChange("cardExpiry", e.target.value)}
                        className={errors.cardExpiry ? "border-destructive" : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardCvc">Security Code (CVV/CVC)</Label>
                      <Input
                        id="cardCvc"
                        placeholder="123"
                        type="password"
                        value={formData.cardCvc}
                        onChange={(e) => handleInputChange("cardCvc", e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className={errors.cardCvc ? "border-destructive" : ""}
                      />
                    </div>
                  </div>

                  {/* Friction: Long terms text with required checkbox at bottom */}
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg max-h-48 overflow-y-auto text-sm text-muted-foreground">
                    <p>
                      By completing this purchase, you agree to our Terms of Service, Privacy Policy, 
                      Return Policy, Shipping Policy, Cookie Policy, and all applicable terms and conditions.
                    </p>
                    <p>
                      You understand that your order is subject to availability and may be canceled 
                      if items are out of stock. Shipping times are estimates only and not guaranteed.
                    </p>
                    <p>
                      You consent to receiving transactional emails related to your order, including 
                      shipping updates, delivery notifications, and post-purchase surveys.
                    </p>
                    <p>
                      For international orders, you acknowledge responsibility for any customs duties, 
                      taxes, or import fees that may apply. Prices shown do not include these fees.
                    </p>
                  </div>
                  
                  <div className={`flex items-start gap-2 ${errors.terms ? 'text-destructive' : ''}`}>
                    <Checkbox
                      id="terms"
                      checked={formData.terms}
                      onCheckedChange={(checked) => handleInputChange("terms", checked as boolean)}
                    />
                    <Label htmlFor="terms" className="text-sm cursor-pointer leading-relaxed">
                      I have read, understood, and agree to all terms and conditions listed above *
                    </Label>
                  </div>
                  {errors.terms && <p className="text-xs text-destructive">{errors.terms}</p>}
                </CardContent>
              </Card>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
              <Card className="animate-fade-in">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-cla-success/20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-cla-success" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Order Confirmed!</h2>
                  <p className="text-muted-foreground mb-6">
                    Thank you for trying our demo. Your interactions have been tracked for cognitive load analysis.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Link to="/dashboard">
                      <Button className="gap-2">
                        View Your Analytics
                      </Button>
                    </Link>
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Try Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            {step < 4 && (
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => setStep(Math.max(1, step - 1))}
                  disabled={step === 1}
                >
                  Back
                </Button>
                {step < 3 ? (
                  <Button onClick={handleNext} className="gap-2">
                    Continue
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} className="gap-2">
                    <CreditCard className="w-4 h-4" />
                    Place Order
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-32">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Demo Product */}
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <Brain className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">CLA Pro License</h4>
                    <p className="text-sm text-muted-foreground">Annual subscription</p>
                    <p className="text-sm font-medium mt-1">$199.00</p>
                  </div>
                </div>
                
                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>$199.00</span>
                  </div>
                  {formData.shippingSpeed && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{shippingOptions.find(o => o.id === formData.shippingSpeed)?.price}</span>
                    </div>
                  )}
                  {formData.giftWrap && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gift Wrap</span>
                      <span>$7.99</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>$17.91</span>
                  </div>
                </div>
                
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-primary">
                      ${(199 + 17.91 + 
                        (formData.shippingSpeed ? parseFloat(shippingOptions.find(o => o.id === formData.shippingSpeed)?.price?.replace('$', '') || '0') : 0) +
                        (formData.giftWrap ? 7.99 : 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Friction indicators for demo */}
                {submitAttempts > 0 && (
                  <div className="p-3 bg-cla-warning/10 border border-cla-warning/30 rounded-lg text-sm">
                    <p className="font-medium text-cla-warning">Form Submission Attempts: {submitAttempts}</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      This is being tracked as a cognitive load signal
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Demo;
