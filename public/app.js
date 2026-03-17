let selectedFile = null;
let resultBlob = null;

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const previewArea = document.getElementById('previewArea');
const originalImg = document.getElementById('originalImg');
const resultImg = document.getElementById('resultImg');
const resultPlaceholder = document.getElementById('resultPlaceholder');
const processBtn = document.getElementById('processBtn');
const downloadBtn = document.getElementById('downloadBtn');
const errorMsg = document.getElementById('errorMsg');

// Drag & Drop
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drop-active');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drop-active'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drop-active');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) handleFile(e.target.files[0]);
});

function handleFile(file) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    alert('仅支持 JPG / PNG / WebP 格式');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    alert('图片不能超过 10MB');
    return;
  }
  selectedFile = file;
  resultBlob = null;

  const reader = new FileReader();
  reader.onload = (e) => {
    originalImg.src = e.target.result;
    dropZone.classList.add('hidden');
    previewArea.classList.remove('hidden');
    resultImg.classList.add('hidden');
    resultPlaceholder.classList.remove('hidden');
    downloadBtn.classList.add('hidden');
    errorMsg.classList.add('hidden');
    setBtnState('idle');
  };
  reader.readAsDataURL(file);
}

async function processImage() {
  if (!selectedFile) return;

  setBtnState('loading');
  errorMsg.classList.add('hidden');
  resultImg.classList.add('hidden');
  resultPlaceholder.classList.remove('hidden');
  downloadBtn.classList.add('hidden');

  try {
    const formData = new FormData();
    formData.append('image_file', selectedFile);

    const res = await fetch('/api/remove-bg', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: '处理失败，请重试' }));
      throw new Error(err.error || '处理失败');
    }

    resultBlob = await res.blob();
    const url = URL.createObjectURL(resultBlob);
    resultImg.src = url;
    resultImg.classList.remove('hidden');
    resultPlaceholder.classList.add('hidden');
    downloadBtn.classList.remove('hidden');
    setBtnState('done');
  } catch (err) {
    errorMsg.textContent = '❌ ' + err.message;
    errorMsg.classList.remove('hidden');
    setBtnState('idle');
  }
}

function downloadResult() {
  if (!resultBlob) return;
  const a = document.createElement('a');
  const originalName = selectedFile.name.replace(/\.[^.]+$/, '');
  a.href = URL.createObjectURL(resultBlob);
  a.download = `removed_bg_${originalName}.png`;
  a.click();
}

function reset() {
  selectedFile = null;
  resultBlob = null;
  fileInput.value = '';
  dropZone.classList.remove('hidden');
  previewArea.classList.add('hidden');
  errorMsg.classList.add('hidden');
}

function setBtnState(state) {
  const icon = document.getElementById('btnIcon');
  const text = document.getElementById('btnText');
  if (state === 'loading') {
    processBtn.disabled = true;
    processBtn.classList.add('opacity-60', 'cursor-not-allowed');
    icon.textContent = '⏳';
    text.textContent = '处理中...';
  } else {
    processBtn.disabled = false;
    processBtn.classList.remove('opacity-60', 'cursor-not-allowed');
    icon.textContent = '✂️';
    text.textContent = state === 'done' ? '重新处理' : '去背景';
  }
}

function setBg(type) {
  const bg = document.getElementById('resultBg');
  const btns = { checker: 'btn-checker', white: 'btn-white', black: 'btn-black' };

  bg.className = bg.className.replace(/checkerboard|bg-white|bg-black/g, '').trim();
  Object.values(btns).forEach(id => {
    document.getElementById(id).className = 'px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-600';
  });

  if (type === 'checker') {
    bg.classList.add('checkerboard');
    document.getElementById('btn-checker').className = 'px-3 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700 font-medium';
  } else if (type === 'white') {
    bg.classList.add('bg-white');
    document.getElementById('btn-white').className = 'px-3 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700 font-medium';
  } else {
    bg.classList.add('bg-black');
    document.getElementById('btn-black').className = 'px-3 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700 font-medium';
  }
}
