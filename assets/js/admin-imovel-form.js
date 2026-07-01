/**
 * admin-imovel-form.js — Heleno Alves
 * Formulário de criação/edição de imóvel. Integra com o backend real:
 *   CREATE → HA_UPLOADS.uploadProperty
 *            (presigned MinIO → PUT → POST adminWISEUPTECHmedias com
 *             event_name=create_property)
 *   READ   → HA_API_ADMIN.getProperty (ADMINuniqueITEM)
 *   UPDATE → HA_API_ADMIN.updateProperty (haimoveisPROPERTYMANAGER,
 *            event_name=update_property; envia previous_data + updated_data
 *            no formato BACKEND, igual ao projeto antigo).
 *
 * O design (HTML/CSS) NÃO foi alterado. Apenas a lógica de salvar/carregar.
 */
const defaultFeatures = [
  'Frente mar','Vista mar','Vista definitiva','Alto andar','Arquitetura assinada',
  'Lazer premium','Lazer completo','Mobiliado','Decorado','Pronto para morar',
  'Em obra','Lançamento','Pé na areia','Piscina privativa','Área gourmet',
  'Sacada','Varanda integrada','Living amplo','Planta inteligente','Poucas unidades',
  'Boutique','Condomínio fechado','Privacidade','Casa','Cobertura','Triplex','Duplex',
  'Marina','Brava Norte','Brava Sul','Barra Sul','Centro','Barra Norte'
];

let selectedFeatures = [];
let selectedPhotos   = [];
let selectedVideos   = [];
let coverPhotoIndex  = 0;
let editingPropertyId = null;
let originalRawProperty = null; // payload "previous_data" para update

const fields = ['title','region','district','type','status','price','area','suites','parking','tag','description','lat','lng','tourUrl'];

function $(id) { return document.getElementById(id); }
function createId() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now() + Math.random()); }
function slugify(v) { return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }

function normalizeRegionForStorage(region) {
  if (!region) return '';
  if (['Balneário Camboriú','Balneario Camboriu','balneario-camboriu','BC'].includes(region)) return 'Balneário Camboriú';
  if (region === 'praia-brava') return 'Praia Brava';
  return region;
}
function normalizeRegionLabel(region) {
  if (!region) return '';
  if (region === 'BC') return 'Balneário Camboriú';
  return region;
}

function formatFileSize(bytes) {
  if (!bytes) return '0 KB';
  const units = ['B','KB','MB','GB']; let size = bytes; let i = 0;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[i]}`;
}
function escapeText(v) {
  return String(v||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

function normalizeStatusForBackend(value) {
  const v = String(value || '').trim().toLowerCase();
  if (['active', 'ativo', 'visivel', 'visível', 'visible', 'publicado', 'published'].includes(v)) return 'active';
  if (['inactive', 'inativo', 'oculto', 'hidden', 'rascunho', 'draft'].includes(v)) return 'inactive';
  return v || 'inactive';
}

function normalizeStatusForForm(value) {
  return normalizeStatusForBackend(value) === 'active' ? 'Ativo' : 'Oculto';
}

function setSelectValueByCandidates(id, candidates, fallback) {
  const el = $(id);
  if (!el) return;
  const values = Array.from(el.options || []).map((option) => option.value);
  const found = candidates.find((candidate) => values.includes(candidate));
  el.value = found || fallback || candidates[0] || '';
}

function setStatusField(value) {
  const normalized = normalizeStatusForBackend(value);
  if (normalized === 'active') {
    setSelectValueByCandidates('status', ['active', 'Ativo', 'Visível', 'Visivel', 'visible'], 'Ativo');
  } else {
    setSelectValueByCandidates('status', ['inactive', 'Oculto', 'Inativo', 'hidden'], 'Oculto');
  }
}

function hasRealUploadFile(item) {
  return Boolean(item && item.isExisting !== true && item.file && item.file instanceof File);
}

/* ── Helpers de mídia ──────────────────────────────────────────── */
function createPhotoFromUrl(url, name) {
  if (!url) return null;
  return { id: createId(), name: name || 'Imagem cadastrada', size: 0, type: 'image/url', previewUrl: url, isExisting: true };
}
function createVideoFromUrl(url, name) {
  if (!url) return null;
  return { id: createId(), name: name || 'Vídeo cadastrado', size: 0, type: 'video/url', previewUrl: url, isExisting: true };
}

/* ── Render dos blocos do formulário (mantido do design original) ──── */
function renderFeatureBank() {
  const featureBank = $('featureBank');
  if (!featureBank) return;

  featureBank.innerHTML = defaultFeatures.map((f, index) => `
    <button type="button" class="feature-option ${selectedFeatures.includes(f) ? 'active' : ''}"
      data-feature-index="${index}">${escapeText(f)}</button>
  `).join('');

  featureBank.querySelectorAll('[data-feature-index]').forEach((button) => {
    button.addEventListener('click', () => {
      const feature = defaultFeatures[Number(button.dataset.featureIndex)];
      if (feature) toggleFeature(feature);
    });
  });
}

function renderSelectedFeatures() {
  const el = $('selectedFeatures');
  if (!el) return;
  if (!selectedFeatures.length) {
    el.innerHTML = '<span style="color:rgba(255,255,255,.35);font-size:13px">Nenhuma característica selecionada.</span>';
    return;
  }
  el.innerHTML = selectedFeatures.map((f, index) => `
    <span class="selected-feature">${escapeText(f)}
      <button type="button" data-remove-feature-index="${index}">×</button>
    </span>
  `).join('');

  el.querySelectorAll('[data-remove-feature-index]').forEach((button) => {
    button.addEventListener('click', () => {
      const feature = selectedFeatures[Number(button.dataset.removeFeatureIndex)];
      if (feature) removeFeature(feature);
    });
  });
}

function renderPreviewFeatures() {
  const el = $('previewFeatures');
  if (!el) return;
  if (!selectedFeatures.length) {
    el.innerHTML = '<span class="preview-feature">Sem características selecionadas</span>';
    return;
  }
  el.innerHTML = selectedFeatures.map((f) => `<span class="preview-feature">${escapeText(f)}</span>`).join('');
}

function toggleFeature(f) {
  if (selectedFeatures.includes(f)) selectedFeatures = selectedFeatures.filter((x) => x !== f);
  else selectedFeatures.push(f);
  updateEverything();
}

function addCustomFeature() {
  const input = $('customFeature'); if (!input) return;
  const v = input.value.trim(); if (!v) return;
  if (!selectedFeatures.includes(v)) selectedFeatures.push(v);
  if (!defaultFeatures.includes(v))  defaultFeatures.push(v);
  input.value = ''; updateEverything();
}

function removeFeature(f) { selectedFeatures = selectedFeatures.filter((x) => x !== f); updateEverything(); }

/* ── Upload local (arquivos que vão para presigned no save) ──── */
function handlePhotoFiles(files) {
  Array.from(files || []).filter((f) => f.type.startsWith('image/')).forEach((file) => {
    selectedPhotos.push({ id: createId(), file, name: file.name, size: file.size, type: file.type, previewUrl: URL.createObjectURL(file), isExisting: false });
  });
  if (selectedPhotos.length && coverPhotoIndex >= selectedPhotos.length) coverPhotoIndex = 0;
  renderPhotoPreview(); updatePreview();
}

function handleVideoFiles(files) {
  Array.from(files || []).filter((f) => f.type.startsWith('video/')).forEach((file) => {
    selectedVideos.push({ id: createId(), file, name: file.name, size: file.size, type: file.type, previewUrl: URL.createObjectURL(file), isExisting: false });
  });
  renderVideoPreview(); updatePreview();
}

function handlePhotoUpload(e) { handlePhotoFiles(e.target.files); e.target.value = ''; }
function handleVideoUpload(e) { handleVideoFiles(e.target.files); e.target.value = ''; }

function renderPhotoPreview() {
  const c = $('photoPreview'); if (!c) return;
  if (!selectedPhotos.length) { c.innerHTML = ''; return; }
  c.innerHTML = selectedPhotos.map((p, i) => `
    <div class="media-preview-item ${i === coverPhotoIndex ? 'cover-selected' : ''}">
      <img src="${p.previewUrl}" alt="${escapeText(p.name)}">
      <div class="media-preview-actions">
        <button type="button" onclick="setCoverPhoto(${i})">Capa</button>
        <button type="button" onclick="removePhoto(${i})">Excluir</button>
      </div>
    </div>
  `).join('');
}

function renderVideoPreview() {
  const c = $('videoPreview'); if (!c) return;
  if (!selectedVideos.length) { c.innerHTML = ''; return; }
  c.innerHTML = selectedVideos.map((v, i) => `
    <div class="media-preview-item">
      <video src="${v.previewUrl}" muted controls></video>
      <div class="media-preview-actions">
        <button type="button" onclick="removeVideo(${i})">Excluir</button>
      </div>
    </div>
  `).join('');
}

function setCoverPhoto(i) { coverPhotoIndex = i; renderPhotoPreview(); updatePreview(); }

async function removePhoto(i) {
  const photo = selectedPhotos[i];
  if (photo && photo.isExisting && editingPropertyId && photo.previewUrl) {
    if (!confirm('Remover esta imagem do imóvel? Esta ação afeta o backend.')) return;
    try {
      await HA_API_ADMIN.removePropertyMedia(editingPropertyId, photo.previewUrl);
    } catch (err) {
      console.error('[FORM] remover mídia falhou:', err);
      alert('Não foi possível remover a imagem agora.');
      return;
    }
  } else if (photo && !photo.isExisting) {
    URL.revokeObjectURL(photo.previewUrl);
  }
  selectedPhotos.splice(i, 1);
  if (coverPhotoIndex >= selectedPhotos.length) coverPhotoIndex = Math.max(0, selectedPhotos.length - 1);
  renderPhotoPreview(); updatePreview();
}

async function removeVideo(i) {
  const v = selectedVideos[i];
  if (v && v.isExisting && editingPropertyId && v.previewUrl) {
    if (!confirm('Remover este vídeo do imóvel? Esta ação afeta o backend.')) return;
    try { await HA_API_ADMIN.removePropertyMedia(editingPropertyId, v.previewUrl); }
    catch (err) { console.error(err); alert('Não foi possível remover o vídeo.'); return; }
  } else if (v && !v.isExisting) {
    URL.revokeObjectURL(v.previewUrl);
  }
  selectedVideos.splice(i, 1);
  renderVideoPreview(); updatePreview();
}

function setupDropzone(id, cb) {
  const dz = $(id); if (!dz) return;
  ['dragenter','dragover'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dz.classList.add('drag-over'); }));
  ['dragleave','drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dz.classList.remove('drag-over'); }));
  dz.addEventListener('drop', (e) => cb(e.dataTransfer.files));
}

/* ── Coleta dados do form (shape "design") ───────────────────── */
function getFormData() {
  const coverPhoto = selectedPhotos[coverPhotoIndex] || null;
  const title  = $('title')?.value.trim() || '';
  const region = normalizeRegionForStorage($('region')?.value || '');
  const privateArea = $('area')?.value.trim() || '';
  const cover = coverPhoto ? { name: coverPhoto.name, type: coverPhoto.type, size: coverPhoto.size, sizeFormatted: formatFileSize(coverPhoto.size), previewUrl: coverPhoto.previewUrl } : null;

  return {
    title, slug: slugify(title), region,
    district:    $('district')?.value.trim() || '',
    type:        $('type')?.value || '',
    status:      normalizeStatusForBackend($('status')?.value || 'inactive'),
    statusLabel: normalizeStatusForForm($('status')?.value || 'inactive'),
    price:       $('price')?.value.trim() || '',
    area:        privateArea, privateArea,
    suites:      $('suites')?.value.trim() || '',
    parking:     $('parking')?.value.trim() || '',
    tag:         $('tag')?.value.trim() || '',
    description: $('description')?.value.trim() || '',
    cover, img: cover?.previewUrl || '',
    tourUrl:     $('tourUrl')?.value.trim() || '',
    lat:         $('lat')?.value.trim() || '',
    lng:         $('lng')?.value.trim() || '',
    features:    selectedFeatures,
  };
}

function updatePreview() {
  const d = getFormData();
  if ($('previewTitle'))    $('previewTitle').textContent    = d.title || 'Nome do imóvel';
  if ($('previewLocation')) $('previewLocation').textContent = `${d.district || 'Área'} · ${normalizeRegionLabel(d.region) || 'Região'}`;
  if ($('previewDesc'))     $('previewDesc').textContent     = d.description || 'A descrição do imóvel aparecerá aqui.';
  if ($('previewArea'))     $('previewArea').textContent     = d.privateArea || '-';
  if ($('previewSuites'))   $('previewSuites').textContent   = d.suites || '-';
  if ($('previewParking'))  $('previewParking').textContent  = d.parking || '-';
  if ($('previewStatus'))   $('previewStatus').textContent   = d.statusLabel || d.status || '-';
  if ($('previewPrice'))    $('previewPrice').textContent    = d.price || 'Preço obrigatório';
  if ($('previewTag'))      $('previewTag').textContent      = d.tag || d.type || 'Destaque';
  if (d.cover && d.cover.previewUrl && $('previewImage')) $('previewImage').src = d.cover.previewUrl;
  renderPreviewFeatures();
}

function updateEverything() { renderFeatureBank(); renderSelectedFeatures(); renderPhotoPreview(); renderVideoPreview(); updatePreview(); }

/* ── Carrega para edição (do backend real) ─────────────────────── */
async function loadPropertyForEditing() {
  editingPropertyId = localStorage.getItem('editing_property_id');
  if (!editingPropertyId) return;
  if (typeof HA_API_ADMIN === 'undefined') return;

  try {
    const res = await HA_API_ADMIN.getProperty(editingPropertyId);
    const raw = res && res.property;
    if (!raw) { console.warn('[FORM] imóvel não encontrado no backend.'); return; }
    originalRawProperty = raw;

    if ($('title'))       $('title').value       = raw.property_title || '';
    if ($('region'))      $('region').value      = raw.property_city || 'Balneário Camboriú';
    if ($('district'))    $('district').value    = raw.property_district || raw.property_neighborhood || '';
    if ($('type'))        $('type').value        = (raw.property_types && raw.property_types[0] && raw.property_types[0].property_type_name) || $('type').value;
    setStatusField(raw.property_status || 'inactive');
    if ($('price'))       $('price').value       = raw.property_price || '';
    if ($('area'))        $('area').value        = raw.property_area_sqm ? `${raw.property_area_sqm} m²` : '';
    if ($('suites'))      $('suites').value      = raw.property_bedrooms || '';
    if ($('parking'))     $('parking').value     = raw.property_garage_spaces || '';
    if ($('tag'))         $('tag').value         = (raw.categories && raw.categories[0] && raw.categories[0].category_name) || '';
    if ($('description')) $('description').value = raw.property_description || raw.property_detail || '';
    if ($('lat'))         $('lat').value         = raw.property_lat || '';
    if ($('lng'))         $('lng').value         = raw.property_lng || '';

    selectedFeatures = (raw.amenities || []).map((a) => a.amenitie_name).filter(Boolean);
    selectedPhotos = [];
    (raw.images || []).forEach((img) => {
      const p = createPhotoFromUrl(img.url, 'Imagem cadastrada');
      if (p) selectedPhotos.push(p);
    });
    const coverIdx = (raw.images || []).findIndex((i) => i.is_cover === 'true' || i.is_cover === true);
    coverPhotoIndex = Math.max(0, coverIdx);

    selectedVideos = [];
    (raw.videos || []).forEach((v) => {
      const vo = createVideoFromUrl(v.url, 'Vídeo cadastrado');
      if (vo) selectedVideos.push(vo);
    });
  } catch (err) {
    console.error('[FORM] erro carregando imóvel:', err);
  }
}

/* ── Salvar ────────────────────────────────────────────────────── */
function buildBackendPayloadFromForm(data) {
  return {
    titulo: data.title,
    descricao: data.description,
    cidade: normalizeRegionLabel(data.region) || data.region || '',
    bairro: data.district,
    rua: '',
    cep: '',
    numero: '',
    valor: data.price,
    negociacao: 'Venda',
    tipo: data.type,
    quartos: String(data.suites || ''),
    banheiros: '',
    vagas: String(data.parking || ''),
    metros: String(data.area || '').replace(/[^\d.,]/g, ''),
    condominio: '',
    valorNegociacao: '',
    valorLocacao: '',
    phone: '', email: '', message: '',
    area: String(data.area || '').replace(/[^\d.,]/g, ''),
    quarto: String(data.suites || ''),
    banheiro: '',
    vaga: String(data.parking || ''),
    endereco: data.district + ', ' + (normalizeRegionLabel(data.region) || data.region || ''),
    finalidade: 'Venda',
    event_name: 'create_property',
    caracteristicas: data.tag || '',
    comodidades: (data.features || []).join(', '),
    nome: '',
  };
}

function buildUpdatedRawFromForm(data) {
  const base = originalRawProperty ? JSON.parse(JSON.stringify(originalRawProperty)) : { id: editingPropertyId };
  base.property_title           = data.title;
  base.property_description     = data.description;
  base.property_detail          = data.description;
  base.property_city            = normalizeRegionLabel(data.region) || data.region || base.property_city || '';
  base.property_district        = data.district;
  base.property_neighborhood    = data.district;
  base.property_price           = data.price;
  base.property_area_sqm        = String(data.area || '').replace(/[^\d.,]/g, '');
  base.property_bedrooms        = String(data.suites || '');
  base.property_garage_spaces   = String(data.parking || '');
  base.property_status          = normalizeStatusForBackend(data.status || base.property_status || 'inactive');
  if (data.lat) base.property_lat = data.lat;
  if (data.lng) base.property_lng = data.lng;

  if (Array.isArray(data.features)) {
    const currentAmenities = Array.isArray(base.amenities) ? base.amenities : [];
    const allByName = new Map(currentAmenities.map((a) => [a.amenitie_name, a]));
    base.amenities = data.features.map((name) => allByName.get(name) || { amenitie_name: name });
  }

  if (Array.isArray(base.categories) && data.tag) {
    const exists = base.categories.find((c) => c.category_name === data.tag);
    base.categories = exists ? [exists] : [{ category_name: data.tag }];
  }

  return base;
}

async function saveProperty() {
  const data = getFormData();
  if (!data.title) { alert('Preencha o nome do imóvel.'); return; }
  if (!data.price) { alert('Preencha o preço do imóvel.'); return; }
  if (typeof HA_API_ADMIN === 'undefined') {
    alert('Falha ao carregar integração de admin. Recarregue a página.'); return;
  }

  const saveBtn = document.querySelector('[onclick="saveProperty()"], #saveProperty');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.dataset._old = saveBtn.textContent; saveBtn.textContent = 'Salvando...'; }

  try {
    if (editingPropertyId && originalRawProperty) {
      const updatedRaw = buildUpdatedRawFromForm(data);
      await HA_API_ADMIN.updateProperty({
        event_name:    'update_property',
        property_id:   Number(editingPropertyId) || editingPropertyId,
        previous_data: originalRawProperty,
        updated_data:  updatedRaw,
      });

      const newPhotos = selectedPhotos.filter(hasRealUploadFile).map((p) => p.file);
      const newVideos = selectedVideos.filter(hasRealUploadFile).map((v) => v.file);
      const newFiles  = [...newPhotos, ...newVideos];

      let mediaUploadWarning = null;
      if (newFiles.length) {
        if (typeof HA_UPLOADS === 'undefined') {
          mediaUploadWarning = 'Integração de upload não carregada.';
        } else {
          try {
            const payload = buildBackendPayloadFromForm(data);
            payload.event_name = 'update_property';
            await HA_UPLOADS.uploadProperty(payload, newFiles);
          } catch (mediaErr) {
            console.error('[FORM][MEDIA] upload de nova mídia falhou:', mediaErr);
            mediaUploadWarning = mediaErr.message || String(mediaErr);
          }
        }
      }

      if (mediaUploadWarning) {
        alert('Dados do imóvel atualizados. Porém, a nova mídia não foi enviada: ' + mediaUploadWarning);
      } else {
        alert('Imóvel atualizado com sucesso.');
      }
    } else {
      if (typeof HA_UPLOADS === 'undefined') {
        alert('Falha ao carregar integração de upload. Recarregue a página.');
        return;
      }
      const payload = buildBackendPayloadFromForm(data);
      const photoFiles = selectedPhotos.filter((p) => p.file instanceof File).map((p) => p.file);
      const videoFiles = selectedVideos.filter((v) => v.file instanceof File).map((v) => v.file);
      const allFiles = [...photoFiles, ...videoFiles];
      await HA_UPLOADS.uploadProperty(payload, allFiles);
      alert('Imóvel cadastrado com sucesso.');
    }

    localStorage.removeItem('editing_property_id');
    window.location.href = 'imoveis.html';
  } catch (err) {
    console.error('[FORM][SAVE] falhou:', err);
    alert('Não foi possível salvar agora: ' + (err.message || err));
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = saveBtn.dataset._old || 'Salvar'; }
  }
}

function clearForm() {
  fields.forEach((id) => { const f = $(id); if (f) f.value = ''; });
  if ($('region')) $('region').value = 'Balneário Camboriú';
  if ($('type'))   $('type').value   = 'Apartamento';
  setStatusField('active');

  selectedFeatures = [];
  selectedPhotos.forEach((p) => { if (!p.isExisting) URL.revokeObjectURL(p.previewUrl); });
  selectedVideos.forEach((v) => { if (!v.isExisting) URL.revokeObjectURL(v.previewUrl); });
  selectedPhotos = []; selectedVideos = []; coverPhotoIndex = 0;
  editingPropertyId = null; originalRawProperty = null;
  localStorage.removeItem('editing_property_id');
  if ($('photoUpload')) $('photoUpload').value = '';
  if ($('videoUpload')) $('videoUpload').value = '';
  updateEverything();
}

async function initPropertyForm() {
  await loadPropertyForEditing();

  fields.forEach((id) => {
    const f = $(id);
    if (f) { f.addEventListener('input', updatePreview); f.addEventListener('change', updatePreview); }
  });

  const cf = $('customFeature');
  if (cf) cf.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomFeature(); } });

  if ($('photoUpload')) $('photoUpload').addEventListener('change', handlePhotoUpload);
  if ($('videoUpload')) $('videoUpload').addEventListener('change', handleVideoUpload);

  setupDropzone('photoDropzone', handlePhotoFiles);
  setupDropzone('videoDropzone', handleVideoFiles);

  updateEverything();
}

window.toggleFeature    = toggleFeature;
window.addCustomFeature = addCustomFeature;
window.removeFeature    = removeFeature;
window.setCoverPhoto    = setCoverPhoto;
window.removePhoto      = removePhoto;
window.removeVideo      = removeVideo;
window.clearForm        = clearForm;
window.saveProperty     = saveProperty;

window.HA_FORM_DEBUG = {
  getMediaState() {
    return {
      photos: selectedPhotos.map((p, i) => ({
        index: i,
        name: p.name,
        isExisting: p.isExisting,
        hasFile: Boolean(p.file),
        fileType: p.file?.constructor?.name,
        type: p.type,
        preview: p.previewUrl?.slice(0, 80)
      })),
      videos: selectedVideos.map((v, i) => ({
        index: i,
        name: v.name,
        isExisting: v.isExisting,
        hasFile: Boolean(v.file),
        fileType: v.file?.constructor?.name,
        type: v.type,
        preview: v.previewUrl?.slice(0, 80)
      })),
      hasNewPhotos: selectedPhotos.some((p) => p.isExisting !== true && p.file instanceof File),
      hasNewVideos: selectedVideos.some((v) => v.isExisting !== true && v.file instanceof File)
    };
  },

  clearNewMedia() {
    selectedPhotos = selectedPhotos.filter((p) => p.isExisting === true);
    selectedVideos = selectedVideos.filter((v) => v.isExisting === true);
    coverPhotoIndex = 0;

    renderPhotoPreview();
    renderVideoPreview();
    updatePreview();

    return this.getMediaState();
  }
};

document.addEventListener('DOMContentLoaded', initPropertyForm);
