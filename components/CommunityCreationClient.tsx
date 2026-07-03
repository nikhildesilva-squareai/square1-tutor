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
    subscriptionModel: "one-time",
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
    <div className="min-h-screen bg-neutral-50">
      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">
            Create community
          </h1>
        </div>

        <div className="flex gap-6">
          {/* Left Sidebar Navigation */}
          <div className="w-48">
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
              {/* About community tab */}
              <button
                onClick={() => setActiveSection("about")}
                className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                  activeSection === "about"
                    ? "border-b-2 border-blue-600 text-blue-600 bg-white"
                    : "border-b border-neutral-200 text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                About community
              </button>

              {/* Visuals & branding tab */}
              <button
                onClick={() => setActiveSection("visuals")}
                className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                  activeSection === "visuals"
                    ? "text-neutral-900"
                    : "text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                Visuals & branding
              </button>

              {/* Set up pricing tab */}
              <button
                onClick={() => setActiveSection("pricing")}
                className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                  activeSection === "pricing"
                    ? "text-neutral-900"
                    : "text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                Set up pricing
              </button>

              {/* Rules & guidelines tab */}
              <button
                onClick={() => setActiveSection("rules")}
                className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                  activeSection === "rules"
                    ? "text-neutral-900"
                    : "text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                Rules & guidelines
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 space-y-6">
            {/* About Community Section */}
            {activeSection === "about" && (
              <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-4">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                  About community
                </h2>

                <div className="space-y-4">
                  {/* Community Name */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Community name*
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Learn AI in 2026"
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Community Category */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Community category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Community description*
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe about your community"
                      rows={5}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Community Type */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-3">
                      Community type
                    </label>
                    <div className="space-y-3">
                      {/* Public Option */}
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="type"
                          value="public"
                          checked={formData.type === "public"}
                          onChange={() => handleTypeChange("public")}
                          className="w-4 h-4 mt-0.5 accent-blue-600"
                        />
                        <div>
                          <p className="text-sm font-medium text-neutral-700">
                            Public
                          </p>
                          <p className="text-xs text-neutral-400">
                            Anyone can view posts and members. Discoverable on search engines.
                          </p>
                        </div>
                      </label>

                      {/* Private Option */}
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="type"
                          value="private"
                          checked={formData.type === "private"}
                          onChange={() => handleTypeChange("private")}
                          className="w-4 h-4 mt-0.5 accent-blue-600"
                        />
                        <div>
                          <p className="text-sm font-medium text-neutral-700">
                            Private
                          </p>
                          <p className="text-xs text-neutral-400">
                            Only members can view posts and members. Hidden from search engines.
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
              <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-4">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                  Visuals & branding
                </h2>

                <div className="grid grid-cols-2 gap-6">
                  {/* Icon Upload */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Icon*
                    </label>
                    <label className="block border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-6 text-center cursor-pointer hover:bg-blue-100 transition-colors">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 bg-white border border-neutral-200 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-neutral-900"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.67}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-600">
                            Click to upload
                          </p>
                          <p className="text-xs text-neutral-400">
                            or drag and drop
                          </p>
                        </div>
                        <p className="text-xs text-neutral-400">
                          PNG or JPG (max. 10 MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(e) => handleFileChange(e, "icon")}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Cover Upload */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Cover*
                    </label>
                    <label className="block border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-6 text-center cursor-pointer hover:bg-blue-100 transition-colors">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 bg-white border border-neutral-200 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-neutral-900"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.67}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-600">
                            Click to upload
                          </p>
                          <p className="text-xs text-neutral-400">
                            or drag and drop
                          </p>
                        </div>
                        <p className="text-xs text-neutral-400">
                          MP4 or MOV (max. 200 MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime"
                        onChange={(e) => handleFileChange(e, "cover")}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Set Up Pricing Section */}
            {activeSection === "pricing" && (
              <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-4">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                  Set up pricing
                </h2>

                <div className="space-y-4">
                  {/* Subscription Model */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-3">
                      How would you like to charge members for access to this community?
                    </label>
                    <div className="flex gap-6">
                      {[
                        { value: "one-time", label: "One time" },
                        { value: "daily", label: "Daily" },
                        { value: "weekly", label: "Weekly" },
                        { value: "monthly", label: "Monthly" },
                      ].map((option) => (
                        <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="subscriptionModel"
                            value={option.value}
                            checked={
                              formData.subscriptionModel === option.value
                            }
                            onChange={() =>
                              handleSubscriptionChange(
                                option.value as any
                              )
                            }
                            className="w-4 h-4 accent-blue-600"
                          />
                          <span className="text-sm text-neutral-700">
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Price Input */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Cost per community membership
                    </label>
                    <div className="flex gap-0">
                      <select className="px-4 py-2 border border-neutral-200 border-r-0 rounded-l-lg text-sm font-medium text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>LKR</option>
                      </select>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="20.00"
                        className="flex-1 px-4 py-2 border border-neutral-200 rounded-r-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Bank Account Section */}
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-5 space-y-3">
                    <div>
                      <h3 className="text-sm font-medium text-neutral-900">
                        Connect your bank account
                      </h3>
                      <p className="text-xs text-neutral-600 mt-1">
                        Square1.Ai uses Stripe to send payouts to your bank account. Complete setup to monetize your group.
                      </p>
                    </div>
                    <button className="px-5 py-2 bg-gradient-to-b from-blue-500 to-blue-700 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-shadow">
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Rules & Guidelines Section */}
            {activeSection === "rules" && (
              <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-4">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                  Rules & guidelines
                </h2>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Community rules*
                  </label>
                  <textarea
                    name="rules"
                    value={formData.rules}
                    onChange={handleInputChange}
                    placeholder="Describe about your community"
                    rows={5}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => window.history.back()}
                className="px-6 py-2 bg-white border border-neutral-200 text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCommunity}
                disabled={isCreating}
                className="px-6 py-2 bg-gradient-to-b from-blue-500 to-blue-700 text-white text-sm font-medium rounded-lg hover:shadow-lg disabled:opacity-50 transition-shadow"
              >
                {isCreating ? "Creating..." : "Create community"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
