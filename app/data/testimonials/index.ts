/**
 * Testimonial Data Structure
 * To add a new testimonial:
 * 1. Add your image to public/images/people/
 * 2. Add a new object to the testimonials array below
 */
export interface Testimonial {
    id: string;
    name: string;
    title: string;
    company: string;
    image: string; // Path starting from /public (e.g., "/images/people/name.png")
    content: string;
}

export const testimonials: Testimonial[] = [
    {
        id: "1",
        name: "Tejas R Bhoopalam",
        title: "CEO",
        company: "TenderSeal",
        image: "/images/people/tejas-bhoopalam.png",
        content: "GodsEye provided invaluable insights into our visibility across AI search engines. They didn’t just show us where we stood; they helped us build a robust AEO (Answer Engine Optimization) strategy and clearly mapped out the competitive landscape, highlighting exactly how to close the gap with our competitors.\n\nWhat stood out the most was the clarity and actionable direction. The insights were not generic — they were structured, practical, and immediately useful for execution."
    }
    // To add more:
    // {
    //   id: "2",
    //   name: "Next Person",
    //   title: "Role",
    //   company: "Company Name",
    //   image: "/images/people/image.png",
    //   content: "Their quote here..."
    // }
];
