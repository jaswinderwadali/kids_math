/* -------------------------------------------------------------
   Magic Math - Kids' Educational Game Logic (Magic Addition)
------------------------------------------------------------- */

// State variables
let currentNumber = 0; // The target sum
let correctAnswer = 0; // Same as sum
let numA = 0;
let numB = 0;
let score = 0;
let streak = 0;
let oopsiesCount = 0;
let isFirstTry = true;
let isMuted = false;
let currentThemeIndex = 0;
let difficultyLimit = 10;

// Practice Queue
let practiceQueue = [];
let isPracticeQuestion = false;

// Audio Context
let audioCtx = null;

// Speech statements
const idleStatements = [
  "Can you add these numbers? 🧐",
  "Count the shiny stars to find the sum! 🌟",
  "Let's add them together! You got this! ✨",
  "Magic addition time! ☀️",
  "Which box shows the correct answer? 🎁"
];

const practiceStatements = [
  "Let's practice this addition! 🧠🩹",
  "Practice makes perfect! You got it! ✨",
  "Let's try this sum again! 💪",
  "We can solve this together! 🌟"
];

const successStatements = [
  "Fantastic adding! ⭐",
  "You're a math magician! 🌟",
  "Spot on sum! 🎉",
  "Perfect! Let's do another! 🚀",
  "Awesome addition! 🌈"
];

const wrongStatements = [
  "Let's try again! Count the stars! 💪",
  "Almost! Check your count! 🤔",
  "Give it another go! You can do it! 🌟",
  "Oops! Count them once more! 😊"
];

// Cute smiling star SVG
const starSVG = `
  <svg class="counting-svg" viewBox="0 0 24 24" style="--item-index: {INDEX};">
    <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.21l8.2-1.192L12 .587z" fill="#FFD15C" stroke="#D35400" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="9" cy="11" r="1.3" fill="#2C3E50"/>
    <circle cx="15" cy="11" r="1.3" fill="#2C3E50"/>
    <path d="M10 14 Q12 15.5 14 14" fill="none" stroke="#2C3E50" stroke-width="1.2" stroke-linecap="round"/>
  </svg>
`;

window.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadNewQuestion();
});

function setupEventListeners() {
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`opt-${i}`);
    btn.addEventListener('click', (e) => handleOptionClick(e, i));
  }

  const diffSelect = document.getElementById('difficulty-select');
  diffSelect.addEventListener('change', () => {
    loadNewQuestion();
  });

  const soundBtn = document.getElementById('sound-toggle');
  soundBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    document.getElementById('sound-icon').textContent = isMuted ? "🔇" : "🔊";
  });
}

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playCorrectSound() {
  initAudio();
  if (isMuted || !audioCtx) return;

  const now = audioCtx.currentTime;
  const tones = [523.25, 659.25, 783.99, 1046.50];
  tones.forEach((freq, index) => {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + index * 0.08);
    gainNode.gain.setValueAtTime(0.15, now + index * 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.25);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start(now + index * 0.08);
    osc.stop(now + index * 0.08 + 0.3);
  });
}

function playWrongSound() {
  initAudio();
  if (isMuted || !audioCtx) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(140, now + 0.35);
  gainNode.gain.setValueAtTime(0.2, now);
  gainNode.gain.linearRampToValueAtTime(0.001, now + 0.35);
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.4);
}

function loadNewQuestion() {
  isFirstTry = true;
  isPracticeQuestion = false;

  // Retrieve global score
  score = parseInt(localStorage.getItem('magic-math-stars')) || 0;
  oopsiesCount = parseInt(localStorage.getItem('magic-math-oopsies')) || 0;
  document.getElementById('star-count').textContent = score;
  document.getElementById('oopsies-count').textContent = oopsiesCount;

  const diffSelect = document.getElementById('difficulty-select');
  const rangeBadge = document.getElementById('range-badge');
  const isAdaptive = (diffSelect.value === 'adaptive');

  if (isAdaptive) {
    if (streak < 5) {
      difficultyLimit = 10;
    } else if (streak < 12) {
      difficultyLimit = 20;
    } else if (streak < 20) {
      difficultyLimit = 50;
    } else if (streak < 28) {
      difficultyLimit = 70;
    } else {
      difficultyLimit = 100;
    }
    rangeBadge.textContent = `Up to ${difficultyLimit}`;
    rangeBadge.style.display = 'inline-block';
  } else {
    difficultyLimit = parseInt(diffSelect.value, 10);
    rangeBadge.style.display = 'none';
  }

  // Spaced repetition queue check
  const eligiblePractice = practiceQueue.filter(item => item.target !== currentNumber);
  
  if (eligiblePractice.length > 0 && Math.random() < 0.6) {
    const practiceItem = eligiblePractice[0];
    currentNumber = practiceItem.target;
    isPracticeQuestion = true;
  } else {
    // Generate random sum
    currentNumber = Math.floor(Math.random() * (difficultyLimit - 1)) + 2;
  }
  
  correctAnswer = currentNumber;

  // Partition the sum into two addends: numA + numB = sum
  // Ensure A >= 1 and B >= 1
  numA = Math.floor(Math.random() * (currentNumber - 1)) + 1;
  numB = currentNumber - numA;

  // Render visual panel helpers (only draw if sum <= 20)
  const visualPanel = document.getElementById('visual-panel');
  visualPanel.innerHTML = '';
  
  if (correctAnswer <= 20) {
    // Left group A
    const groupA = document.createElement('div');
    groupA.className = 'equation-group group-addition';
    for (let i = 0; i < numA; i++) {
      groupA.innerHTML += starSVG.replace('{INDEX}', i);
    }

    // Math symbol
    const symbolSpan = document.createElement('span');
    symbolSpan.className = 'math-symbol';
    symbolSpan.textContent = '+';

    // Right group B
    const groupB = document.createElement('div');
    groupB.className = 'equation-group group-addition';
    for (let i = 0; i < numB; i++) {
      groupB.innerHTML += starSVG.replace('{INDEX}', numA + i);
    }

    visualPanel.appendChild(groupA);
    visualPanel.appendChild(symbolSpan);
    visualPanel.appendChild(groupB);
  } else {
    // Large number message
    visualPanel.innerHTML = `
      <div style="font-size: 1.1rem; font-weight: 700; color: #8E44AD; text-align: center;">
        Use your magic mental math powers! 🧠🚀
      </div>
    `;
  }

  // Update numbers in DOM
  document.getElementById('num-a').textContent = numA;
  document.getElementById('num-b').textContent = numB;
  
  const targetBox = document.getElementById('target-box');
  targetBox.textContent = "?";
  targetBox.classList.remove('correct-reveal');

  // Load option buttons
  const optionsArray = generateSmartOptions(correctAnswer, difficultyLimit);
  optionsArray.forEach((val, i) => {
    const btn = document.getElementById(`opt-${i}`);
    btn.textContent = val;
    btn.className = `option-btn option-${i + 1}`;
    btn.disabled = false;
  });

  // Mascot bubble text
  let defaultStatement = "";
  if (isPracticeQuestion) {
    defaultStatement = getRandomItem(practiceStatements);
  } else {
    defaultStatement = getRandomItem(idleStatements);
    if (isAdaptive) {
      if (streak === 4) defaultStatement = "Get this right to Level Up! 🚀";
      else if (streak === 11) defaultStatement = "One more for Big Numbers! 🤩";
      else if (streak === 19) defaultStatement = "Ready for level Up to 70? 🏆";
      else if (streak === 27) defaultStatement = "Ready for the Ultimate Challenge? 👑";
    }
  }
  setMascotState('normal', defaultStatement);
  changeBackgroundRandomly();
  announceToScreenReader(`New question: ${numA} plus ${numB}. Select from options.`);
}

function generateSmartOptions(correctAns, limit) {
  const distractors = new Set();
  
  const addIfValid = (val) => {
    if (val !== correctAns && val > 0 && val <= limit + 5) {
      distractors.add(val);
      return true;
    }
    return false;
  };

  // Typical mistakes
  addIfValid(correctAns + 1);
  addIfValid(correctAns - 1);
  addIfValid(correctAns + 2);

  // Inversion for two digits
  if (correctAns >= 10 && correctAns % 10 !== 0) {
    const reversed = parseInt(correctAns.toString().split('').reverse().join(''), 10);
    addIfValid(reversed);
  } else {
    addIfValid(correctAns + 10);
  }

  const offsets = [-3, 3, -4, 4];
  shuffleArray(offsets);
  for (const offset of offsets) {
    if (distractors.size >= 3) break;
    addIfValid(correctAns + offset);
  }

  let fallbackCounter = 0;
  while (distractors.size < 3 && fallbackCounter < 100) {
    fallbackCounter++;
    const randomDecoy = Math.floor(Math.random() * (limit + 2)) + 1;
    addIfValid(randomDecoy);
  }

  const distractorsArray = Array.from(distractors).slice(0, 3);
  const finalOptions = [correctAns, ...distractorsArray];
  shuffleArray(finalOptions);
  return finalOptions;
}

function handleOptionClick(event, buttonIndex) {
  const btn = event.currentTarget;
  const selectedVal = parseInt(btn.textContent, 10);

  if (selectedVal === correctAnswer) {
    playCorrectSound();
    const prevDifficultyLimit = difficultyLimit;
    
    btn.classList.add('correct');
    
    const targetBox = document.getElementById('target-box');
    targetBox.textContent = correctAnswer;
    targetBox.classList.add('correct-reveal');

    disableAllOptions();

    if (isFirstTry) {
      score++;
      streak++;
      localStorage.setItem('magic-math-stars', score);
      updateScoreUI();
      
      if (isPracticeQuestion) {
        const queueIndex = practiceQueue.findIndex(item => item.target === currentNumber);
        if (queueIndex !== -1) {
          practiceQueue[queueIndex].remaining--;
          if (practiceQueue[queueIndex].remaining <= 0) {
            practiceQueue.splice(queueIndex, 1);
          }
        }
      }
    } else {
      const queueIndex = practiceQueue.findIndex(item => item.target === currentNumber);
      if (queueIndex !== -1) {
        practiceQueue[queueIndex].remaining--;
        if (practiceQueue[queueIndex].remaining <= 0) {
          practiceQueue.splice(queueIndex, 1);
        }
      }
    }

    let bubbleText = getRandomItem(successStatements);
    
    const diffSelect = document.getElementById('difficulty-select');
    if (diffSelect.value === 'adaptive' && isFirstTry) {
      let nextLimit = 10;
      if (streak >= 5 && streak < 12) nextLimit = 20;
      else if (streak >= 12 && streak < 20) nextLimit = 50;
      else if (streak >= 20 && streak < 28) nextLimit = 70;
      else if (streak >= 28) nextLimit = 100;

      if (nextLimit > prevDifficultyLimit) {
        bubbleText = `🎉 Level Up! Numbers up to ${nextLimit}! 🚀`;
      }
    }

    setMascotState('happy', bubbleText);
    triggerConfetti();
    announceToScreenReader(`Correct! ${numA} plus ${numB} is ${correctAnswer}.`);

    setTimeout(() => {
      loadNewQuestion();
    }, 1500);

  } else {
    playWrongSound();
    setMascotState('thinking', getRandomItem(wrongStatements));
    
    btn.classList.add('wrong');
    btn.disabled = true;

    if (isFirstTry) {
      oopsiesCount++;
      localStorage.setItem('magic-math-oopsies', oopsiesCount);
      updateOopsiesUI();

      const alreadyQueued = practiceQueue.find(item => item.target === currentNumber);
      if (!alreadyQueued) {
        practiceQueue.push({ target: currentNumber, remaining: 3 });
      } else {
        alreadyQueued.remaining = 3;
      }
    }

    isFirstTry = false;
    streak = 0;
    updateStreakUI();
    announceToScreenReader(`Incorrect option ${selectedVal}. Try again!`);
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function disableAllOptions() {
  for (let i = 0; i < 4; i++) {
    document.getElementById(`opt-${i}`).disabled = true;
  }
}

function setMascotState(state, text) {
  const mascot = document.getElementById('mascot');
  mascot.className = `mascot-container ${state}`;
  document.getElementById('speech-bubble').textContent = text;
}

function updateScoreUI() {
  const starCount = document.getElementById('star-count');
  starCount.textContent = score;

  const scoreCard = document.getElementById('score-card');
  scoreCard.classList.add('pulse');
  setTimeout(() => {
    scoreCard.classList.remove('pulse');
  }, 500);

  updateStreakUI();
}

function updateStreakUI() {
  const streakIndicator = document.getElementById('streak-indicator');
  const streakCount = document.getElementById('streak-count');

  if (streak > 0) {
    streakCount.textContent = streak;
    streakIndicator.style.display = 'inline-flex';
  } else {
    streakIndicator.style.display = 'none';
  }
}

function updateOopsiesUI() {
  const oopsiesCountEl = document.getElementById('oopsies-count');
  oopsiesCountEl.textContent = oopsiesCount;

  const oopsiesCard = document.getElementById('oopsies-card');
  oopsiesCard.classList.add('pulse');
  setTimeout(() => {
    oopsiesCard.classList.remove('pulse');
  }, 500);
}

function changeBackgroundRandomly() {
  let newThemeIndex = currentThemeIndex;
  while (newThemeIndex === currentThemeIndex) {
    newThemeIndex = Math.floor(Math.random() * 6);
  }
  currentThemeIndex = newThemeIndex;
  document.body.className = `theme-${currentThemeIndex}`;
}

function triggerConfetti() {
  const container = document.getElementById('confetti-container');
  container.innerHTML = '';
  const colors = ['#FF4081', '#FFD15C', '#2ECC71', '#3498DB', '#9B59B6', '#E67E22'];
  for (let i = 0; i < 45; i++) {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 0.4 + 's';
    const size = Math.random() * 8 + 8;
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size}px`;
    container.appendChild(confetti);
  }
}

function announceToScreenReader(message) {
  const statusEl = document.getElementById('status-message');
  if (statusEl) {
    statusEl.textContent = message;
  }
}
