"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function OnboardingPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        role: "",
        educationLevel: "",
        schoolName: "",
        yearLevel: "",
        programme: "",
        subjects: [] as string[],
        strugglingSubjects: [] as string[],
        strugglingTopics: "",
        learningStyles: [] as string[],
        preferredResources: [] as string[],
        studyTime: "",
        studyGoal: "",
        wantsStudyPartner: "",
    });

    const [otherSubject, setOtherSubject] = useState("");
    const [otherStrugglingSubject, setOtherStrugglingSubject] = useState("");
    const [error, setError] = useState("");

    const subjectOptions = [
        "Mathematics",
        "English",
        "Biology",
        "Chemistry",
        "Physics",
        "Information Technology",
        "Computer Science",
        "Theory of Computation",
        "Data Structures",
        "Operating Systems",
        "Database Systems",
        "Accounting",
        "Economics",
        "Other",
    ];

    const learningStyleOptions = [
        "Reading notes",
        "Watching videos",
        "Practice questions",
        "Step-by-step explanations",
        "Group study",
        "Visual diagrams",
        "Audio explanations",
    ];

    const resourceOptions = [
        "Notes",
        "Videos",
        "Flashcards",
        "Quizzes",
        "Past papers",
        "Worked examples",
        "Mind maps",
    ];

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    function handleCheckboxChange(field: "subjects" | "strugglingSubjects" | "learningStyles" | "preferredResources", value: string) {
        setFormData((prev) => {
            const currentValues = prev[field];
            const updatedValues = currentValues.includes(value)
                ? currentValues.filter((item) => item !== value)
                : [...currentValues, value];

            return {
                ...prev,
                [field]: updatedValues,
            };
        });
    }

    async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (
        !formData.role ||
        !formData.educationLevel ||
        !formData.schoolName ||
        !formData.yearLevel ||
        !formData.programme
    ) {
        setError("Please fill in all required fields.");
        return;
    }

    if (formData.subjects.length === 0) {
        setError("Please choose at least one subject.");
        return;
    }

    if (formData.learningStyles.length === 0) {
        setError("Please choose at least one learning style.");
        return;
    }

    let finalSubjects = [...formData.subjects];

    if (finalSubjects.includes("Other") && otherSubject.trim() !== "") {
        finalSubjects = finalSubjects.filter((s) => s !== "Other");
        finalSubjects.push(otherSubject);
    }

    let finalStrugglingSubjects = [...formData.strugglingSubjects];

    if (finalStrugglingSubjects.includes("Other") && otherStrugglingSubject.trim() !== "") {
        finalStrugglingSubjects = finalStrugglingSubjects.filter((s) => s !== "Other");
        finalStrugglingSubjects.push(otherStrugglingSubject);
    }

    // GET USER
    const { data: userData } = await supabase.auth.getUser();

    const userId = userData.user?.id;

    // SAVE TO DATABASE
    const { error: dbError } = await supabase
        .from("user_preferences")
        .insert({
            user_id: userId,
            school: formData.schoolName,
            year: formData.yearLevel,
            learning_style: formData.learningStyles,
            subjects: finalSubjects,
        });

    if (dbError) {
        setError("Failed to save survey. Please try again.");
        console.error(dbError);
        return;
    }

    alert("Survey submitted successfully!");

    router.push("/dashboard");
}
    return (
        <main className="min-h-screen bg-gray-950 text-white px-4 py-10">
            <div className="max-w-4xl mx-auto bg-gray-900 rounded-2xl shadow-lg p-8">
                <h1 className="text-3xl font-bold text-center mb-2">Onboarding Survey</h1>
                <p className="text-center text-gray-400 mb-8">
                    Help us personalize your study experience
                </p>

                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* Section 1 */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4">Academic Profile</h2>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-2">Are you a student or teacher?</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full p-3 rounded bg-gray-800 border border-gray-700"
                                >
                                    <option value="">Select role</option>
                                    <option value="Student">Student</option>
                                    <option value="Teacher">Teacher</option>
                                </select>
                            </div>

                            <div>
                                <label className="block mb-2">Education Level</label>
                                <select
                                    name="educationLevel"
                                    value={formData.educationLevel}
                                    onChange={handleChange}
                                    className="w-full p-3 rounded bg-gray-800 border border-gray-700"
                                >
                                    <option value="">Select level</option>
                                    <option value="Secondary">Secondary / High School</option>
                                    <option value="College">College</option>
                                    <option value="University">University</option>
                                </select>
                            </div>

                            <div>
                                <label className="block mb-2">School Name</label>
                                <input
                                    type="text"
                                    name="schoolName"
                                    value={formData.schoolName}
                                    onChange={handleChange}
                                    placeholder="Enter your school"
                                    className="w-full p-3 rounded bg-gray-800 border border-gray-700"
                                />
                            </div>

                            <div>
                                <label className="block mb-2">Year / Grade</label>
                                <input
                                    type="text"
                                    name="yearLevel"
                                    value={formData.yearLevel}
                                    onChange={handleChange}
                                    placeholder="e.g. Grade 11, 2nd Year"
                                    className="w-full p-3 rounded bg-gray-800 border border-gray-700"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block mb-2">Programme / Degree / Stream</label>
                                <input
                                    type="text"
                                    name="programme"
                                    value={formData.programme}
                                    onChange={handleChange}
                                    placeholder="e.g. Computer Science, Sciences, Business"
                                    className="w-full p-3 rounded bg-gray-800 border border-gray-700"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4">Subjects</h2>

                        <div className="mb-6">
                            <label className="block mb-3">What subjects are you currently doing?</label>
                            <div className="grid md:grid-cols-3 gap-3">
                              {subjectOptions.map((subject) => (
    <div key={subject}>
        <label className="flex items-center gap-2 bg-gray-800 p-3 rounded">
            <input
                type="checkbox"
                checked={formData.subjects.includes(subject)}
                onChange={() => handleCheckboxChange("subjects", subject)}
            />
            {subject}
        </label>

        {subject === "Other" && formData.subjects.includes("Other") && (
            <input
                type="text"
                placeholder="Type your subject..."
                value={otherSubject}
                onChange={(e) => setOtherSubject(e.target.value)}
                className="mt-2 w-full p-2 rounded bg-gray-800 border border-gray-700"
            />
        )}
    </div>
))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block mb-3">Which subjects are you struggling with?</label>
                            <div className="grid md:grid-cols-3 gap-3">
                            {subjectOptions.map((subject) => (
  <div key={subject}>
    <label className="flex items-center gap-2 bg-gray-800 p-3 rounded">
      <input
        type="checkbox"
        checked={formData.strugglingSubjects.includes(subject)}
        onChange={() =>
          handleCheckboxChange("strugglingSubjects", subject)
        }
      />
      {subject}
    </label>

    {subject === "Other" &&
      formData.strugglingSubjects.includes("Other") && (
        <input
          type="text"
          placeholder="Type struggling subject..."
          value={otherStrugglingSubject}
          onChange={(e) => setOtherStrugglingSubject(e.target.value)}
          className="mt-2 w-full p-2 rounded bg-gray-800 border border-gray-700"
        />
      )}
  </div>
))}
                            </div>
                        </div>

                        <div>
                            <label className="block mb-2">Specific topics you need help with</label>
                            <textarea
                                name="strugglingTopics"
                                value={formData.strugglingTopics}
                                onChange={handleChange}
                                placeholder="e.g. Regular expressions, algebra, photosynthesis"
                                rows={4}
                                className="w-full p-3 rounded bg-gray-800 border border-gray-700"
                            />
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4">Learning Preferences</h2>

                        <div className="mb-6">
                            <label className="block mb-3">How do you learn best?</label>
                            <div className="grid md:grid-cols-2 gap-3">
                                {learningStyleOptions.map((style) => (
                                    <label key={style} className="flex items-center gap-2 bg-gray-800 p-3 rounded">
                                        <input
                                            type="checkbox"
                                            checked={formData.learningStyles.includes(style)}
                                            onChange={() => handleCheckboxChange("learningStyles", style)}
                                        />
                                        {style}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block mb-3">Preferred study resources</label>
                            <div className="grid md:grid-cols-2 gap-3">
                                {resourceOptions.map((resource) => (
                                    <label key={resource} className="flex items-center gap-2 bg-gray-800 p-3 rounded">
                                        <input
                                            type="checkbox"
                                            checked={formData.preferredResources.includes(resource)}
                                            onChange={() => handleCheckboxChange("preferredResources", resource)}
                                        />
                                        {resource}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-2">When do you usually study?</label>
                                <select
                                    name="studyTime"
                                    value={formData.studyTime}
                                    onChange={handleChange}
                                    className="w-full p-3 rounded bg-gray-800 border border-gray-700"
                                >
                                    <option value="">Select study time</option>
                                    <option value="Morning">Morning</option>
                                    <option value="Afternoon">Afternoon</option>
                                    <option value="Evening">Evening</option>
                                    <option value="Late Night">Late Night</option>
                                </select>
                            </div>

                            <div>
                                <label className="block mb-2">Main academic goal</label>
                                <select
                                    name="studyGoal"
                                    value={formData.studyGoal}
                                    onChange={handleChange}
                                    className="w-full p-3 rounded bg-gray-800 border border-gray-700"
                                >
                                    <option value="">Select goal</option>
                                    <option value="Understand difficult topics">Understand difficult topics</option>
                                    <option value="Improve grades">Improve grades</option>
                                    <option value="Prepare for exams">Prepare for exams</option>
                                    <option value="Find better study resources">Find better study resources</option>
                                    <option value="Find study partners">Find study partners</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4">Study Matching</h2>

                        <div>
                            <label className="block mb-2">Would you like to be matched with study partners?</label>
                            <select
                                name="wantsStudyPartner"
                                value={formData.wantsStudyPartner}
                                onChange={handleChange}
                                className="w-full p-3 rounded bg-gray-800 border border-gray-700"
                            >
                                <option value="">Select option</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                            </select>
                        </div>
                    </section>

                    {error && <p className="text-red-400 text-sm font-medium">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-500 transition p-4 rounded-lg font-semibold"
                    >
                        Submit Survey
                    </button>
                </form>
            </div>
        </main>
    );
}