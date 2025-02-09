const RESUME_API_URL = "https://api.affinda.com/v1/documents";
const JOB_API_URL = "https://jsearch.p.rapidapi.com/job-details?job_id=20N57zBfi3eT9BdpAAAAAA%3D%3D&country=us";
const RESUME_API_KEY = "aff_6545c7842b44b42dc4b9763fbeb124ad08e52d4d";
const JOB_API_KEY = "712111b44dmsh366c532917c2107p1a3703jsn8182d00db04f"

document.addEventListener("DOMContentLoaded", initializeApp);

function initializeApp() {
    document.querySelectorAll(".nav-item").forEach(item =>
        item.addEventListener("click", () => switchSection(item))
    );

    setupResumeUpload();
    loadSavedData();
    setupJobSearch();
}

function switchSection(item) {
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".section").forEach(el => el.classList.remove("active"));

    item.classList.add("active");
    document.getElementById(`${item.dataset.section}-section`).classList.add("active");
}

function setupResumeUpload() {
    const dropzone = document.getElementById("resume-dropzone");
    const fileInput = document.getElementById("file-input");

    dropzone.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", handleFileUpload);
}

async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) await processResume(file);
}

async function processResume(file) {
    showNotification("Uploading resume...");
    const formData = new FormData();
    formData.append("file", file);

    try {
        // Step 1: Upload Resume
        const uploadResponse = await fetch(RESUME_API_URL, {
            method: "POST",
            headers: { "Authorization": `Bearer ${RESUME_API_KEY}` },
            body: formData
        });

        if (!uploadResponse.ok) throw new Error("Resume upload failed");

        const uploadData = await uploadResponse.json();
        console.log("Upload Response:", uploadData);

        // Step 2: Fetch Parsed Resume Data (Wait for Processing)
        const documentId = uploadData.identifier;
        showNotification("Processing resume... Please wait.");

        const parsedData = await fetchResumeData(documentId);
        if (parsedData) {
            localStorage.setItem("resumeData", JSON.stringify(parsedData));
            displayExtractedData(parsedData);
            showNotification("Resume processed successfully!");
        } else {
            showNotification("Failed to extract resume details.", "error");
        }
    } catch (error) {
        console.error("Error processing resume:", error);
        showNotification("Error processing resume", "error");
    }
}

// Step 2: Fetch Resume Data by Document ID
async function fetchResumeData(documentId) {
    for (let i = 0; i < 5; i++) { // Retry up to 5 times
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying

        try {
            const response = await fetch(`${RESUME_API_URL}/${documentId}`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${RESUME_API_KEY}` }
            });

            if (!response.ok) throw new Error("Failed to fetch parsed resume");

            const data = await response.json();
            console.log("Parsed Resume Data:", data);

            if (data.data && data.data.skills) {
                return data; // Return full parsed resume
            }
        } catch (error) {
            console.warn("Retrying resume fetch...");
        }
    }
    return null; // Return null if parsing fails
}

function loadSavedData() {
    const storedResume = localStorage.getItem("resumeData");
    if (storedResume) {
        const resumeData = JSON.parse(storedResume);
        displayExtractedData(resumeData);
        showNotification("Loaded saved resume data.");
    }
}

function displayExtractedData(data) {
    const skillsList = document.getElementById("skills-list");
    const suggestionsList = document.getElementById("suggestions-list");

    skillsList.innerHTML = "<h4>Skills</h4>";
    suggestionsList.innerHTML = "<h4>Improvement Suggestions</h4>";

    if (data?.data?.skills?.length > 0) {
        data.data.skills.forEach(skill => {
            const skillItem = document.createElement("div");
            skillItem.classList.add("skill-item");
            skillItem.textContent = skill.name;
            skillsList.appendChild(skillItem);
        });
    } else {
        skillsList.innerHTML += "<p>No skills found.</p>";
    }

    if (data?.data?.sections) {
        data.data.sections.forEach(section => {
            if (section.text) {
                const suggestionItem = document.createElement("div");
                suggestionItem.classList.add("suggestion-item");
                suggestionItem.textContent = section.text;
                suggestionsList.appendChild(suggestionItem);
            }
        });
    } else {
        suggestionsList.innerHTML += "<p>No suggestions available.</p>";
    }
}

function setupJobSearch() {
    const jobSearchInput = document.getElementById("job-search");
    jobSearchInput.addEventListener("input", searchJobs);
}

async function searchJobs() {
    const query = document.getElementById("job-search").value;
    if (!query) return;

    showNotification("Fetching job recommendations...");

    try {
        const response = await fetch(`${JOB_API_URL}?query=${query}&country=us`, {
            method: "GET",
            headers: {
                "X-RapidAPI-Key": JOB_API_KEY,
                "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
            }
        });

        if (!response.ok) throw new Error("Job API request failed");

        const data = await response.json();
        console.log("Job API Response:", data);
        displayJobResults(data);
    } catch (error) {
        console.error("Error fetching jobs:", error);
        showNotification("Error fetching jobs", "error");
    }
}

function displayJobResults(data) {
    const jobsContainer = document.getElementById("jobs-container");
    jobsContainer.innerHTML = "<h4>Job Recommendations</h4>";

    if (data?.data?.length > 0) {
        data.data.forEach(job => {
            const jobItem = document.createElement("div");
            jobItem.classList.add("job-item");
            jobItem.innerHTML = `
                <h3>${job.job_title}</h3>
                <p>${job.employer_name} - ${job.location}</p>
                <a href="${job.job_apply_link}" target="_blank">Apply Now</a>
            `;
            jobsContainer.appendChild(jobItem);
        });
        showNotification("Job recommendations updated!");
    } else {
        jobsContainer.innerHTML += "<p>No jobs found.</p>";
    }
}

function showNotification(message, type = "success") {
    const notification = document.getElementById("notification");
    notification.textContent = message;
    notification.classList.add("show", type);
    setTimeout(() => notification.classList.remove("show", type), 3000);
}
