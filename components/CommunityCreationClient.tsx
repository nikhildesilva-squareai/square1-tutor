"use client";

import { useState } from "react";
import Link from "next/link";

interface FormData {
  name: string;
  category: string;
  description: string;
  type: "public" | "private";
  icon: File | null;
  cover: File | null;
  subscriptionModel: "one-time" | "daily" | "weekly" | "monthly";
  price: string;
  rules: string;
}

type Section = "about" | "visuals" | "pricing" | "rules";

const CATEGORIES = [
  "Select category",
  "Music",
  "Design",
  "Business management",
  "Learn AI Tech",
  "IT & Software",
  "Finance & Accounting",
  "Sciences & Technology",
  "Sports",
];

const SECTION_CONFIG = [
  { id: "about" as const, label: "About Community", icon: "📝" },
  { id: "visuals" as const, label: "Visuals & Branding", icon: "🎨" },
  { id: "pricing" as const, label: "Set Up Pricing", icon: "💳" },
  { id: "rules" as const, label: "Rules & Guidelines", icon: "⚖️" },
];

export function CommunityCreationClient() {
  const [activeSection, setActiveSection] = useState<Section>("about");
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    category: "",
    description: "",
    type: "public",
    icon: null,
    cover: null,
    subscriptionModel: "monthly",
    price: "",
    rules: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTypeChange = (type: "public" | "private") => {
    setFormData((prev) => ({
      ...prev,
      type,
    }));
  };

  const handleSubscriptionChange = (
    model: "one-time" | "daily" | "weekly" | "monthly"
  ) => {
    setFormData((prev) => ({
      ...prev,
      subscriptionModel: model,
    }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "icon" | "cover"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        [type]: file,
      }));
    }
  };

  const handleCreateCommunity = async () => {
    if (!formData.name || !formData.category || !formData.description) {
      alert("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("category", formData.category);
      data.append("description", formData.description);
      data.append("is_private", formData.type === "private" ? "true" : "false");
      data.append("subscription_model", formData.subscriptionModel);
      data.append("monthly_price", formData.price);
      data.append("rules", formData.rules);
      if (formData.icon) data.append("icon", formData.icon);
      if (formData.cover) data.append("cover", formData.cover);

      const response = await fetch("/api/communities", {
        method: "POST",
        body: data,
      });

      if (response.ok) {
        const community = await response.json();
        window.location.href = `/community/${community.slug}`;
      } else {
        alert("Failed to create community");
      }
    } catch (error) {
      console.error("Failed to create community:", error);
      alert("Failed to create community");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header Section */}
      <div className="relative w-screen -mx-[calc((100vw-100%)/2)] bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-20 px-4 mb-16 overflow-hidden">
        <div className="absolute top-0 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto text-center">
          <span className="inline-block px-4 py-2 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-medium uppercase tracking-widest mb-4">
            ✨ Launch Your Community
          </span>
          <h1 className="text-6xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-none">
            Create Your <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">Community</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Build a thriving community in minutes. Set your own rules, pricing, and values.
          </p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex gap-8">
          {/* Left Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-8 space-y-4">
              {SECTION_CONFIG.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-6 py-4 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-3 ${
                    activeSection === section.id
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-600/30"
                      : "bg-white/80 backdrop-blur-lg border border-white/60 text-slate-700 hover:bg-white hover:border-blue-200 hover:shadow-md"
                  }`}
                >
                  <span className="text-2xl">{section.icon}</span>
                  <div className="text-left">
                    <div className="text-sm">{section.label}</div>
                    <div className={`text-xs font-medium ${activeSection === section.id ? "text-blue-100" : "text-slate-500"}`}>
                      Step {index + 1}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 space-y-6">
            {/* About Community Section */}
            {activeSection === "about" && (
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-white/60 shadow-xl p-10 space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">About Your Community</h2>
                  <p className="text-slate-600">Share the story and vision behind your community</p>
                </div>

                <div className="space-y-7">
                  {/* Community Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">
                      Community name*
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Learn AI in 2026"
                      className="w-full px-5 py-4 border border-slate-200 rounded-2xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Community Category */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-5 py-4 border border-slate-200 rounded-2xl text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Community Description */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">
                      Description*
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe the purpose, mission, and value your community provides..."
                      rows={6}
                      className="w-full px-5 py-4 border border-slate-200 rounded-2xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  {/* Community Type */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">
                      Community Visibility
                    </label>
                    <div className="space-y-4">
                      {/* Public Option */}
                      <label className="flex items-start gap-4 p-4 rounded-2xl border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer">
                        <input
                          type="radio"
                          name="type"
                          value="public"
                          checked={formData.type === "public"}
                          onChange={() => handleTypeChange("public")}
                          className="w-5 h-5 mt-1 accent-blue-600"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">Public</p>
                          <p className="text-sm text-slate-600 mt-1">
                            Anyone can discover and view your community. Appears in search results.
                          </p>
                        </div>
                      </label>

                      {/* Private Option */}
                      <label className="flex items-start gap-4 p-4 rounded-2xl border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer">
                        <input
                          type="radio"
                          name="type"
                          value="private"
                          checked={formData.type === "private"}
                          onChange={() => handleTypeChange("private")}
                          className="w-5 h-5 mt-1 accent-blue-600"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">Private</p>
                          <p className="text-sm text-slate-600 mt-1">
                            Only invited members can join. Hidden from search and discovery.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Visuals & Branding Section */}
            {activeSection === "visuals" && (
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-white/60 shadow-xl p-10 space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Visuals & Branding</h2>
                  <p className="text-slate-600">Create a strong visual identity for your community</p>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  {/* Icon Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">
                      Community Icon*
                    </label>
                    <label className="block border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 text-center cursor-pointer hover:bg-blue-100/50 hover:border-blue-400 transition-all group">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-white border border-slate-200 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-all">
                          <svg
                            className="w-7 h-7 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-base font-semibold text-blue-600">
                            Click to upload
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            or drag and drop
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">
                          PNG or JPG • Square (1:1) • Max 10 MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(e) => handleFileChange(e, "icon")}
                        className="hidden"
                      />
                    </label>
                    {formData.icon && (
                      <p className="text-sm text-green-600 font-medium mt-3">✓ {formData.icon.name}</p>
                    )}
                  </div>

                  {/* Cover Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">
                      Cover Image*
                    </label>
                    <label className="block border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 text-center cursor-pointer hover:bg-blue-100/50 hover:border-blue-400 transition-all group">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-white border border-slate-200 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-all">
                          <svg
                            className="w-7 h-7 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-base font-semibold text-blue-600">
                            Click to upload
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            or drag and drop
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">
                          PNG or JPG • 16:9 aspect ratio • Max 10 MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(e) => handleFileChange(e, "cover")}
                        className="hidden"
                      />
                    </label>
                    {formData.cover && (
                      <p className="text-sm text-green-600 font-medium mt-3">✓ {formData.cover.name}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Set Up Pricing Section */}
            {activeSection === "pricing" && (
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-white/60 shadow-xl p-10 space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Set Up Pricing</h2>
                  <p className="text-slate-600">Choose how you want to monetize your community</p>
                </div>

                <div className="space-y-8">
                  {/* Subscription Model */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">
                      Subscription Model
                    </label>
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { value: "one-time", label: "One Time", icon: "💳" },
                        { value: "daily", label: "Daily", icon: "📅" },
                        { value: "weekly", label: "Weekly", icon: "📆" },
                        { value: "monthly", label: "Monthly", icon: "🗓️" },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            formData.subscriptionModel === option.value
                              ? "border-blue-600 bg-blue-50"
                              : "border-slate-200 hover:border-blue-300 hover:bg-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name="subscriptionModel"
                            value={option.value}
                            checked={formData.subscriptionModel === option.value}
                            onChange={() => handleSubscriptionChange(option.value as any)}
                            className="hidden"
                          />
                          <div className="text-center">
                            <div className="text-3xl mb-2">{option.icon}</div>
                            <p className={`font-semibold ${formData.subscriptionModel === option.value ? "text-blue-600" : "text-slate-900"}`}>
                              {option.label}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Price Input */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">
                      Membership Cost
                    </label>
                    <div className="flex gap-3">
                      <select className="px-5 py-4 border border-slate-200 rounded-2xl text-base font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>USD $</option>
                        <option>EUR €</option>
                        <option>GBP £</option>
                        <option>LKR ₨</option>
                      </select>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="49.99"
                        step="0.01"
                        min="0"
                        className="flex-1 px-5 py-4 border border-slate-200 rounded-2xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Bank Account Section */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-8 space-y-4">
                    <div className="flex gap-4">
                      <div className="text-3xl">🏦</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900">
                          Connect Your Bank Account
                        </h3>
                        <p className="text-sm text-slate-700 mt-2">
                          Square1.Ai uses Stripe to securely handle payments and send payouts to your bank account. Set this up to start earning from your community.
                        </p>
                      </div>
                    </div>
                    <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300">
                      Connect Stripe Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Rules & Guidelines Section */}
            {activeSection === "rules" && (
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-white/60 shadow-xl p-10 space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Rules & Guidelines</h2>
                  <p className="text-slate-600">Set expectations for community members</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">
                    Community Rules & Code of Conduct*
                  </label>
                  <textarea
                    name="rules"
                    value={formData.rules}
                    onChange={handleInputChange}
                    placeholder="Outline the rules, guidelines, and code of conduct for your community members. This helps maintain a positive and respectful environment..."
                    rows={8}
                    className="w-full px-5 py-4 border border-slate-200 rounded-2xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <p className="text-sm text-slate-500 mt-3">
                    💡 Tips: Be clear and concise. Include guidelines about respectful communication, prohibited content, and consequences for violations.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6">
              <button
                onClick={() => window.history.back()}
                className="px-8 py-4 bg-white border border-slate-200 text-slate-700 text-base font-semibold rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-300"
              >
                ← Cancel
              </button>
              <button
                onClick={handleCreateCommunity}
                disabled={isCreating}
                className="px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-base font-semibold rounded-2xl hover:shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                {isCreating ? "Creating Community..." : "Launch Community 🚀"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
