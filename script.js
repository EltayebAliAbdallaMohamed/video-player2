let data = [];
let currentIndex = 0;

// Multi-search mode
let filteredIndexes = null;
let filteredPosition = 0;

// Load data.json
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

// Render content
function renderContent() {
  const contentDiv = document.getElementById("content");
  contentDiv.innerHTML = "";

  const item = data[currentIndex];
  if (!item) return;

  if (filteredIndexes) {
    videoCounter.textContent =
      `Video ${filteredPosition + 1} of ${filteredIndexes.length}`;
  } else {
    videoCounter.textContent =
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
    contentDiv.appendChild(video);
  }

  const header = document.createElement("h3");
  header.textContent = "Reflection Questions";
  contentDiv.appendChild(header);

  if (!item.questions || item.questions.length === 0) {
    const p = document.createElement("p");
    p.textContent = "No questions yet. Add one below!";
    contentDiv.appendChild(p);
  } else {
    const ul = document.createElement("ul");
    item.questions.forEach((q, idx) => {
      const li = document.createElement("li");
      li.textContent = q;

      const del = document.createElement("button");
      del.textContent = "🗑️";
      del.className = "delete-btn";
      del.addEventListener("click", () => deleteQuestion(idx));

      li.appendChild(del);
      ul.appendChild(li);
    });
    contentDiv.appendChild(ul);
  }

  updateButtonStates();
}

function updateButtonStates() {
  prevBtn.disabled = filteredIndexes
    ? filteredPosition === 0
    : currentIndex === 0;

  nextBtn.disabled = filteredIndexes
    ? filteredPosition === filteredIndexes.length - 1
    : currentIndex === data.length - 1;
}

// Add/Delete question
function addQuestion() {
  const input = newQuestion;
  const q = input.value.trim();
  if (!q) return;

  if (!data[currentIndex].questions) data[currentIndex].questions = [];
  data[currentIndex].questions.push(q);

  saveQuestions();
  input.value = "";
  renderContent();
}

function deleteQuestion(i) {
  data[currentIndex].questions.splice(i, 1);
  saveQuestions();
  renderContent();
}

// Navigation
function showNext() {
  if (filteredIndexes) {
    if (filteredPosition < filteredIndexes.length - 1) {
      filteredPosition++;
      currentIndex = filteredIndexes[filteredPosition];
      renderContent();
    }
  } else if (currentIndex < data.length - 1) {
    currentIndex++;
    renderContent();
  }
}

function showPrevious() {
  if (filteredIndexes) {
    if (filteredPosition > 0) {
      filteredPosition--;
      currentIndex = filteredIndexes[filteredPosition];
      renderContent();
    }
  } else if (currentIndex > 0) {
    currentIndex--;
    renderContent();
  }
}

// Search
function goToVideo() {
  const value = videoSearch.value.trim();
  const multi = multiSearch.checked;

  if (multi) {
    if (!value.includes(",")) return alert("Use commas: 1,3,6");
    const numbers = value.split(",").map(n => parseInt(n.trim(), 10));
    const valid = numbers.filter(n => n >= 1 && n <= data.length);

    if (!valid.length) return alert("No valid numbers.");

    filteredIndexes = valid.map(v => v - 1);
    filteredPosition = 0;
    currentIndex = filteredIndexes[0];
    videoSearch.value = "";
    return renderContent();
  }

  const num = parseInt(value, 10);
  if (!num || num < 1 || num > data.length) {
    return alert("Invalid number.");
  }

  filteredIndexes = null;
  filteredPosition = 0;
  currentIndex = num - 1;
  videoSearch.value = "";
  renderContent();
}

// Save questions
function saveQuestions() {
  const all = data.map(item => item.questions || []);
  localStorage.setItem("userQuestions", JSON.stringify(all));
}

// Event listeners
nextBtn.addEventListener("click", showNext);
prevBtn.addEventListener("click", showPrevious);
addQuestionBtn.addEventListener("click", addQuestion);
goBtn.addEventListener("click", goToVideo);

// Swipe gesture support
let startX = 0;

document.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});

document.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - startX;

  if (Math.abs(dx) > 60) {
    if (dx < 0) showNext();
    else showPrevious();
  }
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") showNext();
  if (e.key === "ArrowLeft") showPrevious();

  if (e.key === "Enter" && document.activeElement.id === "videoSearch") {
    goToVideo();
  }

  if (e.ctrlKey && e.key === "Backspace") {
    const item = data[currentIndex];
    if (item.questions?.length) {
      item.questions.pop();
      saveQuestions();
      renderContent();
    }
  }

  if (e.ctrlKey && e.key.toLowerCase() === "n") {
    newQuestion.focus();
  }

  if (e.ctrlKey && e.key.toLowerCase() === "g") {
    videoSearch.focus();
  }
});

// Dark mode toggle
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Start
loadData();
