let data = [];
let currentIndex = 0;

// Multi-search state
let filteredIndexes = null;   // null = normal mode; array = playlist mode
let filteredPosition = 0;

// Fetch data.json and merge stored questions
async function loadData() {
  try {
    const response = await fetch("data.json");
    if (!response.ok) throw new Error("Could not load data.json");
    data = await response.json();

    const stored = localStorage.getItem("userQuestions");
    if (stored) {
      const saved = JSON.parse(stored);
      data.forEach((item, i) => {
        if (saved[i]) item.questions = saved[i];
      });
    }

    renderContent();
  } catch (err) {
    console.error(err);
    document.getElementById("content").innerHTML =
      '<p style="color:red;">Error loading data.json</p>';
  }
}

// Display current video and questions
function renderContent() {
  const contentDiv = document.getElementById("content");
  contentDiv.innerHTML = "";

  const item = data[currentIndex];
  if (!item) return;

  // Correct counter for filtered mode
  if (filteredIndexes) {
    document.getElementById("videoCounter").textContent =
      `Video ${filteredPosition + 1} of ${filteredIndexes.length}`;
  } else {
    document.getElementById("videoCounter").textContent =
      `Video ${currentIndex + 1} of ${data.length}`;
  }

  const title = document.createElement("h2");
  title.textContent = item.title;
  contentDiv.appendChild(title);

  if (item.type === "type-video") {
    const video = document.createElement("video");
    video.src = item.video;
    video.controls = true;
    video.style.borderRadius = "10px";
    video.style.marginBottom = "1rem";
    contentDiv.appendChild(video);
  }

  const header = document.createElement("h3");
  header.textContent = "Reflection Questions";
  contentDiv.appendChild(header);

  const ul = document.createElement("ul");
  ul.id = "questionList";

  if (!item.questions || item.questions.length === 0) {
    const p = document.createElement("p");
    p.textContent = "No questions yet. Add one below!";
    contentDiv.appendChild(p);
  } else {
    item.questions.forEach((q, idx) => {
      const li = document.createElement("li");
      li.textContent = q;

      const del = document.createElement("button");
      del.type = "button";
      del.textContent = "🗑️";
      del.className = "delete-btn";
      del.addEventListener("click", () => deleteQuestion(idx));

      li.appendChild(del);
      ul.appendChild(li);
    });

    contentDiv.appendChild(ul);
  }
}

// Add a question
function addQuestion() {
  const input = document.getElementById("newQuestion");
  const q = input.value.trim();
  if (!q) return;

  if (!data[currentIndex].questions) data[currentIndex].questions = [];
  data[currentIndex].questions.push(q);

  saveQuestions();
  input.value = "";
  renderContent();
}

// Delete a question
function deleteQuestion(i) {
  data[currentIndex].questions.splice(i, 1);
  saveQuestions();
  renderContent();
}

// NEXT button
function showNext() {
  if (filteredIndexes) {
    if (filteredPosition < filteredIndexes.length - 1) {
      filteredPosition++;
      currentIndex = filteredIndexes[filteredPosition];
      renderContent();
    }
  } else {
    if (currentIndex < data.length - 1) {
      currentIndex++;
      renderContent();
    }
  }
}

// PREVIOUS button
function showPrevious() {
  if (filteredIndexes) {
    if (filteredPosition > 0) {
      filteredPosition--;
      currentIndex = filteredIndexes[filteredPosition];
      renderContent();
    }
  } else {
    if (currentIndex > 0) {
      currentIndex--;
      renderContent();
    }
  }
}

// Jump or multi-search
function goToVideo() {
  const input = document.getElementById("videoSearch");
  const multi = document.getElementById("multiSearch").checked;
  const value = input.value.trim();

  // MULTI SEARCH
  if (multi) {
    if (!value.includes(",")) {
      alert("Enter numbers separated by commas: e.g., 2,4,7");
      return;
    }

    const parts = value.split(",").map((n) => parseInt(n.trim(), 10));
    const valid = parts.filter((n) => n >= 1 && n <= data.length);

    if (valid.length === 0) {
      alert("No valid video numbers.");
      return;
    }

    filteredIndexes = valid.map((v) => v - 1);
    filteredPosition = 0;

    currentIndex = filteredIndexes[0];
    renderContent();

    input.value = "";
    return;
  }

  // SINGLE SEARCH
  const num = parseInt(value, 10);

  if (!num || num < 1 || num > data.length) {
    alert(`Enter a valid number between 1 and ${data.length}`);
    return;
  }

  filteredIndexes = null;
  filteredPosition = 0;

  currentIndex = num - 1;
  renderContent();
  input.value = "";
}

// Save questions to localStorage
function saveQuestions() {
  const all = data.map((item) => item.questions || []);
  localStorage.setItem("userQuestions", JSON.stringify(all));
}

// Event listeners
document.getElementById("nextBtn").addEventListener("click", showNext);
document.getElementById("prevBtn").addEventListener("click", showPrevious);
document.getElementById("addQuestionBtn").addEventListener("click", addQuestion);
document.getElementById("goBtn").addEventListener("click", goToVideo);

// Initialize
loadData();

/* ------------------------------------------
   KEYBOARD SHORTCUTS (ONLY NEW ADDITIONS)
------------------------------------------- */
document.addEventListener("keydown", (e) => {

  // Right arrow → Next
  if (e.key === "ArrowRight") {
    e.preventDefault();
    showNext();
  }

  // Left arrow → Previous
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    showPrevious();
  }

  // Enter → Search (Go button)
  if (e.key === "Enter") {
    if (document.activeElement.id === "videoSearch") {
      goToVideo();
    }
  }

  // Ctrl + Delete → Delete last question
  if (e.ctrlKey && e.key === "Backspace") {
    const item = data[currentIndex];
    if (item.questions && item.questions.length > 0) {
      item.questions.pop();
      saveQuestions();
      renderContent();
    }
  }

  // Ctrl + N → Focus add-question field
  if (e.ctrlKey && e.key.toLowerCase() === "n") {
    document.getElementById("newQuestion").focus();
  }

  // Ctrl + G → Focus search box
  if (e.ctrlKey && e.key.toLowerCase() === "g") {
    document.getElementById("videoSearch").focus();
  }
});
