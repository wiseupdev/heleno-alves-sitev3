const defaultFeatures = [
  'Frente mar',
  'Vista mar',
  'Vista definitiva',
  'Alto andar',
  'Arquitetura assinada',
  'Lazer premium',
  'Lazer completo',
  'Mobiliado',
  'Decorado',
  'Pronto para morar',
  'Em obra',
  'Lançamento',
  'Pé na areia',
  'Piscina privativa',
  'Área gourmet',
  'Sacada',
  'Varanda integrada',
  'Living amplo',
  'Planta inteligente',
  'Poucas unidades',
  'Boutique',
  'Condomínio fechado',
  'Privacidade',
  'Casa',
  'Cobertura',
  'Triplex',
  'Duplex',
  'Marina',
  'Brava Norte',
  'Brava Sul',
  'Barra Sul',
  'Centro',
  'Barra Norte'
];

let selectedFeatures = [];
let selectedPhotos = [];
let selectedVideos = [];
let coverPhotoIndex = 0;
let editingPropertyId = null;

const fields = [
  'title',
  'region',
  'district',
  'type',
  'status',
  'price',
  'area',
  'suites',
  'parking',
  'tag',
  'description',
  'lat',
  'lng',
  'tourUrl'
];

function $(id) {
  return document.getElementById(id);
}

function createId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return String(Date.now() + Math.random());
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeRegionForStorage(region) {
  if (!region) return '';

  if (
    region === 'Balneário Camboriú' ||
    region === 'Balneario Camboriu' ||
    region === 'balneario-camboriu'
  ) {
    return 'BC';
  }

  if (region === 'praia-brava') {
    return 'Praia Brava';
  }

  return region;
}

function normalizeRegionLabel(region) {
  if (!region) return '';

  if (region === 'BC') return 'Balneário Camboriú';

  return region;
}

function formatFileSize(bytes) {
  if (!bytes) return '0 KB';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size = size / 1024;
    unitIndex++;
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function escapeText(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getStorageArray(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

function saveStorageArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getImageFromProperty(property) {
  return property.cover?.previewUrl ||
    property.cover ||
    property.img ||
    property.image ||
    '';
}

function buildSpecs(data) {
  return [
    data.privateArea || data.area,
    data.suites ? `${data.suites} suítes` : '',
    data.parking ? `${data.parking} vagas` : '',
    data.status
  ].filter(Boolean);
}

function getLocation(data) {
  return [
    data.district,
    normalizeRegionLabel(data.region)
  ].filter(Boolean).join(' · ');
}

function createPhotoFromUrl(url, name) {
  if (!url) return null;

  return {
    id: createId(),
    name: name || 'Imagem cadastrada',
    size: 0,
    type: 'image/url',
    previewUrl: url,
    isExisting: true
  };
}

function createVideoFromUrl(url, name) {
  if (!url) return null;

  return {
    id: createId(),
    name: name || 'Vídeo cadastrado',
    size: 0,
    type: 'video/url',
    previewUrl: url,
    isExisting: true
  };
}

function renderFeatureBank() {
  const featureBank = $('featureBank');

  if (!featureBank) return;

  featureBank.innerHTML = defaultFeatures.map((feature) => `
    <button
      type="button"
      class="feature-option ${selectedFeatures.includes(feature) ? 'active' : ''}"
      onclick="toggleFeature(${JSON.stringify(feature)})"
    >
      ${escapeText(feature)}
    </button>
  `).join('');
}

function renderSelectedFeatures() {
  const selectedFeaturesEl = $('selectedFeatures');

  if (!selectedFeaturesEl) return;

  if (!selectedFeatures.length) {
    selectedFeaturesEl.innerHTML = '<span style="color:rgba(255,255,255,.35);font-size:13px">Nenhuma característica selecionada.</span>';
    return;
  }

  selectedFeaturesEl.innerHTML = selectedFeatures.map((feature) => `
    <span class="selected-feature">
      ${escapeText(feature)}
      <button type="button" onclick="removeFeature(${JSON.stringify(feature)})">×</button>
    </span>
  `).join('');
}

function renderPreviewFeatures() {
  const previewFeatures = $('previewFeatures');

  if (!previewFeatures) return;

  if (!selectedFeatures.length) {
    previewFeatures.innerHTML = '<span class="preview-feature">Sem características selecionadas</span>';
    return;
  }

  previewFeatures.innerHTML = selectedFeatures.map((feature) => `
    <span class="preview-feature">${escapeText(feature)}</span>
  `).join('');
}

function toggleFeature(feature) {
  if (selectedFeatures.includes(feature)) {
    selectedFeatures = selectedFeatures.filter((item) => item !== feature);
  } else {
    selectedFeatures.push(feature);
  }

  updateEverything();
}

function addCustomFeature() {
  const input = $('customFeature');

  if (!input) return;

  const value = input.value.trim();

  if (!value) return;

  if (!selectedFeatures.includes(value)) {
    selectedFeatures.push(value);
  }

  if (!defaultFeatures.includes(value)) {
    defaultFeatures.push(value);
  }

  input.value = '';
  updateEverything();
}

function removeFeature(feature) {
  selectedFeatures = selectedFeatures.filter((item) => item !== feature);
  updateEverything();
}

function handlePhotoFiles(files) {
  const imageFiles = Array.from(files || []).filter((file) => file.type.startsWith('image/'));

  imageFiles.forEach((file) => {
    selectedPhotos.push({
      id: createId(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: URL.createObjectURL(file),
      isExisting: false
    });
  });

  if (selectedPhotos.length && coverPhotoIndex >= selectedPhotos.length) {
    coverPhotoIndex = 0;
  }

  renderPhotoPreview();
  updatePreview();
}

function handleVideoFiles(files) {
  const videoFiles = Array.from(files || []).filter((file) => file.type.startsWith('video/'));

  videoFiles.forEach((file) => {
    selectedVideos.push({
      id: createId(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: URL.createObjectURL(file),
      isExisting: false
    });
  });

  renderVideoPreview();
  updatePreview();
}

function handlePhotoUpload(event) {
  handlePhotoFiles(event.target.files);
  event.target.value = '';
}

function handleVideoUpload(event) {
  handleVideoFiles(event.target.files);
  event.target.value = '';
}

function renderPhotoPreview() {
  const container = $('photoPreview');

  if (!container) return;

  if (!selectedPhotos.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = selectedPhotos.map((photo, index) => `
    <div class="media-preview-item ${index === coverPhotoIndex ? 'cover-selected' : ''}">
      <img src="${photo.previewUrl}" alt="${escapeText(photo.name)}">

      <div class="media-preview-actions">
        <button type="button" onclick="setCoverPhoto(${index})">Capa</button>
        <button type="button" onclick="removePhoto(${index})">Excluir</button>
      </div>
    </div>
  `).join('');
}

function renderVideoPreview() {
  const container = $('videoPreview');

  if (!container) return;

  if (!selectedVideos.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = selectedVideos.map((video, index) => `
    <div class="media-preview-item">
      <video src="${video.previewUrl}" muted controls></video>

      <div class="media-preview-actions">
        <button type="button" onclick="removeVideo(${index})">Excluir</button>
      </div>
    </div>
  `).join('');
}

function setCoverPhoto(index) {
  coverPhotoIndex = index;
  renderPhotoPreview();
  updatePreview();
}

function removePhoto(index) {
  if (selectedPhotos[index] && !selectedPhotos[index].isExisting) {
    URL.revokeObjectURL(selectedPhotos[index].previewUrl);
  }

  selectedPhotos.splice(index, 1);

  if (coverPhotoIndex >= selectedPhotos.length) {
    coverPhotoIndex = Math.max(0, selectedPhotos.length - 1);
  }

  renderPhotoPreview();
  updatePreview();
}

function removeVideo(index) {
  if (selectedVideos[index] && !selectedVideos[index].isExisting) {
    URL.revokeObjectURL(selectedVideos[index].previewUrl);
  }

  selectedVideos.splice(index, 1);

  renderVideoPreview();
  updatePreview();
}

function setupDropzone(dropzoneId, callback) {
  const dropzone = $(dropzoneId);

  if (!dropzone) return;

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      dropzone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      dropzone.classList.remove('drag-over');
    });
  });

  dropzone.addEventListener('drop', (event) => {
    callback(event.dataTransfer.files);
  });
}

function getFormData() {
  const coverPhoto = selectedPhotos[coverPhotoIndex] || null;
  const title = $('title')?.value.trim() || '';
  const region = normalizeRegionForStorage($('region')?.value || '');
  const privateArea = $('area')?.value.trim() || '';

  const cover = coverPhoto ? {
    name: coverPhoto.name,
    type: coverPhoto.type,
    size: coverPhoto.size,
    sizeFormatted: formatFileSize(coverPhoto.size),
    previewUrl: coverPhoto.previewUrl
  } : null;

  const data = {
    id: editingPropertyId || Date.now(),
    title,
    slug: slugify(title),
    region,
    district: $('district')?.value.trim() || '',
    type: $('type')?.value || '',
    status: $('status')?.value || 'Ativo',
    price: $('price')?.value.trim() || '',
    area: privateArea,
    privateArea,
    suites: $('suites')?.value.trim() || '',
    parking: $('parking')?.value.trim() || '',
    tag: $('tag')?.value.trim() || '',
    description: $('description')?.value.trim() || '',
    desc: $('description')?.value.trim() || '',
    cover,
    img: cover?.previewUrl || '',
    image: cover?.previewUrl || '',
    gallery: selectedPhotos.map((photo) => photo.previewUrl),
    photos: selectedPhotos.map((photo, index) => ({
      name: photo.name,
      type: photo.type,
      size: photo.size,
      sizeFormatted: formatFileSize(photo.size),
      previewUrl: photo.previewUrl,
      isCover: index === coverPhotoIndex
    })),
    videos: selectedVideos.map((video) => ({
      name: video.name,
      type: video.type,
      size: video.size,
      sizeFormatted: formatFileSize(video.size),
      previewUrl: video.previewUrl
    })),
    videoUrl: selectedVideos[0]?.previewUrl || '',
    tourUrl: $('tourUrl')?.value.trim() || '',
    lat: $('lat')?.value.trim() || '',
    lng: $('lng')?.value.trim() || '',
    features: selectedFeatures,
    updatedAt: new Date().toISOString()
  };

  data.loc = getLocation(data);
  data.specs = buildSpecs(data);

  return data;
}

function updatePreview() {
  const data = getFormData();

  if ($('previewTitle')) {
    $('previewTitle').textContent = data.title || 'Nome do imóvel';
  }

  if ($('previewLocation')) {
    $('previewLocation').textContent = `${data.district || 'Área'} · ${normalizeRegionLabel(data.region) || 'Região'}`;
  }

  if ($('previewDesc')) {
    $('previewDesc').textContent = data.description || 'A descrição do imóvel aparecerá aqui.';
  }

  if ($('previewArea')) {
    $('previewArea').textContent = data.privateArea || '-';
  }

  if ($('previewSuites')) {
    $('previewSuites').textContent = data.suites || '-';
  }

  if ($('previewParking')) {
    $('previewParking').textContent = data.parking || '-';
  }

  if ($('previewStatus')) {
    $('previewStatus').textContent = data.status || '-';
  }

  if ($('previewPrice')) {
    $('previewPrice').textContent = data.price || 'Preço obrigatório';
  }

  if ($('previewTag')) {
    $('previewTag').textContent = data.tag || data.type || 'Destaque';
  }

  if (data.cover && data.cover.previewUrl && $('previewImage')) {
    $('previewImage').src = data.cover.previewUrl;
  }

  renderPreviewFeatures();

}

function updateEverything() {
  renderFeatureBank();
  renderSelectedFeatures();
  renderPhotoPreview();
  renderVideoPreview();
  updatePreview();
}

function loadPropertyForEditing() {
  editingPropertyId = localStorage.getItem('editing_property_id');

  if (!editingPropertyId) return;

  const properties = getStorageArray('admin_properties_list');

  const property = properties.find((item) => {
    return String(item.id) === String(editingPropertyId);
  });

  if (!property) return;

  fields.forEach((id) => {
    const field = $(id);

    if (!field) return;

    if (id === 'area') {
      field.value = property.privateArea || property.area || '';
      return;
    }

    if (id === 'description') {
      field.value = property.description || property.desc || '';
      return;
    }

    if (id === 'region') {
      field.value = normalizeRegionLabel(property.region);
      return;
    }

    field.value = property[id] || '';
  });

  selectedFeatures = Array.isArray(property.features) ? [...property.features] : [];

  selectedPhotos = [];

  const coverUrl = getImageFromProperty(property);

  if (coverUrl) {
    const coverPhoto = createPhotoFromUrl(coverUrl, property.cover?.name || 'Capa cadastrada');

    if (coverPhoto) {
      selectedPhotos.push(coverPhoto);
      coverPhotoIndex = 0;
    }
  }

  if (Array.isArray(property.gallery)) {
    property.gallery.forEach((url) => {
      if (!url || url === coverUrl) return;

      const photo = createPhotoFromUrl(url, 'Imagem cadastrada');

      if (photo) {
        selectedPhotos.push(photo);
      }
    });
  }

  if (Array.isArray(property.photos)) {
    property.photos.forEach((photoData) => {
      const url = photoData.previewUrl;

      if (!url || selectedPhotos.some((photo) => photo.previewUrl === url)) return;

      selectedPhotos.push({
        id: createId(),
        name: photoData.name || 'Imagem cadastrada',
        size: photoData.size || 0,
        type: photoData.type || 'image/url',
        previewUrl: url,
        isExisting: true
      });
    });
  }

  selectedVideos = [];

  if (property.videoUrl) {
    const video = createVideoFromUrl(property.videoUrl, 'Vídeo cadastrado');

    if (video) {
      selectedVideos.push(video);
    }
  }

  if (Array.isArray(property.videos)) {
    property.videos.forEach((videoData) => {
      const url = videoData.previewUrl;

      if (!url || selectedVideos.some((video) => video.previewUrl === url)) return;

      selectedVideos.push({
        id: createId(),
        name: videoData.name || 'Vídeo cadastrado',
        size: videoData.size || 0,
        type: videoData.type || 'video/url',
        previewUrl: url,
        isExisting: true
      });
    });
  }
}

function cityFromRegion(region) {
  if (!region) return '';
  if (region === 'BC' || region === 'Balneario Camboriu' || region === 'balneario-camboriu') {
    return 'Balneário Camboriú';
  }
  if (region === 'praia-brava') return 'Praia Brava';
  return region;
}

function setSaveButtonLoading(isLoading) {
  // Pega qualquer botão "Salvar imóvel" e desabilita/restaura durante o envio.
  var candidates = [];
  var byId = $('saveProperty') || $('saveBtn') || $('btnSave');
  if (byId) candidates.push(byId);
  document.querySelectorAll('[onclick*="saveProperty"], button[type="submit"]').forEach(function (btn) {
    if (candidates.indexOf(btn) === -1) candidates.push(btn);
  });

  candidates.forEach(function (btn) {
    if (!btn) return;
    if (isLoading) {
      if (!btn.dataset.originalLabel) {
        btn.dataset.originalLabel = btn.textContent;
      }
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      btn.textContent = 'Enviando…';
    } else {
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      if (btn.dataset.originalLabel) {
        btn.textContent = btn.dataset.originalLabel;
        delete btn.dataset.originalLabel;
      }
    }
  });
}

function clearAdminPropertyCaches() {
  try { localStorage.removeItem('admin_properties_list'); } catch (_) {}
  try { localStorage.removeItem('admin_properties_draft'); } catch (_) {}
  try { localStorage.removeItem('ha_props_v7'); } catch (_) {}
  // Remove qualquer cache ha_props_* (chaves versionadas) por garantia.
  try {
    for (var i = localStorage.length - 1; i >= 0; i--) {
      var k = localStorage.key(i);
      if (k && /^ha_props_/.test(k)) localStorage.removeItem(k);
    }
  } catch (_) {}
}

async function saveProperty(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }

  var data = getFormData();

  if (!data.title) {
    alert('Preencha o nome do imóvel.');
    return false;
  }

  if (!data.price) {
    alert('Preencha o preço do imóvel.');
    return false;
  }

  // File[] real das fotos selecionadas. Nunca enviar previewUrl/blob.
  var files = selectedPhotos
    .map(function (photo) { return photo && photo.file; })
    .filter(Boolean);

  var cidade = cityFromRegion(data.region);
  var endereco = data.loc || [data.district, cidade].filter(Boolean).join(' · ');
  var caracteristicas = (selectedFeatures || []).join(', ');

  var payload = {
    titulo: data.title,
    descricao: data.description || '',
    cidade: cidade,
    bairro: data.district || '',
    rua: '',
    cep: '',
    numero: '',
    valor: data.price || '',
    negociacao: data.status || 'Venda',
    tipo: data.type || '',
    quartos: data.suites || '',
    banheiros: '',
    vagas: data.parking || '',
    metros: data.privateArea || data.area || '',
    condominio: '',
    valorNegociacao: data.price || '',
    valorLocacao: '',
    foto: files,
    phone: '',
    email: '',
    message: data.description || '',
    area: data.privateArea || data.area || '',
    quarto: data.suites || '',
    banheiro: '',
    vaga: data.parking || '',
    endereco: endereco,
    finalidade: 'Venda',
    event_name: 'create_property',
    caracteristicas: caracteristicas,
    comodidades: caracteristicas,
    nome: data.title
  };

  if (!window.HAPropertyManager || typeof window.HAPropertyManager.sendPropertyToWebhook !== 'function') {
    alert('Erro: módulo de envio (property-manager.js) não carregado.');
    return false;
  }

  setSaveButtonLoading(true);

  try {
    await window.HAPropertyManager.sendPropertyToWebhook(payload);

    // Sucesso real — limpa caches antigos para a lista renovar via API.
    clearAdminPropertyCaches();
    localStorage.removeItem('editing_property_id');

    alert('Imóvel enviado com sucesso!');
    window.location.href = 'imoveis.html';
    return true;
  } catch (error) {
    console.error('[saveProperty] Falha ao enviar imóvel:', error);
    alert('Erro ao enviar imóvel: ' + (error && error.message ? error.message : 'tente novamente.'));
    return false;
  } finally {
    setSaveButtonLoading(false);
  }
}

function clearForm() {
  fields.forEach((id) => {
    const field = $(id);

    if (field) field.value = '';
  });

  if ($('region')) $('region').value = 'Balneário Camboriú';
  if ($('type')) $('type').value = 'Apartamento';
  if ($('status')) $('status').value = 'Ativo';

  selectedFeatures = [];

  selectedPhotos.forEach((photo) => {
    if (!photo.isExisting) {
      URL.revokeObjectURL(photo.previewUrl);
    }
  });

  selectedVideos.forEach((video) => {
    if (!video.isExisting) {
      URL.revokeObjectURL(video.previewUrl);
    }
  });

  selectedPhotos = [];
  selectedVideos = [];
  coverPhotoIndex = 0;
  editingPropertyId = null;

  localStorage.removeItem('editing_property_id');

  if ($('photoUpload')) $('photoUpload').value = '';
  if ($('videoUpload')) $('videoUpload').value = '';

  updateEverything();
}

function initPropertyForm() {
  loadPropertyForEditing();

  fields.forEach((id) => {
    const field = $(id);

    if (field) {
      field.addEventListener('input', updatePreview);
      field.addEventListener('change', updatePreview);
    }
  });

  const customFeature = $('customFeature');

  if (customFeature) {
    customFeature.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        addCustomFeature();
      }
    });
  }

  if ($('photoUpload')) {
    $('photoUpload').addEventListener('change', handlePhotoUpload);
  }

  if ($('videoUpload')) {
    $('videoUpload').addEventListener('change', handleVideoUpload);
  }

  setupDropzone('photoDropzone', handlePhotoFiles);
  setupDropzone('videoDropzone', handleVideoFiles);

  updateEverything();
}

window.toggleFeature = toggleFeature;
window.addCustomFeature = addCustomFeature;
window.removeFeature = removeFeature;
window.setCoverPhoto = setCoverPhoto;
window.removePhoto = removePhoto;
window.removeVideo = removeVideo;
window.clearForm = clearForm;
window.saveProperty = saveProperty;

document.addEventListener('DOMContentLoaded', initPropertyForm);