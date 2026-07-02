/**
 * ha-api-admin.js — Heleno Alves
 * Wrapper dos webhooks ADMIN (N8n / WiseUpTech). Mantém EXATAMENTE
 * os endpoints, payloads e tenant_id usados pelo projeto antigo
 * funcional. NÃO modificar nomes de eventos ou campos.
 *
 * Endpoints reaproveitados do projeto antigo:
 *   - webhook/apiADMINpagination         (listar imóveis admin)
 *   - webhook/ADMINuniqueITEM            (buscar imóvel único admin)
 *   - webhook/haimoveisPROPERTYMANAGER   (update/delete property)
 *   - webhook/haimoveisCATEGORYAMENITIE  (categorias/comodidades/tipos)
 *   - webhook/...search-name-admin       (busca por nome — admin)
 */
(function (root) {
  const TENANT_ID = '1911202511';
  const DATABASE_NAME = 'helenoalvesbc';

  const URLS = {
    list:       'https://webhook.wiseuptech.com.br/webhook/apiADMINpagination',
    unique:     'https://webhook.wiseuptech.com.br/webhook/ADMINuniqueITEM',
    manager:    'https://webhook.wiseuptech.com.br/webhook/haimoveisPROPERTYMANAGER',
    catamen:    'https://webhook.wiseuptech.com.br/webhook/haimoveisCATEGORYAMENITIE',
    searchName: 'https://webhook.wiseuptech.com.br/webhook/84f3dd87-2c33-4f47-951f-b5841c1c1e06-search-name-admin',
  };

  async function postJSON(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${url} — ${txt.slice(0, 200)}`);
    }
    return res.json();
  }

  /* ─── LISTAR (admin paginado) ─────────────────────────────────── */
  async function listProperties({ page = 1, limit = 50, filters = null } = {}) {
    const payload = {
      event_name: 'get_property',
      tenant_id:  TENANT_ID,
      page, limit,
      filters,
    };
    console.log('[ADMIN][LIST] payload:', payload);
    const rawData = await postJSON(URLS.list, payload);

    if (Array.isArray(rawData) && rawData.length > 0) {
      const first = rawData[0];
      return {
        page,
        per_page: limit,
        total_items: first.propertyAmount || (first.listProperty || []).length || 0,
        properties:     first.listProperty   || [],
        categories:     first.propertyCategory || [],
        amenities:      first.propertyAmenitie || [],
        property_types: first.propertyType    || [],
      };
    }
    return { page, per_page: limit, total_items: 0, properties: [], categories: [], amenities: [], property_types: [] };
  }

  /** Busca TODAS as páginas (uso conveniente para a tela admin). */
  async function listAllProperties({ pageSize = 50 } = {}) {
    const first = await listProperties({ page: 1, limit: pageSize });
    const total = first.total_items || first.properties.length;
    const all   = [...first.properties];
    if (total > pageSize) {
      const totalPages = Math.ceil(total / pageSize);
      for (let p = 2; p <= totalPages; p++) {
        try {
          const next = await listProperties({ page: p, limit: pageSize });
          all.push(...next.properties);
        } catch (e) {
          console.warn('[ADMIN][LIST] falha página', p, e);
        }
      }
    }
    return { ...first, properties: all };
  }

  /* ─── ITEM ÚNICO (admin) ──────────────────────────────────────── */
  async function getProperty(propertyId) {
    const payload = {
      id: Number(propertyId) || propertyId,
      event_name: 'get_unique_property',
      tenant_id:  TENANT_ID,
    };
    console.log('[ADMIN][UNIQUE] payload:', payload);
    const rawData = await postJSON(URLS.unique, payload);
    if (Array.isArray(rawData) && rawData.length >= 1) {
      const propertyData = rawData[0] || {};
      const optionsData  = rawData[1] || {};
      const property = (propertyData.listProperty && propertyData.listProperty[0]) || null;
      return {
        property,
        categories:     optionsData.propertyCategory || [],
        amenities:      optionsData.propertyAmenitie || [],
        property_types: optionsData.propertyType    || [],
      };
    }
    return null;
  }

  /* ─── UPDATE / DELETE via PROPERTYMANAGER ─────────────────────── */
  async function updateProperty(data) {
    // data: { property_id, previous_data, updated_data, media_key? }
    const body = {
      event_name: 'update_property',
      tenant_id:  TENANT_ID,
      ...data,
    };
    console.log('[ADMIN][UPDATE] payload:', body);
    return postJSON(URLS.manager, body);
  }

  async function deleteProperty(propertyId) {
    const body = {
      event_name: 'delete_property',
      property_id: Number(propertyId) || propertyId,
      tenant_id:   TENANT_ID,
    };
    console.log('[ADMIN][DELETE] payload:', body);
    return postJSON(URLS.manager, body);
  }

  async function removePropertyMedia(propertyId, mediaKey) {
    const body = {
      event_name: 'remove_property_media',
      property_id: Number(propertyId) || propertyId,
      media_key: mediaKey,
      tenant_id: TENANT_ID,
    };
    console.log('[ADMIN][REMOVE MEDIA] payload:', body);
    return postJSON(URLS.manager, body);
  }

  /* ─── Categorias / Comodidades / Tipos ────────────────────────── */
  async function categoryAmenitieRequest(eventBody) {
    const body = { ...eventBody, tenant_id: TENANT_ID };
    console.log('[ADMIN][CAT/AMEN]', body);
    return postJSON(URLS.catamen, body);
  }
  function getCategoryAmenitie() { return categoryAmenitieRequest({ event_name: 'get_category_amenitie' }); }
  function createCategoryAmenitie(type, data) { return categoryAmenitieRequest({ event_name: 'create_category_amenitie', type, ...data }); }
  function updateCategoryAmenitie(type, data) { return categoryAmenitieRequest({ event_name: 'update_category_amenitie', type, ...data }); }
  function deleteCategoryAmenitie(type, id)   { return categoryAmenitieRequest({ event_name: 'delete_category_amenitie', type, id }); }

  /* ─── Busca por nome (admin) ──────────────────────────────────── */
  async function searchByName(name) {
    const n = (name || '').trim();
    if (!n) return [];
    const body = {
      event_name: 'search_property_by_name',
      tenant_id:  TENANT_ID,
      property_name: n,
    };
    const rawData = await postJSON(URLS.searchName, body);
    if (Array.isArray(rawData) && rawData.length > 0) {
      return rawData[0].listProperty || [];
    }
    return [];
  }

  root.HA_API_ADMIN = {
    TENANT_ID, DATABASE_NAME, URLS,
    listProperties, listAllProperties,
    getProperty,
    updateProperty, deleteProperty, removePropertyMedia,
    getCategoryAmenitie, createCategoryAmenitie, updateCategoryAmenitie, deleteCategoryAmenitie,
    searchByName,
  };
})(window);
