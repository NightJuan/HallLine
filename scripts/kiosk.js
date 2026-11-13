// State Management
const KIOSK_STATE = {
  currentStudent: null,
  activePasses: [
    { id: 1, name: "Jacob Miller", initials: "JM", destination: "Boys Restroom", time: "3m ago" },
    { id: 2, name: "Emma Watson", initials: "EW", destination: "Nurse Office", time: "8m ago" }
  ],
  queue: [
    { id: 101, name: "Marcus Diaz", destination: "Counselor" },
    { id: 102, name: "Sophia Lopez", destination: "Boys Restroom" }
  ],
  verifyingPassId: null,
  turnItem: null
};

let html5QrScanner = null;

// Audio Chime
function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.12);
    osc.frequency.setValueAtTime(783.99, now + 0.24);
    
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.8);
  } catch (err) {}
}

// DOM Elements
const signinBox = document.getElementById("signinBox");
const destinationSheet = document.getElementById("destinationSheet");
const formStudentSignIn = document.getElementById("formStudentSignIn");
const inputEmail = document.getElementById("inputEmail");
const inputPassword = document.getElementById("inputPassword");
const signinError = document.getElementById("signinError");
const verifiedStudentName = document.getElementById("verifiedStudentName");
const btnCancelSignIn = document.getElementById("btnCancelSignIn");

const btnIdSignIn = document.getElementById("btnIdSignIn");
const modalWebcamScanner = document.getElementById("modalWebcamScanner");
const btnCloseScanner = document.getElementById("btnCloseScanner");
const btnDemoScanCard = document.getElementById("btnDemoScanCard");

const otherInputWrap = document.getElementById("otherInputWrap");
const inputOtherWhere = document.getElementById("inputOtherWhere");
const btnConfirmOther = document.getElementById("btnConfirmOther");
const destinationGrid = document.getElementById("destinationGrid");

const currentlyOutList = document.getElementById("currentlyOutList");
const queueList = document.getElementById("queueList");
const outListWrapper = document.getElementById("outListWrapper");
const queueListWrapper = document.getElementById("queueListWrapper");

const modalVerifyReturn = document.getElementById("modalVerifyReturn");
const verifyReturnStudentName = document.getElementById("verifyReturnStudentName");
const inputVerifyPassword = document.getElementById("inputVerifyPassword");
const btnCancelVerifyReturn = document.getElementById("btnCancelVerifyReturn");
const btnConfirmReturn = document.getElementById("btnConfirmReturn");

const modalQueueTurn = document.getElementById("modalQueueTurn");
const turnStudentName = document.getElementById("turnStudentName");
const turnDestination = document.getElementById("turnDestination");
const btnRemoveFromQueue = document.getElementById("btnRemoveFromQueue");
const btnCheckoutFromQueue = document.getElementById("btnCheckoutFromQueue");

// Render Lists
function renderActivePasses() {
  currentlyOutList.innerHTML = "";
  if (KIOSK_STATE.activePasses.length === 0) {
    currentlyOutList.innerHTML = '<div class="empty-state">No students currently out</div>';
    outListWrapper.classList.remove("is-overflowing");
    return;
  }

  KIOSK_STATE.activePasses.forEach(pass => {
    const bar = document.createElement("div");
    bar.className = "pass-bar";
    bar.innerHTML = `
      <div class="pass-avatar">${pass.initials}</div>
      <div class="pass-info">
        <span class="pass-name">${pass.name}</span>
        <span class="pass-destination">${pass.destination} • ${pass.time}</span>
      </div>
      <button type="button" class="btn-return" data-id="${pass.id}">I'm Back</button>
    `;
    currentlyOutList.appendChild(bar);
  });

  outListWrapper.classList.toggle("is-overflowing", outListWrapper.scrollHeight > outListWrapper.clientHeight);
}

function renderQueue() {
  queueList.innerHTML = "";
  if (KIOSK_STATE.queue.length === 0) {
    queueList.innerHTML = '<div class="empty-state">No students waiting in queue</div>';
    queueListWrapper.classList.remove("is-overflowing");
    return;
  }

  KIOSK_STATE.queue.forEach((item, index) => {
    const isFirst = index === 0;
    const bar = document.createElement("div");
    bar.className = "queue-bar";
    bar.innerHTML = `
      <div class="queue-position">${index + 1}</div>
      <div class="pass-info">
        <span class="pass-name">${item.name}</span>
        <span class="pass-destination">${item.destination}</span>
      </div>
      <span class="queue-pill ${isFirst ? 'queue-pill--next' : 'queue-pill--waiting'}">
        ${isFirst ? 'Next Up' : 'Waiting'}
      </span>
    `;
    queueList.appendChild(bar);
  });

  queueListWrapper.classList.toggle("is-overflowing", queueListWrapper.scrollHeight > queueListWrapper.clientHeight);
}

// Student Authentication
function getInitials(name) {
  return name.split(" ").map(part => part[0]).join("").toUpperCase().substring(0, 2);
}

function completeSignIn(studentName) {
  KIOSK_STATE.currentStudent = studentName;
  verifiedStudentName.textContent = studentName;
  signinError.hidden = true;
  signinBox.hidden = true;
  destinationSheet.hidden = false;
  otherInputWrap.hidden = true;
}

function resetSignIn() {
  KIOSK_STATE.currentStudent = null;
  formStudentSignIn.reset();
  destinationSheet.hidden = true;
  signinBox.hidden = false;
  otherInputWrap.hidden = true;
  signinError.hidden = true;
}

formStudentSignIn.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = inputEmail.value.trim().toLowerCase();
  const allowedDomain = "@students.godleyisd.net";

  if (!email.endsWith(allowedDomain)) {
    signinError.textContent = `Please enter an authorized school email ending with ${allowedDomain}`;
    signinError.hidden = false;
    return;
  }

  const rawName = email.replace(allowedDomain, "").replace(".", " ");
  const formattedName = rawName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  completeSignIn(formattedName || "Student");
});

btnCancelSignIn.addEventListener("click", resetSignIn);

// ID Scanner Handlers
function openScanner() {
  modalWebcamScanner.hidden = false;
  if (window.Html5Qrcode) {
    try {
      html5QrScanner = new Html5Qrcode("scannerReader");
      html5QrScanner.start(
        { facingMode: "user" },
        { fps: 10, qrbox: { width: 220, height: 140 } },
        (decodedText) => {
          closeScanner();
          completeSignIn(`Student #${decodedText.slice(-4)}`);
        },
        () => {}
      ).catch(() => {});
    } catch (err) {}
  }
}

function closeScanner() {
  if (html5QrScanner) {
    html5QrScanner.stop().catch(() => {}).then(() => {
      html5QrScanner.clear();
      html5QrScanner = null;
    });
  }
  modalWebcamScanner.hidden = true;
}

btnIdSignIn.addEventListener("click", openScanner);
btnCloseScanner.addEventListener("click", closeScanner);

btnDemoScanCard.addEventListener("click", () => {
  closeScanner();
  const sampleStudents = ["Juan Cerritos", "Alex Rivera", "Mia Morales", "Caleb Wright"];
  const randomStudent = sampleStudents[Math.floor(Math.random() * sampleStudents.length)];
  completeSignIn(randomStudent);
});

// Destination Selection
destinationGrid.addEventListener("click", (e) => {
  const card = e.target.closest(".destination-card");
  if (!card) return;

  const dest = card.dataset.destination;
  if (dest === "Other") {
    otherInputWrap.hidden = false;
    inputOtherWhere.focus();
    return;
  }

  const statusBadge = card.querySelector(".dest-status");
  const isFull = statusBadge && statusBadge.classList.contains("dest-status--full");

  if (isFull) {
    KIOSK_STATE.queue.push({
      id: Date.now(),
      name: KIOSK_STATE.currentStudent,
      destination: dest
    });
    renderQueue();
    resetSignIn();
  } else {
    KIOSK_STATE.activePasses.unshift({
      id: Date.now(),
      name: KIOSK_STATE.currentStudent,
      initials: getInitials(KIOSK_STATE.currentStudent),
      destination: dest,
      time: "Just now"
    });
    renderActivePasses();
    resetSignIn();
  }
});

btnConfirmOther.addEventListener("click", () => {
  const customPlace = inputOtherWhere.value.trim();
  if (!customPlace) {
    inputOtherWhere.focus();
    return;
  }

  KIOSK_STATE.activePasses.unshift({
    id: Date.now(),
    name: KIOSK_STATE.currentStudent,
    initials: getInitials(KIOSK_STATE.currentStudent),
    destination: `Other: ${customPlace}`,
    time: "Just now"
  });
  inputOtherWhere.value = "";
  renderActivePasses();
  resetSignIn();
});

// Return Verification
currentlyOutList.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-return");
  if (!btn) return;
  const passId = parseInt(btn.dataset.id, 10);
  const targetPass = KIOSK_STATE.activePasses.find(p => p.id === passId);
  if (!targetPass) return;

  KIOSK_STATE.verifyingPassId = passId;
  verifyReturnStudentName.textContent = targetPass.name;
  inputVerifyPassword.value = "";
  modalVerifyReturn.hidden = false;
  inputVerifyPassword.focus();
});

btnCancelVerifyReturn.addEventListener("click", () => {
  modalVerifyReturn.hidden = true;
  KIOSK_STATE.verifyingPassId = null;
});

btnConfirmReturn.addEventListener("click", () => {
  if (!KIOSK_STATE.verifyingPassId) return;

  const passIndex = KIOSK_STATE.activePasses.findIndex(p => p.id === KIOSK_STATE.verifyingPassId);
  if (passIndex !== -1) {
    const returnedPass = KIOSK_STATE.activePasses[passIndex];
    KIOSK_STATE.activePasses.splice(passIndex, 1);
    renderActivePasses();
    modalVerifyReturn.hidden = true;
    KIOSK_STATE.verifyingPassId = null;

    checkQueueTurn(returnedPass.destination);
  }
});

// Queue Turn Progression
function checkQueueTurn(freedDestination) {
  if (KIOSK_STATE.queue.length === 0) return;

  const waitingIndex = KIOSK_STATE.queue.findIndex(q => q.destination === freedDestination || freedDestination.startsWith("Counselor"));
  if (waitingIndex !== -1) {
    const nextStudent = KIOSK_STATE.queue[waitingIndex];
    KIOSK_STATE.turnItem = { item: nextStudent, index: waitingIndex };
    
    turnStudentName.textContent = nextStudent.name;
    turnDestination.textContent = nextStudent.destination;
    
    playChime();
    modalQueueTurn.hidden = false;
  }
}

btnRemoveFromQueue.addEventListener("click", () => {
  if (!KIOSK_STATE.turnItem) return;
  KIOSK_STATE.queue.splice(KIOSK_STATE.turnItem.index, 1);
  renderQueue();
  modalQueueTurn.hidden = true;
  KIOSK_STATE.turnItem = null;
});

btnCheckoutFromQueue.addEventListener("click", () => {
  if (!KIOSK_STATE.turnItem) return;
  const item = KIOSK_STATE.turnItem.item;
  KIOSK_STATE.queue.splice(KIOSK_STATE.turnItem.index, 1);
  
  KIOSK_STATE.activePasses.unshift({
    id: Date.now(),
    name: item.name,
    initials: getInitials(item.name),
    destination: item.destination,
    time: "Just now"
  });
  
  renderQueue();
  renderActivePasses();
  modalQueueTurn.hidden = true;
  KIOSK_STATE.turnItem = null;
});

// Initialization
renderActivePasses();
renderQueue();
