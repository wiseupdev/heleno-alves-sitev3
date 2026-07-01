/**
 * ha-normalizer.js — Heleno Alves
 * Camada de tradução: converte registros do backend antigo
 * (N8n/Postgres via WiseUpTech) para o formato que o design novo consome.
 *
 * NÃO altera campos do backend nem dos webhooks. Apenas mapeia chaves
 * para o "shape" usado pelas telas HTML/CSS/JS do site novo.
 *
 * Campos de entrada (backend antigo):
 *   id, property_title, property_description, property_city,
 *   property_district, property_street, property_street_number,
 *   property_postal_code, property_price, property_negociation_price,
 *   property_condo_price, property_rental_price, property_bedrooms,
 *   property_bathrooms, property_garage_spaces, property_area_sqm,
 *   property_status, property_lat, property_lng,
 *   images[].url|.is_cover, videos[].url,
 *   categories[].category_name, amenities[].amenitie_name,
 *   property_types[].property_type_name
 */
(function (root) {
  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function normalizeRegion(rawCity) {
    const city = String(rawCity || '').trim();
    if (/balne.rio\s*cambo/i.test(city) || /^\s*BC\s*$/i.test(city)) {
      return { region: 'Balneário Camboriú', regionSlug: 'balneario-camboriu' };
    }
    if (/praia\s*brava/i.test(city)) {
      return { region: 'Praia Brava', regionSlug: 'praia-brava' };
    }
    return { region: city, regionSlug: slugify(city) };
  }

  function getMediaUrl(media) {
    if (!media) return '';
    if (typeof media === 'string') return media.trim();
    return String(media.url || media.media_url || media.image_url || media.previewUrl || media.src || '').trim();
  }

  function pickCover(images) {
    if (!Array.isArray(images) || !images.length) return '';
    const cover = images.find((img) => img && (img.is_cover === true || img.is_cover === 'true' || img.is_cover === 1 || img.is_cover === '1'));
    return getMediaUrl(cover) || getMediaUrl(images[0]) || '';
  }

  function pickGallery(images) {
    if (!Array.isArray(images)) return [];
    // Mantém a ordem original; capa primeiro se existir is_cover
    const sorted = [...images].sort((a, b) => {
      const ac = a && (a.is_cover === true || a.is_cover === 'true' || a.is_cover === 1 || a.is_cover === '1');
      const bc = b && (b.is_cover === true || b.is_cover === 'true' || b.is_cover === 1 || b.is_cover === '1');
      if (ac && !bc) return -1;
      if (bc && !ac) return 1;
      return 0;
    });
    return sorted.map(getMediaUrl).filter(Boolean);
  }

  function formatPrice(raw) {
    const v = String(raw || '').trim();
    if (!v || v === '0' || v === 'R$ 0,00') return 'Sob consulta';
    return v.startsWith('R$') ? v : `R$ ${v}`;
  }

  /**
   * Normaliza um registro vindo do backend antigo para o shape do design novo.
   * Aceita já-normalizado (HA_API.normalize) também — campos extras passam por.
   */
  function normalizeProperty(raw) {
    if (!raw || typeof raw !== 'object') return null;

    // Se vier já no shape novo (vindo de HA_API.normalize), repassa
    if (raw.title && !raw.property_title) return raw;

    const images = Array.isArray(raw.images) ? raw.images : [];
    const videos = Array.isArray(raw.videos) ? raw.videos : [];
    const types  = Array.isArray(raw.property_types) ? raw.property_types : [];
    const cats   = Array.isArray(raw.categories) ? raw.categories : [];
    const amen   = Array.isArray(raw.amenities) ? raw.amenities : [];

    const { region, regionSlug } = normalizeRegion(raw.property_city);
    const title = raw.property_title || '';
    const slug  = raw.slug || (slugify(title) + '-' + (raw.id || ''));

    const cover   = pickCover(images);
    const gallery = pickGallery(images);
    const video   = (videos[0] && videos[0].url) || '';

    const type = (types[0] && types[0].property_type_name) || '';
    const tag  = (cats[0]  && cats[0].category_name)       || type;

    return {
      id:           raw.id,
      slug,
      title,
      description:  raw.property_description || raw.property_detail || '',
      region,
      regionSlug,
      city:         raw.property_city || '',
      district:     raw.property_district || raw.property_neighborhood || '',
      street:       raw.property_street || '',
      streetNumber: raw.property_street_number || '',
      postalCode:   raw.property_postal_code || '',
      type,
      tag,
      status:       raw.property_status || 'Ativo',
      price:                formatPrice(raw.property_price),
      negotiationPrice:     raw.property_negociation_price || '',
      condoPrice:           raw.property_condo_price || '',
      rentalPrice:          raw.property_rental_price || '',
      suites:    raw.property_bedrooms      ? Number(raw.property_bedrooms)      : 0,
      bathrooms: raw.property_bathrooms     ? Number(raw.property_bathrooms)     : 0,
      parking:   raw.property_garage_spaces ? Number(raw.property_garage_spaces) : 0,
      privateArea: raw.property_area_sqm ? `${raw.property_area_sqm} m²` : '',
      area:        raw.property_area_sqm ? `${raw.property_area_sqm} m²` : '',
      cover,
      img: cover,
      gallery,
      video,
      videos:    videos.map((v) => v && v.url).filter(Boolean),
      images:    images,
      features:  amen.map((a) => a && a.amenitie_name).filter(Boolean),
      categories: cats.map((c) => c && c.category_name).filter(Boolean),
      types:      types.map((t) => t && t.property_type_name).filter(Boolean),
      lat: raw.property_lat ? Number(raw.property_lat) : null,
      lng: raw.property_lng ? Number(raw.property_lng) : null,
      _raw: raw, // mantém original p/ debug e p/ edição
    };
  }

  function normalizeList(list) {
    if (!Array.isArray(list)) return [];
    return list.map(normalizeProperty).filter(Boolean);
  }

  root.HA_NORMALIZER = {
    slugify,
    normalizeRegion,
    pickCover,
    pickGallery,
    formatPrice,
    normalizeProperty,
    normalizeList,
  };
})(window);
