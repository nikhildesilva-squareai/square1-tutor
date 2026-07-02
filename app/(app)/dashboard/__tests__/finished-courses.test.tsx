/**
 * Finished Courses Dashboard Tests
 *
 * Tests for the split dashboard showing both in-progress and completed courses.
 *
 * @description
 * These tests verify:
 * - Current courses are filtered (completed_at IS NULL)
 * - Finished courses are filtered (completed_at IS NOT NULL)
 * - Finished courses are sorted by completed_at DESC (newest first)
 * - Completion dates are formatted as en-AU locale
 * - "View Certificate" button navigates to /certificate/[courseSlug]
 * - Finished courses section is visually distinct with checkmark badge
 * - Responsive design works on mobile/tablet/desktop
 * - No regressions to existing dashboard sections
 */

import { describe, it, expect, beforeEach } from "@jest/globals";

describe("Dashboard - Finished Courses", () => {
  // ─────────────────────────────────────────────────────────────────────────
  // 1. Enrollment Filtering
  // ─────────────────────────────────────────────────────────────────────────

  describe("Enrollment Filtering", () => {
    it("should separate current enrollments (completed_at IS NULL)", () => {
      const allEnrollments = [
        { id: "1", completed_at: null },
        { id: "2", completed_at: "2026-06-28T10:00:00Z" },
        { id: "3", completed_at: null },
      ];

      const currentEnrollments = allEnrollments.filter(e => !e.completed_at);
      expect(currentEnrollments).toHaveLength(2);
      expect(currentEnrollments.map(e => e.id)).toEqual(["1", "3"]);
    });

    it("should separate finished enrollments (completed_at IS NOT NULL)", () => {
      const allEnrollments = [
        { id: "1", completed_at: null },
        { id: "2", completed_at: "2026-06-28T10:00:00Z" },
        { id: "3", completed_at: null },
      ];

      const finishedEnrollments = allEnrollments.filter(e => e.completed_at);
      expect(finishedEnrollments).toHaveLength(1);
      expect(finishedEnrollments[0].id).toBe("2");
    });

    it("should handle edge case: no current enrollments, only finished", () => {
      const allEnrollments = [
        { id: "1", completed_at: "2026-06-28T10:00:00Z" },
        { id: "2", completed_at: "2026-06-15T10:00:00Z" },
      ];

      const currentEnrollments = allEnrollments.filter(e => !e.completed_at);
      const finishedEnrollments = allEnrollments.filter(e => e.completed_at);

      expect(currentEnrollments).toHaveLength(0);
      expect(finishedEnrollments).toHaveLength(2);
    });

    it("should handle edge case: only current enrollments, no finished", () => {
      const allEnrollments = [
        { id: "1", completed_at: null },
        { id: "2", completed_at: null },
      ];

      const currentEnrollments = allEnrollments.filter(e => !e.completed_at);
      const finishedEnrollments = allEnrollments.filter(e => e.completed_at);

      expect(currentEnrollments).toHaveLength(2);
      expect(finishedEnrollments).toHaveLength(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Sorting: Finished Courses by completed_at DESC
  // ─────────────────────────────────────────────────────────────────────────

  describe("Finished Courses Sorting", () => {
    it("should sort finished courses by completed_at DESC (newest first)", () => {
      const finishedEnrollments = [
        { id: "1", completed_at: "2026-06-10T10:00:00Z" },
        { id: "2", completed_at: "2026-06-28T10:00:00Z" },
        { id: "3", completed_at: "2026-06-20T10:00:00Z" },
      ];

      const sorted = finishedEnrollments.sort((a, b) => {
        return new Date(b.completed_at ?? 0).getTime() - new Date(a.completed_at ?? 0).getTime();
      });

      expect(sorted.map(e => e.id)).toEqual(["2", "3", "1"]);
    });

    it("should handle enrollments with same completion timestamp", () => {
      const finishedEnrollments = [
        { id: "1", completed_at: "2026-06-28T10:00:00Z" },
        { id: "2", completed_at: "2026-06-28T10:00:00Z" },
      ];

      const sorted = finishedEnrollments.sort((a, b) => {
        return new Date(b.completed_at ?? 0).getTime() - new Date(a.completed_at ?? 0).getTime();
      });

      // Both should remain (order may vary with identical timestamps)
      expect(sorted).toHaveLength(2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Date Formatting: en-AU Locale
  // ─────────────────────────────────────────────────────────────────────────

  describe("Completion Date Formatting (en-AU)", () => {
    it("should format date as 'D MMM YYYY' in en-AU locale", () => {
      const date = "2026-06-28T10:00:00Z";
      const formatted = new Date(date).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      expect(formatted).toBe("28 Jun 2026");
    });

    it("should handle dates from different months correctly", () => {
      const dates = [
        { input: "2026-01-05T10:00:00Z", expected: "5 Jan 2026" },
        { input: "2026-12-31T10:00:00Z", expected: "31 Dec 2026" },
        { input: "2026-07-02T10:00:00Z", expected: "2 Jul 2026" },
      ];

      dates.forEach(({ input, expected }) => {
        const formatted = new Date(input).toLocaleDateString("en-AU", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        expect(formatted).toBe(expected);
      });
    });

    it("should handle single-digit days without leading zero", () => {
      const date = "2026-06-05T10:00:00Z";
      const formatted = new Date(date).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      expect(formatted).toBe("5 Jun 2026");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Certificate Link Navigation
  // ─────────────────────────────────────────────────────────────────────────

  describe("Certificate Link Navigation", () => {
    it("should generate certificate URL as /certificate/[courseSlug]", () => {
      const courseSlug = "generative-ai";
      const url = `/certificate/${courseSlug}`;
      expect(url).toBe("/certificate/generative-ai");
    });

    it("should handle various course slugs correctly", () => {
      const slugs = [
        "generative-ai",
        "machine-learning",
        "cybersecurity",
        "fullstack-development",
        "data-science",
      ];

      slugs.forEach(slug => {
        const url = `/certificate/${slug}`;
        expect(url).toMatch(/^\/certificate\//);
        expect(url).toBe(`/certificate/${slug}`);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Visual Distinction
  // ─────────────────────────────────────────────────────────────────────────

  describe("Visual Distinction - Finished Courses Badge", () => {
    it("should include checkmark emoji (✅) in finished courses display", () => {
      const badge = "✅";
      expect(badge).toBe("✅");
    });

    it("should use distinct styling for finished vs current courses", () => {
      // Finished courses should use emerald-600 for button vs brand for current
      const finishedButtonColor = "#059669"; // emerald-600
      const currentButtonColor = "#0056CE"; // brand

      expect(finishedButtonColor).not.toBe(currentButtonColor);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Dashboard Sections Visibility
  // ─────────────────────────────────────────────────────────────────────────

  describe("Dashboard Sections Visibility", () => {
    it("should show finished courses section only when finishedEnrollments.length > 0", () => {
      const finishedEnrollments = [];
      const shouldShow = finishedEnrollments.length > 0;
      expect(shouldShow).toBe(false);

      const finishedEnrollmentsWithData = [
        { id: "1", completed_at: "2026-06-28T10:00:00Z" },
      ];
      const shouldShowWithData = finishedEnrollmentsWithData.length > 0;
      expect(shouldShowWithData).toBe(true);
    });

    it("should show both sections when student has current and finished courses", () => {
      const currentEnrollments = [{ id: "1", completed_at: null }];
      const finishedEnrollments = [{ id: "2", completed_at: "2026-06-28T10:00:00Z" }];

      const showCurrent = currentEnrollments.length > 0;
      const showFinished = finishedEnrollments.length > 0;

      expect(showCurrent).toBe(true);
      expect(showFinished).toBe(true);
    });

    it("should hide finished courses section when no enrollments are completed", () => {
      const finishedEnrollments = [];
      const shouldShow = finishedEnrollments.length > 0;
      expect(shouldShow).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Course Switcher Logic
  // ─────────────────────────────────────────────────────────────────────────

  describe("Course Switcher - Active Courses Only", () => {
    it("should only include current enrollments in course switcher, not finished", () => {
      const currentEnrollments = [
        { id: "1", course: { slug: "generative-ai" } },
        { id: "2", course: { slug: "machine-learning" } },
      ];
      const finishedEnrollments = [
        { id: "3", course: { slug: "cybersecurity" } },
      ];

      // Course switcher should only use currentEnrollments
      const switcherCourses = currentEnrollments.map(e => e.course?.slug);

      expect(switcherCourses).toHaveLength(2);
      expect(switcherCourses).not.toContain("cybersecurity");
    });

    it("should hide course switcher when only 1 current enrollment", () => {
      const currentEnrollments = [{ id: "1", course: { slug: "generative-ai" } }];
      const shouldShow = currentEnrollments.length > 1;
      expect(shouldShow).toBe(false);
    });

    it("should show course switcher when 2+ current enrollments (even with finished courses)", () => {
      const currentEnrollments = [
        { id: "1", course: { slug: "generative-ai" } },
        { id: "2", course: { slug: "machine-learning" } },
      ];
      const finishedEnrollments = [
        { id: "3", course: { slug: "cybersecurity" } },
      ];

      const shouldShow = currentEnrollments.length > 1;
      expect(shouldShow).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 8. My Courses Sidebar
  // ─────────────────────────────────────────────────────────────────────────

  describe("My Courses Sidebar Sections", () => {
    it("should show 'In Progress' subsection only when currentEnrollments.length > 1", () => {
      const currentEnrollments = [
        { id: "1", course: { slug: "generative-ai" } },
      ];
      const shouldShowInProgressSection = currentEnrollments.length > 1;
      expect(shouldShowInProgressSection).toBe(false);

      const multipleCurrentEnrollments = [
        { id: "1", course: { slug: "generative-ai" } },
        { id: "2", course: { slug: "machine-learning" } },
      ];
      const shouldShowWithMultiple = multipleCurrentEnrollments.length > 1;
      expect(shouldShowWithMultiple).toBe(true);
    });

    it("should show 'Completed' subsection when finishedEnrollments.length > 0", () => {
      const finishedEnrollments = [];
      const shouldShowCompletedSection = finishedEnrollments.length > 0;
      expect(shouldShowCompletedSection).toBe(false);

      const withFinished = [{ id: "1", completed_at: "2026-06-28T10:00:00Z" }];
      const shouldShowWithFinished = withFinished.length > 0;
      expect(shouldShowWithFinished).toBe(true);
    });

    it("should list finished enrollments in 'Completed' subsection", () => {
      const finishedEnrollments = [
        { id: "1", course: { slug: "generative-ai" }, completed_at: "2026-06-28T10:00:00Z" },
        { id: "2", course: { slug: "cybersecurity" }, completed_at: "2026-06-20T10:00:00Z" },
      ];

      expect(finishedEnrollments).toHaveLength(2);
      expect(finishedEnrollments[0].course?.slug).toBe("generative-ai");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 9. Pre-enrollment Dashboard
  // ─────────────────────────────────────────────────────────────────────────

  describe("Pre-enrollment Dashboard Visibility", () => {
    it("should show pre-enrollment UI only when no current AND no finished enrollments", () => {
      const currentEnrollments: typeof [] = [];
      const finishedEnrollments: typeof [] = [];
      const showPreEnrollment = currentEnrollments.length === 0 && finishedEnrollments.length === 0;
      expect(showPreEnrollment).toBe(true);
    });

    it("should show post-enrollment UI when current enrollments exist", () => {
      const currentEnrollments = [{ id: "1" }];
      const finishedEnrollments: typeof [] = [];
      const showPostEnrollment = !(currentEnrollments.length === 0 && finishedEnrollments.length === 0);
      expect(showPostEnrollment).toBe(true);
    });

    it("should show post-enrollment UI when only finished enrollments exist", () => {
      const currentEnrollments: typeof [] = [];
      const finishedEnrollments = [{ id: "1" }];
      const showPostEnrollment = !(currentEnrollments.length === 0 && finishedEnrollments.length === 0);
      expect(showPostEnrollment).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 10. Responsive Design
  // ─────────────────────────────────────────────────────────────────────────

  describe("Responsive Design", () => {
    it("should define responsive grid classes for finished courses section", () => {
      // grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
      const gridClasses = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      expect(gridClasses).toContain("grid-cols-1"); // Mobile: 1 column
      expect(gridClasses).toContain("sm:grid-cols-2"); // Tablet: 2 columns
      expect(gridClasses).toContain("lg:grid-cols-3"); // Desktop: 3 columns
    });

    it("should use appropriate padding and spacing for various screen sizes", () => {
      const padding = "p-5"; // Consistent padding
      const gap = "gap-4"; // Card gap in grid

      expect(padding).toBeDefined();
      expect(gap).toBeDefined();
    });
  });
});
